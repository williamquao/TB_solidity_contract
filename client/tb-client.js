require("dotenv").config();

export class TBClient {
  constructor(privateKey) {
    this.proxyContractHandler = new ProxyContractHandler(privateKey);
  }

  async createBond(bondParam) {
    // const { initialSupply, maturityDate, name, minter } = bondParam;
    const functionName = "createBond";
    const result = await this.proxyContractHandler.callImplementationFunction(
      functionName,
      bondParam
    );
    console.log("CreateBond Result:", result);
    return result;
  }
}
