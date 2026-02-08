document.addEventListener('DOMContentLoaded', async () => {
    const sendBtn = document.getElementById('sendHeart');
    const historyDiv = document.getElementById('history');
    const setupDiv = document.getElementById('setup');
    const mainContent = document.getElementById('mainContent');
    const saveSetupBtn = document.getElementById('saveSetup');
    const yourNameInput = document.getElementById('yourName');
    const yourBabsNameInput = document.getElementById('yourBabsName');
    const userInfo = document.getElementById('userInfo');
  
    // Check if setup is complete
    const { yourName, yourBabsName } = await chrome.storage.sync.get(['yourName', 'yourBabsName']);
    
    if (yourName && yourBabsName) {
      setupDiv.style.display = 'none';
      mainContent.style.display = 'block';
      userInfo.textContent = `You: ${yourName} 💕 Your Babs: ${yourBabsName}`;
    } else {
      setupDiv.style.display = 'block';
      mainContent.style.display = 'none';
    }
  
    saveSetupBtn.addEventListener('click', async () => {
      const yourNameValue = yourNameInput.value.trim();
      const yourBabsNameValue = yourBabsNameInput.value.trim();
      
      if (yourNameValue && yourBabsNameValue) {
        await chrome.storage.sync.set({ yourName: yourNameValue, yourBabsName: yourBabsNameValue });
        setupDiv.style.display = 'none';
        mainContent.style.display = 'block';
        userInfo.textContent = `You: ${yourNameValue} 💕 Your Babs: ${yourBabsNameValue}`;
        loadHistory();
      }
    });
  
    sendBtn.addEventListener('click', async () => {
      const { yourName } = await chrome.storage.sync.get(['yourName']);
      const heart = {
        id: Date.now(),
        sender: yourName,
        timestamp: Date.now()
      };
  
      // Get current hearts
      const { hearts = [] } = await chrome.storage.sync.get(['hearts']);
      hearts.push(heart);
      
      // Keep only last 20 hearts
      const recentHearts = hearts.slice(-20);
      await chrome.storage.sync.set({ hearts: recentHearts });
  
      // Visual feedback
      sendBtn.textContent = '💖 Sent!';
      setTimeout(() => {
        sendBtn.textContent = '💖 Send Heart';
      }, 1000);
  
      loadHistory();
    });
  
    async function loadHistory() {
      const { hearts = [], yourName } = await chrome.storage.sync.get(['hearts', 'yourName']);
      historyDiv.innerHTML = '';
  
      // Show last 10 hearts
      const recentHearts = hearts.slice(-10).reverse();
      
      recentHearts.forEach(heart => {
        const div = document.createElement('div');
        const isSent = heart.sender === yourName;
        div.className = `history-item ${isSent ? 'sent' : 'received'}`;
        
        const date = new Date(heart.timestamp);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        div.textContent = `${isSent ? 'You sent' : heart.sender + ' sent'} 💖 at ${timeStr}`;
        historyDiv.appendChild(div);
      });
    }
  
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.hearts) {
        loadHistory();
      }
    });
  
    loadHistory();
  });