/**
 * Leaderboard Event Reader
 * Reads scores from MoonlanderGame contract events on Monad
 */

// Configuration
const CONFIG = {
  RPC_URL: 'https://rpc.monad.xyz',
  MOONLANDER_CONTRACT: '0x802C3a9953C4fcEC807eF1B464F7b15310C2396b',
  M00NAD_DECIMALS: 18,
};

/**
 * Load leaderboard from contract events
 */
async function loadLeaderboardFromContract() {
  try {
    console.log('Loading leaderboard from contract...');
    
    const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL);
    const contract = new ethers.Contract(
      CONFIG.MOONLANDER_CONTRACT,
      MOONLANDER_ABI,
      provider
    );

    // Get current block to determine search range
    const currentBlock = await provider.getBlockNumber();
    const searchFromBlock = Math.max(0, currentBlock - 50000); // Last ~50k blocks

    console.log(`Searching from block ${searchFromBlock} to ${currentBlock}`);

    // Query ScoreSubmitted events
    const events = await provider.getLogs({
      address: CONFIG.MOONLANDER_CONTRACT,
      topics: [ethers.utils.id('ScoreSubmitted(address,uint256,uint8,uint256)')],
      fromBlock: searchFromBlock,
      toBlock: 'latest'
    });

    console.log(`Found ${events.length} score events`);

    // Parse events and create leaderboard
    const scores = [];
    const iface = new ethers.utils.Interface(window.MOONLANDER_ABI || []);

    events.forEach((log) => {
      try {
        const parsed = iface.parseLog(log);
        const score = {
          player: parsed.args.player,
          score: parsed.args.score.toNumber(),
          landed: parsed.args.landed,
          timestamp: parsed.args.timestamp.toNumber(),
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash
        };
        scores.push(score);
      } catch (e) {
        console.error('Failed to parse event:', e);
      }
    });

    // Filter for safe landings only (landed == 1)
    const validScores = scores.filter(s => s.landed === 1);

    // Sort by score descending, then by timestamp
    validScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.timestamp - b.timestamp;
    });

    // Take top 100
    const topScores = validScores.slice(0, 100);

    console.log(`Displaying ${topScores.length} safe landings`);

    return topScores;
  } catch (error) {
    console.error('Failed to load leaderboard from contract:', error);
    return [];
  }
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
  try {
    const scores = await loadLeaderboardFromContract();
    const leaderboardList = document.getElementById('leaderboardList');

    if (!leaderboardList) {
      console.error('Leaderboard element not found');
      return;
    }

    leaderboardList.innerHTML = '';

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
        hover-color: #444;
      `;
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
          <span style="color: #999; font-weight: bold; min-width: 30px; text-align: center;">
            #${index + 1}
          </span>
          <span style="color: #ccc;">
            <a href="https://monadvision.com/address/${entry.player}" target="_blank" style="color: #4a90e2; text-decoration: none;">
              ${formatted.playerShort}
            </a>
          </span>
        </div>
        <div style="text-align: right;">
          <div style="color: #50c878; font-weight: bold; font-size: 18px;">
            ${entry.score.toLocaleString()}
          </div>
          <div style="color: #999; font-size: 11px;">
            ${formatted.date}
          </div>
        </div>
      `;
      leaderboardList.appendChild(div);
    });
  } catch (error) {
    console.error('Failed to display leaderboard:', error);
    const leaderboardList = document.getElementById('leaderboardList');
    if (leaderboardList) {
      leaderboardList.innerHTML = '<div style="color: #f00; padding: 20px;">Error loading leaderboard</div>';
    }
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
       CONFIG.MOONLANDER_CONTRACT,
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
  await displayLeaderboard();
  
  // Listen for new scores and refresh
  listenToNewScores(() => {
    console.log('New score detected, refreshing leaderboard...');
    displayLeaderboard();
  });
  
  // Auto-refresh every 30 seconds
  startAutoRefresh(30);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadLeaderboardFromContract,
    displayLeaderboard,
    listenToNewScores,
    startAutoRefresh
  };
}
