const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tokenized bonds Test", () => {
  let tbContract;
  let tbProxyContract;
  let tbImplementationContract;
  let signers;

  const invalidAddress = "0x0000000000000000000000000000000000000000";

  before(async () => {
    signers = await hre.ethers.getSigners();

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
    it("should deploy Tokenized bond proxy contract", async () => {
      expect(tbProxyContract).to.not.be.undefined;
      expect(tbProxyContract).to.be.a("string");
      expect(tbProxyContract).to.not.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });
  });

  describe("Test bond creation", () => {
    it("should fail if caller is not contract owner", async () => {
      try {
        const bondParam = {
          initialSupply: 100000,
          maturityDate: 1740058156,
          name: "jane bond",
          minter: signers[3].getAddress(),
        };

        await tbContract
          .connect(signers[2])
          .createBond(
            bondParam.initialSupply,
            bondParam.maturityDate,
            bondParam.name,
            bondParam.minter
          );
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("OwnableUnauthorizedAccount");
      }
    });

    it("should fail if minter address is invalid", async () => {
      try {
        const bondParam = {
          initialSupply: 100000,
          maturityDate: 1740058156,
          name: "CMR BOND",
          minter: signers[3].getAddress(),
        };
        await tbContract.createBond(
          bondParam.initialSupply,
          bondParam.maturityDate,
          bondParam.name,
          invalidAddress
        );
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain(
          "Address is invalid and Supply below 0"
        );
      }
    });

    it("should fail if maturity date is below present date", async () => {
      try {
        const bondParam = {
          initialSupply: 100000,
          maturityDate: 123,
          name: "CMR BOND",
          minter: signers[3].getAddress(),
        };
        await tbContract.createBond(
          bondParam.initialSupply,
          bondParam.maturityDate,
          bondParam.name,
          bondParam.minter
        );
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain(
          "Maturity date must be above current time"
        );
      }
    });

    it("should fail if initial supply is 0", async () => {
      try {
        const bondParam = {
          initialSupply: 100000,
          maturityDate: 1740058156,
          name: "CMR BOND",
          minter: signers[3].getAddress(),
        };
        await tbContract.createBond(
          0,
          bondParam.maturityDate,
          bondParam.name,
          bondParam.minter
        );
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain(
          "Address is invalid and Supply below 0"
        );
      }
    });

    it("should successfully create Bond", async () => {
      const bondParam = {
        initialSupply: 100000,
        maturityDate: 1740058156,
        name: "CMR BOND",
        minter: signers[3].getAddress(),
      };
      const newBond = await tbContract.createBond(
        bondParam.initialSupply,
        bondParam.maturityDate,
        bondParam.name,
        bondParam.minter
      );

      expect(newBond.hash).to.not.undefined;
      expect(newBond.hash).to.be.a("string");
    });

    it("should fail if trying to recreate an existing bond", async () => {
      try {
        const bondParam = {
          initialSupply: 100000,
          maturityDate: 1740058156,
          name: "CMR BOND",
          minter: signers[3].getAddress(),
        };

        await tbContract.createBond(
          bondParam.initialSupply,
          bondParam.maturityDate,
          bondParam.name,
          bondParam.minter
        );
        expect.fail("Expected a revert");
      } catch (error) {
        expect(error.message).to.contain("Bond already exist");
      }
    });
  });
});
