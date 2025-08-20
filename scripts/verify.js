async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const unlockTime = process.env.UNLOCK_TIME;

  if (!contractAddress || !unlockTime) {
    throw new Error("请先在 .env 中设置 CONTRACT_ADDRESS 和 UNLOCK_TIME");
  }

  await hre.run("verify:verify", {
    address: contractAddress,
    constructorArguments: [unlockTime]
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});