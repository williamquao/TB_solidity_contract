const ethers = require("ethers");
require("dotenv").config();
const implementationAbi = "../implementation_abi.js";
const proxyContractAddress = process.env.PROXY_CONTRACT;
const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_URL);

class ProxyContractHandler {
  constructor(privateKey) {
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

  async callImplementationFunction(functionName, functionParams) {
    const result = await this.proxy[functionName](...functionParams);
    console.log("Function Result:", result);

    return result;
  }
}
