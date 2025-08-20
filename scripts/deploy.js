const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;

  console.log("Deploying Vault with account:", deployer.address);
  // console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // 获取合约工厂
  const Vault = await ethers.getContractFactory("Vault");

  // 部署合约（ethers v6 方式）
  const vault = await Vault.deploy(tokenContractAddress); // 部署立即生效

  // 可选：等待区块确认
  await vault.waitForDeployment();

  console.log("Vault deployed to:", vault.target); // v6 中用 target 获取地址
  console.log("Vault unlockTime:", (await vault.unlockTime()).toString());
}



main().catch((error) => {
  console.error(error);
  process.exit(1);
});
