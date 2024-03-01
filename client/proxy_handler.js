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

  //* This function is used upgrade TB contract implementation
  //! Only contract owner can make this call
  async upgradeImplementation(newImplementationAddress) {
    const transaction = await this.proxyContract.upgradeImpl(
      newImplementationAddress
    );
    await transaction.wait();

    return transaction?.hash;
  }

  //* This function is used to make TB_implementation contract function calls through proxy contract
  async callImplementationFunction(functionName, params) {
    let result;

    if (typeof params === "object") {
      result = await this.proxyContract[functionName](...Object.values(params));
    } else {
      result = await this.proxyContract[functionName](params);
    }

    await result.wait();

    return result;
  }
}

module.exports = { ProxyContractHandler };
