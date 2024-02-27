const ethers = require("ethers");
require("dotenv").config();
const implementationAbi = require("../implementationAbi");

const proxyContractAddress = process.env.PROXY_CONTRACT;
const provider = new ethers.AlchemyProvider(
  process.env.TESTNET,
  process.env.APIKEY
);

class ProxyContractHandler {
  constructor(privateKey) {
    this.wallet = new ethers.Wallet(privateKey, provider);
    this.proxyContract = new ethers.Contract(
      proxyContractAddress,
      implementationAbi,
      this.wallet
    );
  }

  async upgradeImplementation(newImplementationAddress) {
    const transaction = await this.proxyContract.upgradeImpl(
      newImplementationAddress
    );
    await transaction.wait();

    console.log("Upgrade successful");
    return transaction?.hash;
  }

  async callImplementationFunction(functionName, params) {
    let result;

    if (typeof params === "object") {
      result = await this.proxyContract[functionName](...Object.values(params));
    } else {
      result = await this.proxyContract[functionName](params);
    }

    await result.wait();
    console.log(`${functionName} Result:`, result);

    return result;
  }
}

module.exports = { ProxyContractHandler };
