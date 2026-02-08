import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import { getDatabase, ref, onChildAdded, query, limitToLast } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js';

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

async function startListening() {
  if (isListening) return;
  
  const stored = await chrome.storage.local.get(['yourName', 'coupleId']);
  
  if (!stored.yourName || !stored.coupleId) {
    setTimeout(startListening, 2000);
    return;
  }
  
  try {
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const heartsRef = ref(database, `couples/${stored.coupleId}/hearts`);
    const recentHeartsQuery = query(heartsRef, limitToLast(1));
    
    let isFirstLoad = true;
    
    onChildAdded(recentHeartsQuery, (snapshot) => {
      // Skip the initial load
      if (isFirstLoad) {
        isFirstLoad = false;
        return;
      }
      
      const heart = snapshot.val();
      
      // Only show if from partner
      if (heart.sender !== stored.yourName) {
        showHeart(heart.sender);
      }
    });
    
    isListening = true;
  } catch (error) {
    console.error('Firebase error:', error);
    setTimeout(startListening, 5000);
  }
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

// Start listening when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startListening);
} else {
  startListening();
}