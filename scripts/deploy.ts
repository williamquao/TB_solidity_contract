import { ethers } from "ethers";
import dotenv from "dotenv";
import hre from "hardhat";

dotenv.config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY as string;
  const provider = new ethers.AlchemyProvider(
    process.env.TESTNET,
    process.env.APIKEY
  );

  let wallet = new ethers.Wallet(privateKey, provider);

  let tbImplementationArtifacts = await hre.artifacts.readArtifact("TBImpl");
  let tbProxyArtifacts = await hre.artifacts.readArtifact("TBProxy");

  const implementation = new ethers.ContractFactory(
    tbImplementationArtifacts.abi,
    tbImplementationArtifacts.bytecode,
    wallet
  );

  const impl = await implementation.deploy();
  await impl.waitForDeployment();
  console.log("impl deployed to: ", impl.target);

  const TBProxy = new ethers.ContractFactory(
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
