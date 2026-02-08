import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import { getDatabase, ref, push, onValue, off } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js';

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

  // Initialize Firebase
  try {
    const app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    statusDiv.textContent = 'Firebase initialized';
  } catch (error) {
    statusDiv.textContent = 'Error: ' + error.message;
    statusDiv.className = 'status error';
    return;
  }

  // Check if setup is complete
  const stored = await chrome.storage.local.get(['yourName', 'yourBabsName', 'coupleId']);
  
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
        off(heartsRef);
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
    const yourNameValue = yourNameInput.value.trim();
    const yourBabsNameValue = yourBabsNameInput.value.trim();
    const coupleIdValue = coupleIdInput.value.trim();
    
    if (yourNameValue && yourBabsNameValue && coupleIdValue) {
      await chrome.storage.local.set({ 
        yourName: yourNameValue, 
        yourBabsName: yourBabsNameValue,
        coupleId: coupleIdValue
      });
      
      setupDiv.style.display = 'none';
      mainContent.style.display = 'block';
      userInfo.textContent = `You: ${yourNameValue} ❤️ Babs: ${yourBabsNameValue}`;
      coupleIdDisplay.textContent = `Couple ID: ${coupleIdValue}`;
      currentCoupleId = coupleIdValue;
      currentUserName = yourNameValue;
      
      connectToFirebase(coupleIdValue, yourNameValue);
    } else {
      alert('Please fill in all fields!');
    }
  });

  function connectToFirebase(coupleId, userName) {
    heartsRef = ref(database, `couples/${coupleId}/hearts`);
    
    // Listen for new hearts in real-time
    onValue(heartsRef, (snapshot) => {
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
      await push(heartsRef, heart);
      
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