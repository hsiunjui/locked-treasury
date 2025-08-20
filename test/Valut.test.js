const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
  let Vault, vault, owner, addr1, Token, token;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    // 部署 ERC20 测试代币
    Token = await ethers.getContractFactory("ERC20Mock");
    token = await Token.deploy(
      "Test Token",
      "TT",
      owner.address,
      ethers.utils.parseEther("1000")
    );
    await token.deployed();

    // 部署 Vault
    Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.deployed();
  });

  it("should set correct owner and unlockTime", async function () {
    expect(await vault.owner()).to.equal(owner.address);
    const unlockTime = await vault.unlockTime();
    expect(unlockTime).to.be.gt(0);
  });

  it("should receive ETH", async function () {
    await owner.sendTransaction({ to: vault.address, value: ethers.utils.parseEther("1") });
    const balance = await ethers.provider.getBalance(vault.address);
    expect(balance).to.equal(ethers.utils.parseEther("1"));
  });

  it("should not allow withdrawal before unlock", async function () {
    await owner.sendTransaction({ to: vault.address, value: ethers.utils.parseEther("1") });

    await expect(vault.withdrawETH()).to.be.revertedWith("Vault is still locked");
    await expect(vault.withdrawToken(token.address)).to.be.revertedWith("Vault is still locked");
  });

  it("should allow owner to withdraw ETH after unlock", async function () {
    await owner.sendTransaction({ to: vault.address, value: ethers.utils.parseEther("1") });

    // increase time
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine");

    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
    const tx = await vault.withdrawETH();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerBalanceAfter).to.equal(
      ownerBalanceBefore.add(ethers.utils.parseEther("1")).sub(gasUsed)
    );
  });

  it("should allow owner to withdraw ERC20 token after unlock", async function () {
    // 给 Vault 转 token
    await token.transfer(vault.address, ethers.utils.parseEther("100"));

    // increase time
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine");

    await vault.withdrawToken(token.address);
    expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1000")); 
    // 原本 1000 + Vault 100 = 1100，但 ERC20Mock 初始化给 owner 1000，Vault 扣 100，提现后 owner 总计 1100
  });

  it("should not allow non-owner to withdraw", async function () {
    await owner.sendTransaction({ to: vault.address, value: ethers.utils.parseEther("1") });

    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine");

    await expect(vault.connect(addr1).withdrawETH()).to.be.revertedWith("Only owner can call");
    await expect(vault.connect(addr1).withdrawToken(token.address)).to.be.revertedWith("Only owner can call");
  });

  it("should allow owner to extend lock", async function () {
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine");

    const tx = await vault.extendLock();
    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === "UnlockTimeExtended");
    expect(event).to.not.be.undefined;

    const newUnlockTime = await vault.unlockTime();
    expect(newUnlockTime).to.be.gt(Math.floor(Date.now() / 1000));
  });
});
