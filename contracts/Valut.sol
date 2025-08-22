// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Vault is ReentrancyGuard {

    using SafeERC20 for IERC20;
    address private owner;
    uint256 public unlockTime;
    uint256 private constant LOCK_DURATION = 1 minutes;  // or 365 days

    event WithdrawnETH(address indexed to, uint256 amount);
    event WithdrawnToken(address indexed token, address indexed to, uint256 amount);
    event UnlockTimeExtended(uint256 newUnlockTime);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY OWNER");
        _;
    }
    modifier afterUnlock() {
        require(block.timestamp >= unlockTime, "VALUT LOCK");
        _;
    }

    constructor() payable  {
        owner = msg.sender;
        unlockTime = block.timestamp + LOCK_DURATION;
    }
    // widthdral ETH
    function withdrawETH() external onlyOwner afterUnlock nonReentrant {
        uint256 amount = address(this).balance;
        require(amount > 0, "Zero ETH");
        (bool success, ) = owner.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit WithdrawnETH(owner, amount);
    }
    // withdraw Token
    function withdrawToken(address token) external onlyOwner afterUnlock nonReentrant {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "Zero Token");
        IERC20(token).safeTransfer(msg.sender, balance); // send Token
        emit WithdrawnToken(token, owner, balance);
    }
    // extend lock
    function extendLock() external onlyOwner afterUnlock {
        unlockTime = block.timestamp + LOCK_DURATION;
        emit UnlockTimeExtended(unlockTime);
    }
    // receive ETH
    receive() external payable {}
    fallback() external payable {}
}