// 部署 Vault 和 Token 的 fixture
const { ethers } = require("hardhat");

async function deployVaultAndToken() {
  const [owner, user] = await ethers.getSigners();

  // 部署 ERC20Mock
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const token = await ERC20Mock.deploy(
    "TestToken",
    "TT",
    owner.address,
    ethers.parseEther("1000")
  );
  await token.waitForDeployment();

  // 部署 Vault，并预存 1 ETH
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy({ value: ethers.parseEther("1") });
  await vault.waitForDeployment();

  return { vault, token, owner, user };
}

module.exports = {
  deployVaultAndToken,
};
