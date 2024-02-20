const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tokenized bonds Test", () => {
  let tbContract;
  let tbProxyContract;
  let tbImplementationContract;
  before(async () => {
    // deploy implementation contract
    const TBImpl = await ethers.getContractFactory("TBImpl");
    const tbImpl = await TBImpl.deploy();

    await tbImpl.waitForDeployment();
    tbImplementationContract = tbImpl.target;

    // deploy implementation proxy contract
    const ProxyTBImpl = await ethers.getContractFactory("TBProxy");
    const proxyTBImpl = await ProxyTBImpl.deploy(tbImplementationContract);
    await proxyTBImpl.waitForDeployment();

    tbProxyContract = proxyTBImpl.target;

    // attach proxy to implementation
    tbContract = TBImpl.attach(tbProxyContract);
  });

  describe("Test deployment", async () => {
    it("should deploy Tokenized bond implementation contract", async () => {
      expect(tbImplementationContract).to.not.be.undefined;
      expect(tbImplementationContract).to.be.a("string");
      expect(tbImplementationContract).to.not.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });
  });
});
