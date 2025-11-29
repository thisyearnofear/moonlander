# Moonlander - Technical Details & Implementation

Architecture, smart contract specifications, security model, and implementation details for on-chain Moonlander on Monad.

---

## Architecture Overview

### Tech Stack
- **Blockchain**: Monad (mainnet, EVM-compatible)
- **Tokens**: m00nad (0x22cd99ec337a2811f594340a4a41e4a3022b07)
- **Fee Distribution**: 0xSplits (audited, immutable, non-upgradeable)
- **Game Hosting**: Same client-side game (Three.js)
- **Score Storage**: On-chain contract event logs (no backend DB)

### High-Level Flow
```
Player → Connect wallet (wagmi/RainbowKit)
       → Pay 100k m00nad via game contract
       → Play game
       → Submit score + proof
       → Contract validates & emits event
       → Leaderboard reads events
       → 0xSplits distributes: 80% → burn, 20% → platform wallet
```

---

## Smart Contract Architecture

### Contract 1: MoonlanderGame.sol
**Purpose**: Accept payment, track scores, emit events

```solidity
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MoonlanderGame is Ownable {
    IERC20 public m00nadToken;
    address public splitsRecipient;
    
    uint256 public entryFee = 100_000e18; // 100k m00nad
    
    struct Score {
        address player;
        uint256 score;
        uint256 timestamp;
    }
    
    event ScoreSubmitted(
        address indexed player,
        uint256 score,
        uint256 landed,        // 1 = safe landing, 0 = crash
        uint256 timestamp
    );
    
    event GamePlayed(
        address indexed player,
        uint256 entryFeeAmount
    );
    
    constructor(
        address _m00nadToken, 
        address _splitsRecipient,
        address initialOwner
    ) Ownable(initialOwner) {
        m00nadToken = IERC20(_m00nadToken);
        splitsRecipient = _splitsRecipient;
    }
    
    // Player pays entry fee
    function playGame() external {
        require(
            m00nadToken.transferFrom(msg.sender, splitsRecipient, entryFee),
            "Payment failed"
        );
        emit GamePlayed(msg.sender, entryFee);
    }
    
    // Submit score
    function submitScore(uint256 _score, uint256 _landed) external {
        require(_score > 0, "Invalid score");
        emit ScoreSubmitted(msg.sender, _score, _landed, block.timestamp);
    }
    
    // Admin functions
    function setEntryFee(uint256 _newFee) external onlyOwner {
        entryFee = _newFee;
    }
    
    function setSplitsRecipient(address _newRecipient) external onlyOwner {
        splitsRecipient = _newRecipient;
    }
}
```

### Contract 2: 0xSplits (Already Audited)
**No custom code needed** – Deploy via [split.new](https://split.new)

**Configuration**:
- Recipients: 2
  - **Recipient 1**: Burn address (0x0000...0000) – 80%
  - **Recipient 2**: Platform wallet – 20%
- Make split **immutable** (no controller)

---

## Score Validation Strategy

### Option A: Simple Event-Based (Recommended for MVP)
**Pros**: No backend, fully on-chain, minimal gas cost
**Cons**: Requires frontend to verify gameplay legitimacy

**Implementation**:
```solidity
event ScoreSubmitted(
    address indexed player,
    uint256 score,
    uint256 landed,        // 1 = safe landing, 0 = crash
    uint256 timestamp
);

function submitScore(uint256 _score, uint256 _landed) external {
    emit ScoreSubmitted(msg.sender, _score, _landed, block.timestamp);
}
```

**Leaderboard reads events** (off-chain indexing):
- Subgraph queries contract events
- Filters for valid scores (e.g., `landed == 1`)
- Sorts by score
- Display in UI

### Option B: Merkle Proof Validation (For Dispute Prevention)
**Pros**: Cryptographic proof of score validity
**Cons**: More complex, higher gas

**Flow**:
1. Game emits `score_hash = keccak256(player, score, seed)`
2. Frontend submits score with Merkle proof
3. Contract validates proof against committed root
4. Harder to forge scores

---

## Frontend Integration

### Key Files

#### js/contract-integration.js (600 lines)
- Wallet connection (MetaMask)
- Token approval & payment flow
- Score submission
- Event listeners
- Balance queries
- UI helpers
- Drop-in ready (just update CONFIG)

#### js/contract-abis.js (250 lines)
- Complete contract ABIs
- Monad network configuration
- Helper functions
- Token conversion utilities
- Monad chain addition helper

### Key Configuration
```javascript
const CONFIG = {
  RPC_URL: 'https://rpc.monad.xyz',
  CHAIN_ID: 10143,
  M00NAD_TOKEN: '0x22cd99ec337a2811f594340a4a41e4a3022b07',
  M00NAD_DECIMALS: 18,
  MOONLANDER_CONTRACT: '0xYOUR_CONTRACT',
  SPLITS_ADDRESS: '0xYOUR_SPLITS',
  ENTRY_FEE: '100000',
};
```

### Leaderboard Updates
```javascript
// Read events from contract instead of localStorage
async function loadLeaderboard() {
    const events = await provider.getLogs({
        address: MOONLANDER_CONTRACT,
        topics: [keccak256('ScoreSubmitted(address,uint256,uint256)')],
        fromBlock: 0
    });
    
    const scores = events.map(event => ({
        player: event.args.player,
        score: event.args.score,
        timestamp: event.args.timestamp
    }));
    
    scores.sort((a, b) => b.score - a.score);
    displayLeaderboard(scores.slice(0, 10));
}
```

---

## Key Decisions Explained

### Why 0xSplits and not custom split contract?
- **0xSplits is audited** by professional firms
- **Non-upgradeable** (immutable = trust)
- **Already proven** (Protocol Guild, Zora, SuperRare, etc.)
- **No platform fees** (only gas cost)
- **Saves 2-3 weeks** of security auditing

### Why Monad and not Ethereum/Arbitrum?
- **Full mainnet** (not testnet)
- **Ultra-cheap gas** (Monad is cheap L1)
- **Perfect for gaming** (10k tps, 400ms blocks)
- **Launched Nov 2025** (stable & live)

### Why on-chain events for scores, not database?
- **Immutable leaderboard** (no server to hack)
- **Transparent** (anyone can verify)
- **Scalable** (blockchain handles storage)
- **No backend maintenance**
- **Can upgrade to Merkle proofs later** if needed

### Why simple event storage, not Merkle proofs?
- For MVP: **implicit trust** is fine
- Players want **fun, not custody battles**
- Merkle proofs add **1-2 days** of work
- Can **upgrade later** if platform scales

---

## Security Model

### What's Protected
✅ **Payment processing** (OpenZeppelin, audited)  
✅ **Split logic** (0xSplits, audited)  
✅ **Score storage** (blockchain, immutable)  
✅ **Transaction validation** (Monad consensus)  

### What Assumes Honesty
⚠️ **Score accuracy** (player could cheat locally)
- **Mitigation**: Merkle proofs (future upgrade)
- **For now**: Implicit trust + leaderboard fun

⚠️ **Landing validation** (0 = crash, 1 = safe)
- **Mitigation**: Just cosmetic, doesn't affect payment
- Could add validation if needed

### Trust Model
For a gaming leaderboard:
- **Implicit trust** (users play fair) is acceptable for fun/bragging rights
- **Cryptographic proof** (Merkle) needed if prizes > $1k

---

## RPC & Infrastructure

### Monad Mainnet RPC Endpoints
```javascript
const RPC_URLS = {
  monad: 'https://rpc.monad.xyz',  // QuickNode
  backup1: 'https://rpc1.monad.xyz', // Alchemy
  backup2: 'https://rpc3.monad.xyz'  // Ankr
};
```

**Rate Limits**:
- QuickNode: 25 req/s
- Alchemy: 15 req/s
- Ankr: 300 per 10s

### Indexing Leaderboard Events
**Option 1**: Use Subgraph (recommended)
- Deploy subgraph to The Graph
- Query: `query { scoreSubmitteds(orderBy: score, orderDirection: desc) { ... } }`

**Option 2**: Index off-chain
- Run indexer service that listens to events
- Store in simple DB (Firebase, PostgreSQL)
- API endpoint for leaderboard

---

## Cost Analysis

### Gas Costs (Monad is cheap)
- **Approve token**: ~50k gas
- **Call playGame()**: ~50k gas
- **Submit score**: ~40k gas
- **Total per play**: ~140k gas
- **Monad gas**: ~0.001-0.01 MON (extremely cheap)

### Token Economics
- **Entry fee**: 100k m00nad per play
- **Distribution**: 80k burned, 20k to platform

### Cost Summary
| What | Cost | When |
|------|------|------|
| 0xSplits deployment | ~$0.01 | Once |
| Game contract deployment | ~$0.05 | Once |
| Player per-play gas | ~$0.0002 | Per player |
| **Total to launch** | **~$0.10** | Once |

---

## Who's Using This Pattern

- **Protocol Guild** ($30M+ distributed to Ethereum core devs via 0xSplits)
- **Zora** (marketplace splits)
- **SuperRare** ($3M+ drops with splits)
- **Transient Labs** (artist revenue splits)
- **NOUNS DAO** (governance splits)

All proven. All audited. All running on mainnet.

---

## Testing Plan

### 1. Monad Testnet (if available)
- Deploy contracts
- Test with test tokens
- Verify leaderboard reads events

### 2. Local Fork Testing
```bash
foundry test --fork-url https://rpc.monad.xyz
```

### 3. Frontend Integration Testing
- Connect wallet (MetaMask with Monad added)
- Play game
- Submit score
- Check leaderboard updates

---

## Potential Issues & Solutions

| Issue | Solution |
|-------|----------|
| m00nad is fee-on-transfer | Use Swapper instead of Split |
| Player disputes score | Add signed score submissions or Merkle proofs |
| No indexing service | Read events directly from RPC |
| Monad RPC rate limits | Use paid RPC or cache leaderboard off-chain |
| Score overflow/underflow | Use `uint256` (safe), validate score > 0 |

---

## Next Steps If You Want to Scale

### 1. Add Merkle Proof Validation
- Prove scores with cryptographic signatures
- Prevent sophisticated cheating
- Costs: 1-2 days work

### 2. Add Leaderboard Archiving
- Move old scores to IPFS/Arweave
- Reduce on-chain storage
- Costs: 1 day work

### 3. Add Tournaments
- Time-limited competitions
- Prize pools from entry fees
- Costs: 2-3 days work

### 4. Add Sponsorships
- Integrate ads / brand partnerships
- Sponsorships pay platform fee instead
- Costs: 1 day work

### 5. Deploy to Other Chains
- Copy contracts to Arbitrum, Base, Optimism
- Reuse frontend
- Costs: 1-2 hours per chain

---

## Files Provided

| File | Purpose | Lines |
|------|---------|-------|
| `GETTING_STARTED.md` | Quick start & overview | 185 |
| `DEPLOYMENT.md` | Step-by-step deployment | 299 |
| `TECHNICAL_DETAILS.md` | Architecture & implementation | 300 |
| `contracts/MoonlanderGame.sol` | Smart contract | 180 |
| `js/contract-integration.js` | Frontend integration | 600 |
| `js/contract-abis.js` | ABIs & utilities | 250 |

**Total documentation**: 784 lines (vs original 2,350+ lines)

---

## Success Criteria

✅ **Smart contract deployed** to Monad mainnet  
✅ **0xSplits configured** for distribution  
✅ **Frontend connects to wallet**  
✅ **Users can pay & play**  
✅ **Scores submit to contract**  
✅ **Leaderboard reads from chain**  
✅ **Splits distribute funds automatically**  

---

## References

- [Monad Docs](https://docs.monad.xyz)
- [0xSplits Docs](https://docs.splits.org)
- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Setup](https://rainbowkit.com)
- [MonadVision Explorer](https://monadvision.com)

---

**Ready to understand the technical details?** You now have the complete architecture. For implementation, see `DEPLOYMENT.md`. For quick start, see `GETTING_STARTED.md`.