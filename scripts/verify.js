require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const vaultAddress = process.env.CONTRACT_ADDRESS;
  const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
  if (!vaultAddress) {
    console.error("Please set CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }

  console.log("Verifying Vault at address:", vaultAddress);

  try {
    await hre.run("verify:verify", {
      address: vaultAddress,
      constructorArguments: [tokenContractAddress],
    });
    console.log("Verification successful!");
  } catch (err) {
    console.error("Verification failed:", err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
