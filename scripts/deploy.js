async function main() {
  const LockedTreasury = await ethers.getContractFactory("LockedTreasury");
  const treasury = await LockedTreasury.deploy();
  await treasury.deployed();

  console.log(`LockedTreasury deployed to: ${treasury.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});