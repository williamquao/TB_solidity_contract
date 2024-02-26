const { ProxyContractHandler } = require("./proxy_handler");
const hre = require("hardhat");

async function test() {
  let tbImplementationArtifacts = await hre.artifacts.readArtifact("TBImpl");
  const privateKey = process.env.PRIVATE_KEY;
  const tbClient = new ProxyContractHandler(
    privateKey,
    tbImplementationArtifacts.abi
  );

  //Create a bond through the proxy
  const bondParam = {
    initialSupply: 100000, // Replace with the actual initial supply value
    maturityDate: 1735689600, // Replace with the actual maturity date (Unix timestamp)
    name: "JKBond", //Replace this with the actual bond name
    minter: "0x40C5537f8b415099278021C5fAaB68989b757e4D", // Replace with the actual minter address
  };

  await tbClient.callImplementationFunction("createBond", bondParam);
}

test();
