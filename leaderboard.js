// Determine if we're showing results with a score
const urlParams = new URLSearchParams(window.location.search);
const scoreFromUrl = parseInt(urlParams.get('score'));
const landedFromUrl = parseInt(urlParams.get('landed'));
const finalScore = scoreFromUrl || parseInt(localStorage.getItem('lastScore')) || 0;
const landed = landedFromUrl !== undefined ? landedFromUrl : parseInt(localStorage.getItem('lastLanded')) || 0;

// Show score section only if we have a score from gameplay
const hasScore = scoreFromUrl > 0;
const scoreSection = document.getElementById('scoreSection');
const menuPlayBtn = document.getElementById('menuPlayBtn');
const playAgainBtn = document.getElementById('playAgain');
const mainMenuBtn = document.getElementById('mainMenu');

if (hasScore) {
  scoreSection.style.display = 'block';
  document.getElementById('finalScore').textContent = finalScore;
  menuPlayBtn.style.display = 'none';
  playAgainBtn.style.display = 'block';
  mainMenuBtn.style.display = 'block';
} else {
  scoreSection.style.display = 'none';
  menuPlayBtn.style.display = 'block';
  playAgainBtn.style.display = 'none';
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

// Play Again button
playAgainBtn.addEventListener('click', async () => {
  window.location.href = 'leaderboard.html';
});

// Main Menu button
mainMenuBtn.addEventListener('click', () => {
  window.location.href = 'leaderboard.html';
});

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
