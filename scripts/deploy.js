const hre = require("hardhat");

async function main() {

  let tbImplementationArtifacts = await hre.artifacts.readArtifact("TBImpl");
  let tbProxyArtifacts = await hre.artifacts.readArtifact("TBProxy");

  const implementation =  hre.ethers.ContractFactory(
    tbImplementationArtifacts.abi,
    tbImplementationArtifacts.bytecode,
    wallet
  );

  const impl = await implementation.deploy();
  await impl.waitForDeployment();
  console.log("impl deployed to: ", impl.target);

  const TBProxy = hre.ethers.ContractFactory(
    tbProxyArtifacts.abi,
    tbProxyArtifacts.bytecode,
    wallet
  );
  const tbProxy = await TBProxy.deploy(impl.target);

  await tbProxy.waitForDeployment();

  console.log("impl Proxy deployed to: ", tbProxy.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
