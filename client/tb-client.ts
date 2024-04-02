import { ProxyContractHandler } from "./proxy_handler";
import { MintBond, Minter, OperatorParam, Transfer } from "../dto/tb.dto";

export class TBClient {
  private proxyContractHandler;

  constructor() {
    this.proxyContractHandler = new ProxyContractHandler();
  }

  /**
   * //* This function is used to create new bonds
     //! Only contract minters can make this call
   * bondParam
   * @param {number} interestRate - The interest rate of the bond
   * @param {number} tokenId - The token id of the bond
   * @param {timestamp} expirationDate - The bond maturity date
   * @param {number} amount - The stock of the bond
   * @returns {string} -The operation hash
   */

  async mintBond(bondParam: MintBond): Promise<string> {
    try {
      const functionName = "mint";
      const newBond =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondParam
        );

      const hash = await newBond?.hash;

      return hash;
    } catch (e) {
      return "Operation failed: " + e;
    }
  }

  /**
   * //* This function is used to transfer tokens
   * @param {Array<Transfer>} depositParamList
   * @returns {string} - The operation hash
   */
  async transfer(transfers: Array<Transfer>): Promise<string> {
    try {
      const functionName = "makeTransfer";
      const deposit =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          transfers
        );

      const hash: string = await deposit?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to replace a bond minter
     //! Only Contract owner can make this call
   * @param {string} OldMinter - The previous tokenized bond minter
   * @param {string} newMinter - The new tokenized bond minter
   * @returns {string} - The operation hash
   */
  async replaceMinter(minter: Minter): Promise<string> {
    try {
      const functionName = "replaceMinter";
      const replaceMinter =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          minter
        );
      const hash = await replaceMinter?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to add a minter
     //! Only Contract owner can make this call
   * @param {string} Minter - New minter
   * @returns {string} - The operation hash
   */
  async addMinter(minter: string): Promise<string> {
    try {
      const functionName = "addMinter";
      const replaceMinter =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          minter
        );
      const hash = await replaceMinter?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to remove a minter 
    //! Only Contract owner can make this call
   * @param {string} Minter - New minter
   * @returns {string} - The operation hash
   */
  async removeMinter(minter: string): Promise<string> {
    try {
      const functionName = "removeMinter";
      const removeMint =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          minter
        );
      const hash: string = await removeMint?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to pause contract
    //! Only Contract owner can make this call
   * @returns {string} - The operation hash
   */
  async pause(): Promise<string> {
    try {
      const functionName = "pause";
      const pause = await this.proxyContractHandler.callImplementationFunction(
        functionName
      );
      const hash: string = await pause?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to resume contract
    //! Only Contract owner can make this call
   * @returns {string} - The operation hash
   */
  async resume(): Promise<string> {
    try {
      const functionName = "resume";
      const resume = await this.proxyContractHandler.callImplementationFunction(
        functionName
      );
      const hash: string = await resume?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to enable bond inter-transfer amongst users
     //! Only Contract owner can make this call
   * @param {number} tokenId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async resumeInterTransfer(tokenId: number): Promise<string> {
    try {
      const functionName = "resumeInterTransfer";
      const resumeInterTransfer =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          tokenId
        );
      const hash: string = await resumeInterTransfer?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
     * //* This function is used to disable bond inter-transfer amongst users
       //! Only Contract owner can make this call
     * @param {number} tokenId - The tokenized bond id
     * @returns {string} - The operation hash
     */
  async pauseInterTransfer(tokenId: number): Promise<string> {
    try {
      const functionName = "pauseInterTransfer";
      const pauseInterTransfer =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          tokenId
        );
      const hash: string = await pauseInterTransfer?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to enable bond inter-transfer after expiry 
     //! Only Contract owner can make this call
   * @param {number} tokenId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async resumeItrAfterExpiry(tokenId: number): Promise<string> {
    try {
      const functionName = "resumeItrAfterExpiry";
      const resumeItrAfterExpiry =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          tokenId
        );
      const hash: string = await resumeItrAfterExpiry?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
 * //* This function is used to disable bond inter-transfer after expiry 
   //! Only Contract owner can make this call
  * @param {number} tokenId - The tokenized bond id
  * @returns {string} - The operation hash
  */
  async pauseItrAfterExpiry(tokenId: number): Promise<string> {
    try {
      const functionName = "pauseItrAfterExpiry";
      const pauseItrAfterExpiry =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          tokenId
        );
      const hash: string = await pauseItrAfterExpiry?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to set minter as operator
     //! Only Contract owner can make this call
   * @param {number} tokenId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async setMinterAsOperator(tokenId: number): Promise<string> {
    try {
      const functionName = "setMinterAsOperator";
      const setMinterAsOperator =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          tokenId
        );
      const hash: string = await setMinterAsOperator?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to unset minter as operator
     //! Only Contract owner can make this call
    * @param {number} tokenId - The tokenized bond id
    * @returns {string} - The operation hash
    */
  async unsetMinterAsOperator(tokenId: number): Promise<string> {
    try {
      const functionName = "unsetMinterAsOperator";
      const unsetMinterAsOperator =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          tokenId
        );
      const hash: string = await unsetMinterAsOperator?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to unfreeze a tokenized bond
     //! Only Contract owner can make this call
   * @param {bigInt} tokenId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async freezeToken(tokenId: BigInt): Promise<string> {
    try {
      const functionName = "freezeToken";
      const freezeToken =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          tokenId
        );
      const hash: string = await freezeToken?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to resume a unfreeze a tokenized bond
     //! Only Contract owner can make this call
   * @param {bigInt} tokenId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async unfreezeToken(tokenId: BigInt): Promise<string> {
    try {
      const functionName = "unfreezeToken";
      const unfreezeToken =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          tokenId
        );
      const hash: string = await unfreezeToken?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  async updateOperators(operators: OperatorParam[]): Promise<string> {
    try {
      const functionName = "updateOperators";
      const updateOperators =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          operators
        );
      const hash: string = await updateOperators?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  async updateOperatorsForAll(operators: string[]): Promise<string> {
    try {
      const functionName = "updateOperatorsForAll";
      const updateOperatorsForAll =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          operators
        );
      const hash: string = await updateOperatorsForAll?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }
}
