const firebaseConfig = {
    apiKey: "AIzaSyCAVKFtScHljQ2Rb4Dqqq1RUAhlrjreHSg",
    authDomain: "heartsformybabs.firebaseapp.com",
    databaseURL: "https://heartsformybabs-default-rtdb.firebaseio.com",
    projectId: "heartsformybabs",
    storageBucket: "heartsformybabs.firebasestorage.app",
    messagingSenderId: "736862456337",
    appId: "1:736862456337:web:a3f4e3b912fcff7c09bfb0"
  };
  
  let heartElement = null;
  let heartTimeout = null;
  let isListening = false;
  let database;
  
  // Load Firebase scripts from extension
  function loadFirebase() {
    return new Promise((resolve, reject) => {
      // Check if Firebase is already loaded
      if (typeof firebase !== 'undefined') {
        resolve();
        return;
      }
  
      const script1 = document.createElement('script');
      script1.src = chrome.runtime.getURL('firebase-app-compat.js');
      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = chrome.runtime.getURL('firebase-database-compat.js');
        script2.onload = () => resolve();
        script2.onerror = () => reject(new Error('Failed to load Firebase Database'));
        document.head.appendChild(script2);
      };
      script1.onerror = () => reject(new Error('Failed to load Firebase App'));
      document.head.appendChild(script1);
    });
  }
  
  async function startListening() {
    if (isListening) return;
    
    const stored = await chrome.storage.local.get(['yourName', 'coupleId']);
    
    if (!stored.yourName || !stored.coupleId) {
      setTimeout(startListening, 2000);
      return;
    }
    
    try {
      // Load Firebase if not already loaded
      await loadFirebase();
      
      // Initialize Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      database = firebase.database();
      
      const heartsRef = database.ref(`heartsformybabs/${stored.coupleId}/hearts`);
      
      let isFirstLoad = true;
      
      heartsRef.limitToLast(1).on('child_added', (snapshot) => {
        // Skip the initial load
        if (isFirstLoad) {
          isFirstLoad = false;
          return;
        }
        
        const heart = snapshot.val();
        
        // Only show if from partner
        if (heart && heart.sender !== stored.yourName) {
          showHeart(heart.sender);
        }
      });
      
      isListening = true;
      console.log('Firebase listener started for couple:', stored.coupleId);
    } catch (error) {
      console.error('Firebase error in content script:', error);
      setTimeout(startListening, 5000);
    }
  }
  
  function showHeart(senderName) {
    console.log('Showing heart from:', senderName);
    
    // Remove existing heart if any
    if (heartElement) {
      heartElement.remove();
      clearTimeout(heartTimeout);
    }
  
    // Create heart element
    heartElement = document.createElement('div');
    heartElement.id = 'couple-heart-notification';
    heartElement.innerHTML = `
      <div class="heart-content">
        <div class="heart-icon">❤️</div>
        <div class="heart-text">${senderName} sent you a heart!</div>
      </div>
    `;
    
    document.body.appendChild(heartElement);
  
    // Add animation class
    setTimeout(() => {
      heartElement.classList.add('show');
    }, 10);
  
    // Remove after 5 minutes
    heartTimeout = setTimeout(() => {
      heartElement.classList.remove('show');
      setTimeout(() => {
        if (heartElement) {
          heartElement.remove();
          heartElement = null;
        }
      }, 500);
    }, 5 * 60 * 1000);
  }
  
  // Start listening when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startListening);
  } else {
    startListening();
  }