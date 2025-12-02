/**
 * Wallet Provider Abstraction Layer
 * 
 * Provides a unified interface for wallet operations across different environments:
 * - Farcaster Mini App (with its custom provider)
 * - Standard Web3 wallets (MetaMask, Coinbase, etc.)
 * 
 * This layer handles:
 * - Provider detection and selection
 * - Network switching and verification
 * - Error normalization across different provider types
 * - Connection state management
 */

// ============ Configuration ============

const NETWORKS = {
    MONAD_MAINNET: {
        chainId: 143,
        chainIdHex: '0x8f',
        name: 'Monad Mainnet',
        rpcUrls: ['https://rpc.monad.xyz', 'https://rpc1.monad.xyz'],
        nativeCurrency: {
            name: 'Monad',
            symbol: 'MON',
            decimals: 18
        },
        blockExplorerUrls: ['https://explorer.monad.xyz']
    }
};

// ============ Provider Types ============

const ProviderType = {
    FARCASTER: 'farcaster',
    METAMASK: 'metamask',
    COINBASE: 'coinbase',
    INJECTED: 'injected',
    NONE: 'none'
};

// ============ Error Normalization ============

class WalletError extends Error {
    constructor(message, code, originalError = null) {
        super(message);
        this.name = 'WalletError';
        this.code = code;
        this.originalError = originalError;
    }
}

/**
 * Normalize errors from different wallet providers into a consistent format
 */
function normalizeError(error) {
    console.log('Normalizing error:', error);

    // Extract error information from various possible structures
    let code = null;
    let message = 'Unknown wallet error';

    // Try to extract error code
    if (error.code !== undefined) {
        code = error.code;
    } else if (error.error?.code !== undefined) {
        code = error.error.code;
    } else if (error.data?.code !== undefined) {
        code = error.data.code;
    }

    // Try to extract error message
    if (error.message) {
        message = error.message;
    } else if (error.error?.message) {
        message = error.error.message;
    } else if (error.data?.message) {
        message = error.data.message;
    }

    // Standardize common error codes
    const standardCodes = {
        4001: { message: 'User rejected the request', code: 4001 },
        4100: { message: 'Unauthorized - please connect wallet', code: 4100 },
        4200: { message: 'Unsupported method', code: 4200 },
        4900: { message: 'Wallet disconnected', code: 4900 },
        4901: { message: 'Chain disconnected', code: 4901 },
        '-32700': { message: 'Invalid JSON', code: -32700 },
        '-32600': { message: 'Invalid request', code: -32600 },
        '-32601': { message: 'Method not found', code: -32601 },
        '-32602': { message: 'Invalid params', code: -32602 },
        '-32603': { message: 'Internal error', code: -32603 },
        '-32000': { message: 'Server error', code: -32000 },
        '-32002': { message: 'Resource unavailable', code: -32002 },
        '-32003': { message: 'Transaction rejected', code: -32003 },
    };

    const codeStr = String(code);
    if (standardCodes[codeStr]) {
        return new WalletError(
            standardCodes[codeStr].message,
            standardCodes[codeStr].code,
            error
        );
    }

    return new WalletError(message, code || -1, error);
}

// ============ Provider Manager ============

class WalletProviderManager {
    constructor() {
        this.currentProvider = null;
        this.providerType = ProviderType.NONE;
        this.farcasterProvider = null;
        this.eventListeners = new Map();
    }

    /**
     * Detect and return the best available wallet provider
     */
    async detectProvider() {
        console.log('🔍 Detecting wallet provider...');

        // Check if in Farcaster Mini App
        const inFarcaster = await this.isInFarcasterMiniApp();

        if (inFarcaster) {
            console.log('  📱 Farcaster Mini App detected');
            const farcasterProvider = await this.getFarcasterProvider();

            if (farcasterProvider) {
                this.currentProvider = farcasterProvider;
                this.providerType = ProviderType.FARCASTER;
                console.log('  ✓ Using Farcaster wallet provider');
                return this.currentProvider;
            }
        }

        // Check for standard Web3 providers
        if (!window.ethereum) {
            console.log('  ✗ No Web3 provider found');
            this.providerType = ProviderType.NONE;
            return null;
        }

        // Handle multiple providers
        if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
            console.log(`  Found ${window.ethereum.providers.length} wallet providers`);

            // Filter out problematic wallets
            const validProviders = window.ethereum.providers.filter(p =>
                !p.isPort && !p.isBackpack
            );

            if (validProviders.length === 0) {
                console.log('  ✗ No valid providers');
                this.providerType = ProviderType.NONE;
                return null;
            }

            // Prefer MetaMask
            const metamask = validProviders.find(p => p.isMetaMask);
            if (metamask) {
                this.currentProvider = metamask;
                this.providerType = ProviderType.METAMASK;
                console.log('  ✓ Using MetaMask');
                return this.currentProvider;
            }

            // Prefer Coinbase
            const coinbase = validProviders.find(p => p.isCoinbaseWallet);
            if (coinbase) {
                this.currentProvider = coinbase;
                this.providerType = ProviderType.COINBASE;
                console.log('  ✓ Using Coinbase Wallet');
                return this.currentProvider;
            }

            // Use first valid provider
            this.currentProvider = validProviders[0];
            this.providerType = ProviderType.INJECTED;
            console.log('  ✓ Using first available provider');
            return this.currentProvider;
        }

        // Single provider
        if (window.ethereum.isPort || window.ethereum.isBackpack) {
            console.log('  ✗ Port/Backpack wallet not supported');
            this.providerType = ProviderType.NONE;
            return null;
        }

        this.currentProvider = window.ethereum;

        if (window.ethereum.isMetaMask) {
            this.providerType = ProviderType.METAMASK;
            console.log('  ✓ Using MetaMask');
        } else if (window.ethereum.isCoinbaseWallet) {
            this.providerType = ProviderType.COINBASE;
            console.log('  ✓ Using Coinbase Wallet');
        } else {
            this.providerType = ProviderType.INJECTED;
            console.log('  ✓ Using injected provider');
        }

        return this.currentProvider;
    }

    /**
     * Check if running in Farcaster Mini App
     */
    async isInFarcasterMiniApp() {
        try {
            if (!window.farcasterSDK) return false;

            if (typeof window.farcasterSDK.isInMiniApp === 'function') {
                const result = window.farcasterSDK.isInMiniApp();
                return result;
            }

            // Fallback: check for SDK presence
            return !!window.farcasterSDK.wallet;
        } catch (e) {
            console.warn('Error checking Farcaster status:', e);
            return false;
        }
    }

    /**
     * Get Farcaster wallet provider
     */
    async getFarcasterProvider() {
        if (this.farcasterProvider) {
            return this.farcasterProvider;
        }

        if (!window.farcasterSDK?.wallet?.getEthereumProvider) {
            console.log('  ✗ Farcaster SDK wallet not available');
            return null;
        }

        try {
            const provider = await window.farcasterSDK.wallet.getEthereumProvider();

            if (provider && typeof provider.request === 'function') {
                this.farcasterProvider = provider;
                return provider;
            }

            console.warn('  ✗ Farcaster provider invalid');
            return null;
        } catch (error) {
            console.warn('  ✗ Error getting Farcaster provider:', error);
            return null;
        }
    }

    /**
     * Request wallet connection
     */
    async requestAccounts() {
        if (!this.currentProvider) {
            throw new WalletError('No wallet provider available', 4100);
        }

        try {
            console.log('  Requesting accounts from wallet...');
            const accounts = await this.currentProvider.request({
                method: 'eth_requestAccounts'
            });
            console.log('  ✓ Accounts received:', accounts);
            return accounts;
        } catch (error) {
            throw normalizeError(error);
        }
    }

    /**
     * Get current accounts (without prompting user)
     */
    async getAccounts() {
        if (!this.currentProvider) {
            return [];
        }

        try {
            const accounts = await this.currentProvider.request({
                method: 'eth_accounts'
            });
            return accounts || [];
        } catch (error) {
            console.warn('Failed to get accounts:', error);
            return [];
        }
    }

    /**
     * Get current network
     */
    async getChainId() {
        if (!this.currentProvider) {
            throw new WalletError('No wallet provider available', 4100);
        }

        try {
            const chainId = await this.currentProvider.request({
                method: 'eth_chainId'
            });
            return parseInt(chainId, 16);
        } catch (error) {
            throw normalizeError(error);
        }
    }

    /**
     * Switch to a specific network
     */
    async switchNetwork(network) {
        if (!this.currentProvider) {
            throw new WalletError('No wallet provider available', 4100);
        }

        try {
            console.log(`🔄 Switching to ${network.name}...`);

            await this.currentProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainIdHex }],
            });

            console.log(`  ✓ Switched to ${network.name}`);
            return true;
        } catch (switchError) {
            console.log('Switch error:', switchError);

            // Error code 4902 means the chain hasn't been added yet
            const normalizedError = normalizeError(switchError);

            if (normalizedError.code === 4902 ||
                switchError.code === 4902 ||
                normalizedError.message?.includes('Unrecognized chain')) {
                try {
                    console.log(`  Adding ${network.name} to wallet...`);
                    await this.addNetwork(network);
                    console.log(`  ✓ ${network.name} added successfully`);
                    return true;
                } catch (addError) {
                    throw normalizeError(addError);
                }
            }

            throw normalizedError;
        }
    }

    /**
     * Add a new network to the wallet
     */
    async addNetwork(network) {
        if (!this.currentProvider) {
            throw new WalletError('No wallet provider available', 4100);
        }

        try {
            await this.currentProvider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: network.chainIdHex,
                    chainName: network.name,
                    nativeCurrency: network.nativeCurrency,
                    rpcUrls: network.rpcUrls,
                    blockExplorerUrls: network.blockExplorerUrls
                }],
            });
        } catch (error) {
            throw normalizeError(error);
        }
    }

    /**
     * Attach event listener
     */
    on(event, handler) {
        if (!this.currentProvider || !this.currentProvider.on) {
            console.warn(`Cannot attach ${event} listener - provider doesn't support events`);
            return;
        }

        // Store handler for cleanup
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(handler);

        this.currentProvider.on(event, handler);
    }

    /**
     * Remove event listener
     */
    removeListener(event, handler) {
        if (!this.currentProvider || !this.currentProvider.removeListener) {
            return;
        }

        this.currentProvider.removeListener(event, handler);

        // Remove from our tracking
        if (this.eventListeners.has(event)) {
            const handlers = this.eventListeners.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Remove all event listeners
     */
    removeAllListeners() {
        if (!this.currentProvider || !this.currentProvider.removeListener) {
            return;
        }

        for (const [event, handlers] of this.eventListeners.entries()) {
            for (const handler of handlers) {
                this.currentProvider.removeListener(event, handler);
            }
        }

        this.eventListeners.clear();
    }

    /**
     * Get provider info for debugging
     */
    getInfo() {
        return {
            type: this.providerType,
            hasProvider: !!this.currentProvider,
            hasFarcasterSDK: !!window.farcasterSDK,
            hasEthereum: !!window.ethereum
        };
    }

    /**
     * Get the current provider (for compatibility)
     */
    getProvider() {
        return this.currentProvider;
    }
}

// ============ Export ============

export { WalletProviderManager, WalletError, ProviderType, NETWORKS };
