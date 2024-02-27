const { expect } = require("chai");
const { TBClient } = require("../client/tb-client");
require("dotenv").config();

describe("Tokenized Bond Test", () => {
  let bondId;

  it("should create a new bond", async () => {
    const privateKey = process.env.PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);
    const bondParam = {
      initialSupply: 1000000,
      maturityDate: 1735689600,
      name: "CMR Bond",
      minter: "0x40C5537f8b415099278021C5fAaB68989b757e4D",
    };
    const newBond = await tbClient.createBond(bondParam);
    bondId = BigInt(newBond?.bondId);
    expect(newBond.hash).to.not.be.undefined;
    expect(newBond.hash).to.be.a("string");
  });

  it("should make a deposit", async () => {
    const privateKey = process.env.MINTER_PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const depositParam = {
      bondId,
      amount: 5000,
      receiver: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    };
    const deposit = await tbClient.deposit(depositParam);
    expect(deposit).to.not.be.undefined;
    expect(deposit).to.be.a("string");
  });

  it("should make a bulk deposit", async () => {
    const privateKey = process.env.MINTER_PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);
    const depositParamList = [
      {
        bondId,
        amount: 15000,
        user: "0x25e11a136fA69E9AA4eE6A763bA643DA0D08E120",
      },
      {
        bondId,
        amount: 8000,
        user: "0x9Acb258AC76a757744A05D93FE7cE8E5dcb267A6",
      },
    ];
    const bulkDeposit = await tbClient.bulkDeposit(depositParamList);
    expect(bulkDeposit).to.not.be.undefined;
    expect(bulkDeposit).to.not.contain("Operation failed");
    expect(bulkDeposit).to.be.a("string");
  });

  it("should make a withdraw", async () => {
    const privateKey = process.env.USER_PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const withdrawParam = {
      bondId,
      amount: 2000,
    };
    const withdraw = await tbClient.withdraw(withdrawParam);
    expect(withdraw).to.not.be.undefined;
    expect(withdraw).to.not.contain("Operation failed");
    expect(withdraw).to.be.a("string");
  });

  it("should replace a minter", async () => {
    const privateKey = process.env.PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const minterParam = {
      bondId,
      newMinter: "0x9Acb258AC76a757744A05D93FE7cE8E5dcb267A6",
    };
    const replaceMinter = await tbClient.replaceMinter(minterParam);
    expect(replaceMinter).to.not.be.undefined;
    expect(replaceMinter).to.not.contain("Operation failed");
    expect(replaceMinter).to.be.a("string");
  });

  it("should replace minters from various bond", async () => {
    const privateKey = process.env.PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const replaceMinterParamList = [
      {
        bondId,
        newMinter: "0x40C5537f8b415099278021C5fAaB68989b757e4D",
      },
    ];
    const replaceMinter = await tbClient.replaceMintBulk(
      replaceMinterParamList
    );
    expect(replaceMinter).to.not.be.undefined;
    expect(replaceMinter).to.not.contain("Operation failed");
    expect(replaceMinter).to.be.a("string");
  });

  it("should pause a T-bond", async () => {
    const privateKey = process.env.PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const pauseBond = await tbClient.pauseBond(bondId);
    expect(pauseBond).to.not.be.undefined;
    expect(pauseBond).to.not.contain("Operation failed");
    expect(pauseBond).to.be.a("string");
  });

  it("should resume a T-bond", async () => {
    const privateKey = process.env.PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const resumeBond = await tbClient.resumeBond(bondId);
    expect(resumeBond).to.not.be.undefined;
    expect(resumeBond).to.not.contain("Operation failed");
    expect(resumeBond).to.be.a("string");
  });

  it("should enable inter-transfer of a T-bond", async () => {
    const privateKey = process.env.PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const enableInterTransfer = await tbClient.enableInterTransfer(bondId);
    expect(enableInterTransfer).to.not.be.undefined;
    expect(enableInterTransfer).to.not.contain("Operation failed");
    expect(enableInterTransfer).to.be.a("string");
  });

  it("should disable inter-transfer of a T-bond", async () => {
    const privateKey = process.env.PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const disableInterTransfer = await tbClient.disableInterTransfer(bondId);
    expect(disableInterTransfer).to.not.be.undefined;
    expect(disableInterTransfer).to.not.contain("Operation failed");
    expect(disableInterTransfer).to.be.a("string");
  });

  it("should disable inter-transfer of a T-bond", async () => {
    const privateKey = process.env.USER_PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const transferParam = {
      bondId,
      amount: 1000,
      newMinter: "0x25e11a136fA69E9AA4eE6A763bA643DA0D08E120",
    };
    const transferBondAmongUsers = await tbClient.transferBondAmongUsers(
      transferParam
    );
    expect(transferBondAmongUsers).to.not.be.undefined;
    expect(transferBondAmongUsers).to.not.contain("Operation failed");
    expect(transferBondAmongUsers).to.be.a("string");
  });
});
