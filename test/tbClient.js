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
      initialSupply: 100000,
      maturityDate: 1735689600,
      name: "JKBond",
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

    const bondParam = {
      bondId,
      amount: 5000,
      receiver: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    };
    const deposit = await tbClient.createBond(bondParam);
    console.log(deposit);
    expect(deposit.hash).to.not.be.undefined;
    expect(deposit.hash).to.be.a("string");
  });
});
