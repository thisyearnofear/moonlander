/**
 * Moonlander Game Contract Integration
 * Handles wallet connection, payments, and score submission
 */

// ============ Configuration ============

// Supported chains
const SUPPORTED_CHAINS = {
  monad: {
    chainId: 10143,
    name: 'Monad Mainnet',
    rpcUrl: 'https://rpc.monad.xyz',
    rpcUrlBackup: 'https://rpc1.monad.xyz',
    tokenAddress: '0x22Cd99EC337a2811F594340a4A6E41e4A3022b07', // m00nad
    contractAddress: '0x802C3a9953C4fcEC807eF1B464F7b15310C2396b', // MoonlanderGame
    explorerUrl: 'https://monadvision.com'
  },
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.rpc.blxrbdn.com',
    tokenAddress: '', // m00nad not deployed on Ethereum yet
    contractAddress: '', // Game not deployed on Ethereum yet
    explorerUrl: 'https://etherscan.io'
  }
};

// Primary chain for the game
const PRIMARY_CHAIN = 'monad';
const CONFIG = {
  RPC_URL: SUPPORTED_CHAINS.monad.rpcUrl,
  CHAIN_ID: SUPPORTED_CHAINS.monad.chainId,
  M00NAD_TOKEN: SUPPORTED_CHAINS.monad.tokenAddress,
  M00NAD_DECIMALS: 18,
  MOONLANDER_CONTRACT: SUPPORTED_CHAINS.monad.contractAddress,
  ENTRY_FEE: '100000',
};

// ERC20_ABI is loaded from moonlander-abi.js, use window.ERC20_ABI if available
// This is kept as a fallback minimal ABI
const ERC20_ABI_FALLBACK = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  }
];

// Use the ERC20_ABI from window or fallback
const getERC20ABI = () => window.ERC20_ABI || ERC20_ABI_FALLBACK;

// MOONLANDER_ABI will be loaded from window.MOONLANDER_ABI after moonlander-abi.js loads

// ABIs will be loaded from script tags in HTML

// ============ State Management ============

let currentAccount = null;
let ethersProvider = null;
let ethersSigner = null;
let gameStarted = false;

// ============ Initialization ============

/**
 * Persist wallet connection to sessionStorage
 */
function saveWalletState() {
  if (currentAccount) {
    sessionStorage.setItem('moonlander_wallet', JSON.stringify({
      account: currentAccount,
      timestamp: Date.now()
    }));
    console.log('Wallet state saved:', currentAccount);
  }
}

/**
 * Restore wallet connection from sessionStorage
 */
function restoreWalletState() {
  try {
    const saved = sessionStorage.getItem('moonlander_wallet');
    if (saved) {
      const { account, timestamp } = JSON.parse(saved);
      // Only restore if saved within last 24 hours
      if (Date.now() - timestamp < 86400000) {
        return account;
      }
    }
  } catch (err) {
    console.warn('Could not restore wallet state:', err);
  }
  return null;
}

/**
 * Wait for ethers.js to be available
 */
async function waitForEthers(maxWait = 5000) {
  const startTime = Date.now();
  while (typeof ethers === 'undefined') {
    if (Date.now() - startTime > maxWait) {
      console.error('ethers.js did not load in time');
      return false;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log('ethers.js loaded successfully');
  return true;
}

/**
 * Initialize contract integration when page loads
 */
async function initializeContractIntegration() {
  console.log('Initializing contract integration...');
  
  // Wait for ethers to load
  const ethersReady = await waitForEthers();
  if (!ethersReady) {
    console.error('ethers.js failed to load');
    updateUIForNoWallet();
    return;
  }
  
  // Check if MetaMask/Web3 wallet is available
  if (typeof window.ethereum === 'undefined') {
    console.warn('Web3 wallet not detected - running in read-only mode');
    updateUIForNoWallet();
    return;
  }
  
  try {
    // Listen for account changes
    if (window.ethereum.on) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    // First, try to restore saved wallet state
    const savedAccount = restoreWalletState();
    if (savedAccount) {
      console.log('Attempting to restore wallet connection for:', savedAccount);
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        
        if (accounts && accounts.includes(savedAccount)) {
          console.log('Restoring wallet connection...');
          currentAccount = savedAccount;
          ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
          ethersSigner = ethersProvider.getSigner();
          updateUIForConnectedWallet(currentAccount);
          return;
        }
      } catch (err) {
        console.warn('Could not restore connection:', err);
      }
    }
    
    // Check if already connected
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      
      if (accounts && accounts.length > 0) {
        await connectWallet();
      } else {
        updateUIForNoWallet();
      }
    } catch (err) {
      console.warn('Could not check accounts:', err);
      updateUIForNoWallet();
    }
  } catch (error) {
    console.error('Failed to initialize contract integration:', error);
    updateUIForNoWallet();
  }
}

// ============ Wallet Connection ============

/**
 * Connect wallet and setup providers
 */
async function connectWallet() {
  try {
    // Ensure ethers is available
    if (typeof ethers === 'undefined') {
      console.error('ethers.js not available');
      const ethersReady = await waitForEthers();
      if (!ethersReady) {
        updateUIWithMessage('Library loading error - please refresh page');
        return false;
      }
    }

    // Check if wallet exists
    if (typeof window.ethereum === 'undefined') {
      console.error('No Web3 wallet detected');
      updateUIWithMessage('No Web3 wallet found. Please install MetaMask.');
      return false;
    }

    console.log('Requesting wallet connection...');
    updateUIWithMessage('Connecting wallet...');
    
    // Request accounts from wallet
    let accounts;
    try {
      accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
    } catch (requestError) {
      if (requestError.code === 4001) {
        console.log('User rejected wallet connection');
        updateUIWithMessage('Wallet connection rejected');
      } else {
        console.error('Wallet request failed:', requestError);
        updateUIWithMessage(`Wallet error: ${requestError.message}`);
      }
      return false;
    }

    if (!accounts || accounts.length === 0) {
      console.error('No accounts returned from wallet');
      updateUIWithMessage('No accounts found in wallet');
      return false;
    }
    
    currentAccount = accounts[0];
    console.log('Connected account:', currentAccount);
    
    // Setup ethers providers
    ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
    ethersSigner = ethersProvider.getSigner();
    
    // Verify chain and switch if needed
    const network = await ethersProvider.getNetwork();
    console.log(`Current chain: ${network.chainId}`);
    
    if (network.chainId !== CONFIG.CHAIN_ID) {
      console.log(`Wrong chain (${network.chainId}). Attempting to switch to Monad (${CONFIG.CHAIN_ID})...`);
      updateUIWithMessage('Switching to Monad mainnet...');
      const switched = await switchToMonad();
      if (!switched) {
        updateUIForWrongChain();
        return false;
      }
    }
    
    updateUIForConnectedWallet(currentAccount);
    updateUIWithMessage('Wallet connected!');
    saveWalletState();
    return true;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    updateUIWithMessage(`Connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Switch to Monad mainnet
 */
async function switchToMonad() {
  try {
    if (typeof window.ethereum === 'undefined') {
      console.error('Web3 wallet not available');
      return false;
    }

    const chainIdHex = '0x' + CONFIG.CHAIN_ID.toString(16);
    console.log(`Attempting to switch to chain: ${chainIdHex}`);
    
    try {
      // Try to switch to existing chain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      console.log('Successfully switched to Monad mainnet');
      return true;
    } catch (switchError) {
      console.error('Switch error code:', switchError.code, 'Message:', switchError.message);
      
      // Chain not added, try to add it
      if (switchError.code === 4902 || switchError.code === -32603) {
        console.log('Chain not found, adding Monad mainnet...');
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: 'Monad Mainnet',
              nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
              rpcUrls: [CONFIG.RPC_URL],
              blockExplorerUrls: [SUPPORTED_CHAINS.monad.explorerUrl],
            }],
          });
          console.log('Monad mainnet added and switched successfully');
          return true;
        } catch (addError) {
          console.error('Failed to add Monad chain:', addError);
          if (addError.code === 4001) {
            updateUIWithMessage('You rejected adding the Monad network');
          } else {
            updateUIWithMessage('Failed to add Monad network: ' + addError.message);
          }
          return false;
        }
      } else if (switchError.code === 4001) {
        console.log('User rejected chain switch');
        updateUIWithMessage('You rejected switching networks');
        return false;
      } else {
        console.error('Unexpected switch error:', switchError);
        updateUIWithMessage('Failed to switch network: ' + switchError.message);
        return false;
      }
    }
  } catch (error) {
    console.error('Failed to switch to Monad:', error);
    updateUIWithMessage('Network error: ' + (error.message || 'Unknown error'));
    return false;
  }
}

/**
 * Disconnect wallet
 */
function disconnectWallet() {
  currentAccount = null;
  ethersProvider = null;
  ethersSigner = null;
  gameStarted = false;
  sessionStorage.removeItem('moonlander_wallet');
  updateUIForNoWallet();
}

// ============ Payment & Game Start ============

/**
 * Pay entry fee and start game
 */
async function payAndPlayGame() {
  if (!currentAccount) {
    updateUIWithMessage('Wallet not connected');
    if (typeof window.ethereum === 'undefined') {
      alert('Web3 wallet not found. Please install MetaMask or another wallet to play with payments.');
    } else {
      alert('Please connect your wallet to pay and play');
    }
    return false;
  }
  
  try {
    // Check balance first
    const balance = await getPlayerBalance(currentAccount);
    const entryFeeInWei = ethers.utils.parseUnits(
      CONFIG.ENTRY_FEE,
      CONFIG.M00NAD_DECIMALS
    );
    
    if (balance.lt(entryFeeInWei)) {
      alert(`Insufficient balance. You need ${CONFIG.ENTRY_FEE} m00nad`);
      return false;
    }
    
    // Check and request approval if needed
    const allowance = await getPlayerAllowance(currentAccount);
    if (allowance.lt(entryFeeInWei)) {
      const approved = await approveToken(entryFeeInWei);
      if (!approved) {
        console.log('User cancelled approval');
        return false;
      }
    }
    
    // Call playGame() function
    const moonlanderContract = new ethers.Contract(
      CONFIG.MOONLANDER_CONTRACT,
      window.MOONLANDER_ABI || [],
      ethersSigner
    );
    
    console.log('Submitting payment...');
    const tx = await moonlanderContract.playGame();
    
    console.log('Transaction hash:', tx.hash);
    updateUIWithMessage('Payment processing... waiting for confirmation');
    
    const receipt = await tx.wait();
    console.log('Payment confirmed:', receipt);
    
    gameStarted = true;
    
    return true;
  } catch (error) {
    console.error('Payment failed:', error);
    updateUIWithMessage(`Payment failed: ${error.message}`);
    return false;
  }
}

/**
 * Approve token spending
 */
async function approveToken(amount) {
   try {
     const tokenContract = new ethers.Contract(
       CONFIG.M00NAD_TOKEN,
       getERC20ABI(),
       ethersSigner
     );
    
    console.log('Requesting token approval...');
    const tx = await tokenContract.approve(
      CONFIG.MOONLANDER_CONTRACT,
      amount
    );
    
    updateUIWithMessage('Approval pending... please confirm in wallet');
    await tx.wait();
    
    console.log('Token approval confirmed');
    updateUIWithMessage('Approval confirmed!');
    return true;
  } catch (error) {
    console.error('Approval failed:', error);
    updateUIWithMessage(`Approval failed: ${error.message}`);
    return false;
  }
}

// ============ Score Submission ============

/**
 * Submit score after game ends
 * @param {number} score - The final score achieved
 * @param {number} landed - 1 if safe landing, 0 if crashed
 */
async function submitScore(score, landed) {
  if (!currentAccount || !gameStarted) {
    alert('Please play the game first');
    return false;
  }
  
  if (!Number.isInteger(score) || score <= 0) {
    alert('Invalid score');
    return false;
  }
  
  if (landed !== 0 && landed !== 1) {
    alert('Invalid landing status');
    return false;
  }
  
  try {
    const moonlanderContract = new ethers.Contract(
      CONFIG.MOONLANDER_CONTRACT,
      window.MOONLANDER_ABI || [],
      ethersSigner
    );
    
    console.log(`Submitting score: ${score}, Landed: ${landed}`);
    const tx = await moonlanderContract.submitScore(score, landed);
    
    updateUIWithMessage('Submitting score...');
    const receipt = await tx.wait();
    
    console.log('Score submitted:', receipt);
    updateUIWithMessage('Score submitted!');
    
    // Reset game state
    gameStarted = false;
    
    // Emit custom event for leaderboard update
    window.dispatchEvent(new CustomEvent('scoreSubmitted', {
      detail: { player: currentAccount, score, landed, timestamp: Date.now() }
    }));
    
    // Save score and redirect to leaderboard/results page
    localStorage.setItem('lastScore', score);
    localStorage.setItem('lastLanded', landed);
    setTimeout(() => {
      window.location.href = `leaderboard.html?score=${score}&landed=${landed}`;
    }, 1500);
    
    return true;
  } catch (error) {
    console.error('Score submission failed:', error);
    updateUIWithMessage(`Score submission failed: ${error.message}`);
    return false;
  }
}

// ============ Query Functions ============

/**
 * ERC20 ABI for token operations
 */
const TOKEN_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  }
];

/**
 * Get player's m00nad balance
 */
async function getPlayerBalance(address) {
  try {
    if (!address) {
      console.warn('No address provided for balance check');
      return ethers.BigNumber.from(0);
    }

    console.log('Fetching balance for:', address);
    console.log('Token address:', CONFIG.M00NAD_TOKEN);
    
    // Use primary RPC provider
    let rpcProvider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL);
    
    // Create contract instance
    const tokenContract = new ethers.Contract(
      CONFIG.M00NAD_TOKEN,
      TOKEN_ABI,
      rpcProvider
    );
    
    console.log('Calling balanceOf...');
    const balance = await tokenContract.balanceOf(address);
    
    console.log('Balance raw:', balance.toString());
    console.log('Balance formatted:', ethers.utils.formatUnits(balance, 18));
    
    return balance;
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    console.error('Error type:', error.code);
    console.error('Error message:', error.message);
    
    // Log more details
    if (error.reason) console.error('Error reason:', error.reason);
    if (error.method) console.error('Error method:', error.method);
    if (error.transaction) console.error('Error transaction:', error.transaction);
    
    return ethers.BigNumber.from(0);
  }
}

/**
 * Get player's allowance for MoonlanderGame contract
 */
async function getPlayerAllowance(address) {
   try {
     const tokenContract = new ethers.Contract(
       CONFIG.M00NAD_TOKEN,
       getERC20ABI(),
       ethersProvider
     );
    
    return await tokenContract.allowance(address, CONFIG.MOONLANDER_CONTRACT);
  } catch (error) {
    console.error('Failed to fetch allowance:', error);
    return ethers.BigNumber.from(0);
  }
}

/**
 * Get current entry fee from contract
 */
async function getEntryFee() {
  try {
    const moonlanderContract = new ethers.Contract(
      CONFIG.MOONLANDER_CONTRACT,
      window.MOONLANDER_ABI || [],
      ethersProvider
    );
    
    return await moonlanderContract.getEntryFee();
  } catch (error) {
    console.error('Failed to fetch entry fee:', error);
    return ethers.BigNumber.from(0);
  }
}

// ============ Event Listeners ============

/**
 * Listen to GameStarted events
 */
async function listenToGameStartedEvents(callback) {
  try {
    const moonlanderContract = new ethers.Contract(
      CONFIG.MOONLANDER_CONTRACT,
      window.MOONLANDER_ABI || [],
      ethersProvider
    );
    
    moonlanderContract.on('GameStarted', (player, timestamp, amount, event) => {
      console.log('GameStarted event:', { player, timestamp, amount });
      callback({ player, timestamp, amount, event });
    });
  } catch (error) {
    console.error('Failed to setup event listener:', error);
  }
}

/**
 * Listen to ScoreSubmitted events
 */
async function listenToScoreSubmittedEvents(callback) {
  try {
    const moonlanderContract = new ethers.Contract(
      CONFIG.MOONLANDER_CONTRACT,
      window.MOONLANDER_ABI || [],
      ethersProvider
    );
    
    moonlanderContract.on('ScoreSubmitted', (player, score, landed, timestamp, event) => {
      console.log('ScoreSubmitted event:', { player, score: score.toString(), landed, timestamp });
      callback({
        player,
        score: score.toNumber(),
        landed,
        timestamp: timestamp.toNumber(),
        event
      });
    });
  } catch (error) {
    console.error('Failed to setup event listener:', error);
  }
}

// ============ Event Handlers ============

/**
 * Handle account changes
 */
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    disconnectWallet();
  } else if (accounts[0] !== currentAccount) {
    currentAccount = accounts[0];
    updateUIForConnectedWallet(currentAccount);
  }
}

/**
 * Handle chain changes
 */
function handleChainChanged(chainId) {
  const newChainId = parseInt(chainId, 16);
  if (newChainId !== CONFIG.CHAIN_ID) {
    updateUIForWrongChain();
  }
}

// ============ UI Helpers ============

/**
 * Update in-game HUD display
 */
function updateUIForConnectedWallet(address) {
  if (!address) {
    updateUIForNoWallet();
    return;
  }
  
  const connectBtn = document.getElementById('hudConnectWalletBtn');
  const walletInfo = document.getElementById('hudWalletInfo');
  
  if (connectBtn && walletInfo) {
    connectBtn.classList.add('hidden');
    walletInfo.classList.remove('hidden');
    document.getElementById('hudWalletAddress').textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  // Dispatch event for other pages (leaderboard)
  window.dispatchEvent(new CustomEvent('walletConnected', {
    detail: { address }
  }));
  
  updateBalanceDisplay();
}

/**
 * Update UI when wallet is not connected
 */
function updateUIForNoWallet() {
  const connectBtn = document.getElementById('hudConnectWalletBtn');
  const walletInfo = document.getElementById('hudWalletInfo');
  
  if (connectBtn && walletInfo) {
    connectBtn.classList.remove('hidden');
    walletInfo.classList.add('hidden');
  }
}

/**
 * Update UI for wrong chain
 */
function updateUIForWrongChain() {
  updateUIWithMessage('❌ Please switch to Monad mainnet');
  updateUIForNoWallet();
}



/**
 * Update in-game balance display
 */
async function updateBalanceDisplay() {
  if (!currentAccount) {
    console.log('No account connected, skipping balance update');
    return;
  }
  
  try {
    console.log('Updating balance display...');
    const balance = await getPlayerBalance(currentAccount);
    
    if (!balance || balance.isZero()) {
      console.log('Balance is zero or unavailable');
    }
    
    const balanceFormatted = ethers.utils.formatUnits(balance, CONFIG.M00NAD_DECIMALS);
    const balanceNum = parseFloat(balanceFormatted);
    
    const balanceText = document.getElementById('hudBalanceText');
    if (balanceText) {
      balanceText.textContent = `${balanceNum.toFixed(2)} m00nad`;
    }
    
    // Dispatch event for other pages (leaderboard)
    window.dispatchEvent(new CustomEvent('balanceUpdated', {
      detail: { balance: balanceFormatted }
    }));
  } catch (error) {
    console.error('Failed to update balance:', error);
  }
}

/**
 * Update UI message
 */
function updateUIWithMessage(message) {
  const messageEl = document.getElementById('statusMessage');
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.style.display = 'block';
  }
}

// ============ Export Functions ============

// Make functions available globally for HTML onclick handlers
window.contractIntegration = {
  connectWallet,
  disconnectWallet,
  payAndPlayGame,
  submitScore,
  getPlayerBalance,
  getPlayerAllowance,
  listenToScoreSubmittedEvents
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeContractIntegration);
