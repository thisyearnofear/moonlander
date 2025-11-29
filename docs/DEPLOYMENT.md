# Moonlander - Deployment Guide

Complete step-by-step deployment instructions for both Farcaster Mini App and Monad blockchain integration.

---

## Part 1: Farcaster Mini App Deployment

### Prerequisites
- Farcaster account (create at [warpcast.com](https://warpcast.com))
- Vercel account (free at [vercel.com](https://vercel.com))

### Step 1: Prepare Your Environment

#### Update index.html
Find this line:
```html
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://moonlander-game.example.com/...
```

Replace `moonlander-game.example.com` with your domain.

#### Update .well-known/farcaster.json
```json
{
  "miniapp": {
    "homeUrl": "https://YOUR-DOMAIN.com",
    "iconUrl": "https://YOUR-DOMAIN.com/images/icon-1024.png",
    "domain": "YOUR-DOMAIN.com"
  }
}
```

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
npm install -g vercel
cd /path/to/moonlander
vercel --prod
```

#### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Create new project
3. Select "Other" (static files)
4. Upload your project folder
5. Deploy

**Note your deployment URL** (e.g., `https://lunar-lander-abc.vercel.app`)

### Step 3: Sign the Manifest

#### Using Farcaster Developer Tools
1. Go to: https://farcaster.xyz/~/settings/developer-tools
2. Toggle "Developer Mode" on
3. Find "Manifest Auditor" in Developer section
4. Paste your domain
5. Click "Validate and Sign"
6. Follow prompts to sign with your account
7. Copy the signature

#### Save the Signature
In `.well-known/farcaster.json`:
```json
{
  "accountAssociation": {
    "header": {
      "type": "custody",
      "key": "COPIED_PUBLIC_KEY"
    },
    "payload": {
      "domain": "your-domain.com"
    },
    "signature": "COPIED_SIGNATURE"
  }
}
```

### Step 4: Test in Developer Mode

1. Go to: https://farcaster.xyz/~/settings/developer-tools
2. Use "Manifest Auditor" to verify
3. Use preview feature to test
4. Check that game loads, controls work, score displays

---

## Part 2: Monad Integration Deployment

### Prerequisites
- MetaMask or similar Web3 wallet
- m00nad tokens for testing
- Access to [Remix IDE](https://remix.ethereum.org/)

**Note**: This implementation is self-contained and doesn't require external 0xSplits contracts.

### Step 1: Prepare Your Wallet (5 minutes)

1. Make sure you have m00nad tokens in your MetaMask wallet
2. Note your wallet address (you'll be the contract owner)
3. Ensure you're connected to Monad mainnet

**No external contracts needed** – this implementation is self-contained!

### Step 2: Deploy Game Contract (30 minutes)

#### Option A: Using Remix (Recommended)

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create new file: `MoonlanderGame.sol`
3. Copy contract from `/contracts/MoonlanderGame.sol`
4. Compiler:
   - Select version: `0.8.20` or higher
   - Click "Compile MoonlanderGame.sol"
5. Deploy:
   - Environment: "Injected Provider - MetaMask"
   - Connect MetaMask to **Monad Mainnet**
   - Constructor args:
     ```
     m00nadToken: 0x22cd99ec337a2811f594340a4a41e4a3022b07
     initialOwner: [YOUR_WALLET_ADDRESS]
     ```
   - Click "Deploy"
   - Sign in MetaMask
   - Wait for confirmation (~1 minute on Monad)

6. Copy deployed contract address

**Save this address** – you'll use it in the frontend.

#### Option B: Using Hardhat

1. Create `hardhat.config.js`:
```javascript
module.exports = {
  solidity: "0.8.20",
  networks: {
    monad: {
      url: "https://rpc.monad.xyz",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 10143
    }
  }
};
```

2. Create `scripts/deploy.js`:
```javascript
const hre = require("hardhat");

async function main() {
  const M00NAD = "0x22cd99ec337a2811f594340a4a41e4a3022b07";
  const OWNER = (await hre.ethers.getSigners())[0].address;
  
  const Game = await hre.ethers.getContractFactory("MoonlanderGame");
  const game = await Game.deploy(M00NAD, OWNER);
  
  await game.deployed();
  console.log("Deployed to:", game.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

3. Deploy:
```bash
npx hardhat run scripts/deploy.js --network monad
```

### Step 3: Update Frontend (30 minutes)

#### Update Configuration
In `js/contract-integration.js`, update the `CONFIG` object:

```javascript
const CONFIG = {
  RPC_URL: 'https://rpc.monad.xyz',
  CHAIN_ID: 10143,
  M00NAD_TOKEN: '0x22cd99ec337a2811f594340a4a41e4a3022b07',
  M00NAD_DECIMALS: 18,
  MOONLANDER_CONTRACT: '0xYOUR_GAME_CONTRACT_ADDRESS',
  ENTRY_FEE: '100000',
};
```

#### Update HTML
Add to `index.html` (before closing `</body>`):

```html
<!-- Ethers.js -->
<script src="https://cdn.ethers.io/lib/ethers-5.6.umd.min.js"></script>

<!-- Contract Integration -->
<script src="js/contract-integration.js"></script>

<!-- Add wallet button to UI -->
<button id="walletConnectBtn" onclick="window.contractIntegration.connectWallet()">
  Connect Wallet
</button>

<!-- Add play game button -->
<button id="playGameBtn" onclick="window.contractIntegration.payAndPlayGame()" disabled>
  Pay & Play (100k m00nad)
</button>

<!-- Status message -->
<div id="statusMessage" style="display: none; color: green; margin: 10px 0;">
</div>
```

#### Setup Leaderboard Events
Update `leaderboard.js` to listen to contract events as shown in the implementation files.

#### How Payments Work (New Self-Contained Model)
The contract now handles payments internally:

1. **Player pays 100k m00nad** → Funds go to contract
2. **80% effectively burned** → Stays in contract (irrecoverable)
3. **20% goes to platform** → Withdrawable by owner via `withdrawPlatformFunds()`

#### Owner Withdrawals
Add a withdraw button to your UI:
```html
<button id="withdrawBtn" onclick="window.contractIntegration.withdrawPlatformFunds()">
  Withdraw Platform Funds
</button>
```

---

## Part 3: Testing & Verification

### Local Testing Checklist

- [ ] **Wallet Connection**: Connect to Monad mainnet
- [ ] **Balance Display**: Shows m00nad balance correctly  
- [ ] **Token Approval**: Approves spending correctly
- [ ] **Payment Flow**: Pays entry fee successfully
- [ ] **Score Submission**: Submits scores to contract
- [ ] **Leaderboard**: Loads scores from blockchain events
- [ ] **No Console Errors**: All functions work smoothly

### Test Flow
1. Open `index.html` in browser
2. Click "Connect Wallet" - verify MetaMask prompts
3. Click "Pay & Play" - approve token and payment
4. Play the game
5. Submit score - verify transaction
6. Check leaderboard - score should appear

### Monad RPC Endpoints
```
Primary: https://rpc.monad.xyz
Backup 1: https://rpc1.monad.xyz (Alchemy)
Backup 2: https://rpc3.monad.xyz (Ankr)
```

---

## Part 4: Production Deployment

### 1. Deploy Frontend

**Option A: Vercel (Recommended)**
```bash
npm install -g vercel
vercel
```

**Option B: GitHub Pages**
```bash
git push origin main
# Enable GitHub Pages in repo settings
```

### 2. Update .env (if using secrets)
```
MOONLANDER_CONTRACT=0x...
RPC_URL=https://rpc.monad.xyz
```

### 3. Final Checks
- [ ] Wallet connection works
- [ ] Payment processes correctly
- [ ] Scores submit to contract
- [ ] Leaderboard updates from contract events
- [ ] MetaMask shows Monad network
- [ ] Block explorer links work
- [ ] No console errors

### 4. Announce
- Tweet about launch
- Post on Farcaster mini app
- Share leaderboard link

---

## Common Issues & Solutions

### Issue: "Please switch to Monad mainnet"
**Solution**: Add Monad to MetaMask:
- Network Name: `Monad`
- RPC URL: `https://rpc.monad.xyz`
- Chain ID: `10143`
- Symbol: `MON`

### Issue: "Insufficient allowance"
**Solution**: Approve token first
- Contract automatically prompts approval
- Higher gas cost on first play only

### Issue: "Payment failed: invalid token"
**Solution**: Verify m00nad address
- Confirm: `0x22cd99ec337a2811f594340a4a41e4a3022b07`
- Check decimals are 18

### Issue: Leaderboard not updating
**Solution**: Check RPC endpoint
- Verify RPC is responding
- Check contract address in console
- Verify events are emitted in block explorer

### Issue: "Game Won't Load"
**Check:**
- All images exist and are accessible
- No 404 errors in console (F12)
- Three.js loads from CDN
- JavaScript syntax errors

**Fix:**
```bash
# Test locally first
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Issue: "Invalid splits address" (Deployment Error)
**Cause**: You used the burn address (`0x0000...0000`) instead of the split contract address.

**Solution**: 
- Go back to [split.new](https://app.splits.org/new/split/) 
- After creating your split, copy the **split contract address** (not the recipient addresses)
- The split contract address should start with `0x` and be much longer than the recipient addresses
- Use this split contract address as `_splitsRecipient` in the MoonlanderGame constructor

---

## Support Resources

- **Monad Docs**: https://docs.monad.xyz
- **0xSplits Docs**: https://docs.splits.org
- **Block Explorer**: https://monadvision.com
- **Farcaster Mini Apps**: https://miniapps.farcaster.xyz
- **Discord**: https://discord.gg/monaddev

---

## Timeline & Costs

| Step | Time | Cost |
|------|------|------|
| Prepare wallet | 5 min | $0 |
| Deploy contract | 30 min | $0.05 |
| Update frontend | 30 min | $0 |
| Test thoroughly | 45 min | $0.001 |
| Deploy frontend | 15 min | $0 |
| **TOTAL** | **2 hours** | **~$0.05** |

**Much simpler!** No external 0xSplits deployment needed.

---

**Ready to launch?** Follow the steps above. For quick reference, see `GETTING_STARTED.md`. For technical details, see `TECHNICAL_DETAILS.md`.
