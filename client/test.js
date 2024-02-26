const { ProxyContractHandler } = require("./proxy_handler");

async function exampleUsage() {
  const privateKey = process.env.PRIVATE_KEY;
  const tbClient = new ProxyContractHandler(privateKey);

  // Example: Create a bond through the proxy
  const bondParam = {
    initialSupply: 1000, // Replace with the actual initial supply value
    maturityDate: 1735689600, // Replace with the actual maturity date (Unix timestamp)
    name: "MyBond",
    minter: "0x40C5537f8b415099278021C5fAaB68989b757e4D", // Replace with the actual minter address
  };

  await tbClient.createBond(bondParam);
}

// Call the example usage
exampleUsage();
