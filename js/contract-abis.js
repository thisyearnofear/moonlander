/**
 * Smart Contract ABIs
 * Export contract interfaces for use in frontend
 */

// ============ ERC20 ABI (m00nad token) ============

export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
    stateMutability: 'view'
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
    stateMutability: 'nonpayable'
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
    stateMutability: 'view'
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
    stateMutability: 'nonpayable'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'spender', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ],
    name: 'Approval',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  }
];

// ============ MoonlanderGame Contract ABI ============

export const MOONLANDER_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_m00nadToken', type: 'address' },
      { internalType: 'address', name: '_splitsRecipient', type: 'address' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'entryFeeAmount', type: 'uint256' }
    ],
    name: 'GameStarted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'score', type: 'uint256' },
      { indexed: false, internalType: 'uint8', name: 'landed', type: 'uint8' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' }
    ],
    name: 'ScoreSubmitted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint256', name: 'newFee', type: 'uint256' }],
    name: 'EntryFeeUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'newRecipient', type: 'address' }],
    name: 'SplitsRecipientUpdated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }],
    name: 'ReentrancyGuardReenteredCall',
    type: 'event'
  },
  {
    inputs: [],
    name: 'entryFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '_player', type: 'address' }],
    name: 'getAllowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '_player', type: 'address' }],
    name: 'getBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getEntryFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getSplitsRecipient',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'm00nadToken',
    outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'playGame',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_newFee', type: 'uint256' }],
    name: 'setEntryFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '_newRecipient', type: 'address' }],
    name: 'setSplitsRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'splitsRecipient',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '_score', type: 'uint256' },
      { internalType: 'uint8', name: '_landed', type: 'uint8' }],
    name: 'submitScore',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_score', type: 'uint256' },
      { internalType: 'uint8', name: '_landed', type: 'uint8' },
      { internalType: 'uint256', name: '_fuel', type: 'uint256' },
      { internalType: 'uint256', name: '_maxAltitude', type: 'uint256' }
    ],
    name: 'submitScoreWithMetadata',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

// ============ 0xSplits ABI (minimal) ============

export const SPLITS_ABI = [
  {
    inputs: [
      { internalType: 'address[]', name: 'accounts', type: 'address[]' },
      { internalType: 'uint32[]', name: 'percentAllocations', type: 'uint32[]' },
      { internalType: 'address', name: 'distributorFeeAccount', type: 'address' }
    ],
    name: 'createSplit',
    outputs: [{ internalType: 'address', name: 'split', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'split', type: 'address' },
      { indexed: false, internalType: 'address[]', name: 'accounts', type: 'address[]' },
      { indexed: false, internalType: 'uint32[]', name: 'percentAllocations', type: 'uint32[]' },
      { indexed: false, internalType: 'uint32', name: 'distributorFeePercent', type: 'uint32' },
      { indexed: false, internalType: 'address', name: 'controller', type: 'address' }
    ],
    name: 'CreateSplit',
    type: 'event'
  },
  {
    inputs: [{ internalType: 'address', name: 'split', type: 'address' }],
    name: 'getEthBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'split', type: 'address' },
      { internalType: 'address', name: 'token', type: 'address' }
    ],
    name: 'getERC20Balance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'split', type: 'address' }],
    name: 'distributeETH',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'split', type: 'address' },
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'address[]', name: 'accounts', type: 'address[]' },
      { internalType: 'uint32[]', name: 'percentAllocations', type: 'uint32[]' },
      { internalType: 'uint32', name: 'distributorFeePercent', type: 'uint32' },
      { internalType: 'address', name: 'distributorAddress', type: 'address' }
    ],
    name: 'distributeERC20',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'split', type: 'address' },
      { indexed: false, internalType: 'address', name: 'token', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'distributorAddress', type: 'address' }
    ],
    name: 'DistributeERC20',
    type: 'event'
  }
];

// ============ Monad-specific utilities ============

export const MONAD_CONFIG = {
  chainId: 143,
  chainName: 'Monad',
  rpcUrls: [
    'https://rpc.monad.xyz',
    'https://rpc1.monad.xyz',
    'https://rpc3.monad.xyz'
  ],
  blockExplorer: 'https://monadvision.com',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18
  }
};

// ============ Helper functions ============

/**
 * Add Monad to MetaMask
 */
export async function addMonadToMetaMask() {
  if (!window.ethereum) {
    alert('Please install MetaMask');
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x' + MONAD_CONFIG.chainId.toString(16),
          chainName: MONAD_CONFIG.chainName,
          rpcUrls: MONAD_CONFIG.rpcUrls,
          blockExplorerUrls: [MONAD_CONFIG.blockExplorer],
          nativeCurrency: MONAD_CONFIG.nativeCurrency
        }
      ]
    });
    return true;
  } catch (error) {
    console.error('Failed to add Monad:', error);
    return false;
  }
}

/**
 * Switch to Monad chain
 */
export async function switchToMonad() {
  if (!window.ethereum) {
    alert('Please install MetaMask');
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + MONAD_CONFIG.chainId.toString(16) }]
    });
    return true;
  } catch (error) {
    if (error.code === 4902) {
      // Chain doesn't exist, add it
      return addMonadToMetaMask();
    }
    console.error('Failed to switch to Monad:', error);
    return false;
  }
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount, decimals = 18) {
  if (!amount) return '0';
  const divisor = Math.pow(10, decimals);
  const num = parseFloat(amount) / divisor;
  return num.toFixed(2);
}

/**
 * Convert token amount to wei
 */
export function toWei(amount, decimals = 18) {
  const multiplier = Math.pow(10, decimals);
  return Math.floor(parseFloat(amount) * multiplier).toString();
}

/**
 * Convert wei to token amount
 */
export function fromWei(amount, decimals = 18) {
  const divisor = Math.pow(10, decimals);
  return (parseFloat(amount) / divisor).toString();
}

/**
 * Truncate address for display
 */
export function truncateAddress(address) {
  if (!address) return '';
  return address.slice(0, 6) + '...' + address.slice(-4);
}
