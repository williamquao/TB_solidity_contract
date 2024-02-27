const { ProxyContractHandler } = require("./proxy_handler");
const hre = require("hardhat");
const ethers = require("ethers");

async function test() {
  let tbImplementationArtifacts = await hre.artifacts.readArtifact("TBImpl");
  const privateKey = process.env.PRIVATE_KEY;
  const provider = new ethers.AlchemyProvider(
    process.env.TESTNET,
    process.env.APIKEY
  );

  const tbClient = new ProxyContractHandler(
    privateKey,
    tbImplementationArtifacts.abi
  );

  const proxyContractAddress = process.env.PROXY_CONTRACT;

  this.wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(
    proxyContractAddress,
    tbImplementationArtifacts.abi,
    this.wallet
  );

  //Create a bond through the proxy
  const bondParam = {
    initialSupply: 100000, // Replace with the actual initial supply value
    maturityDate: 1735689600, // Replace with the actual maturity date (Unix timestamp)
    name: "JKBond", //Replace this with the actual bond name
    minter: "0x40C5537f8b415099278021C5fAaB68989b757e4D", // Replace with the actual minter address
  };

  //   await tbClient.callImplementationFunction("createBond", bondParam);

  const filter = contract.filters.BondCreated(bondParam.minter); // Replace "YourEventName" with the actual event name
  let events;
  try {
    events = await contract.queryFilter(filter);
  } catch (e) {
    console.log("failed to create: ", e);
  }

  console.log("events: ", events);
}

test();
