// ============ Modal Dialog Utility ============

/**
 * Show a custom styled modal dialog
 */
function showModal(message, title = 'Alert', buttonText = 'OK') {
  const backdrop = document.getElementById('modalBackdrop');
  const titleEl = document.getElementById('modalTitle');
  const messageEl = document.getElementById('modalMessage');
  const buttonEl = document.getElementById('modalButton');

  if (!backdrop) {
    // Fallback to alert if modal elements don't exist
    alert(message);
    return new Promise(resolve => resolve());
  }

  titleEl.textContent = title;
  messageEl.textContent = message;
  buttonEl.textContent = buttonText;
  backdrop.classList.add('active');

  return new Promise(resolve => {
    buttonEl.onclick = () => {
      backdrop.classList.remove('active');
      resolve();
    };
  });
}

// Determine if we're showing results with a score
const urlParams = new URLSearchParams(window.location.search);
const scoreFromUrl = parseInt(urlParams.get('score'));
const landedFromUrl = parseInt(urlParams.get('landed'));
const isFreshScore = urlParams.get('fresh') === 'true';
const finalScore = scoreFromUrl || parseInt(localStorage.getItem('lastScore')) || 0;
const landed = landedFromUrl !== undefined ? landedFromUrl : parseInt(localStorage.getItem('lastLanded')) || 0;

// Show score section only if we have a fresh score from gameplay
const hasScore = scoreFromUrl > 0;
const scoreSection = document.getElementById('scoreSection');
const playBtn = document.getElementById('playBtn');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const mainMenuBtn = document.getElementById('mainMenu');

if (hasScore && isFreshScore) {
  // Fresh score from just finishing a game
  scoreSection.style.display = 'block';
  document.getElementById('finalScore').textContent = finalScore;
  playBtn.style.display = 'none';
  submitScoreBtn.style.display = 'block';  // Show submit button for fresh score
  playBtn.textContent = 'PLAY AGAIN 🚀';   // Set text for after submission
  mainMenuBtn.style.display = 'block';
} else {
  // No fresh score or just viewing leaderboard normally
  scoreSection.style.display = 'none';
  playBtn.style.display = 'block';
  playBtn.textContent = 'LFG 🚀';          // Set initial text
  submitScoreBtn.style.display = 'none';
  mainMenuBtn.style.display = 'none';
}

// Load and display leaderboard from contract
async function loadLeaderboard() {
  try {
    // Try to load from contract first
    if (typeof displayLeaderboard === 'function') {
      await displayLeaderboard();
    } else {
      // Fallback to localStorage
      loadLocalLeaderboard();
    }
  } catch (error) {
    console.warn('Failed to load contract leaderboard, using localStorage:', error);
    loadLocalLeaderboard();
  }
}

// Fallback: Load and display leaderboard from localStorage
function loadLocalLeaderboard() {
  let scores = JSON.parse(localStorage.getItem('moonlanderScores')) || [];

  // Add current score if not already in list
  if (finalScore > 0) {
    scores.push({ score: finalScore, date: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10); // Keep top 10
    localStorage.setItem('moonlanderScores', JSON.stringify(scores));
  }

  // Populate both leaderboard displays
  displayLeaderboardEntries(scores, finalScore);
}

// Display leaderboard entries
function displayLeaderboardEntries(scores, highlightScore = 0) {
  const leaderboardList = document.getElementById('leaderboardList');

  leaderboardList.innerHTML = '';

  if (scores.length === 0) {
    const emptyMsg = '<div style="text-align: center; opacity: 0.5; padding: 1rem;">No scores yet</div>';
    leaderboardList.innerHTML = emptyMsg;
    return;
  }

  scores.forEach((entry, index) => {
    const div = createLeaderboardEntry(entry, index, highlightScore);
    leaderboardList.appendChild(div);
  });
}

// Create a leaderboard entry element
function createLeaderboardEntry(entry, index, highlightScore) {
  const div = document.createElement('div');
  div.className = 'leaderboard-entry';
  if (entry.score === highlightScore && highlightScore > 0) {
    div.classList.add('current');
  }
  div.innerHTML = `
    <span class="rank">#${index + 1}</span>
    <span class="score">${entry.score}</span>
  `;
  return div;
}

// Random positioning for planets and startails
function randomizePositions() {
  document.querySelectorAll('.planets > div, .planets-2 > div').forEach(el => {
    el.style.left = `${Math.random() * 100}vw`;
    el.style.top = `${Math.random() * 100}vh`;
  });

  document.querySelectorAll('.startails > div').forEach(el => {
    const x = Math.random();
    const y = Math.random();
    const x2 = Math.random() - 0.5;
    const y2 = Math.random() - 0.5;
    const delay = Math.random();
    const distance = 20;

    el.style.left = `${x * 100}vw`;
    el.style.top = `${y * 100}vh`;
    el.style.animationDelay = `${delay * 144}s`;
    el.style.setProperty('--x', x);
    el.style.setProperty('--y', y);
    el.style.setProperty('--x2', x2);
    el.style.setProperty('--y2', y2);
  });
}

// Wallet button - toggle menu or connect
let walletConnected = false;

function setupWalletButton() {
  const walletButton = document.getElementById('menuConnectWallet');
  const walletMenu = document.getElementById('walletMenu');
  const walletDisconnectBtn = document.getElementById('walletDisconnect');

  if (!walletButton) return;

  walletButton.addEventListener('click', async (e) => {
    e.stopPropagation();

    if (walletConnected) {
      // Toggle menu if already connected
      walletMenu.style.display = walletMenu.style.display === 'none' ? 'block' : 'none';
    } else {
      // Connect if not connected
      if (window.contractIntegration && typeof window.contractIntegration.connectWallet === 'function') {
        console.log('Attempting wallet connection...');
        try {
          await window.contractIntegration.connectWallet();
        } catch (error) {
          console.error('Wallet connection failed:', error);
          alert('Failed to connect wallet. Please try again.');
        }
      } else {
        console.error('Contract integration not ready');
        alert('Please refresh the page and try again.');
      }
    }
  });

  // Wallet disconnect
  walletDisconnectBtn.addEventListener('click', async () => {
    if (typeof window.contractIntegration !== 'undefined') {
      window.contractIntegration.disconnectWallet();
      walletMenu.style.display = 'none';
      walletConnected = false;
    }
  });

  // Close wallet menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.wallet-section')) {
      walletMenu.style.display = 'none';
    }
  });
}

// Setup wallet button after DOM and scripts are ready
function initWalletWhenReady() {
  if (window.contractIntegration) {
    setupWalletButton();
  } else {
    // Wait for contract integration to load
    setTimeout(initWalletWhenReady, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWalletWhenReady);
} else {
  initWalletWhenReady();
}

// Remove duplicate event handlers - handled in DOMContentLoaded below

// Update menu wallet button when wallet connects
function updateMenuWalletDisplay(address) {
  const btn = document.getElementById('menuConnectWallet');
  const playBtn = document.getElementById('playBtn');
  const balanceDiv = document.getElementById('menuBalanceDisplay');

  if (address) {
    document.getElementById('menuWalletStatus').textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
    if (playBtn) {
      playBtn.style.display = 'block';
      playBtn.textContent = 'LFG 🚀';  // Ensure proper text
    }
    walletConnected = true;
  } else {
    document.getElementById('menuWalletStatus').textContent = 'CONNECT WALLET';
    if (playBtn) playBtn.style.display = 'none';
    balanceDiv.style.display = 'none';
    walletConnected = false;
    if (document.getElementById('walletMenu')) {
      document.getElementById('walletMenu').style.display = 'none';
    }
  }
}

// Update menu balance display
function updateMenuBalanceDisplay(balanceFormatted) {
  if (balanceFormatted) {
    const balanceDiv = document.getElementById('menuBalanceDisplay');
    const balanceText = document.getElementById('menuBalanceText');
    balanceText.textContent = balanceFormatted;
    balanceDiv.style.display = 'block';
  }
}

// Listen for wallet connection events from contract-integration
window.addEventListener('walletConnected', (e) => {
  updateMenuWalletDisplay(e.detail.address);
});

window.addEventListener('balanceUpdated', (e) => {
  updateMenuBalanceDisplay(e.detail.balance);
});

// Initialize
randomizePositions();
loadLeaderboard();

// Initialize Farcaster SDK (ready() is called in game.html after page load)
async function initFarcaster() {
  try {
    if (window.farcasterSDK) {
      const sdk = window.farcasterSDK;
      console.log('Farcaster SDK available on leaderboard');

      // Check context if needed
      try {
        const context = await sdk.context;
        console.log('Farcaster context:', context);
      } catch (error) {
        console.log('Not running in Farcaster context');
      }
    }
  } catch (error) {
    console.error('Failed to access Farcaster SDK:', error);
  }
}

// Call initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFarcaster);
} else {
  initFarcaster();
}

// Handle page flow based on URL parameters
window.addEventListener('load', function () {
  setTimeout(handlePageFlow, 500);
});

function handlePageFlow() {
  const urlParams = new URLSearchParams(window.location.search);
  const score = urlParams.get('score');
  const landed = urlParams.get('landed');
  const isFresh = urlParams.get('fresh') === 'true';

  if (score && landed !== null) {
    hideWelcomeSection();

    if (isFresh) {
      // Fresh score - show submit button
      const playBtn = document.getElementById('playBtn');
      const submitScoreBtn = document.getElementById('submitScoreBtn');

      if (submitScoreBtn) submitScoreBtn.style.display = 'block';
      if (playBtn) playBtn.style.display = 'none';
    } else {
      // Viewing past score
      showPlayAgainButton();
      setTimeout(() => highlightPlayerScore(parseInt(score)), 2000);
    }
  } else {
    showWelcomeSection();
    showPlayButton();
  }

  loadGameStats();
}

function showWelcomeSection() {
  const el = document.getElementById('welcomeSection');
  if (el) el.style.display = 'block';
}

function hideWelcomeSection() {
  const el = document.getElementById('welcomeSection');
  if (el) el.style.display = 'none';
}

function showPlayButton() {
  const playBtn = document.getElementById('playBtn');
  const submitScoreBtn = document.getElementById('submitScoreBtn');
  if (playBtn) {
    playBtn.style.display = 'inline-block';
    playBtn.textContent = 'LFG 🚀';
  }
  if (submitScoreBtn) submitScoreBtn.style.display = 'none';
}

function showPlayAgainButton() {
  const playBtn = document.getElementById('playBtn');
  const submitScoreBtn = document.getElementById('submitScoreBtn');
  if (submitScoreBtn) submitScoreBtn.style.display = 'none';
  if (playBtn) {
    playBtn.style.display = 'inline-block';
    playBtn.textContent = 'PLAY AGAIN 🚀';
  }
}

function highlightPlayerScore(playerScore) {
  const entries = document.querySelectorAll('.leaderboard-entry');
  entries.forEach(entry => {
    const scoreElement = entry.querySelector('[style*="font-size: 18px"]');
    if (scoreElement && scoreElement.textContent.replace(/,/g, '') == playerScore) {
      entry.style.border = '2px solid #ffa500';
      entry.style.backgroundColor = '#332200';
      entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

function loadGameStats() {
  const totalGamesEl = document.getElementById('totalGames');
  const totalBurnedEl = document.getElementById('totalBurned');
  const topScoreEl = document.getElementById('topScore');

  if (totalGamesEl) totalGamesEl.textContent = '🔄';
  if (totalBurnedEl) totalBurnedEl.textContent = '🔄';
  if (topScoreEl) topScoreEl.textContent = '🔄';

  setTimeout(() => {
    const firstEntry = document.querySelector('.leaderboard-entry');
    if (firstEntry && topScoreEl) {
      const scoreText = firstEntry.querySelector('[style*="font-size: 18px"]');
      if (scoreText) {
        topScoreEl.textContent = scoreText.textContent;
      } else {
        topScoreEl.textContent = 'No scores yet';
      }
    } else if (topScoreEl) {
      topScoreEl.textContent = 'No scores yet';
    }

    if (totalGamesEl) totalGamesEl.textContent = 'Many!';
    if (totalBurnedEl) totalBurnedEl.textContent = 'Millions!';
  }, 3000);
}

// Handle button clicks
document.addEventListener('DOMContentLoaded', function () {
  const playBtn = document.getElementById('playBtn');
  const submitBtn = document.getElementById('submitScoreBtn');
  const mainMenu = document.getElementById('mainMenu');

  if (playBtn) {
    playBtn.addEventListener('click', function () {
      // Trigger payment flow
      if (window.contractIntegration && window.contractIntegration.payAndPlayGame) {
        window.contractIntegration.payAndPlayGame();
      } else {
        alert('Please connect your wallet first');
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async function () {
      // Submit score to contract
      submitBtn.disabled = true;
      submitBtn.textContent = 'SUBMITTING...';

      try {
        if (!window.contractIntegration || !window.contractIntegration.submitScore) {
          showModal('Contract integration not available. Please refresh the page.', 'Error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'SUBMIT SCORE';
          return;
        }

        // Call submitScore with the final score and landed status
        const success = await window.contractIntegration.submitScore(finalScore, landed);

        if (success) {
          // Show play again button after successful submission
          submitBtn.style.display = 'none';
          if (playBtn) {
            playBtn.style.display = 'block';
            playBtn.textContent = 'PLAY AGAIN 🚀';
          }
          const mainMenuBtn = document.getElementById('mainMenu');
          if (mainMenuBtn) mainMenuBtn.style.display = 'block';
        } else {
          // If submission failed, reset button
          submitBtn.disabled = false;
          submitBtn.textContent = 'SUBMIT SCORE';
        }
      } catch (error) {
        console.error('Score submission error:', error);
        showModal('Failed to submit score. Please try again.', 'Submission Error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'SUBMIT SCORE';
      }
    });
  }

  if (mainMenu) {
    mainMenu.addEventListener('click', function () {
      // Return to main menu (clear URL parameters)
      window.location.href = 'index.html';
    });
  }
});
