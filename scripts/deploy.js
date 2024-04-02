const { ethers } = require("hardhat");

async function main() {

  const impl = await ethers.deployContract("TBImpl");
  await impl.waitForDeployment();
  console.log("impl deployed to: ", impl.target);
  const tbProxy = await ethers.deployContract("TBProxy", [impl.target]);

  await tbProxy.waitForDeployment();

  console.log("impl Proxy deployed to: ", tbProxy.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
