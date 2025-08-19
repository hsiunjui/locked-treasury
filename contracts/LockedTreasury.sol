// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// 本合约满足：
// 1) 可接收原生ETH（receive/payable）。
// 2) 可接收任意ERC20代币（通过 approve 后的 depositToken 或者直接转入合约地址）。
// 3) 仅允许向部署者(owner)转账/提取；
// 4) 从部署时刻起，余额整体锁定1小时，锁定期内不可向外转出ETH或代币。

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LockedTreasury is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable owner;          // 部署者地址（唯一可接收转出的地址）
    uint256 public immutable deployedAt;     // 部署区块时间戳
    uint256 public constant LOCK_DURATION = 1 hours; // 锁定时长

    event EthReceived(address indexed from, uint256 amount);
    event TokenDeposited(address indexed token, address indexed from, uint256 amount);
    event EthWithdrawn(address indexed to, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // 仅在锁定结束后允许转出（ETH/Token）
    modifier unlocked() {
        require(block.timestamp >= deployedAt + LOCK_DURATION, "Balance locked");
        _;
    }

    constructor() {
        owner = msg.sender;
        deployedAt = block.timestamp;
    }

    // 可直接接收ETH（转账或selfdestruct等均可触发）
    receive() external payable {
        emit EthReceived(msg.sender, msg.value);
    }

    // 兜底回退：如果携带ETH也记录事件
    fallback() external payable {
        if (msg.value > 0) {
            emit EthReceived(msg.sender, msg.value);
        }
    }

    // 主动存入ERC20：在调用前，发送方需对本合约进行approve
    function depositToken(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit TokenDeposited(token, msg.sender, amount);
    }

    // === 仅能向部署者(owner)转账 ===
    // 提取指定数量ETH到owner（仅在解锁后）
    function withdrawETH(uint256 amount) external onlyOwner unlocked nonReentrant {
        require(amount > 0, "amount=0");
        (bool ok, ) = owner.call{ value: amount }("");
        require(ok, "ETH transfer failed");
        emit EthWithdrawn(owner, amount);
    }

    // 提取合约全部ETH到owner（仅在解锁后）
    function withdrawAllETH() external onlyOwner unlocked nonReentrant {
        uint256 bal = address(this).balance;
        (bool ok, ) = owner.call{ value: bal }("");
        require(ok, "ETH transfer failed");
        emit EthWithdrawn(owner, bal);
    }

    // 提取指定数量ERC20到owner（仅在解锁后）
    function withdrawToken(address token, uint256 amount) external onlyOwner unlocked nonReentrant {
        require(amount > 0, "amount=0");
        IERC20(token).safeTransfer(owner, amount);
        emit TokenWithdrawn(token, owner, amount);
    }

    // 提取某种ERC20的全部余额到owner（仅在解锁后）
    function withdrawAllToken(address token) external onlyOwner unlocked nonReentrant {
        uint256 bal = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner, bal);
        emit TokenWithdrawn(token, owner, bal);
    }

    // 工具函数：查看解锁时间与当前锁定状态
    function lockExpiresAt() external view returns (uint256) {
        return deployedAt + LOCK_DURATION;
    }

    function isLocked() external view returns (bool) {
        return block.timestamp < deployedAt + LOCK_DURATION;
    }
}
