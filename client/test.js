const { ProxyContractHandler } = require("./proxy_handler");
const hre = require("hardhat");

async function exampleUsage() {
  let tbImplementationArtifacts = await hre.artifacts.readArtifact("TBImpl");
  const privateKey = process.env.PRIVATE_KEY;
  const tbClient = new ProxyContractHandler(
    privateKey,
    tbImplementationArtifacts.abi
  );

  // Example: Create a bond through the proxy
  const bondParam = {
    initialSupply: 1000, // Replace with the actual initial supply value
    maturityDate: 1735689600, // Replace with the actual maturity date (Unix timestamp)
    name: "MyBond",
    minter: "0x40C5537f8b415099278021C5fAaB68989b757e4D", // Replace with the actual minter address
  };
  console.log(tbClient);

  await tbClient.callImplementationFunction("createBond", bondParam);
}

// Call the example usage
exampleUsage();
