const firebaseConfig = {
    apiKey: "AIzaSyCAVKFtScHljQ2Rb4Dqqq1RUAhlrjreHSg",
    authDomain: "heartsformybabs.firebaseapp.com",
    databaseURL: "https://heartsformybabs-default-rtdb.firebaseio.com",
    projectId: "heartsformybabs",
    storageBucket: "heartsformybabs.firebasestorage.app",
    messagingSenderId: "736862456337",
    appId: "1:736862456337:web:a3f4e3b912fcff7c09bfb0"
  };
  
  // Single shared room for everyone
  const ROOM_ID = 'babs-and-missy';
  
  let database;
  let heartsRef;
  let currentUserName;
  let currentUserId;
  
  async function getUserId() {
    const stored = await chrome.storage.local.get(['userId']);
    if (stored.userId) {
      return stored.userId;
    }
    const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await chrome.storage.local.set({ userId: newId });
    return newId;
  }
  
  document.addEventListener('DOMContentLoaded', async () => {
    const sendBtn = document.getElementById('sendHeart');
    const historyDiv = document.getElementById('history');
    const setupDiv = document.getElementById('setup');
    const mainContent = document.getElementById('mainContent');
    const saveSetupBtn = document.getElementById('saveSetup');
    const yourNameInput = document.getElementById('yourName');
    const userInfo = document.getElementById('userInfo');
    const resetBtn = document.getElementById('resetBtn');
    const statusDiv = document.getElementById('status');
    const messageInput = document.getElementById('messageInput');
    const charCounter = document.getElementById('charCounter');
  
    currentUserId = await getUserId();
  
    messageInput.addEventListener('input', () => {
      const length = messageInput.value.length;
      charCounter.textContent = `${length}/10`;
      if (length > 10) {
        charCounter.classList.add('over-limit');
      } else {
        charCounter.classList.remove('over-limit');
      }
    });
  
    try {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
      statusDiv.textContent = 'Firebase initialized';
    } catch (error) {
      statusDiv.textContent = 'Error: ' + error.message;
      statusDiv.className = 'status error';
      return;
    }
  
    const stored = await chrome.storage.local.get(['yourName']);
    
    if (stored.yourName) {
      setupDiv.style.display = 'none';
      mainContent.style.display = 'block';
      userInfo.textContent = `${stored.yourName}`;
      currentUserName = stored.yourName;
      
      connectToFirebase(stored.yourName);
    } else {
      setupDiv.style.display = 'block';
      mainContent.style.display = 'none';
    }
  
    resetBtn.addEventListener('click', async () => {
      if (confirm('Clear all hearts? This will delete ALL hearts in the room for everyone!')) {
        if (heartsRef) {
          await heartsRef.remove();
        }
      }
    });
  
    saveSetupBtn.addEventListener('click', async () => {
      const yourName = yourNameInput.value.trim();
      
      if (!yourName) {
        alert('Please enter your name!');
        return;
      }
      
      await chrome.storage.local.set({ yourName: yourName });
      
      setupDiv.style.display = 'none';
      mainContent.style.display = 'block';
      userInfo.textContent = `${yourName}`;
      currentUserName = yourName;
      
      connectToFirebase(yourName);
    });
  
    function connectToFirebase(userName) {
      heartsRef = database.ref(`rooms/${ROOM_ID}/hearts`);
      
      heartsRef.on('value', (snapshot) => {
        statusDiv.textContent = '✓ Connected';
        statusDiv.className = 'status connected';
        
        const hearts = [];
        snapshot.forEach((childSnapshot) => {
          hearts.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        
        displayHistory(hearts, userName);
      }, (error) => {
        statusDiv.textContent = 'Connection error: ' + error.message;
        statusDiv.className = 'status error';
      });
    }
  
    sendBtn.addEventListener('click', async () => {
      await sendHeart();
    });
  
    messageInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        await sendHeart();
      }
    });
  
    async function sendHeart() {
      if (!heartsRef) return;
      
      const messageText = messageInput.value.trim();
      
      if (messageText.length > 10) {
        alert('Message must be 10 characters or less!');
        return;
      }
      
      sendBtn.disabled = true;
      messageInput.disabled = true;
      
      const heart = {
        sender: currentUserName,
        senderId: currentUserId,
        timestamp: Date.now()
      };
      
      if (messageText) {
        heart.message = messageText;
      }
  
      try {
        await heartsRef.push(heart);
        
        sendBtn.textContent = '✓';
        messageInput.value = '';
        charCounter.textContent = '0/10';
        
        setTimeout(() => {
          sendBtn.textContent = '❤️';
          sendBtn.disabled = false;
          messageInput.disabled = false;
          messageInput.focus();
        }, 800);
      } catch (error) {
        statusDiv.textContent = 'Send error: ' + error.message;
        statusDiv.className = 'status error';
        sendBtn.disabled = false;
        messageInput.disabled = false;
      }
    }
  
    function displayHistory(hearts, yourName) {
      historyDiv.innerHTML = '';
  
      const displayHearts = hearts.slice(-20).reverse();
      
      if (displayHearts.length === 0) {
        historyDiv.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">No hearts yet ❤️<br>Send one to get started!</div>';
        return;
      }
      
      displayHearts.forEach(heart => {
        const div = document.createElement('div');
        const isSent = heart.senderId ? heart.senderId === currentUserId : heart.sender === yourName;
        div.className = `history-item ${isSent ? 'sent' : 'received'}`;
        
        const date = new Date(heart.timestamp);
        const timeStr = date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        const dateStr = date.toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric' 
        });
        
        let content = `<span class="heart-icon">❤️</span><strong>${isSent ? 'You' : heart.sender}</strong>`;

        if (heart.message) {
          content += ` <span class="message-content">"${heart.message}"</span>`;
        }
        
        content += `<div class="message-time">${dateStr} ${timeStr}</div>`;
        
        div.innerHTML = content;
        historyDiv.appendChild(div);
      });
    }
  });