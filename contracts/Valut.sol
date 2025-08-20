// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
contract Vault is ReentrancyGuard {
    using SafeERC20 for IERC20;
    address public owner;
    uint256 public unlockTime;
    uint256 public constant LOCK_DURATION = 1 minutes;  // 365 days
    event WithdrawnETH(address indexed to, uint256 amount);
    event WithdrawnToken(address indexed token, address indexed to, uint256 amount);
    event UnlockTimeExtended(uint256 newUnlockTime);
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }
    modifier afterUnlock() {
        require(block.timestamp >= unlockTime, "Vault is still locked");
        _;
    }
    constructor() {
        owner = msg.sender;
        unlockTime = block.timestamp + LOCK_DURATION;
    }
    // 提取 ETH
    function withdrawETH() external onlyOwner afterUnlock nonReentrant {
        uint256 amount = address(this).balance;
        (bool success, ) = owner.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit WithdrawnETH(owner, amount);
    }
    // 提取 ERC20 代币（使用 SafeERC20）
    function withdrawToken(address token) external onlyOwner afterUnlock nonReentrant {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner, balance);
        emit WithdrawnToken(token, owner, balance);
    }
    // 延长锁定期
    function extendLock() external onlyOwner afterUnlock {
        unlockTime = block.timestamp + LOCK_DURATION;
        emit UnlockTimeExtended(unlockTime);
    }
    // 接收 ETH
    receive() external payable {}
    fallback() external payable {}
}