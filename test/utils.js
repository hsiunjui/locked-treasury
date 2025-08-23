// 工具具函数 (impersonate, 增加时间, 转账等)
const { ethers, network } = require("hardhat");

const NEW_OWNER = "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2";

// 模拟 newOwner
async function impersonateNewOwner() {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [NEW_OWNER],
  });
  const signer = await ethers.getSigner(NEW_OWNER);
  await network.provider.send("hardhat_setBalance", [
    NEW_OWNER,
    "0x1000000000000000000",
  ]);
  return signer;
}

// 快进时间
async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine");
}

// 设置下一个区块时间
async function setNextBlockTimestamp(timestamp) {
  await network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  await network.provider.send("evm_mine");
}

module.exports = {
  NEW_OWNER,
  impersonateNewOwner,
  increaseTime,
  setNextBlockTimestamp,
};

