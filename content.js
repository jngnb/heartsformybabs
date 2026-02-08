let heartElement = null;
let heartTimeout = null;

// Listen for storage changes
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'sync' && changes.hearts) {
    const { yourName } = await chrome.storage.sync.get(['yourName']);
    const newHearts = changes.hearts.newValue || [];
    const oldHearts = changes.hearts.oldValue || [];
    
    // Check if there's a new heart
    if (newHearts.length > oldHearts.length) {
      const latestHeart = newHearts[newHearts.length - 1];
      
      // Only show if it's from partner (not from you)
      if (latestHeart.sender !== yourName) {
        showHeart(latestHeart.sender);
      }
    }
  }
});

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
      <div class="heart-icon">💖</div>
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
  }, 5 * 60 * 1000); // 5 minutes
}