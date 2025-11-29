// Determine if we're showing menu or results
const urlParams = new URLSearchParams(window.location.search);
const scoreFromUrl = parseInt(urlParams.get('score'));
const landedFromUrl = parseInt(urlParams.get('landed'));
const finalScore = scoreFromUrl || parseInt(localStorage.getItem('lastScore')) || 0;
const landed = landedFromUrl !== undefined ? landedFromUrl : parseInt(localStorage.getItem('lastLanded')) || 0;

// Show results only if we have a score from gameplay
const isResultsScreen = scoreFromUrl > 0;
const menuContainer = document.getElementById('menuContainer');
const resultsContainer = document.getElementById('resultsContainer');

if (isResultsScreen) {
  menuContainer.style.display = 'none';
  resultsContainer.style.display = 'block';
  document.getElementById('finalScore').textContent = finalScore;
} else {
  menuContainer.style.display = 'block';
  resultsContainer.style.display = 'none';
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
  
  const leaderboardList = document.getElementById('leaderboardList');
  leaderboardList.innerHTML = '';
  
  if (scores.length === 0) {
    leaderboardList.innerHTML = '<div style="text-align: center; opacity: 0.5;">No scores yet</div>';
    return;
  }
  
  scores.forEach((entry, index) => {
    const div = document.createElement('div');
    div.className = 'leaderboard-entry';
    if (entry.score === finalScore && index < 10) {
      div.classList.add('current');
    }
    div.innerHTML = `
      <span><span class="rank">#${index + 1}</span></span>
      <span class="score">${entry.score}</span>
    `;
    leaderboardList.appendChild(div);
  });
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

// Menu buttons
document.getElementById('menuConnectWallet').addEventListener('click', async () => {
  if (typeof window.contractIntegration !== 'undefined') {
    await window.contractIntegration.connectWallet();
  }
});

document.getElementById('menuPlayBtn').addEventListener('click', async () => {
  if (typeof window.contractIntegration !== 'undefined') {
    await window.contractIntegration.payAndPlayGame();
  }
});

document.getElementById('menuViewLeaderboard').addEventListener('click', () => {
  resultsContainer.style.display = 'block';
  menuContainer.style.display = 'none';
});

// Results buttons
document.getElementById('playAgain').addEventListener('click', async () => {
  // Redirect to menu first
  window.location.href = 'leaderboard.html';
});

document.getElementById('mainMenu').addEventListener('click', () => {
  window.location.href = 'leaderboard.html';
});

// Toggle leaderboard visibility (results page)
const toggleBtn = document.getElementById('toggleLeaderboard');
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    resultsContainer.classList.add('collapsed');
  });
}

// Update menu wallet button when wallet connects
function updateMenuWalletDisplay(address) {
  const btn = document.getElementById('menuConnectWallet');
  const playBtn = document.getElementById('menuPlayBtn');
  const balanceDiv = document.getElementById('menuBalanceDisplay');
  
  if (address) {
    document.getElementById('menuWalletStatus').textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
    playBtn.style.display = 'block';
  } else {
    document.getElementById('menuWalletStatus').textContent = 'CONNECT WALLET';
    playBtn.style.display = 'none';
    balanceDiv.style.display = 'none';
  }
}

// Update menu balance display
function updateMenuBalanceDisplay(balanceFormatted) {
  const balanceNum = parseFloat(balanceFormatted);
  if (balanceNum > 0) {
    const balanceDiv = document.getElementById('menuBalanceDisplay');
    const balanceText = document.getElementById('menuBalanceText');
    balanceText.textContent = `${balanceNum.toFixed(2)} m00nad`;
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
