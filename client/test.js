const { ProxyContractHandler } = require("./proxy_handler");
const hre = require("hardhat");
const ethers = require("ethers");
const abi = require("../implementationAbi");

async function test() {
  let tbImplementationArtifacts = await hre.artifacts.readArtifact("TBImpl");
  const privateKey = process.env.PRIVATE_KEY;
  const provider = new ethers.AlchemyProvider(
    process.env.TESTNET,
    process.env.APIKEY
  );

  const tbClient = new ProxyContractHandler(privateKey, abi);
  console.log(JSON.stringify(abi));

  const proxyContractAddress = process.env.PROXY_CONTRACT;

  //   this.wallet = new ethers.Wallet(privateKey, provider);
  //   const contract = new ethers.Contract(
  //     proxyContractAddress,
  //     tbImplementationArtifacts.abi,
  //     this.wallet
  //   );

  //Create a bond through the proxy
  const bondParam = {
    initialSupply: 100000, // Replace with the actual initial supply value
    maturityDate: 1735689600, // Replace with the actual maturity date (Unix timestamp)
    name: "JKBond", //Replace this with the actual bond name
    minter: "0x40C5537f8b415099278021C5fAaB68989b757e4D", // Replace with the actual minter address
  };

  //   await tbClient.callImplementationFunction("createBond", bondParam);

  const filter = tbClient.proxyContract.filters.BondCreated(
    bondParam.minter,
    null,
    bondParam.maturityDate,
    bondParam.initialSupply
  );
  let events;
  try {
    events = await tbClient.proxyContract.queryFilter(filter);
    console.log("events: ", events);

    console.log("events: ", events[0].args);
    console.log("bondId: ", events[0].args[4].toString());
  } catch (e) {
    console.log("failed to create: ", e);
  }
}

test();
