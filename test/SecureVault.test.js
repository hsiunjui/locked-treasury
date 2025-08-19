const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecureVault", function () {
  let vault, owner, other, token;

  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("SecureVault", owner);
    vault = await Vault.deploy();

    // 部署一个测试 ERC20
    const TestToken = await ethers.getContractFactory("ERC20Mock", owner);
    token = await TestToken.deploy("MockToken", "MTK", owner.address, 1000n * 10n ** 18n);
  });

  it("初始 unlockTime 正确", async () => {
    const now = await ethers.provider.getBlock("latest").then(b => b.timestamp);
    const unlockTime = await vault.unlockTime();
    expect(unlockTime).to.be.closeTo(now + 60, 2); // 因为LOCK_DURATION=1 minutes
  });

  it("未到时间不能提取 ETH", async () => {
    await owner.sendTransaction({ to: vault.address, value: ethers.parseEther("1") });
    await expect(vault.withdrawETH()).to.be.revertedWith("Vault is still locked");
  });

  it("到期后可以提取 ETH", async () => {
    await owner.sendTransaction({ to: vault.address, value: ethers.parseEther("1") });

    // 时间快进
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine");

    const beforeBalance = await ethers.provider.getBalance(owner.address);
    const tx = await vault.withdrawETH();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const afterBalance = await ethers.provider.getBalance(owner.address);
    expect(afterBalance).to.be.gt(beforeBalance - gasUsed);
  });

  it("提取 Token 正常", async () => {
    // 转 Token 到 Vault
    await token.transfer(vault.target, 1000);
    // 时间快进
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine");
    await vault.withdrawToken(token.target);
    expect(await token.balanceOf(owner.address)).to.equal(1000n * 10n ** 18n);
  });

  it("非 owner 无法调用", async () => {
    await expect(vault.connect(other).extendLock()).to.be.revertedWith("Only owner can call");
  });

  it("extendLock 修改 unlockTime", async () => {
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine");
    const tx = await vault.extendLock();
    await tx.wait();
    const now = await ethers.provider.getBlock("latest").then(b => b.timestamp);
    expect(await vault.unlockTime()).to.be.closeTo(now + 60, 2);
  });
});
