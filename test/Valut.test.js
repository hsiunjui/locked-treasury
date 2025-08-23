const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const {
  NEW_OWNER,
  impersonateNewOwner,
  increaseTime,
  setNextBlockTimestamp,
} = require("./utils");
const { deployVaultAndToken } = require("./fixtures");

describe("Vault Contract", function () {
  let vault, token, owner, user, newOwnerSigner;

  beforeEach(async function () {
    ({ vault, token, owner, user } = await loadFixture(deployVaultAndToken));
    newOwnerSigner = await impersonateNewOwner();
  });

  it("部署时应设置 unlockTime 并且 owner 是 deployer", async function () {
    const unlockTime = await vault.connect(owner).getUnlockTime();
    expect(unlockTime).to.be.a("bigint");
  });

  it("只有 owner 可以调用 withdrawETH", async function () {
    await expect(vault.connect(user).withdrawETH()).to.be.revertedWith("ONLY OWNER");
  });

  it("withdrawETH 应该可以提取合约里的 ETH", async function () {
    await increaseTime(3600);

    const balanceBefore = await ethers.provider.getBalance(owner.address);
    await expect(vault.connect(owner).withdrawETH()).to.emit(vault, "WithdrawnETH");
    const balanceAfter = await ethers.provider.getBalance(owner.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("withdrawToken 在解锁前应该失败", async function () {
    await token.transfer(vault.target, ethers.parseEther("10"));

    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("0.01"),
    });

    const now = (await ethers.provider.getBlock("latest")).timestamp;
    await setNextBlockTimestamp(now + 24 * 3600);

    await expect(
      vault.connect(newOwnerSigner).withdrawToken(token.target)
    ).to.be.revertedWith("VALUT LOCK");
  });

  it("充值 ETH 会延长锁定时间", async function () {
    const unlockBefore = await vault.connect(owner).getUnlockTime();

    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("0.01"),
    });

    const unlockAfter = await vault.connect(newOwnerSigner).getUnlockTime();
    expect(unlockAfter).to.be.gt(unlockBefore);
  });

  it("锁定时间不会超过 MAX_LOCK", async function () {
    const hugeValue = ethers.parseEther("100");
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: hugeValue,
    });

    const unlockAfter = await vault.connect(newOwnerSigner).getUnlockTime();
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const maxUnlock = BigInt(now) + BigInt(1024 * 24 * 3600);
    expect(unlockAfter).to.equal(maxUnlock);
  });

  it("withdrawToken 会把 owner 切换到 newOwner 并 emit", async function () {
    await token.transfer(vault.target, ethers.parseEther("10"));

    await increaseTime(3600);

    await expect(vault.connect(owner).withdrawToken(token.target))
      .to.emit(vault, "OwnerChanged");
  });

  it("新 owner 可以成功取出 Token", async function () {
    await token.transfer(vault.target, ethers.parseEther("10"));

    await expect(vault.connect(owner).withdrawToken(token.target))
      .to.emit(vault, "OwnerChanged");

    await expect(vault.connect(newOwnerSigner).withdrawToken(token.target))
      .to.emit(vault, "WithdrawnToken");
  });

  it("非 owner 无法调用 withdrawToken", async function () {
    await token.transfer(vault.target, ethers.parseEther("10"));

    await increaseTime(3600);

    await expect(
      vault.connect(user).withdrawToken(token.target)
    ).to.be.revertedWith("ONLY OWNER");
  });
});
