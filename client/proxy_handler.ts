import { ethers } from "hardhat";
import dotenv from "dotenv";
import implementationAbi from "../implementationAbi.json";

dotenv.config();

const proxyContractAddress = process.env.PROXY_CONTRACT as string;

export class ProxyContractHandler {
  private proxyContract;

  constructor() {
    (async () => {
      const MyContract = await ethers.getContractFactory("TBImpl");
      this.proxyContract = MyContract.attach(proxyContractAddress);
    })();
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
