const ethers = require("ether");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider(dotenv.pr);
const contractAddress = "0xYourContractAddress";
const contractAbi = "../proxy_abi.js";

let privateKey;
// const signer = new ethers.Wallet("yourPrivateKey", provider);
// const contract = new ethers.Contract(contractAddress, contractAbi, signer);

export class TBClient {
  constructor(privateKey) {
    this.proxyContractHandler = new ProxyContractHandler(privateKey);
  }

  async createBond() {}
}
