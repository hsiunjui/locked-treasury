require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/public", // 或者Alchemy等RPC
      accounts: [process.env.PRIVATE_KEY] // 部署用的钱包私钥（注意保护）
    }
  },
  etherscan: {
    apiKey: {
      sepolia: "YOUR_ETHERSCAN_API_KEY"
    }
  }
};
