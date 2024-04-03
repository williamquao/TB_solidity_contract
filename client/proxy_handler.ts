const ethers = require("hardhat");

const proxyContractAddress = process.env.PROXY_CONTRACT as string;

export class ProxyContractHandler {
  private connectedProxyContract;

  constructor(privateKey: string) {
    (async () => {
      const MyContract = await ethers.getContractFactory("TBImpl");
      const proxyContract =  MyContract.attach(proxyContractAddress);
      this.connectedProxyContract = await proxyContract.connect(privateKey)

    })();
  }

  //* This function is used upgrade TB contract implementation
  //! Only contract owner can make this call
  async upgradeImplementation(
    newImplementationAddress: string
  ): Promise<string> {
    const transaction = await this.connectedProxyContract.upgradeImpl(
      newImplementationAddress
    );
    await transaction.wait();

    return transaction?.hash;
  }

  //* This function is used to make TB_implementation contract function calls through proxy contract
  async callImplementationFunction(functionName: string, params: any) {
    let result;

    if (typeof params === "object") {
      result = await this.connectedProxyContract[functionName](...Object.values(params));
    } else {
      result = await this.connectedProxyContract[functionName](params);
    }

    await result.wait();

    return result;
  }
}
