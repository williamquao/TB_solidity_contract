const { expect } = require("chai");
const TBClient = require("../client/tb-client");
require("dotenv").config();

describe("Tokenized Bond Test", () => {
  let bondId;
  // before(() => {

  // });

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
    bondId = newBond?.bondId;
    console.log(newBond);
    expect(newBond.hash).to.not.be.undefined;
    expect(newBond.hash).to.be.a("string");
  });

  it("should make a deposit", async () => {
    const privateKey = process.env.PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const depositParam = {
      bondId,
      amount: 5000,
      receiver: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    };
    const deposit = await tbClient.deposit(depositParam);
    console.log(deposit);
    expect(deposit.hash).to.not.be.undefined;
    expect(deposit.hash).to.be.a("string");
  });

  it("should make a bulk deposit", async () => {
    const privateKey = process.env.MINTER_PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const depositParamList = [
      {
        bondId,
        amount: 1000,
        receiver: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      },
      {
        bondId,
        amount: 8000,
        receiver: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      },
    ];
    const bulkDeposit = await tbClient.bulkDeposit(depositParamList);
    console.log(bulkDeposit);
    expect(bulkDeposit.hash).to.not.be.undefined;
    expect(bulkDeposit.hash).to.be.a("string");
  });

  it("should make a withdraw", async () => {
    const privateKey = process.env.USER_PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const withdrawParam = {
      bondId,
      amount: 2000,
    };
    const withdraw = await tbClient.withdraw(withdrawParam);
    console.log(withdraw);
    expect(withdraw.hash).to.not.be.undefined;
    expect(withdraw.hash).to.be.a("string");
  });

  it("should replace a minter", async () => {
    const privateKey = process.env.PRIVATE_KEY;
    const tbClient = new TBClient(privateKey);

    const minterParam = {
      bondId,
      newMinter: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    };
    const replaceMinter = await tbClient.replaceMinter(minterParam);
    console.log(replaceMinter);
    expect(replaceMinter.hash).to.not.be.undefined;
    expect(replaceMinter.hash).to.be.a("string");
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
    console.log(replaceMinter);
    expect(replaceMinter.hash).to.not.be.undefined;
    expect(replaceMinter.hash).to.be.a("string");
  });

  //   it("should pause a T-bond", async () => {
  //     const privateKey = process.env.PRIVATE_KEY;
  //     const tbClient = new TBClient(privateKey);

  //     const pauseBond = await tbClient.pauseBond(bondId);
  //     console.log(pauseBond);
  //     expect(pauseBond.hash).to.not.be.undefined;
  //     expect(pauseBond.hash).to.be.a("string");
  //   });

  //   it("should resume a T-bond", async () => {
  //     const privateKey = process.env.PRIVATE_KEY;
  //     const tbClient = new TBClient(privateKey);

  //     const resumeBond = await tbClient.resumeBond(bondId);
  //     console.log(resumeBond);
  //     expect(resumeBond.hash).to.not.be.undefined;
  //     expect(resumeBond.hash).to.be.a("string");
  //   });

  //   it("should enable inter-transfer of a T-bond", async () => {
  //     const privateKey = process.env.PRIVATE_KEY;
  //     const tbClient = new TBClient(privateKey);

  //     const enableInterTransfer = await tbClient.enableInterTransfer(bondId);
  //     console.log(enableInterTransfer);
  //     expect(enableInterTransfer.hash).to.not.be.undefined;
  //     expect(enableInterTransfer.hash).to.be.a("string");
  //   });

  //   it("should disable inter-transfer of a T-bond", async () => {
  //     const privateKey = process.env.PRIVATE_KEY;
  //     const tbClient = new TBClient(privateKey);

  //     const disableInterTransfer = await tbClient.disableInterTransfer(bondId);
  //     console.log(disableInterTransfer);
  //     expect(disableInterTransfer.hash).to.not.be.undefined;
  //     expect(disableInterTransfer.hash).to.be.a("string");
  //   });

  //   it("should disable inter-transfer of a T-bond", async () => {
  //     const privateKey = process.env.USER_PRIVATE_KEY;
  //     const tbClient = new TBClient(privateKey);

  //     const transferParam = {
  //       bondId,
  //       amount: 1000,
  //       newMinter: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  //     };
  //     const transferBondAmongUsers = await tbClient.transferBondAmongUsers(
  //       transferParam
  //     );
  //     console.log(transferBondAmongUsers);
  //     expect(transferBondAmongUsers.hash).to.not.be.undefined;
  //     expect(transferBondAmongUsers.hash).to.be.a("string");
  //   });
});
