// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
contract Vault is ReentrancyGuard {

    using SafeERC20 for IERC20;
    address private owner; // 合约所有者
    uint256 public unlockTime; // 锁定期结束时间（时间戳 - s）
    uint256 private constant LOCK_DURATION = 1 minutes;  // 锁定间隔 可以修改为 365 days
    address private ticketAddress; // 票据合约地址

    // 事件
    event WithdrawnETH(address indexed to, uint256 amount);
    event WithdrawnToken(address indexed token, address indexed to, uint256 amount);
    event UnlockTimeExtended(uint256 newUnlockTime);
    // 只允许合约所有者调用
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }
    // 只有在锁定期结束后才能调用
    modifier afterUnlock() {
        require(block.timestamp >= unlockTime, "Vault is still locked");
        _;
    }
    // 构造函数，初始化合约所有者、锁定时间和票据地址
    constructor(address ticket_address) {
        owner = msg.sender; // 设置合约所有者为部署者
        unlockTime = block.timestamp + LOCK_DURATION; // 设置初始锁定时间为当前时间加上锁定间隔
        ticketAddress = ticket_address; // 设置票据合约地址
    }
    // 提取 全部ETH
    function withdrawETH() external onlyOwner afterUnlock nonReentrant {
        uint256 amount = address(this).balance;
        require(amount > 0, "Zero ETH");
        (bool success, ) = owner.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit WithdrawnETH(owner, amount);
    }
    // 提取 ERC20 代币（使用 SafeERC20）,持有票据的用户可以提取,提取的数量为用户持有的票据数量或合约中代币余额的最小值
    function withdrawToken(address token) external afterUnlock nonReentrant {
        address sender = msg.sender; // 获取调用者地址
        uint256 balance = IERC20(token).balanceOf(address(this)); // 获取合约中指定代币的余额
        uint256 ticketBalance = IERC20(ticketAddress).balanceOf(address(this)); // 获取调用者在票据合约中的余额

        require(balance > 0, "Zero Token");
        require(ticketBalance > 0, "Zero Ticket");

        // 计算提取的数量，取合约余额和用户票据余额的最小值
        uint256 amount = balance < ticketBalance ? balance : ticketBalance;

        // 先转 ticket，再转 token
        IERC20(ticketAddress).safeTransfer(sender, amount);
        IERC20(token).safeTransfer(sender, amount);

        emit WithdrawnToken(token, sender, amount);
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