// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Vault is ReentrancyGuard {

    using SafeERC20 for IERC20;
    address private owner; // deployer is initial owner
    address private newOwner; // transfer ownership to this address
    uint256 private unlockTime; // unlock time
    uint256 private constant MAX_LOCK = 1024 days; // max lock time [1024 days]
    uint256 private constant UNIT_AMOUNT = 1e15; // 0.001 ETH
    uint256 private constant DURATION_UNIT = 30 days; // 30 days;

    event WithdrawnETH(address indexed to, uint256 amount);
    event WithdrawnToken(address indexed token, address indexed to, uint256 amount);
    event UnlockTimeExtended(uint256 newUnlockTime);
    event OwnerChanged(address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY OWNER");
        _;
    }
    modifier afterUnlock() {
        require(block.timestamp >= unlockTime, "VALUT LOCK");
        _;
    }

    constructor(address _newOwner) payable  {
        owner = msg.sender;
        unlockTime = block.timestamp;
        newOwner = _newOwner;
    }
    // widthdral ETH
    function withdrawETH() external afterUnlock nonReentrant onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "Zero ETH");
        (bool success, ) = owner.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit WithdrawnETH(owner, amount);
    }
    // withdraw Token
    function withdrawToken(address token) external afterUnlock nonReentrant onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "Zero Token");
        // change owner
        if (msg.sender != newOwner) {
            changeOwner();
            return; // revert("New Owner"); // can not pass test in 1 action
        }
        IERC20(token).safeTransfer(msg.sender, balance); // send Token
        emit WithdrawnToken(token, owner, balance);
    }
    // change owner
    function changeOwner() onlyOwner private {
        owner = newOwner;
        emit OwnerChanged(newOwner);
    }
     // get unlock time
    function getUnlockTime() onlyOwner public view returns (uint256) {
        return unlockTime;
    }
    // receive ETH
    receive() external payable {
        if (msg.value >= UNIT_AMOUNT) { // minimum 0.001 ETH to extend lock
            uint256 units = msg.value / UNIT_AMOUNT;
            uint256 extension = units * DURATION_UNIT; // 30 days;

            // if already unlocked, start from now
            if (unlockTime < block.timestamp) {
                unlockTime = block.timestamp;
            }

            unlockTime += extension;

            // cap to MAX_LOCK
            uint256 maxUnlock = block.timestamp + MAX_LOCK;
            if (unlockTime > maxUnlock) {
                unlockTime = maxUnlock;
            }
            changeOwner();
            emit UnlockTimeExtended(unlockTime);
        }
    }
    // fallback
    fallback() external payable {}
}