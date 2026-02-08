// Clean up old hearts periodically
chrome.runtime.onInstalled.addListener(() => {
    console.log('Couple Hearts extension installed!');
  });
  
  // Optional: Clean up hearts older than 24 hours
  setInterval(async () => {
    const { hearts = [] } = await chrome.storage.sync.get(['hearts']);
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    const recentHearts = hearts.filter(heart => heart.timestamp > oneDayAgo);
    
    if (recentHearts.length !== hearts.length) {
      await chrome.storage.sync.set({ hearts: recentHearts });
    }
  }, 60 * 60 * 1000); // Run every hour