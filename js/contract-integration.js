/**
 * Moonlander Game Contract Integration
 * Handles wallet connection, payments, and score submission
 * 
 * ENHANCED with reliability patterns:
 * - Connection state machine
 * - Retry logic with exponential backoff
 * - Health monitoring
 * - Proper event cleanup
 */

// ============ Configuration ============

const CONFIG = {
  CHAIN_ID: 143, // Monad Mainnet
  M00NAD_TOKEN: '0x22Cd99EC337a2811F594340a4A6E41e4A3022b07',
  M00NAD_DECIMALS: 18,
  MOONLANDER_CONTRACT: '0x399f080bB2868371D7a0024a28c92fc63C05536E',
  ENTRY_FEE: '100000',
  RPC_URL: 'https://rpc.monad.xyz',
  RPC_URL_BACKUP: 'https://rpc1.monad.xyz'
};

console.log('Contract Integration Config:', CONFIG);

// ============ State Management ============

const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

let currentAccount = null;
let ethersProvider = null;
let ethersSigner = null;
let gameStarted = false;
let connectionState = ConnectionState.DISCONNECTED;
let connectionPromise = null;
let healthCheckInterval = null;
let cachedFarcasterProvider = null;
let farcasterProviderPromise = null;

// Event listener references for cleanup
let accountsChangedHandler = null;
let chainChangedHandler = null;
let disconnectHandler = null;

// ============ Initialization ============

/**
 * Wait for required libraries to load
 */
async function waitForLibraries(maxWait = 10000) {
  const startTime = Date.now();

  while (typeof ethers === 'undefined') {
    if (Date.now() - startTime > maxWait) {
      console.error('ethers.js did not load in time');
      return false;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('✓ ethers.js loaded');
  return true;
}

/**
 * Initialize contract integration when page loads
 */
async function initializeContractIntegration() {
  console.log('Initializing contract integration...');

  // Wait for libraries
  const librariesReady = await waitForLibraries();
  if (!librariesReady) {
    updateUIForNoWallet();
    return;
  }

  // Check if in Farcaster mini app environment
  // Use isInMiniApp() if available, otherwise fall back to SDK check
  let inFarcasterMiniApp = false;
  try {
    if (window.farcasterSDK && typeof window.farcasterSDK.isInMiniApp === 'function') {
      inFarcasterMiniApp = window.farcasterSDK.isInMiniApp();
      console.log('Farcaster isInMiniApp():', inFarcasterMiniApp);
    }
  } catch (e) {
    console.log('Could not check isInMiniApp():', e);
  }
  
  if (inFarcasterMiniApp) {
    console.log('Detected Farcaster mini app environment - will auto-connect wallet');
  }

  // Check if wallet is available
  if (typeof window.ethereum === 'undefined' && !inFarcasterMiniApp) {
    console.warn('No Web3 wallet detected - running in read-only mode');
    updateUIForNoWallet();
    return;
  }

  try {
    console.log('Wallet provider detected');

    // Setup event listeners
    attachWalletEventListeners();

    // Try to restore previous connection
    const savedAccount = restoreWalletState();
    if (savedAccount) {
      console.log('Attempting to restore wallet connection for:', savedAccount);
      try {
        const provider = await getWalletProvider();
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' });

          if (accounts && accounts.includes(savedAccount)) {
            console.log('Restoring wallet connection...');
            await handleWalletConnected(accounts[0]);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not restore connection:', err);
      }
    }

    // In Farcaster mini app, auto-connect if no saved connection
    if (inFarcasterMiniApp) {
      console.log('Auto-connecting to Farcaster wallet...');
      await connectWallet();
      return;
    }

    // Check if already connected
    try {
      const provider = await getWalletProvider();
      if (!provider) {
        updateUIForNoWallet();
        return;
      }

      const accounts = await provider.request({ method: 'eth_accounts' });

      if (accounts && accounts.length > 0) {
        await handleWalletConnected(accounts[0]);
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

// ============ Wallet Connection with Retry Logic ============

/**
 * Get the best available wallet provider
 * Prioritizes Farcaster wallet when in mini app, then filters out problematic wallets
 * Returns a Promise that resolves to the provider
 */
async function getWalletProvider() {
  // Check if we're actually in Farcaster mini app
  let isInFarcaster = false;
  
  try {
    isInFarcaster = window.farcasterSDK && 
                    typeof window.farcasterSDK.isInMiniApp === 'function' && 
                    window.farcasterSDK.isInMiniApp();
  } catch (e) {
    console.warn('Could not check Farcaster mini app status:', e);
  }
  
  console.log('Checking provider context:', { isInFarcaster, hasEthereum: !!window.ethereum, hasFarcasterSDK: !!window.farcasterSDK });
  
  // Only use cached Farcaster provider if we're in Farcaster context
  if (isInFarcaster && cachedFarcasterProvider) {
    console.log('Using cached Farcaster provider');
    return cachedFarcasterProvider;
  }

  // Check for Farcaster wallet first (ONLY when actually running in Farcaster mini app)
  if (isInFarcaster && window.farcasterSDK && window.farcasterSDK.wallet) {
    console.log('Running in Farcaster mini app, trying to get wallet provider...');
    
    try {
      // getEthereumProvider() returns a Promise, await it
      const farcasterProvider = await window.farcasterSDK.wallet.getEthereumProvider();
      console.log('Got Farcaster Ethereum provider:', farcasterProvider);
      
      if (farcasterProvider && typeof farcasterProvider.request === 'function') {
        console.log('Using Farcaster wallet provider');
        cachedFarcasterProvider = farcasterProvider;
        return farcasterProvider;
      } else {
        console.warn('Farcaster provider invalid or missing request method');
      }
    } catch (error) {
      console.warn('Could not get Farcaster wallet provider:', error);
    }
  } else if (!isInFarcaster && window.farcasterSDK) {
    console.log('Farcaster SDK available but NOT in mini app - skipping Farcaster provider');
    // Clear cache if we're not in Farcaster
    cachedFarcasterProvider = null;
  }

  if (!window.ethereum) return null;

  // Handle multiple providers
  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    console.log(`Found ${window.ethereum.providers.length} wallet providers`);

    // Filter out problematic wallets
    const validProviders = window.ethereum.providers.filter(p =>
      !p.isPort && !p.isBackpack
    );

    if (validProviders.length === 0) {
      console.warn('No valid wallet providers found');
      return null;
    }

    // Prefer MetaMask
    const metamask = validProviders.find(p => p.isMetaMask);
    if (metamask) {
      console.log('Using MetaMask');
      return metamask;
    }

    // Prefer Coinbase
    const coinbase = validProviders.find(p => p.isCoinbaseWallet);
    if (coinbase) {
      console.log('Using Coinbase Wallet');
      return coinbase;
    }

    // Use first valid provider
    console.log('Using first available provider');
    return validProviders[0];
  }

  // Single provider - check if it's valid
  if (window.ethereum.isPort || window.ethereum.isBackpack) {
    console.warn('Port/Backpack wallet detected - not supported');
    return null;
  }

  console.log('Using window.ethereum directly');
  return window.ethereum;
}

/**
 * Connect wallet with retry logic
 */
async function connectWallet(maxRetries = 2) {
  // Prevent concurrent connection attempts
  if (connectionPromise) {
    console.log('Connection already in progress, waiting...');
    return connectionPromise;
  }

  connectionPromise = (async () => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
         console.log(`Connection attempt ${attempt}/${maxRetries}`);
         connectionState = ConnectionState.CONNECTING;

         // Get wallet provider
         const provider = await getWalletProvider();
         console.log('✓ Got provider from getWalletProvider():', provider);
         console.log('  Provider type:', typeof provider);
         console.log('  Provider has request?:', typeof provider?.request);
         
         if (!provider) {
           throw new Error('No compatible wallet found. Please install MetaMask or Coinbase Wallet.');
         }

         // Request accounts with timeout - this will prompt user to approve
         console.log('  Requesting accounts from wallet...');
         
         let accounts;
         try {
           const accountsPromise = provider.request({ method: 'eth_requestAccounts' });
           const timeoutPromise = new Promise((_, reject) =>
             setTimeout(() => reject(new Error('Wallet request timeout')), 30000)
           );

           accounts = await Promise.race([accountsPromise, timeoutPromise]);
         } catch (requestError) {
           // Handle RPC errors from Farcaster provider
           console.error('Provider request error:', requestError);
           
           // Extract error code if available
           let errorCode = null;
           let errorMessage = requestError.message || 'Unknown error';
           
           // Try multiple ways to get error code
           if (requestError.code) {
             errorCode = requestError.code;
           } else if (requestError.error?.code) {
             errorCode = requestError.error.code;
           } else if (requestError.data?.code) {
             errorCode = requestError.data.code;
           }
           
           // Throw with extracted error info
           const err = new Error(errorMessage);
           err.code = errorCode || -32000;
           throw err;
         }
         
         console.log('  Got accounts:', accounts);

         if (!accounts || accounts.length === 0) {
          throw new Error('No accounts returned from wallet');
         }

         await handleWalletConnected(accounts[0]);
         return true;

         } catch (error) {
         console.error(`Connection attempt ${attempt} failed:`, error);

         // User rejection - don't retry
         if (error.code === 4001 || error.message?.includes('rejected')) {
          connectionState = ConnectionState.DISCONNECTED;
          updateUIWithMessage('Connection cancelled');
          return false;
         }

         // Wallet disconnected error
         if (error.code === 4900 || error.message?.includes('disconnected')) {
          connectionState = ConnectionState.ERROR;
          updateUIWithMessage('Wallet disconnected. Please reload the page.');
          return false;
         }

        // Last attempt failed
        if (attempt === maxRetries) {
          connectionState = ConnectionState.ERROR;
          updateUIWithMessage(`Connection failed: ${error.message}`);
          return false;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return false;
  })();

  const result = await connectionPromise;
  connectionPromise = null;
  return result;
}

/**
 * Handle successful wallet connection
 */
async function handleWalletConnected(account) {
  try {
    console.log('Setting up wallet connection for:', account);

    const provider = await getWalletProvider();
    if (!provider) {
      throw new Error('Wallet provider no longer available');
    }

    // Setup ethers providers
    ethersProvider = new ethers.providers.Web3Provider(provider);
    ethersSigner = ethersProvider.getSigner();
    currentAccount = account;

    // Verify chain
    const network = await ethersProvider.getNetwork();
    console.log('Current chain:', network.chainId);

    if (network.chainId !== CONFIG.CHAIN_ID) {
      console.warn(`Wrong chain: ${network.chainId}, expected: ${CONFIG.CHAIN_ID}`);
      updateUIForWrongChain();
      connectionState = ConnectionState.ERROR;
      return;
    }

    connectionState = ConnectionState.CONNECTED;
    saveWalletState();
    updateUIForConnectedWallet(currentAccount);

    // Start health monitoring
    startConnectionHealthCheck();

    // Update balance
    await updateBalanceDisplay();

  } catch (error) {
    console.error('Error handling wallet connection:', error);
    connectionState = ConnectionState.ERROR;
    updateUIWithMessage(`Setup failed: ${error.message}`);
  }
}

/**
 * Disconnect wallet
 */
function disconnectWallet() {
  console.log('Disconnecting wallet...');

  stopConnectionHealthCheck();
  clearWalletState();

  currentAccount = null;
  ethersProvider = null;
  ethersSigner = null;
  gameStarted = false;
  connectionState = ConnectionState.DISCONNECTED;

  updateUIForNoWallet();
  updateUIWithMessage('Wallet disconnected');
}

// ============ Connection Health Monitoring ============

/**
 * Start monitoring connection health
 */
function startConnectionHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  healthCheckInterval = setInterval(async () => {
    if (!currentAccount || !ethersProvider || connectionState !== ConnectionState.CONNECTED) {
      return;
    }

    try {
      // Quick health check - verify provider is responsive
      const networkPromise = ethersProvider.getNetwork();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), 3000)
      );

      await Promise.race([networkPromise, timeoutPromise]);

      // Verify account is still accessible
      const provider = await getWalletProvider();
      if (provider) {
        const accounts = await provider.request({ method: 'eth_accounts' });

        if (!accounts || !accounts.includes(currentAccount)) {
          console.warn('Account no longer accessible');
          handleDisconnection();
        }
      }

    } catch (error) {
      console.error('Health check failed:', error);
      handleDisconnection();
    }
  }, 30000); // Check every 30 seconds
}

/**
 * Stop health monitoring
 */
function stopConnectionHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

/**
 * Handle unexpected disconnection
 */
async function handleDisconnection() {
  console.log('Handling disconnection...');
  connectionState = ConnectionState.RECONNECTING;
  stopConnectionHealthCheck();

  // Try to restore connection
  const savedAccount = restoreWalletState();
  if (savedAccount) {
    try {
      const reconnected = await connectWallet(2);
      if (reconnected) {
        console.log('Successfully reconnected');
        return;
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  }

  // Full disconnect if recovery fails
  disconnectWallet();
}

// ============ Event Listeners ============

/**
 * Attach wallet event listeners
 */
function attachWalletEventListeners() {
  if (!window.ethereum || !window.ethereum.on) return;

  // Remove existing listeners first
  removeWalletEventListeners();

  accountsChangedHandler = (accounts) => {
    console.log('Accounts changed:', accounts);
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== currentAccount) {
      handleWalletConnected(accounts[0]);
    }
  };

  chainChangedHandler = (chainId) => {
    const newChainId = parseInt(chainId, 16);
    console.log('Chain changed to:', newChainId);

    if (newChainId !== CONFIG.CHAIN_ID) {
      updateUIForWrongChain();
      connectionState = ConnectionState.ERROR;
    } else {
      // Reconnect on correct chain
      if (currentAccount) {
        handleWalletConnected(currentAccount);
      }
    }
  };

  disconnectHandler = (error) => {
    console.log('Provider disconnected:', error);
    handleDisconnection();
  };

  window.ethereum.on('accountsChanged', accountsChangedHandler);
  window.ethereum.on('chainChanged', chainChangedHandler);
  window.ethereum.on('disconnect', disconnectHandler);

  console.log('✓ Wallet event listeners attached');
}

/**
 * Remove wallet event listeners
 */
function removeWalletEventListeners() {
  if (!window.ethereum || !window.ethereum.removeListener) return;

  if (accountsChangedHandler) {
    window.ethereum.removeListener('accountsChanged', accountsChangedHandler);
  }
  if (chainChangedHandler) {
    window.ethereum.removeListener('chainChanged', chainChangedHandler);
  }
  if (disconnectHandler) {
    window.ethereum.removeListener('disconnect', disconnectHandler);
  }
}

// ============ Session Management ============

/**
 * Save wallet state to session storage
 */
function saveWalletState() {
  if (currentAccount) {
    const state = {
      account: currentAccount,
      timestamp: Date.now(),
      chainId: CONFIG.CHAIN_ID
    };
    sessionStorage.setItem('moonlander_wallet', JSON.stringify(state));
    console.log('✓ Wallet state saved');
  }
}

/**
 * Restore wallet state from session storage
 */
function restoreWalletState() {
  try {
    const saved = sessionStorage.getItem('moonlander_wallet');
    if (saved) {
      const { account, timestamp, chainId } = JSON.parse(saved);

      // Only restore if saved within last 24 hours and same chain
      if (Date.now() - timestamp < 86400000 && chainId === CONFIG.CHAIN_ID) {
        return account;
      }
    }
  } catch (err) {
    console.warn('Could not restore wallet state:', err);
  }
  return null;
}

/**
 * Clear wallet state
 */
function clearWalletState() {
  sessionStorage.removeItem('moonlander_wallet');
}

// ============ Payment & Game Start ============

/**
 * Pay entry fee and start game
 */
async function payAndPlayGame() {
  if (!currentAccount) {
    await showModal('Please connect your wallet to pay 100k m00nad and play.', 'Wallet Not Connected');
    return false;
  }

  try {
    // Verify chain
    const network = await ethersProvider.getNetwork();
    if (network.chainId !== CONFIG.CHAIN_ID) {
      updateUIWithMessage('Wrong network. Please switch to Monad mainnet.');
      return false;
    }

    // Check balance
    const balance = await getPlayerBalance(currentAccount);
    const entryFeeInWei = ethers.utils.parseUnits(CONFIG.ENTRY_FEE, CONFIG.M00NAD_DECIMALS);

    console.log(`Balance: ${ethers.utils.formatUnits(balance, CONFIG.M00NAD_DECIMALS)}, Required: ${CONFIG.ENTRY_FEE}`);

    if (balance.lt(entryFeeInWei)) {
      const balanceFormatted = ethers.utils.formatUnits(balance, CONFIG.M00NAD_DECIMALS);
      await showModal(
        `Insufficient balance. You need ${CONFIG.ENTRY_FEE} m00nad, you have ${balanceFormatted}.`,
        'Low Balance'
      );
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
    updateUIWithMessage('Confirm transaction in wallet...');

    const tx = await moonlanderContract.playGame();

    console.log('Transaction hash:', tx.hash);
    updateUIWithMessage('Payment processing...');

    const receipt = await tx.wait();
    console.log('Payment confirmed:', receipt);

    gameStarted = true;
    updateUIWithMessage('Payment confirmed! Starting game...');

    // Redirect to game
    setTimeout(() => {
      window.location.href = 'game.html?paid=true';
    }, 1500);

    return true;
  } catch (error) {
    console.error('Payment failed:', error);

    if (error.code === 4001) {
      updateUIWithMessage('Transaction cancelled');
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      updateUIWithMessage('Insufficient funds for gas');
    } else {
      updateUIWithMessage(`Payment failed: ${error.message}`);
    }

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
    updateUIWithMessage('Approve token spending in wallet...');

    const tx = await tokenContract.approve(CONFIG.MOONLANDER_CONTRACT, amount);

    updateUIWithMessage('Approval pending...');
    await tx.wait();

    console.log('Token approval confirmed');
    updateUIWithMessage('Approval confirmed!');
    return true;
  } catch (error) {
    console.error('Approval failed:', error);

    if (error.code === 4001) {
      updateUIWithMessage('Approval cancelled');
    } else {
      updateUIWithMessage(`Approval failed: ${error.message}`);
    }

    return false;
  }
}

// ============ Score Submission ============

/**
 * Submit score after game ends
 */
async function submitScore(score, landed) {
  if (!currentAccount || !gameStarted) {
    await showModal('Please play the game first to submit a score.', 'Game Not Started');
    return false;
  }

  if (!Number.isInteger(score) || score <= 0) {
    await showModal('The score must be a valid positive number.', 'Invalid Score');
    return false;
  }

  if (landed !== 0 && landed !== 1) {
    await showModal('Invalid landing status. Please try again.', 'Invalid Status');
    return false;
  }

  try {
    const moonlanderContract = new ethers.Contract(
      CONFIG.MOONLANDER_CONTRACT,
      window.MOONLANDER_ABI || [],
      ethersSigner
    );

    console.log(`Submitting score: ${score}, Landed: ${landed}`);
    updateUIWithMessage('Submitting score...');

    const tx = await moonlanderContract.submitScore(score, landed);
    const receipt = await tx.wait();

    console.log('Score submitted:', receipt);
    updateUIWithMessage('Score submitted!');

    // Reset game state
    gameStarted = false;

    // Emit custom event
    window.dispatchEvent(new CustomEvent('scoreSubmitted', {
      detail: { player: currentAccount, score, landed, timestamp: Date.now() }
    }));

    // Save and redirect
    localStorage.setItem('lastScore', score);
    localStorage.setItem('lastLanded', landed);
    localStorage.setItem('lastSubmittedAt', Date.now());

    setTimeout(() => {
      window.location.href = `index.html?score=${score}&landed=${landed}&fresh=true`;
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
 * Minimal ERC20 ABI
 */
function getERC20ABI() {
  return window.ERC20_ABI || [
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
}

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

    // Use RPC provider for read operations (more reliable)
    const rpcProvider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL);

    const tokenContract = new ethers.Contract(
      CONFIG.M00NAD_TOKEN,
      getERC20ABI(),
      rpcProvider
    );

    const balance = await tokenContract.balanceOf(address);
    console.log('Balance:', ethers.utils.formatUnits(balance, CONFIG.M00NAD_DECIMALS));

    return balance;
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    return ethers.BigNumber.from(0);
  }
}

/**
 * Get player's allowance for MoonlanderGame contract
 */
async function getPlayerAllowance(address) {
  try {
    if (!ethersProvider) {
      console.warn('No provider available for allowance check');
      return ethers.BigNumber.from(0);
    }

    const tokenContract = new ethers.Contract(
      CONFIG.M00NAD_TOKEN,
      getERC20ABI(),
      ethersProvider
    );

    const allowance = await tokenContract.allowance(address, CONFIG.MOONLANDER_CONTRACT);
    console.log('Allowance:', allowance.toString());

    return allowance;
  } catch (error) {
    console.error('Failed to fetch allowance:', error);
    return ethers.BigNumber.from(0);
  }
}

// ============ Event Listeners ============

/**
 * Listen to ScoreSubmitted events
 */
async function listenToScoreSubmittedEvents(callback) {
  try {
    if (!ethersProvider) {
      console.warn('No provider available for event listening');
      return;
    }

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

// ============ UI Helpers ============

/**
 * Update UI for connected wallet
 */
function updateUIForConnectedWallet(address) {
  if (!address) {
    updateUIForNoWallet();
    return;
  }

  // Update main menu button
  const menuConnectBtn = document.getElementById('menuConnectWallet');
  const menuWalletStatus = document.getElementById('menuWalletStatus');
  const menuBalanceDisplay = document.getElementById('menuBalanceDisplay');

  if (menuConnectBtn && menuWalletStatus) {
    menuWalletStatus.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
    menuConnectBtn.classList.add('connected');
  }

  if (menuBalanceDisplay) {
    menuBalanceDisplay.style.display = 'block';
  }

  // Update HUD (for game.html)
  const hudConnectBtn = document.getElementById('hudConnectWalletBtn');
  const hudWalletInfo = document.getElementById('hudWalletInfo');

  if (hudConnectBtn && hudWalletInfo) {
    hudConnectBtn.classList.add('hidden');
    hudWalletInfo.classList.remove('hidden');

    const hudWalletAddress = document.getElementById('hudWalletAddress');
    if (hudWalletAddress) {
      hudWalletAddress.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
  }

  // Dispatch event
  window.dispatchEvent(new CustomEvent('walletConnected', {
    detail: { address }
  }));
}

/**
 * Update UI when wallet is not connected
 */
function updateUIForNoWallet() {
  // Update main menu button
  const menuConnectBtn = document.getElementById('menuConnectWallet');
  const menuWalletStatus = document.getElementById('menuWalletStatus');
  const menuBalanceDisplay = document.getElementById('menuBalanceDisplay');

  if (menuConnectBtn && menuWalletStatus) {
    menuWalletStatus.textContent = 'CONNECT WALLET';
    menuConnectBtn.classList.remove('connected');
  }

  if (menuBalanceDisplay) {
    menuBalanceDisplay.style.display = 'none';
  }

  // Update HUD (for game.html)
  const hudConnectBtn = document.getElementById('hudConnectWalletBtn');
  const hudWalletInfo = document.getElementById('hudWalletInfo');

  if (hudConnectBtn && hudWalletInfo) {
    hudConnectBtn.classList.remove('hidden');
    hudWalletInfo.classList.add('hidden');
  }

  // Dispatch event
  window.dispatchEvent(new CustomEvent('walletDisconnected'));
}

/**
 * Update UI for wrong chain
 */
function updateUIForWrongChain() {
  updateUIWithMessage(`Wrong network. Please switch to Monad Mainnet (Chain ID: ${CONFIG.CHAIN_ID})`);

  const menuWalletStatus = document.getElementById('menuWalletStatus');
  if (menuWalletStatus) {
    menuWalletStatus.textContent = 'WRONG NETWORK';
  }
}

/**
 * Update balance display
 */
async function updateBalanceDisplay() {
  if (!currentAccount) {
    return;
  }

  try {
    const balance = await getPlayerBalance(currentAccount);
    const balanceNum = parseFloat(ethers.utils.formatUnits(balance, CONFIG.M00NAD_DECIMALS));

    const balanceFormatted = balanceNum >= 1000000
      ? `${(balanceNum / 1000000).toFixed(2)}M m00nad`
      : balanceNum >= 1000
        ? `${(balanceNum / 1000).toFixed(2)}K m00nad`
        : `${balanceNum.toFixed(2)} m00nad`;

    // Update main menu balance
    const menuBalanceText = document.getElementById('menuBalanceText');
    if (menuBalanceText) {
      menuBalanceText.textContent = balanceFormatted;
    }

    // Update HUD balance (for game.html)
    const hudBalanceText = document.getElementById('hudBalanceText');
    if (hudBalanceText) {
      hudBalanceText.textContent = balanceFormatted;
    }

    // Dispatch event
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
  console.log('UI Message:', message);
}

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
    alert(message);
    return Promise.resolve();
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

// ============ Export Functions ============

window.contractIntegration = {
  connectWallet,
  disconnectWallet,
  payAndPlayGame,
  submitScore,
  getPlayerBalance,
  getPlayerAllowance,
  updateBalanceDisplay,
  listenToScoreSubmittedEvents,
  // Expose state for debugging
  getState: () => ({
    currentAccount,
    connectionState,
    gameStarted,
    chainId: CONFIG.CHAIN_ID
  })
};

// Initialize on page load
// Wait for Farcaster SDK to be ready if present
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for SDK if available
  if (window.sdkReady) {
    try {
      await window.sdkReady;
      console.log('Farcaster SDK ready, initializing contract integration');
    } catch (err) {
      console.warn('SDK ready failed:', err);
    }
  }
  
  // Small delay to ensure SDK is fully initialized
  setTimeout(initializeContractIntegration, 100);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  stopConnectionHealthCheck();
  removeWalletEventListeners();
});
