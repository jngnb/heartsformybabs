let heartElement = null;
let heartTimeout = null;
let database;
let heartsRef;
let isInitialized = false;

// Initialize Firebase
async function initializeFirebase() {
  if (isInitialized) return;
  
  try {
    const script1 = document.createElement('script');
    script1.src = chrome.runtime.getURL('firebase-app.js');
    document.head.appendChild(script1);
    
    await new Promise(resolve => script1.onload = resolve);
    
    const script2 = document.createElement('script');
    script2.src = chrome.runtime.getURL('firebase-database.js');
    document.head.appendChild(script2);
    
    await new Promise(resolve => script2.onload = resolve);
    
    // Load config
    const configScript = document.createElement('script');
    configScript.src = chrome.runtime.getURL('config.js');
    document.head.appendChild(configScript);
    
    await new Promise(resolve => configScript.onload = resolve);
    
    const app = firebase.initializeApp(firebaseConfig);
    database = firebase.database(app);
    
    isInitialized = true;
    startListening();
  } catch (error) {
    console.error('Firebase init error:', error);
  }
}

async function startListening() {
  const stored = await chrome.storage.local.get(['yourName', 'coupleId']);
  
  if (!stored.yourName || !stored.coupleId) return;
  
  heartsRef = firebase.database().ref(`couples/${stored.coupleId}/hearts`);
  let lastHeartCount = 0;
  
  heartsRef.on('child_added', (snapshot) => {
    const heart = snapshot.val();
    
    // Skip initial load
    if (lastHeartCount === 0) {
      heartsRef.once('value', (s) => {
        lastHeartCount = s.numChildren();
      });
      return;
    }
    
    lastHeartCount++;
    
    // Only show if from partner
    if (heart.sender !== stored.yourName) {
      showHeart(heart.sender);
    }
  });
}

function showHeart(senderName) {
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

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
  initializeFirebase();
}