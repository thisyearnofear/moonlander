/**
 * Farcaster Mini App Integration for m00nlander
 * Handles SDK initialization, splash screen, and game state notifications
 */

let farcasterContext = null;
let isInitializing = true;

/**
 * Initialize Farcaster SDK and prepare game for display
 * Note: sdk.actions.ready() is now called in game.html after the game loads
 */
async function initFarcasterSDK() {
    try {
        // Wait for SDK to be ready
        const sdk = await window.sdkReady;
        
        if (!sdk) {
            console.log('Farcaster SDK not available - running in standalone mode');
            isInitializing = false;
            return;
        }
        
        // Get context about where the mini app is running
        try {
            farcasterContext = sdk.context;
            console.log('Farcaster context:', farcasterContext);
        } catch (error) {
            console.warn('Could not get Farcaster context:', error);
        }
        
        console.log('m00nlander mini app SDK initialized');
        
        isInitializing = false;
    } catch (error) {
        console.error('Error initializing Farcaster SDK:', error);
        isInitializing = false;
    }
}

/**
 * Share the user's high score to Farcaster feed
 * Called when game ends
 */
async function shareScoreToFarcaster(score, landings = 0) {
    try {
        const sdk = await window.sdkReady;
        
        if (!sdk || !sdk.actions.composeCast) {
            console.log('Cannot share to Farcaster - SDK not available');
            return;
        }
        
        const message = `🚀 I scored ${score} points in m00nlander! Made ${landings} landings before running out of fuel. Can you beat my score?\n\nhttps://moonlander-game.example.com`;
        
        // Prompt user to compose a cast with their score
        await sdk.actions.composeCast({
            text: message,
            embeds: ['https://moonlander-game.example.com']
        });
    } catch (error) {
        console.error('Error sharing score:', error);
    }
}

/**
 * Prompt user to add the mini app for notifications/quick access
 */
async function promptAddMiniApp() {
    try {
        const sdk = await window.sdkReady;
        
        if (!sdk || !sdk.actions.addMiniApp) {
            console.log('Cannot add mini app - SDK not available');
            return;
        }
        
        await sdk.actions.addMiniApp();
    } catch (error) {
        console.error('Error adding mini app:', error);
    }
}

/**
 * Close the mini app (returns to Farcaster)
 */
async function closeMiniApp() {
    try {
        const sdk = await window.sdkReady;
        
        if (!sdk || !sdk.actions.close) {
            console.log('Cannot close mini app - SDK not available');
            return;
        }
        
        await sdk.actions.close();
    } catch (error) {
        console.error('Error closing mini app:', error);
    }
}

/**
 * Check if running in Farcaster context
 */
function isRunningInFarcaster() {
    return farcasterContext !== null;
}

/**
 * Get the current user's FID (Farcaster ID) if available
 */
function getFarcasterUser() {
    return farcasterContext?.user || null;
}

// Initialize SDK when this script loads
// The actual game init() will be called after window.onload
initFarcasterSDK();
