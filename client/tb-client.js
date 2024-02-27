require("dotenv").config();

export class TBClient {
  constructor(privateKey) {
    this.proxyContractHandler = new ProxyContractHandler(privateKey);
  }

  /**
   * bondParam
   * @param {number} initialSupply - The total supply of the bond
   * @param {timestamp} maturityDate - The bond maturity date
   * @param {string} name - The name of the bond
   * @param {string} name - The minter of the bond
   * @returns {string, string} -The operation hash and bondId
   */
  async createBond(bondParam) {
    try {
      const { initialSupply, maturityDate, name, minter } = bondParam;
      const functionName = "createBond";
      const newBond =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondParam
        );

      const operationTrx = await newBond?.hash;

      const filter =
        this.proxyContractHandler.proxyContract.filters.BondCreated(
          minter,
          null,
          maturityDate,
          initialSupply
        );
      let events;

      events = await this.proxyContractHandler.proxyContract.queryFilter(
        filter
      );

      const bondId = events[0]?.args[4].toString();
      return { operationTrx, bondId };
    } catch (e) {
      return "Operation failed";
    }
  }

  /**
   * depositParam
   * @param {bigInt} bondId - The tokenized bond id
   * @param {number} amount - The amount to deposit to user
   * @param {string} receiver - The address of the user
   * @returns {string} - The operation hash
   */
  async deposit(depositParam) {
    try {
      const functionName = "deposit";
      const deposit =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          depositParam
        );
      const operationTrx = await deposit?.hash;
      return operationTrx;
    } catch (error) {
      return "Operation failed";
    }
  }

  /**
   * depositParamList
   * @param {Array<{ bondId: bigInt, amount: number, receiver: string }>} depositParamList
   * @returns {string} - The operation hash
   */
  async bulkDeposit(depositParamList) {
    try {
      const functionName = "depositBulk";
      const deposit =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          depositParamList
        );
      const operationTrx = await deposit?.hash;
      return operationTrx;
    } catch (error) {
      return "Operation failed";
    }
  }

  /**
   * withdrawParam
   * @param {bigInt} bondId - The tokenized bond id
   * @param {number} amount - The amount to deposit to user
   * @returns {string} - The operation hash
   */
  async withdraw(withdrawParam) {
    try {
      const functionName = "withdraw";
      const withdraw =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          withdrawParam
        );
      const operationTrx = await withdraw?.hash;
      return operationTrx;
    } catch (error) {
      return "Operation failed";
    }
  }

  /**
   * minterParam
   * @param {bigInt} bondId - The tokenized bond id
   * @param {string} newMinter - The new tokenized bond minter
   * @returns {string} - The operation hash
   */
  async replaceMinter(minterParam) {
    try {
      const functionName = "updateBondMinter";
      const replaceMinter =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          minterParam
        );
      const operationTrx = await replaceMinter?.hash;
      return operationTrx;
    } catch (error) {
      return "Operation failed";
    }
  }

  /**
   * minterParam
   * @description dd
   * @param {Array<{ bondId: bigInt, newMinter: string }>} replaceMinterParamList
   * @returns {string} - The operation hash
   */
  async replaceMintBulk(replaceMinterParamList) {
    try {
      const functionName = "replaceMintBulk";
      const replaceMintBulk =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          replaceMinterParamList
        );
      const operationTrx = await replaceMintBulk?.hash;
      return operationTrx;
    } catch (error) {
      return "Operation failed";
    }
  }

  /**
   * @param {bigInt} bondId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async removeMint(bondId) {
    try {
      const functionName = "removeMint";
      const removeMint =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondId
        );
      const operationTrx = await removeMint?.hash;
      return operationTrx;
    } catch (error) {
      return "Operation failed";
    }
  }

  /**
   * @param {bigInt} bondId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async pauseBond(bondId) {
    try {
      const functionName = "pauseBond";
      const pauseBond =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondId
        );
      const operationTrx = await pauseBond?.hash;
      return operationTrx;
    } catch (error) {
      return "Operation failed";
    }
  }

  /**
   * @param {bigInt} bondId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async resumeBond(bondId) {
    try {
      const functionName = "resumeBond";
      const resumeBond =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondId
        );
      const operationTrx = await resumeBond?.hash;
      return operationTrx;
    } catch (error) {
      return "Operation failed";
    }
  }

  /**
   * @param {bigInt} bondId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async resumeBond(bondId) {
    try {
      const functionName = "resumeBond";
      const resumeBond =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondId
        );
      const operationTrx = await resumeBond?.hash;
      return operationTrx;
    } catch (error) {
      return "Operation failed";
    }
  }

  /**
   * @param {bigInt} bondId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async enableInterTransfer(bondId) {
    try {
      const functionName = "enableInterTransfer";
      const enableInterTransfer =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondId
        );
      const operationTrx = await enableInterTransfer?.hash;
      return operationTrx;
    } catch (error) {
      return "Operation failed";
    }
  }

  /**
   * @param {bigInt} bondId - The tokenized bond id
   * @returns {string} - The operation hash
   */
  async disableInterTransfer(bondId) {
    try {
      const functionName = "disableInterTransfer";
      const disableInterTransfer =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          bondId
        );
      const operationTrx = await disableInterTransfer?.hash;
      return operationTrx;
    } catch (error) {
      return "Operation failed";
    }
  }

  /**
   * transferParam
   * @param {bigInt} bondId - The tokenized bond id
   * @param {number} amount - The amount transferred
   * @param {string} receiver - The receiver address
   * @returns {string} - The operation hash
   */
  async transferBondAmongUsers(transferParam) {
    try {
      const functionName = "transferBondAmongUsers";
      const transferBondAmongUsers =
        await this.proxyContractHandler.callImplementationFunction(
          functionName,
          transferParam
        );
      const operationTrx = await transferBondAmongUsers?.hash;
      return operationTrx;
    } catch (error) {
      return "Operation failed";
    }
  }
}
