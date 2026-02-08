const firebaseConfig = {
    apiKey: "AIzaSyCAVKFtScHljQ2Rb4Dqqq1RUAhlrjreHSg",
    authDomain: "heartsformybabs.firebaseapp.com",
    databaseURL: "https://heartsformybabs-default-rtdb.firebaseio.com",
    projectId: "heartsformybabs",
    storageBucket: "heartsformybabs.firebasestorage.app",
    messagingSenderId: "736862456337",
    appId: "1:736862456337:web:a3f4e3b912fcff7c09bfb0"
  };
  
  let database;
  let heartsRef;
  let currentCoupleId;
  let currentUserName;
  
  document.addEventListener('DOMContentLoaded', async () => {
    const sendBtn = document.getElementById('sendHeart');
    const historyDiv = document.getElementById('history');
    const setupDiv = document.getElementById('setup');
    const mainContent = document.getElementById('mainContent');
    const saveSetupBtn = document.getElementById('saveSetup');
    const whoAreYouSelect = document.getElementById('whoAreYou');
    const coupleIdInput = document.getElementById('coupleId');
    const userInfo = document.getElementById('userInfo');
    const resetBtn = document.getElementById('resetBtn');
    const statusDiv = document.getElementById('status');
    const coupleIdDisplay = document.getElementById('coupleIdDisplay');
  
    // Initialize Firebase
    try {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
      statusDiv.textContent = 'Firebase initialized';
    } catch (error) {
      statusDiv.textContent = 'Error: ' + error.message;
      statusDiv.className = 'status error';
      return;
    }
  
    // Check if setup is complete
    const stored = await chrome.storage.local.get(['yourName', 'coupleId']);
    
    if (stored.yourName && stored.coupleId) {
      const partnerName = stored.yourName === 'Babs' ? 'Missy' : 'Babs';
      
      setupDiv.style.display = 'none';
      mainContent.style.display = 'block';
      userInfo.textContent = `You: ${stored.yourName} ❤️ Partner: ${partnerName}`;
      coupleIdDisplay.textContent = `Couple ID: ${stored.coupleId}`;
      currentCoupleId = stored.coupleId;
      currentUserName = stored.yourName;
      
      connectToFirebase(stored.coupleId, stored.yourName);
      chrome.action.setBadgeText({ text: '' });
    } else {
      setupDiv.style.display = 'block';
      mainContent.style.display = 'none';
    }
  
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset everything?')) {
        if (heartsRef) heartsRef.off();
        await chrome.storage.local.clear();
        chrome.action.setBadgeText({ text: '' });
        setupDiv.style.display = 'block';
        mainContent.style.display = 'none';
        whoAreYouSelect.value = '';
        coupleIdInput.value = '';
      }
    });
  
    saveSetupBtn.addEventListener('click', async () => {
      const yourName = whoAreYouSelect.value;
      const coupleIdValue = coupleIdInput.value.trim();
      
      if (!yourName) {
        alert('Please select who you are!');
        return;
      }
      
      if (!coupleIdValue) {
        alert('Please enter a Couple ID!');
        return;
      }
      
      await chrome.storage.local.set({ 
        yourName: yourName,
        coupleId: coupleIdValue
      });
      
      const yourBabsName = yourName === 'Babs' ? 'Missy' : 'Babs';
      
      setupDiv.style.display = 'none';
      mainContent.style.display = 'block';
      userInfo.textContent = `You: ${yourName} ❤️ Your Babs: ${yourBabsName}`;
      coupleIdDisplay.textContent = `Couple ID: ${coupleIdValue}`;
      currentCoupleId = coupleIdValue;
      currentUserName = yourName;
      
      connectToFirebase(coupleIdValue, yourName);
    });
  
    function connectToFirebase(coupleId, userName) {
      heartsRef = database.ref(`couples/${coupleId}/hearts`);
      
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
      if (!heartsRef) return;
      
      sendBtn.disabled = true;
      
      const heart = {
        sender: currentUserName,
        timestamp: Date.now()
      };
  
      try {
        await heartsRef.push(heart);
        
        sendBtn.textContent = '❤️ Sent!';
        setTimeout(() => {
          sendBtn.textContent = '❤️ Send Heart';
          sendBtn.disabled = false;
        }, 1000);
      } catch (error) {
        statusDiv.textContent = 'Send error: ' + error.message;
        statusDiv.className = 'status error';
        sendBtn.disabled = false;
      }
    });
  
    function displayHistory(hearts, yourName) {
      historyDiv.innerHTML = '';
  
      const displayHearts = hearts.slice(-15).reverse();
      
      if (displayHearts.length === 0) {
        historyDiv.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">No hearts yet ❤️<br>Send one to get started!</div>';
        return;
      }
      
      displayHearts.forEach(heart => {
        const div = document.createElement('div');
        const isSent = heart.sender === yourName;
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
        
        div.textContent = `${isSent ? 'You' : heart.sender} sent ❤️ ${dateStr} ${timeStr}`;
        historyDiv.appendChild(div);
      });
    }
  });