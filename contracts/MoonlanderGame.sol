// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MoonlanderGame
 * @dev Enhanced on-chain payment and score tracking for Moonlander game
 * Features: Paginated leaderboard, score validation, emergency controls
 */
contract MoonlanderGame is Ownable, ReentrancyGuard, Pausable {
    // ============ State Variables ============

    IERC20 public m00nadToken;
    uint256 public entryFee = 100_000e18; // 100k m00nad (18 decimals)
    
    // Score tracking
    struct ScoreEntry {
        address player;
        uint256 score;
        uint8 landed;
        uint256 timestamp;
        uint256 blockNumber;
    }
    
    // Game session tracking
    mapping(address => uint256) public lastGameTimestamp;
    mapping(address => bool) public hasActiveGame;
    
    // Leaderboard storage
    ScoreEntry[] public allScores;
    ScoreEntry[] public validScores; // Only safe landings (landed == 1)
    
    // Score validation
    uint256 public maxScore = 1_000_000; // Maximum possible score
    uint256 public minGameDuration = 5 seconds; // Minimum game time
    uint256 public maxGameDuration = 600 seconds; // Maximum game time (10 minutes)
    
    // Stats
    uint256 public totalGames;
    uint256 public totalRevenue;
    uint256 public totalBurned;

    // ============ Events ============

    /// @notice Emitted when a player pays to play
    event GameStarted(
        address indexed player,
        uint256 indexed gameId,
        uint256 timestamp,
        uint256 entryFeeAmount,
        uint256 burnAmount,
        uint256 platformAmount
    );

    /// @notice Emitted when a player submits their score
    event ScoreSubmitted(
        address indexed player,
        uint256 indexed score,
        uint8 indexed landed,
        uint256 timestamp,
        uint256 gameDuration,
        uint256 scoreId
    );

    /// @notice Emitted when entry fee is updated
    event EntryFeeUpdated(uint256 oldFee, uint256 newFee);

    /// @notice Emitted when score validation parameters are updated
    event ValidationUpdated(uint256 maxScore, uint256 minDuration, uint256 maxDuration);

    /// @notice Emitted when platform funds are withdrawn
    event PlatformWithdrawal(address indexed owner, uint256 amount);

    /// @notice Emitted for invalid score attempts
    event InvalidScoreAttempt(address indexed player, uint256 score, string reason);

    // ============ Constructor ============

    /**
     * @dev Initialize contract with token address
     * @param _m00nadToken Address of m00nad token contract
     * @param initialOwner Address that will be set as the contract owner
     */
    constructor(
        address _m00nadToken,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_m00nadToken != address(0), "Invalid token address");
        require(initialOwner != address(0), "Invalid owner address");

        m00nadToken = IERC20(_m00nadToken);
    }

    // ============ Public Functions ============

    /**
     * @dev Start a game by paying entry fee
     * Enhanced with session tracking and reentrancy protection
     */
    function playGame() external nonReentrant whenNotPaused {
        require(
            m00nadToken.transferFrom(msg.sender, address(this), entryFee),
            "Payment failed: insufficient balance or allowance"
        );

        // Update game session
        lastGameTimestamp[msg.sender] = block.timestamp;
        hasActiveGame[msg.sender] = true;
        totalGames++;

        // Calculate split amounts
        uint256 burnAmount = (entryFee * 80) / 100;
        uint256 platformAmount = (entryFee * 20) / 100;

        // 80% stays in contract (effectively burned - no withdrawal function exists)
        totalBurned += burnAmount;
        
        // Send 20% to platform owner
        require(
            m00nadToken.transfer(owner(), platformAmount),
            "Platform transfer failed"
        );

        totalRevenue += entryFee;

        emit GameStarted(
            msg.sender,
            totalGames,
            block.timestamp,
            entryFee,
            burnAmount,
            platformAmount
        );
    }

    /**
     * @dev Submit score after completing a game
     * Enhanced with validation and leaderboard storage
     */
    function submitScore(uint256 _score, uint8 _landed) external whenNotPaused {
        require(hasActiveGame[msg.sender], "No active game session");
        require(_score > 0, "Score must be greater than 0");
        require(_score <= maxScore, "Score exceeds maximum allowed");
        require(_landed == 0 || _landed == 1, "Landed must be 0 or 1");

        // Validate game duration
        uint256 gameDuration = block.timestamp - lastGameTimestamp[msg.sender];
        require(gameDuration >= minGameDuration, "Game too short");
        require(gameDuration <= maxGameDuration, "Game too long");

        // Additional validation for suspicious scores
        if (_score > 500_000 && gameDuration < 30) {
            emit InvalidScoreAttempt(msg.sender, _score, "High score in short time");
            revert("Score validation failed");
        }

        // Create score entry
        ScoreEntry memory newScore = ScoreEntry({
            player: msg.sender,
            score: _score,
            landed: _landed,
            timestamp: block.timestamp,
            blockNumber: block.number
        });

        // Add to all scores
        allScores.push(newScore);
        uint256 scoreId = allScores.length - 1;

        // Add to valid scores if safe landing
        if (_landed == 1) {
            validScores.push(newScore);
        }

        // Clear game session
        hasActiveGame[msg.sender] = false;

        emit ScoreSubmitted(
            msg.sender,
            _score,
            _landed,
            block.timestamp,
            gameDuration,
            scoreId
        );
    }


    // ============ Admin Functions ============

    /**
     * @dev Update the entry fee (requires owner)
     */
    function setEntryFee(uint256 _newFee) external onlyOwner {
        require(_newFee > 0, "Fee must be greater than 0");
        uint256 oldFee = entryFee;
        entryFee = _newFee;
        emit EntryFeeUpdated(oldFee, _newFee);
    }

    /**
     * @dev Update score validation parameters
     */
    function setValidationParams(
        uint256 _maxScore,
        uint256 _minDuration,
        uint256 _maxDuration
    ) external onlyOwner {
        require(_maxScore > 0, "Max score must be positive");
        require(_minDuration > 0, "Min duration must be positive");
        require(_maxDuration > _minDuration, "Max duration must be greater than min");
        
        maxScore = _maxScore;
        minGameDuration = _minDuration;
        maxGameDuration = _maxDuration;
        
        emit ValidationUpdated(_maxScore, _minDuration, _maxDuration);
    }

    /**
     * @dev Emergency pause (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Resume operations (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw platform share (20% of revenue)
     */
    function withdrawPlatformFunds(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be positive");
        require(
            m00nadToken.transfer(owner(), amount),
            "Transfer failed"
        );
        emit PlatformWithdrawal(owner(), amount);
    }

    // ============ View Functions ============

    /**
     * @dev Get current entry fee
     */
    function getEntryFee() external view returns (uint256) {
        return entryFee;
    }

    /**
     * @dev Check allowance needed for player to play
     */
    function getAllowance(address _player) external view returns (uint256) {
        return m00nadToken.allowance(_player, address(this));
    }

    /**
     * @dev Check balance of a player
     */
    function getBalance(address _player) external view returns (uint256) {
        return m00nadToken.balanceOf(_player);
    }

    /**
     * @dev Get top scores (paginated) - SAFE LANDINGS ONLY
     * This eliminates the need for frontend event scanning!
     */
    function getTopScores(uint256 offset, uint256 limit) 
        external 
        view 
        returns (ScoreEntry[] memory) 
    {
        require(limit > 0 && limit <= 100, "Invalid limit (1-100)");
        
        if (offset >= validScores.length) {
            return new ScoreEntry[](0);
        }

        uint256 end = offset + limit;
        if (end > validScores.length) {
            end = validScores.length;
        }

        ScoreEntry[] memory result = new ScoreEntry[](end - offset);
        for (uint256 i = 0; i < end - offset; i++) {
            result[i] = validScores[offset + i];
        }

        return result;
    }

    /**
     * @dev Get all scores for a specific player
     */
    function getPlayerScores(address player) 
        external 
        view 
        returns (ScoreEntry[] memory) 
    {
        // Count player's scores first
        uint256 count = 0;
        for (uint256 i = 0; i < allScores.length; i++) {
            if (allScores[i].player == player) {
                count++;
            }
        }

        if (count == 0) {
            return new ScoreEntry[](0);
        }

        // Collect player's scores
        ScoreEntry[] memory playerScores = new ScoreEntry[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allScores.length; i++) {
            if (allScores[i].player == player) {
                playerScores[index] = allScores[i];
                index++;
            }
        }

        return playerScores;
    }

    /**
     * @dev Get total number of valid scores (safe landings)
     */
    function getValidScoresCount() external view returns (uint256) {
        return validScores.length;
    }

    /**
     * @dev Get total number of all scores
     */
    function getAllScoresCount() external view returns (uint256) {
        return allScores.length;
    }

    /**
     * @dev Get player's best score
     */
    function getPlayerBestScore(address player) 
        external 
        view 
        returns (uint256 bestScore, bool hasValidScore) 
    {
        for (uint256 i = 0; i < validScores.length; i++) {
            if (validScores[i].player == player) {
                if (!hasValidScore || validScores[i].score > bestScore) {
                    bestScore = validScores[i].score;
                    hasValidScore = true;
                }
            }
        }
    }

    /**
     * @dev Get game statistics
     */
    function getStats() 
        external 
        view 
        returns (
            uint256 _totalGames,
            uint256 _totalRevenue,
            uint256 _totalBurned,
            uint256 _validScoresCount,
            uint256 _allScoresCount
        ) 
    {
        return (
            totalGames,
            totalRevenue,
            totalBurned,
            validScores.length,
            allScores.length
        );
    }

    /**
     * @dev Get validation parameters
     */
    function getValidationParams() 
        external 
        view 
        returns (uint256, uint256, uint256) 
    {
        return (maxScore, minGameDuration, maxGameDuration);
    }

    /**
     * @dev Check if player has active game
     */
    function hasActiveGameSession(address player) 
        external 
        view 
        returns (bool) 
    {
        return hasActiveGame[player];
    }

    /**
     * @dev Get player's last game timestamp
     */
    function getLastGameTime(address player) 
        external 
        view 
        returns (uint256) 
    {
        return lastGameTimestamp[player];
    }
}
