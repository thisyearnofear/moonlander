# Moonlander - Getting Started Guide

**Status**: Ready to deploy  
**Time to launch**: 2 hours  
**Cost**: < $1 in gas

---

## Quick Overview

This implementation deploys Moonlander as:
1. **Farcaster Mini App** - Social discovery and sharing
2. **On-chain game on Monad** - Self-contained payments & immutable leaderboard

### What You Get
- ✅ **No backend required** (everything on-chain)
- ✅ **Self-contained contract** (no external dependencies)
- ✅ **Automatic payment splitting** (80% burn, 20% platform)
- ✅ **On-chain leaderboard** (immutable, decentralized)
- ✅ **Owner withdrawals** (withdrawable platform share)
- ✅ **Ultra-cheap gas** (Monad L1)

---

## 30-Second Start

### 1. Prepare Wallet (5 min)
```
1. Have m00nad tokens in MetaMask
2. Be on Monad mainnet
3. Note your wallet address
```

### 2. Deploy Game Contract (15 min)
```
1. Go to remix.ethereum.org
2. Create MoonlanderGame.sol
3. Deploy with:
   - m00nadToken: 0x22cd99ec337a2811f594340a4a41e4a3022b07
   - initialOwner: [YOUR_WALLET_ADDRESS]
4. Copy contract address
```

### 3. Update Frontend (10 min)
```
1. Update js/contract-integration.js CONFIG:
   - MOONLANDER_CONTRACT: [YOUR_CONTRACT]

2. Add to index.html:
   <button onclick="connectWallet()">Connect Wallet</button>
   <button onclick="payAndPlay()">Pay & Play</button>
   <button onclick="withdrawFunds()">Withdraw Platform Funds</button>
```

### 4. Deploy to Vercel (10 min)
```
npm install -g vercel
vercel
```

**Total: ~40 minutes**

---

## Architecture

```
Player's Wallet
    ↓
[Connect] → MetaMask
    ↓
[Pay 100k m00nad] → MoonlanderGame.sol
    ↓
[80% stays in contract] → Effectively burned
[20% stays in contract] → Withdrawable by owner
    ↓
[Play game & submit score] → Emit event
    ↓
[Read events] → Leaderboard
    ↓
[Owner calls withdrawPlatformFunds()] → Get 20% share
```

---

## Important Addresses

### m00nad Token
```
0x22cd99ec337a2811f594340a4a41e4a3022b07
Chain: Monad Mainnet
Decimals: 18
```

### Monad Network
```
RPC: https://rpc.monad.xyz
Chain ID: 10143
Block Explorer: https://monadvision.com
```

---

## Farcaster Mini App Setup

### Local Testing (5 minutes)
```bash
cd /Users/udingethe/Dev/moonlander
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Deploy & Register (15 minutes)
1. **Deploy to Vercel**: `vercel`
2. **Update URLs** in `index.html` and `.well-known/farcaster.json`
3. **Sign manifest**: Use Farcaster Developer Tools
4. **Test in preview mode**

---

## Key Files

| File | Purpose | Read If |
|------|---------|---------|
| `GETTING_STARTED.md` | This file | You want to start quickly |
| `DEPLOYMENT.md` | Detailed deployment steps | You need step-by-step instructions |
| `TECHNICAL_DETAILS.md` | Architecture & implementation | You want to understand how it works |
| `contracts/MoonlanderGame.sol` | Smart contract | You're deploying contracts |
| `js/contract-integration.js` | Frontend integration | You're integrating payments |

---

## Cost Breakdown

### One-Time Costs
- Game contract deployment: ~$0.05
- **Total**: < $0.10

### Per-Play Costs (paid by player)
- Token approval: ~$0.0005
- Payment transaction: ~$0.0005
- Score submission: ~$0.0004
- **Total per play**: ~$0.001

### Platform Revenue
- 20% of all entry fees (withdrawable by owner)
- 80% effectively burned (stays in contract)

---

## Verification Checklist

- [ ] Wallet connects to Monad
- [ ] Shows balance in m00nad
- [ ] Can approve token
- [ ] Can pay entry fee
- [ ] Transaction succeeds
- [ ] Can submit score
- [ ] Score appears on leaderboard
- [ ] No console errors
- [ ] Works in Farcaster (if using mini app)

---

## Troubleshooting

### "Wrong network" error
→ Add Monad to MetaMask
- Network: Monad
- RPC: https://rpc.monad.xyz
- Chain ID: 10143
- Symbol: MON

### "Insufficient balance"
→ Get m00nad tokens from DEX or faucet

### "Leaderboard not updating"
→ Check transaction succeeded in block explorer

---

## Next Steps After Launch

1. **Monitor** - Watch contract on MonadVision
2. **Share** - Post in Farcaster channels
3. **Scale** - Add tournaments, features, other chains

---

**Ready to launch?** Start with the Quick Start section above. For detailed instructions, see `DEPLOYMENT.md`.

---

## Support

- [Monad Docs](https://docs.monad.xyz)
- [0xSplits Docs](https://docs.splits.org)
- [Farcaster Mini Apps](https://miniapps.farcaster.xyz)
- [MonadVision Explorer](https://monadvision.com)