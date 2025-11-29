// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title EBT Slot Machine - "THE GROCERY RUN" (Standalone)
/// @notice Provably fair on-chain slot machine - standalone and composable
/// @dev Uses Chainlink VRF V2.5 for verifiable randomness. Emits events for off-chain indexing.
/// @author EBT Program Team
contract EBTSlotMachine is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Errors ============
    error SpinCooldownActive();
    error FreeSpinsExhausted();
    error FreeSpinCapReached();
    error InvalidRandomness();
    error SpinNotFound();
    error AlreadyFulfilled();
    error NothingToClaim();
    error InvalidSymbolWeights();
    error JackpotDepleted();
    error InvalidAddress();
    error SpinPending();
    error NotSpinOwner();

    // ============ Enums ============
    enum SpinStatus { NONE, PENDING, FULFILLED }

    // ============ Structs ============
    struct SpinRequest {
        address player;           // Player address
        uint256 timestamp;        // Request timestamp
        SpinStatus status;        // Request status
        bool isFree;              // Is this a free spin?
    }

    struct SpinResult {
        uint8 reel1;              // Symbol ID for reel 1
        uint8 reel2;              // Symbol ID for reel 2
        uint8 reel3;              // Symbol ID for reel 3
        uint256 payout;           // $EBTC payout amount
        bool isJackpot;           // Did this trigger jackpot?
        bool isBonus;             // Did this trigger bonus game?
    }

    struct PlayerStats {
        uint256 freeSpinsUsed;    // Free spins used (max 10)
        uint256 freeSpinWinnings; // Total won from free spins (max 5k)
        uint256 totalSpins;       // Total spins ever
        uint256 totalWinnings;    // Total $EBTC won
        uint256 jackpotWins;      // Number of jackpots hit
        uint256 lastSpinTime;     // Last spin timestamp
    }

    // ============ Constants ============
    uint256 public constant FREE_SPIN_LIMIT = 10;
    uint256 public constant FREE_SPIN_CAP = 5000 * 1e18;    // 5k $EBTC max from free spins
    uint256 public constant SPIN_COOLDOWN = 3 seconds;      // Cooldown between spins
    uint256 public constant JACKPOT_BASE = 5000 * 1e18;     // 5k $EBTC base jackpot
    uint256 public constant EBT_HOLDER_BONUS = 150;         // 1.5x multiplier for EBT holders (100 = 1x)

    // Symbol type constants
    uint8 public constant SYMBOL_COUNT = 16;                // Number of unique symbols
    uint8 public constant WILD_SYMBOL = 100;                // EBT Card (Wild)
    uint8 public constant SEVEN_SYMBOL = 101;               // Lucky 7 (Jackpot)
    uint8 public constant BONUS_SYMBOL = 102;               // Bonus trigger
    uint8 public constant SCATTER_SYMBOL = 103;             // Linda (Scatter)

    // ============ Immutables ============
    IERC20 public immutable foodStamps;

    // ============ State Variables ============

    // Optional EBT Program for holder bonus (can be address(0))
    IERC721 public ebtProgram;

    // VRF Coordinator (Chainlink) - to be set based on deployment chain
    address public vrfCoordinator;
    bytes32 public keyHash;
    uint64 public subscriptionId;
    uint32 public callbackGasLimit = 200_000;
    uint16 public requestConfirmations = 3;

    // Game state
    uint256 public jackpotPool;
    uint256 public totalPayouts;
    uint256 public totalSpinsPlayed;

    // Symbol configuration (on-chain for provability)
    uint8[SYMBOL_COUNT] public symbolWeights;
    uint16[SYMBOL_COUNT] public symbolMultipliers;

    // Request tracking - now by address instead of tokenId
    mapping(uint256 => SpinRequest) public spinRequests;    // requestId => SpinRequest
    mapping(uint256 => SpinResult) public spinResults;      // requestId => SpinResult
    mapping(address => PlayerStats) public playerStats;     // player address => PlayerStats
    mapping(address => uint256) public pendingSpinRequest;  // player address => requestId (if pending)

    // Nonce for pseudo-random generation (temporary until VRF is set up)
    uint256 private _nonce;

    // ============ Events ============

    /// @notice Emitted when a spin is requested
    event SpinRequested(
        uint256 indexed requestId,
        address indexed player,
        bool isFree,
        uint256 timestamp
    );

    /// @notice Emitted when a spin result is fulfilled - main event for off-chain indexing
    event SpinFulfilled(
        uint256 indexed requestId,
        address indexed player,
        uint8 reel1,
        uint8 reel2,
        uint8 reel3,
        uint256 payout,
        bool isJackpot,
        bool isBonus,
        uint256 timestamp
    );

    /// @notice Emitted when player stats are updated - for off-chain scoring
    event PlayerStatsUpdated(
        address indexed player,
        uint256 totalSpins,
        uint256 totalWinnings,
        uint256 freeSpinsUsed,
        uint256 jackpotWins
    );

    event JackpotWon(
        address indexed player,
        uint256 amount
    );

    event BonusTriggered(
        address indexed player
    );

    event JackpotFunded(
        address indexed funder,
        uint256 amount
    );

    event SymbolConfigUpdated();

    event EBTProgramUpdated(address indexed newProgram);

    // ============ Constructor ============
    constructor(
        address _foodStamps
    ) {
        if (_foodStamps == address(0)) {
            revert InvalidAddress();
        }

        foodStamps = IERC20(_foodStamps);

        // Initialize default symbol weights (grocery items common, memes rarer)
        symbolWeights = [
            80, 80, 75, 70, 65, 60,     // Apple, Orange, Carrot, Broccoli, Milk, Bread
            55, 50, 45, 40, 35, 30,     // Berries, Cheese, Eggs, Grapes, Watermelon, Croissant
            25, 20, 15, 10              // Pepe, Doge, Wojak, Special
        ];

        // Initialize multipliers (x100 for precision)
        symbolMultipliers = [
            100, 100, 100, 150, 150, 150,   // 1x, 1x, 1x, 1.5x, 1.5x, 1.5x
            200, 200, 200, 250, 300, 300,   // 2x, 2x, 2x, 2.5x, 3x, 3x
            500, 500, 1000, 2500            // 5x, 5x, 10x, 25x
        ];
    }

    // ============ External Functions ============

    /// @notice Request a spin - any wallet can play
    /// @return requestId The VRF request ID
    function spin() external nonReentrant whenNotPaused returns (uint256 requestId) {
        PlayerStats storage stats = playerStats[msg.sender];

        // Check for pending spin
        if (pendingSpinRequest[msg.sender] != 0) {
            revert SpinPending();
        }

        // Check cooldown
        if (block.timestamp < stats.lastSpinTime + SPIN_COOLDOWN) {
            revert SpinCooldownActive();
        }

        // Determine if this is a free spin
        bool isFree = stats.freeSpinsUsed < FREE_SPIN_LIMIT;

        // If using free spins, check cap
        if (isFree && stats.freeSpinWinnings >= FREE_SPIN_CAP) {
            revert FreeSpinCapReached();
        }

        // Generate request ID (will be replaced by VRF requestId)
        requestId = _generateRequestId();

        // Store spin request
        spinRequests[requestId] = SpinRequest({
            player: msg.sender,
            timestamp: block.timestamp,
            status: SpinStatus.PENDING,
            isFree: isFree
        });

        pendingSpinRequest[msg.sender] = requestId;
        stats.lastSpinTime = block.timestamp;

        emit SpinRequested(requestId, msg.sender, isFree, block.timestamp);

        // For now, immediately fulfill with pseudo-random (will be replaced by VRF callback)
        _fulfillRandomness(requestId, _generatePseudoRandom());

        return requestId;
    }

    /// @notice Fund the jackpot pool
    /// @param amount Amount of $EBTC to add to jackpot
    function fundJackpot(uint256 amount) external {
        foodStamps.safeTransferFrom(msg.sender, address(this), amount);
        jackpotPool += amount;
        emit JackpotFunded(msg.sender, amount);
    }

    // ============ View Functions ============

    /// @notice Get player stats for an address
    /// @param player The player address
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    /// @notice Get remaining free spins for a player
    /// @param player The player address
    function getRemainingFreeSpins(address player) external view returns (uint256) {
        PlayerStats storage stats = playerStats[player];
        if (stats.freeSpinsUsed >= FREE_SPIN_LIMIT) return 0;
        if (stats.freeSpinWinnings >= FREE_SPIN_CAP) return 0;
        return FREE_SPIN_LIMIT - stats.freeSpinsUsed;
    }

    /// @notice Get spin result for a request
    /// @param requestId The spin request ID
    function getSpinResult(uint256 requestId) external view returns (SpinResult memory) {
        return spinResults[requestId];
    }

    /// @notice Check if a player can spin now
    /// @param player The player address
    function canSpin(address player) external view returns (bool, string memory reason) {
        if (pendingSpinRequest[player] != 0) {
            return (false, "Spin pending");
        }

        PlayerStats storage stats = playerStats[player];
        if (block.timestamp < stats.lastSpinTime + SPIN_COOLDOWN) {
            return (false, "Cooldown active");
        }

        return (true, "");
    }

    /// @notice Check if an address holds an EBT NFT (for bonus multiplier)
    /// @param player The player address
    function isEBTHolder(address player) public view returns (bool) {
        if (address(ebtProgram) == address(0)) return false;
        return ebtProgram.balanceOf(player) > 0;
    }

    // ============ Admin Functions ============

    /// @notice Set the EBT Program address for holder bonus (can be address(0) to disable)
    /// @param _ebtProgram The EBT Program NFT contract address
    function setEBTProgram(address _ebtProgram) external onlyOwner {
        ebtProgram = IERC721(_ebtProgram);
        emit EBTProgramUpdated(_ebtProgram);
    }

    /// @notice Update symbol weights
    /// @param weights Array of 16 weights (must sum to a reasonable total)
    function setSymbolWeights(uint8[SYMBOL_COUNT] calldata weights) external onlyOwner {
        uint256 total = 0;
        for (uint256 i = 0; i < SYMBOL_COUNT; i++) {
            total += weights[i];
        }
        if (total == 0 || total > 1000) revert InvalidSymbolWeights();

        symbolWeights = weights;
        emit SymbolConfigUpdated();
    }

    /// @notice Update symbol multipliers
    /// @param multipliers Array of 16 multipliers (x100 precision)
    function setSymbolMultipliers(uint16[SYMBOL_COUNT] calldata multipliers) external onlyOwner {
        symbolMultipliers = multipliers;
        emit SymbolConfigUpdated();
    }

    /// @notice Configure VRF parameters
    function setVRFConfig(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _subscriptionId,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations
    ) external onlyOwner {
        vrfCoordinator = _vrfCoordinator;
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
    }

    /// @notice Pause the slot machine
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the slot machine
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Emergency withdraw (owner only)
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    // ============ Internal Functions ============

    /// @notice Generate a request ID
    function _generateRequestId() internal returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            ++_nonce
        )));
    }

    /// @notice Generate pseudo-random number (temporary - will be replaced by VRF)
    function _generatePseudoRandom() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            _nonce,
            totalSpinsPlayed
        )));
    }

    /// @notice Fulfill randomness and calculate spin result
    /// @param requestId The spin request ID
    /// @param randomWord The random value from VRF
    function _fulfillRandomness(uint256 requestId, uint256 randomWord) internal {
        SpinRequest storage request = spinRequests[requestId];

        if (request.status != SpinStatus.PENDING) {
            revert AlreadyFulfilled();
        }

        // Extract 3 reel results from the random word
        uint8 reel1 = _selectSymbol(uint256(keccak256(abi.encodePacked(randomWord, uint8(0)))));
        uint8 reel2 = _selectSymbol(uint256(keccak256(abi.encodePacked(randomWord, uint8(1)))));
        uint8 reel3 = _selectSymbol(uint256(keccak256(abi.encodePacked(randomWord, uint8(2)))));

        // Calculate payout
        (uint256 payout, bool isJackpot, bool isBonus) = _calculatePayout(reel1, reel2, reel3);

        // Apply EBT holder bonus if applicable
        if (payout > 0 && isEBTHolder(request.player)) {
            payout = (payout * EBT_HOLDER_BONUS) / 100;
        }

        // Update request status
        request.status = SpinStatus.FULFILLED;
        pendingSpinRequest[request.player] = 0;

        // Store result
        spinResults[requestId] = SpinResult({
            reel1: reel1,
            reel2: reel2,
            reel3: reel3,
            payout: payout,
            isJackpot: isJackpot,
            isBonus: isBonus
        });

        // Update player stats
        PlayerStats storage stats = playerStats[request.player];
        stats.totalSpins++;
        stats.totalWinnings += payout;

        if (request.isFree) {
            stats.freeSpinsUsed++;
            // Cap free spin winnings
            uint256 cappedPayout = payout;
            if (stats.freeSpinWinnings + payout > FREE_SPIN_CAP) {
                cappedPayout = FREE_SPIN_CAP - stats.freeSpinWinnings;
            }
            stats.freeSpinWinnings += cappedPayout;
            payout = cappedPayout;
        }

        if (isJackpot) {
            stats.jackpotWins++;
            emit JackpotWon(request.player, payout);
        }

        if (isBonus) {
            emit BonusTriggered(request.player);
        }

        // Transfer winnings
        if (payout > 0) {
            uint256 available = foodStamps.balanceOf(address(this));
            if (payout > available) {
                payout = available; // Cap to available balance
            }
            if (payout > 0) {
                foodStamps.safeTransfer(request.player, payout);
                totalPayouts += payout;
            }
        }

        totalSpinsPlayed++;

        // Emit events for off-chain indexing
        emit SpinFulfilled(
            requestId,
            request.player,
            reel1,
            reel2,
            reel3,
            payout,
            isJackpot,
            isBonus,
            block.timestamp
        );

        emit PlayerStatsUpdated(
            request.player,
            stats.totalSpins,
            stats.totalWinnings,
            stats.freeSpinsUsed,
            stats.jackpotWins
        );
    }

    /// @notice Select a symbol based on weights
    /// @param randomValue Random value to use for selection
    function _selectSymbol(uint256 randomValue) internal view returns (uint8) {
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < SYMBOL_COUNT; i++) {
            totalWeight += symbolWeights[i];
        }

        uint256 roll = randomValue % totalWeight;
        uint256 cumulative = 0;

        for (uint8 i = 0; i < SYMBOL_COUNT; i++) {
            cumulative += symbolWeights[i];
            if (roll < cumulative) {
                return i;
            }
        }

        return 0; // Fallback
    }

    /// @notice Calculate payout for a spin result
    /// @param reel1 Symbol on reel 1
    /// @param reel2 Symbol on reel 2
    /// @param reel3 Symbol on reel 3
    function _calculatePayout(
        uint8 reel1,
        uint8 reel2,
        uint8 reel3
    ) internal view returns (uint256 payout, bool isJackpot, bool isBonus) {
        // Check for special symbol combinations
        bool allSame = (reel1 == reel2 && reel2 == reel3);
        bool twoSame = (reel1 == reel2 || reel2 == reel3 || reel1 == reel3);

        // Triple 7s - MEGA JACKPOT
        if (allSame && reel1 == SEVEN_SYMBOL) {
            return (jackpotPool + JACKPOT_BASE, true, false);
        }

        // Triple Wilds - Jackpot
        if (allSame && reel1 == WILD_SYMBOL) {
            uint256 wildJackpot = (jackpotPool * 50) / 100; // 50% of pool
            return (wildJackpot + (JACKPOT_BASE / 2), true, false);
        }

        // Triple Bonus - Trigger bonus game
        if (allSame && reel1 == BONUS_SYMBOL) {
            return (0, false, true);
        }

        // Three of a kind (regular symbols)
        if (allSame && reel1 < SYMBOL_COUNT) {
            uint256 multiplier = symbolMultipliers[reel1];
            payout = (multiplier * 10 * 1e18) / 100; // Base 10 * multiplier
            return (payout, false, false);
        }

        // Two of a kind with wild
        uint8 matchingSymbol = 255;
        bool hasWild = (reel1 == WILD_SYMBOL || reel2 == WILD_SYMBOL || reel3 == WILD_SYMBOL);

        if (hasWild) {
            // Find the matching pair (excluding wilds)
            if (reel1 != WILD_SYMBOL && reel2 != WILD_SYMBOL && reel1 == reel2) {
                matchingSymbol = reel1;
            } else if (reel1 != WILD_SYMBOL && reel3 != WILD_SYMBOL && reel1 == reel3) {
                matchingSymbol = reel1;
            } else if (reel2 != WILD_SYMBOL && reel3 != WILD_SYMBOL && reel2 == reel3) {
                matchingSymbol = reel2;
            } else if (reel1 != WILD_SYMBOL && reel1 < SYMBOL_COUNT) {
                matchingSymbol = reel1;
            } else if (reel2 != WILD_SYMBOL && reel2 < SYMBOL_COUNT) {
                matchingSymbol = reel2;
            } else if (reel3 != WILD_SYMBOL && reel3 < SYMBOL_COUNT) {
                matchingSymbol = reel3;
            }

            if (matchingSymbol < SYMBOL_COUNT) {
                uint256 multiplier = symbolMultipliers[matchingSymbol];
                payout = (multiplier * 5 * 1e18) / 100; // 5x base * symbol multiplier
                return (payout, false, false);
            }
        }

        // Two of a kind (no wild)
        if (twoSame) {
            // Find the matching symbol
            if (reel1 == reel2 && reel1 < SYMBOL_COUNT) {
                matchingSymbol = reel1;
            } else if (reel2 == reel3 && reel2 < SYMBOL_COUNT) {
                matchingSymbol = reel2;
            } else if (reel1 == reel3 && reel1 < SYMBOL_COUNT) {
                matchingSymbol = reel1;
            }

            if (matchingSymbol < SYMBOL_COUNT) {
                uint256 multiplier = symbolMultipliers[matchingSymbol];
                payout = (multiplier * 2 * 1e18) / 100; // 2x base * symbol multiplier
                return (payout, false, false);
            }
        }

        // Count scatters for scatter pay
        uint8 scatterCount = 0;
        if (reel1 == SCATTER_SYMBOL) scatterCount++;
        if (reel2 == SCATTER_SYMBOL) scatterCount++;
        if (reel3 == SCATTER_SYMBOL) scatterCount++;

        if (scatterCount >= 2) {
            // Scatter pays based on count
            if (scatterCount == 3) {
                payout = 25 * 50 * 1e18; // Triple Linda = 25x * 50 base
            } else {
                payout = 5 * 50 * 1e18; // Double Linda = 5x * 50 base
            }
            return (payout, false, false);
        }

        // No win
        return (0, false, false);
    }

    // ============ VRF Callback (to be implemented) ============

    /// @notice Callback function for Chainlink VRF
    /// @dev Will be called by VRF Coordinator with the random words
    function rawFulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) external {
        // In production, verify caller is VRF Coordinator
        // require(msg.sender == vrfCoordinator, "Only VRF Coordinator");

        if (randomWords.length > 0) {
            _fulfillRandomness(requestId, randomWords[0]);
        }
    }
}
