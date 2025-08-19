const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "ETH");

  const SecureVault = await hre.ethers.getContractFactory("SecureVault");
  const vault = await SecureVault.deploy();

  await vault.waitForDeployment();
  console.log("SecureVault deployed to:", await vault.getAddress());

  const unlockTime = await vault.unlockTime();
  console.log("Unlock time (timestamp):", unlockTime.toString());
  console.log("Unlocks at:", new Date(Number(unlockTime) * 1000).toISOString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
