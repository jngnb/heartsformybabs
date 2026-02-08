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
    const yourNameInput = document.getElementById('yourName');
    const yourBabsNameInput = document.getElementById('yourBabsName');
    const coupleIdInput = document.getElementById('coupleId');
    const userInfo = document.getElementById('userInfo');
    const resetBtn = document.getElementById('resetBtn');
    const statusDiv = document.getElementById('status');
    const coupleIdDisplay = document.getElementById('coupleIdDisplay');
  
    console.log('Popup loaded');
  
    // Initialize Firebase
    try {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
      statusDiv.textContent = 'Firebase initialized';
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase init error:', error);
      statusDiv.textContent = 'Error: ' + error.message;
      statusDiv.className = 'status error';
      return;
    }
  
    // Check if setup is complete
    const stored = await chrome.storage.local.get(['yourName', 'yourBabsName', 'coupleId']);
    console.log('Stored data:', stored);
    
    if (stored.yourName && stored.yourBabsName && stored.coupleId) {
      setupDiv.style.display = 'none';
      mainContent.style.display = 'block';
      userInfo.textContent = `You: ${stored.yourName} ❤️ Babs: ${stored.yourBabsName}`;
      coupleIdDisplay.textContent = `Couple ID: ${stored.coupleId}`;
      currentCoupleId = stored.coupleId;
      currentUserName = stored.yourName;
      
      connectToFirebase(stored.coupleId, stored.yourName);
    } else {
      setupDiv.style.display = 'block';
      mainContent.style.display = 'none';
    }
  
    // Reset button
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset everything? This will disconnect you.')) {
        if (heartsRef) {
          heartsRef.off();
        }
        await chrome.storage.local.clear();
        setupDiv.style.display = 'block';
        mainContent.style.display = 'none';
        yourNameInput.value = '';
        yourBabsNameInput.value = '';
        coupleIdInput.value = '';
      }
    });
  
    saveSetupBtn.addEventListener('click', async () => {
      console.log('Save button clicked');
      const yourNameValue = yourNameInput.value.trim();
      const yourBabsNameValue = yourBabsNameInput.value.trim();
      const coupleIdValue = coupleIdInput.value.trim();
      
      console.log('Values:', yourNameValue, yourBabsNameValue, coupleIdValue);
      
      if (yourNameValue && yourBabsNameValue && coupleIdValue) {
        console.log('Saving to storage...');
        await chrome.storage.local.set({ 
          yourName: yourNameValue, 
          yourBabsName: yourBabsNameValue,
          coupleId: coupleIdValue
        });
        
        console.log('Saved! Switching to main content...');
        setupDiv.style.display = 'none';
        mainContent.style.display = 'block';
        userInfo.textContent = `You: ${yourNameValue} ❤️ Babs: ${yourBabsNameValue}`;
        coupleIdDisplay.textContent = `Couple ID: ${coupleIdValue}`;
        currentCoupleId = coupleIdValue;
        currentUserName = yourNameValue;
        
        connectToFirebase(coupleIdValue, yourNameValue);
      } else {
        console.log('Missing fields');
        alert('Please fill in all fields!');
      }
    });
  
    function connectToFirebase(coupleId, userName) {
      console.log('Connecting to Firebase with couple ID:', coupleId);
      heartsRef = database.ref(`heartsformybabs/${coupleId}/hearts`);
      
      // Listen for new hearts in real-time
      heartsRef.on('value', (snapshot) => {
        console.log('Firebase data received');
        statusDiv.textContent = '✓ Connected';
        statusDiv.className = 'status connected';
        
        const hearts = [];
        snapshot.forEach((childSnapshot) => {
          hearts.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        
        console.log('Hearts:', hearts);
        displayHistory(hearts, userName);
      }, (error) => {
        console.error('Firebase connection error:', error);
        statusDiv.textContent = 'Connection error: ' + error.message;
        statusDiv.className = 'status error';
      });
    }
  
    sendBtn.addEventListener('click', async () => {
      if (!heartsRef) return;
      
      console.log('Sending heart...');
      sendBtn.disabled = true;
      
      const heart = {
        sender: currentUserName,
        timestamp: Date.now()
      };
  
      try {
        await heartsRef.push(heart);
        console.log('Heart sent!');
        
        sendBtn.textContent = '❤️ Sent!';
        setTimeout(() => {
          sendBtn.textContent = '❤️ Send Heart';
          sendBtn.disabled = false;
        }, 1000);
      } catch (error) {
        console.error('Send error:', error);
        statusDiv.textContent = 'Send error: ' + error.message;
        statusDiv.className = 'status error';
        sendBtn.disabled = false;
      }
    });
  
    function displayHistory(hearts, yourName) {
      historyDiv.innerHTML = '';
  
      // Show last 15 hearts
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
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        
        div.textContent = `${isSent ? 'You' : heart.sender} sent ❤️ ${dateStr} ${timeStr}`;
        historyDiv.appendChild(div);
      });
    }
  });