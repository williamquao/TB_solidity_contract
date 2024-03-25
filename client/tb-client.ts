import dotenv from "dotenv";
import { ProxyContractHandler } from "./proxy_handler";
import { Deposit, Minter, NewBond, Transfer, Withdraw } from "../dto/tb.dto";

dotenv.config();

export class TBClient {
  private proxyContractHandler;

  constructor(privateKey: string) {
    this.proxyContractHandler = new ProxyContractHandler(privateKey);
  }

  /**
   * //* This function is used to create new bonds
     //! Only contract owner can make this call
   * bondParam
   * @param {number} initialSupply - The total supply of the bond
   * @param {timestamp} maturityDate - The bond maturity date
   * @param {string} name - The name of the bond
   * @param {string} name - The minter of the bond
   * @returns {string, string} -The operation hash and bondId
   */

  async createBond(bond: NewBond): Promise<any> {
    try {
      const functionName = "createBond";
      const newBond =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bond
        );

      const hash = await newBond?.hash;

      const filter =
        this.proxyContractHandler.proxyContract.filters.BondCreated(
          bond.minter,
          null,
          bond.maturityDate,
          bond.initialSupply
        );

      const events = await this.proxyContractHandler.proxyContract.queryFilter(
        filter
      );

      const bondId = events[0]?.args[4].toString();
      return { hash, bondId };
    } catch (e) {
      return "Operation failed: " + e;
    }
  }

  /**
   * //* This function is used by minter to send bond tokens to user address
     //! Only bond minters can make this call
   * depositParam
   * @param {bigInt} bondId - The tokenized bond id
   * @param {number} amount - The amount to deposit to user
   * @param {string} receiver - The address of the user
   * @returns {string} - The operation hash
   */
  async deposit(depositParam: Deposit): Promise<string> {
    try {
      const functionName = "deposit";
      const deposit =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          depositParam
        );

      const hash: string = await deposit?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used used by minter to send bond tokens to various user addresses
     //! Only bond minters can make this call
   * depositParamList
   * @param {Array<{ bondId: bigInt, amount: number, receiver: string }>} depositParamList
   * @returns {string} - The operation hash
   */
  async bulkDeposit(deposits: Array<Deposit>): Promise<string> {
    try {
      const functionName = "depositBulk";
      const deposit =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          deposits
        );

      const hash: string = await deposit?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used by users to make a withdraw
   //!  Anyone with bond tokens can make this call
   * withdrawParam
   * @param {bigInt} bondId - The tokenized bond id
   * @param {number} amount - The amount to deposit to user
   * @returns {string} - The operation hash
   */
  async withdraw(withdrawParam: Withdraw): Promise<string>  {
    try {
      const functionName = "withdraw";
      const withdraw =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          withdrawParam
        );
      const hash: string = await withdraw?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to replace a bond minter
     //! Only Contract owner can make this call
   * minterParam
   * @param {bigInt} bondId - The tokenized bond id
   * @param {string} newMinter - The new tokenized bond minter
   * @returns {string} - The operation hash
   */
  async replaceMinter(minter: Minter): Promise<string>  {
    try {
      const functionName = "updateBondMinter";
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
   * //* This function is used to replace various bond minters
     //! Only Contract owner can make this call
   * replaceMinterParamList
   * @description dd
   * @param {Array<{ bondId: bigInt, newMinter: string }>} replaceMinterParamList
   * @returns {string} - The operation hash
   */
  async replaceMintBulk(replaceMinters: Array<Minter>): Promise<string>  {
    try {
      const functionName = "replaceMintBulk";
      const replaceMintBulk =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          replaceMinters
        );
      const hash = await replaceMintBulk?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to remove a minter from a bond
    //! Only Contract owner can make this call
   * @param {bigInt} bondId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async removeMint(bondId: number): Promise<string>  {
    try {
      const functionName = "removeMint";
      const removeMint =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondId
        );
      const hash: string = await removeMint?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to pause a bond
     //! Only Contract owner can make this call
   * @param {bigInt} bondId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async pauseBond(bondId: number): Promise<string>  {
    try {
      const functionName = "pauseBond";
      const pauseBond =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondId
        );
      const hash: string = await pauseBond?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to resume a paused bond
     //! Only Contract owner can make this call
   * @param {bigInt} bondId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async resumeBond(bondId: number): Promise<string>  {
    try {
      const functionName = "resumeBond";
      const resumeBond =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondId
        );
      const hash: string = await resumeBond?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to enable bond inter-transfer amongst users
     //! Only Contract owner can make this call
   * @param {bigInt} bondId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async enableInterTransfer(bondId: number): Promise<string>  {
    try {
      const functionName = "enableInterTransfer";
      const enableInterTransfer =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondId
        );
      const hash: string = await enableInterTransfer?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used to disable bond inter-transfer amongst users
     //! Only Contract owner can make this call
   * @param {bigInt} bondId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async disableInterTransfer(bondId: number): Promise<string>  {
    try {
      const functionName = "disableInterTransfer";
      const disableInterTransfer =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondId
        );
      const hash: string = await disableInterTransfer?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }

  /**
   * //* This function is used by users to inter-transfer bonds among themselves
     //! Anyone with bond tokens can make this call
   * transferParam
   * @param {bigInt} bondId - The tokenized bond id
   * @param {number} amount - The amount transferred
   * @param {string} receiver - The receiver address
   * @returns {string} - The operation hash
   */
  async transferBondAmongUsers(transfer: Transfer): Promise<string>  {
    try {
      const functionName = "transferBondAmongUsers";
      const transferBondAmongUsers =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          transfer
        );
      const hash: string = await transferBondAmongUsers?.hash;
      return hash;
    } catch (error) {
      return "Operation failed: " + error;
    }
  }
}

module.exports = { TBClient };
