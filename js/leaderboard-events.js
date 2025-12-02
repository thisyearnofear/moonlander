/**
 * Leaderboard Event Reader
 * Reads scores from MoonlanderGame contract events on Monad
 */

// Configuration - prevent redeclaration
if (typeof LEADERBOARD_CONFIG === 'undefined') {
  var LEADERBOARD_CONFIG = {
    RPC_URL: 'https://rpc.monad.xyz',
    MOONLANDER_CONTRACT: '0x399f080bB2868371D7a0024a28c92fc63C05536E',
    M00NAD_DECIMALS: 18,
  };
}

// Cache to prevent multiple simultaneous loads
let leaderboardCache = {
  data: [],
  lastUpdated: 0,
  isLoading: false
};

// Load cache from localStorage on startup
function loadCacheFromStorage() {
  try {
    const stored = localStorage.getItem('moonlander_leaderboard');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only use if less than 5 minutes old
      if (Date.now() - parsed.lastUpdated < 300000) {
        leaderboardCache = parsed;
        console.log('Loaded leaderboard from localStorage');
        return true;
      }
    }
  } catch (e) {
    console.warn('Failed to load leaderboard cache:', e);
  }
  return false;
}

// Save cache to localStorage
function saveCacheToStorage() {
  try {
    localStorage.setItem('moonlander_leaderboard', JSON.stringify(leaderboardCache));
  } catch (e) {
    console.warn('Failed to save leaderboard cache:', e);
  }
}

/**
 * Load leaderboard from enhanced contract (direct query - no event scanning!)
 */
async function loadLeaderboardFromContract() {
  try {
    // Check if we're already loading or have recent data
    const cacheAge = Date.now() - leaderboardCache.lastUpdated;
    if (leaderboardCache.isLoading) {
      console.log('Leaderboard load already in progress...');
      return leaderboardCache.data;
    }

    // Use cached data if it's less than 30 seconds old
    if (cacheAge < 30000 && leaderboardCache.data.length > 0) {
      console.log('Using cached leaderboard data');
      return leaderboardCache.data;
    }

    leaderboardCache.isLoading = true;
    console.log('Loading leaderboard from enhanced contract...');

    const provider = new ethers.providers.JsonRpcProvider(LEADERBOARD_CONFIG.RPC_URL);
    const contract = new ethers.Contract(
      LEADERBOARD_CONFIG.MOONLANDER_CONTRACT,
      MOONLANDER_ABI,
      provider
    );

    // Use event scanning since contract doesn't have getTopScores method
    let topScores = [];

    try {
      // Event scanning
      const currentBlock = await provider.getBlockNumber();
      const searchFromBlock = Math.max(0, currentBlock - 200);

      console.log(`Scanning events from block ${searchFromBlock} to ${currentBlock}`);

      let allEvents = [];
      const blockChunkSize = 100;

      for (let i = searchFromBlock; i <= currentBlock; i += blockChunkSize) {
        const toBlock = Math.min(i + blockChunkSize - 1, currentBlock);
        try {
          const chunkEvents = await provider.getLogs({
            address: LEADERBOARD_CONFIG.MOONLANDER_CONTRACT,
            topics: [ethers.utils.id('ScoreSubmitted(address,uint256,uint8,uint256)')],
            fromBlock: i,
            toBlock: toBlock
          });
          allEvents = allEvents.concat(chunkEvents);
        } catch (err) {
          console.warn(`Failed to query blocks ${i}-${toBlock}:`, err.message);
        }
      }

      // Parse events
      const scores = [];
      const iface = new ethers.utils.Interface(window.MOONLANDER_ABI || []);

      allEvents.forEach((log) => {
        try {
          const parsed = iface.parseLog(log);
          scores.push({
            player: parsed.args.player,
            score: parsed.args.score.toNumber(),
            landed: parsed.args.landed,
            timestamp: parsed.args.timestamp.toNumber(),
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash
          });
        } catch (e) {
          console.error('Failed to parse event:', e);
        }
      });

      // Filter and sort
      const validScores = scores.filter(s => s.landed === 1);
      validScores.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timestamp - b.timestamp;
      });

      topScores = validScores.slice(0, 100);
    } catch (contractError) {
      console.warn('Event scanning failed:', contractError.message);
      // Return empty array if event scanning fails
      topScores = [];
    }

    console.log(`Displaying ${topScores.length} safe landings`);

    // Cache the results
    leaderboardCache.data = topScores;
    leaderboardCache.lastUpdated = Date.now();
    leaderboardCache.isLoading = false;
    saveCacheToStorage(); // Persist to localStorage

    return topScores;
  } catch (error) {
    console.error('Failed to load leaderboard from contract:', error);
    leaderboardCache.isLoading = false;
    return leaderboardCache.data; // Return cached data if available
  }
}

/**
 * Add optimistic score update (show immediately while waiting for blockchain confirmation)
 */
function addOptimisticScore(player, score, landed) {
  if (landed !== 1) return; // Only show safe landings

  const optimisticScore = {
    player: player,
    score: score,
    landed: landed,
    timestamp: Math.floor(Date.now() / 1000),
    blockNumber: 0,
    transactionHash: 'pending',
    isOptimistic: true
  };

  // Add to cache temporarily
  leaderboardCache.data.unshift(optimisticScore);

  // Re-sort and display
  leaderboardCache.data.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timestamp - b.timestamp;
  });

  // Update display
  displayLeaderboardFromCache();

  console.log('Added optimistic score:', score);
}

/**
 * Display leaderboard from cached data (no network calls)
 */
function displayLeaderboardFromCache() {
  const leaderboardList = document.getElementById('leaderboardList');
  if (!leaderboardList) return;

  leaderboardList.innerHTML = '';

  const scores = leaderboardCache.data.slice(0, 100); // Top 100

  if (scores.length === 0) {
    leaderboardList.innerHTML = '<div style="text-align: center; color: #999; padding: 40px; font-size: 14px;">No safe landings yet. Be the first! 🚀</div>';
    return;
  }

  scores.forEach((entry, index) => {
    const formatted = formatScore(entry);
    const div = document.createElement('div');
    div.className = 'leaderboard-entry';
    div.style.cssText = `
      padding: 12px;
      border-bottom: 1px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 0.2s;
      cursor: pointer;
      ${entry.isOptimistic ? 'opacity: 0.7; border-left: 3px solid #ffa500;' : ''}
    `;

    div.onmouseover = () => div.style.backgroundColor = '#2a2a2a';
    div.onmouseout = () => div.style.backgroundColor = 'transparent';

    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
        <span style="color: #999; font-weight: bold; min-width: 30px; text-align: center;">
          #${index + 1}
        </span>
        <span style="color: #ccc;">
          <a href="https://monadvision.com/address/${entry.player}" target="_blank" style="color: #4a90e2; text-decoration: none;">
            ${formatted.playerShort}
          </a>
          ${entry.isOptimistic ? '<span style="color: #ffa500; font-size: 10px; margin-left: 5px;">⏳ PENDING</span>' : ''}
        </span>
      </div>
      <div style="text-align: right;">
        <div style="color: #50c878; font-weight: bold; font-size: 18px;">
          ${entry.score.toLocaleString()}
        </div>
        <div style="color: #999; font-size: 11px;">
          ${entry.isOptimistic ? 'Just now' : formatted.date}
        </div>
      </div>
    `;
    leaderboardList.appendChild(div);
  });
}

/**
 * Format score for display
 */
function formatScore(score) {
  return {
    player: score.player,
    playerShort: `${score.player.slice(0, 6)}...${score.player.slice(-4)}`,
    score: score.score,
    date: new Date(score.timestamp * 1000).toLocaleDateString(),
    time: new Date(score.timestamp * 1000).toLocaleTimeString(),
    explorerUrl: `https://monadvision.com/tx/${score.transactionHash}`
  };
}

/**
 * Display leaderboard in HTML
 */
async function displayLeaderboard() {
  const leaderboardList = document.getElementById('leaderboardList');

  if (!leaderboardList) {
    console.error('Leaderboard element not found');
    return;
  }

  try {
    // Show loading state
    leaderboardList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #999;">
        <div style="font-size: 20px; margin-bottom: 10px;">🚀</div>
        <div>Loading leaderboard...</div>
      </div>
    `;

    const scores = await loadLeaderboardFromContract();

    // Use the cached display method for consistency
    displayLeaderboardFromCache();
  } catch (error) {
    console.error('Failed to display leaderboard:', error);
    leaderboardList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #f44;">
        <div style="font-size: 20px; margin-bottom: 10px;">⚠️</div>
        <div style="margin-bottom: 15px;">Failed to load leaderboard</div>
        <button onclick="displayLeaderboard()" style="
          background: #4a90e2; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 5px; 
          cursor: pointer;
          font-size: 14px;
        ">
          Try Again
        </button>
      </div>
    `;
  }
}

/**
 * Listen to new score events
 */
function listenToNewScores(callback) {
  try {
    const provider = new ethers.providers.WebSocketProvider(
      'wss://rpc.monad.xyz' // WebSocket endpoint if available
    );
    const contract = new ethers.Contract(
      LEADERBOARD_CONFIG.MOONLANDER_CONTRACT,
      window.MOONLANDER_ABI || [],
      provider
    );

    contract.on('ScoreSubmitted', (player, score, landed, timestamp, event) => {
      console.log('New score event:', {
        player,
        score: score.toString(),
        landed,
        timestamp: timestamp.toNumber()
      });

      if (landed === 1) {
        // Valid landing, refresh leaderboard
        if (callback) callback();
      }
    });

    console.log('Listening for new score events...');
  } catch (error) {
    console.warn('WebSocket not available, using polling instead:', error);
    // Fallback: poll for new scores every 10 seconds
    setInterval(async () => {
      const scores = await loadLeaderboardFromContract();
      if (callback && scores.length > 0) {
        callback(scores);
      }
    }, 10000);
  }
}

/**
 * Auto-refresh leaderboard
 */
function startAutoRefresh(intervalSeconds = 30) {
  console.log(`Auto-refreshing leaderboard every ${intervalSeconds} seconds`);

  setInterval(async () => {
    await displayLeaderboard();
  }, intervalSeconds * 1000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing leaderboard...');

  // Try to load from localStorage first
  loadCacheFromStorage();

  await displayLeaderboard();

  // Listen for new scores and refresh
  listenToNewScores(() => {
    console.log('New score detected, refreshing leaderboard...');
    displayLeaderboard();
  });

  // Auto-refresh every 30 seconds
  startAutoRefresh(60); // Refresh every 60 seconds instead of 30
});

/**
 * Submit score to enhanced contract
 */
async function submitScore(score, landed) {
  try {
    // Delegate to main contract integration if available (handles Farcaster & WalletConnect)
    if (window.contractIntegration && typeof window.contractIntegration.submitScore === 'function') {
      return window.contractIntegration.submitScore(score, landed);
    }

    if (!window.ethereum) throw new Error('No wallet connected');

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      LEADERBOARD_CONFIG.MOONLANDER_CONTRACT,
      window.MOONLANDER_ABI || [],
      signer
    );

    console.log('Submitting score to enhanced contract:', score, landed);

    // Show optimistic update immediately
    const playerAddress = await signer.getAddress();
    addOptimisticScore(playerAddress, score, landed);

    // Submit to contract
    const tx = await contract.submitScore(score, landed);
    console.log('Score submission transaction:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Score confirmed on blockchain:', receipt);

    // Refresh leaderboard to show confirmed score
    setTimeout(() => {
      leaderboardCache.lastUpdated = 0; // Force refresh
      displayLeaderboard();
    }, 2000);

    return receipt;
  } catch (error) {
    console.error('Failed to submit score:', error);
    throw error;
  }
}

// Make functions available globally for optimistic updates
window.leaderboardAPI = {
  addOptimisticScore,
  displayLeaderboard,
  submitScore,
  refreshLeaderboard: () => {
    leaderboardCache.lastUpdated = 0; // Force refresh
    displayLeaderboard();
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadLeaderboardFromContract,
    displayLeaderboard,
    listenToNewScores,
    startAutoRefresh,
    addOptimisticScore
  };
}
