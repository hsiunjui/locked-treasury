async function main() {
  const ONE_HOUR = 60 * 60;
  const unlockTime = Math.floor(Date.now() / 1000) + ONE_HOUR;

  const lockedAmount = ethers.parseEther("0.01"); // 部署时锁定 0.01 ETH

  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

  // ethers v6 等待部署
  await lock.waitForDeployment();

  console.log(`✅ Lock deployed to: ${await lock.getAddress()}`);
  console.log(`Unlock timestamp: ${unlockTime}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});