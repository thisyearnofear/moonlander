/**
 * MoonlanderGame Contract ABI
 * Deployed at: 0x1DFd9003590E4A67594748Ecec18451e6cBDDD90 on Monad Mainnet
 */

const MOONLANDER_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_m00nadToken', type: 'address' },
      { internalType: 'address', name: 'initialOwner', type: 'address' }
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
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'FundsWithdrawn',
    type: 'event'
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
    name: 'getContractBalance',
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
    name: 'getWithdrawableAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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
    name: 'platformShare',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
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
  },
  {
    inputs: [],
    name: 'withdrawPlatformFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

// ERC20 ABI (m00nad token)
const ERC20_ABI = [
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

// Monad network config
const MONAD_CONFIG = {
  chainId: 10143,
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

// Expose to global scope
window.MOONLANDER_ABI = MOONLANDER_ABI;
window.ERC20_ABI = ERC20_ABI;
window.MONAD_CONFIG = MONAD_CONFIG;
