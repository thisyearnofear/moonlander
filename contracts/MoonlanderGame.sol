// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MoonlanderGame
 * @dev On-chain payment and score tracking for Moonlander game
 * Players pay 100k m00nad: 80% burned immediately, 20% to platform owner
 */
contract MoonlanderGame is Ownable {
    // ============ State Variables ============

    IERC20 public m00nadToken;
    uint256 public entryFee = 100_000e18; // 100k m00nad (18 decimals)

    // Burn address - tokens sent here are permanently removed
    address public constant BURN_ADDRESS = 0x0000000000000000000000000000000000000000;

    // ============ Events ============

    /// @notice Emitted when a player pays to play
    /// @param player Address of the player
    /// @param timestamp Block timestamp
    /// @param entryFeeAmount Total amount paid
    /// @param burnAmount Amount sent to burn address
    /// @param platformAmount Amount sent to platform owner
    event GameStarted(
        address indexed player,
        uint256 timestamp,
        uint256 entryFeeAmount,
        uint256 burnAmount,
        uint256 platformAmount
    );

    /// @notice Emitted when a player submits their score
    /// @param player Address of the player
    /// @param score Final score achieved
    /// @param landed Whether landing was successful (1) or crashed (0)
    /// @param timestamp Block timestamp of submission
    event ScoreSubmitted(
        address indexed player,
        uint256 indexed score,
        uint8 landed,
        uint256 timestamp
    );

    /// @notice Emitted when entry fee is updated
    event EntryFeeUpdated(uint256 newFee);

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
     * Player must approve this contract to spend m00nad tokens
     * 80% is immediately burned (sent to 0x0000...0000)
     * 20% is immediately sent to platform owner
     */
    function playGame() external {
        require(
            m00nadToken.transferFrom(msg.sender, address(this), entryFee),
            "Payment failed: insufficient balance or allowance"
        );

        // Calculate split amounts
        uint256 burnAmount = (entryFee * 80) / 100;
        uint256 platformAmount = (entryFee * 20) / 100;

        // Send 80% to burn address (irreversible)
        require(
            m00nadToken.transfer(BURN_ADDRESS, burnAmount),
            "Burn transfer failed"
        );

        // Send 20% to platform owner
        require(
            m00nadToken.transfer(owner(), platformAmount),
            "Platform transfer failed"
        );

        emit GameStarted(
            msg.sender,
            block.timestamp,
            entryFee,
            burnAmount,
            platformAmount
        );
    }

    /**
     * @dev Submit score after completing a game
     * @param _score The final score achieved
     * @param _landed 1 if safe landing, 0 if crashed
     */
    function submitScore(uint256 _score, uint8 _landed) external {
        require(_score > 0, "Score must be greater than 0");
        require(_landed == 0 || _landed == 1, "Landed must be 0 or 1");

        emit ScoreSubmitted(msg.sender, _score, _landed, block.timestamp);
    }

    /**
     * @dev Submit score with optional metadata (reserved for future use)
     * @param _score The final score achieved
     * @param _landed 1 if safe landing, 0 if crashed
     * @param _fuel Fuel remaining at end of game (optional metadata)
     * @param _maxAltitude Maximum altitude reached (optional metadata)
     */
    function submitScoreWithMetadata(
        uint256 _score,
        uint8 _landed,
        uint256 _fuel,
        uint256 _maxAltitude
    ) external {
        require(_score > 0, "Score must be greater than 0");
        require(_landed == 0 || _landed == 1, "Landed must be 0 or 1");

        // Emit event with score (metadata can be derived from transaction)
        emit ScoreSubmitted(msg.sender, _score, _landed, block.timestamp);

        // Use parameters to prevent unused variable warnings
        _fuel;
        _maxAltitude;
    }

    // ============ Admin Functions ============

    /**
     * @dev Update the entry fee (requires owner)
     * @param _newFee New entry fee in wei (with 18 decimals for m00nad)
     */
    function setEntryFee(uint256 _newFee) external onlyOwner {
        require(_newFee > 0, "Fee must be greater than 0");
        entryFee = _newFee;
        emit EntryFeeUpdated(_newFee);
    }

    // ============ View Functions ============

    /**
     * @dev Get current entry fee
     * @return Current entry fee in wei
     */
    function getEntryFee() external view returns (uint256) {
        return entryFee;
    }

    /**
     * @dev Check allowance needed for player to play
     * @param _player Address to check
     * @return Allowance for this contract in wei
     */
    function getAllowance(address _player) external view returns (uint256) {
        return m00nadToken.allowance(_player, address(this));
    }

    /**
     * @dev Check balance of a player
     * @param _player Address to check
     * @return Balance in wei
     */
    function getBalance(address _player) external view returns (uint256) {
        return m00nadToken.balanceOf(_player);
    }
}
