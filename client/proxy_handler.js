const ethers = require("ethers");
require("dotenv").config();
const implementationAbi = "../implementation_abi.js";
const proxyContractAddress = "0xYourContractAddress";

export class ProxyContractHandler {
  constructor(privateKey) {
    this.wallet = new ethers.Wallet(privateKey);
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

  async callImplementationFunction(functionName, functionParams) {
    const result = await this.proxy[functionName](...functionParams);
    console.log("Function Result:", result);

    return result;
  }
}
