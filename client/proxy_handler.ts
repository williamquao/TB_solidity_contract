import { ethers } from "hardhat";

const proxyContractAddress = process.env.PROXY_CONTRACT as string;
const provider = new ethers.AlchemyProvider(
  process.env.TESTNET,
  process.env.APIKEY
);

export class ProxyContractHandler {
  private wallet: ethers.Wallet;
  private proxyContract: ethers.Contract;

  constructor(privateKey: string) {
    this.wallet = new ethers.Wallet(privateKey, provider);
    this.proxyContract = new ethers.Contract(
      proxyContractAddress,
      implementationAbi,
      this.wallet
    );
  }

  //* This function is used upgrade TB contract implementation
  //! Only contract owner can make this call
  async upgradeImplementation(
    newImplementationAddress: string
  ): Promise<string> {
    const transaction = await this.proxyContract.upgradeImpl(
      newImplementationAddress
    );
    await transaction.wait();

    return transaction?.hash;
  }

  //* This function is used to make TB_implementation contract function calls through proxy contract
  async callImplementationFunction(functionName: string, params: any) {
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

// module.exports = { ProxyContractHandler };
