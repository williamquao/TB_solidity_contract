const ethers = require("ethers");
require("dotenv").config();
let implementationAbi;
const proxyContractAddress = process.env.PROXY_CONTRACT;
const provider = new ethers.AlchemyProvider(
  process.env.TESTNET,
  process.env.APIKEY
);

class ProxyContractHandler {
  constructor(privateKey, abi) {
    implementationAbi = abi;
    this.wallet = new ethers.Wallet(privateKey, provider);
    this.proxy = new ethers.Contract(
      proxyContractAddress,
      implementationAbi,
      this.wallet
    );
  }

  async upgradeTo(newImplementationAddress) {
    const transaction = await this.proxy.upgradeTo(newImplementationAddress);
    await transaction.wait();

    console.log("Upgrade successful");
  }

  async callImplementationFunction(functionName, bondParam) {
    const { initialSupply, maturityDate, name, minter } = bondParam;

    const result = await this.proxy[functionName](
      initialSupply,
      maturityDate,
      name,
      minter
    );
    console.log("Function Result:", result);

    return result;
  }
}

module.exports = { ProxyContractHandler };
