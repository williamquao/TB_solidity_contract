const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = require("ethers");

describe("Tokenized bonds Test", () => {
  let tbContract;
  let tbProxyContract;
  let tbImplementationContract;
  let signers;

  const invalidAddress = "0x0000000000000000000000000000000000000000";

  before(async () => {
    signers = await hre.ethers.getSigners();

    // deploy implementation contract
    const TBImpl = await hre.ethers.getContractFactory("TBImpl");
    const tbImpl = await TBImpl.deploy();

    await tbImpl.waitForDeployment();
    tbImplementationContract = tbImpl.target;

    // deploy implementation proxy contract
    const ProxyTBImpl = await hre.ethers.getContractFactory("TBProxy");
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
      const bondParam = {
        initialSupply: 100000,
        maturityDate: 1740058156,
        name: "jane bond",
        minter: signers[3].getAddress(),
      };

      await expect(
        tbContract
          .connect(signers[2])
          .createBond(
            bondParam.initialSupply,
            bondParam.maturityDate,
            bondParam.name,
            bondParam.minter
          )
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should fail if minter address is invalid", async () => {
      const bondParam = {
        initialSupply: 100000,
        maturityDate: 1740058156,
        name: "CMR BOND",
        minter: signers[3].getAddress(),
      };
      await expect(
        tbContract.createBond(
          bondParam.initialSupply,
          bondParam.maturityDate,
          bondParam.name,
          invalidAddress
        )
      ).to.be.rejectedWith("Address is invalid and Supply below 0");
    });

    it("should fail if maturity date is below present date", async () => {
      const bondParam = {
        initialSupply: 100000,
        maturityDate: 123,
        name: "CMR BOND",
        minter: signers[3].getAddress(),
      };
      await expect(
        tbContract.createBond(
          bondParam.initialSupply,
          bondParam.maturityDate,
          bondParam.name,
          bondParam.minter
        )
      ).to.be.revertedWith("Maturity date must be above current time");
    });

    it("should fail if initial supply is 0", async () => {
      const bondParam = {
        initialSupply: 100000,
        maturityDate: 1740058156,
        name: "CMR BOND",
        minter: signers[3].getAddress(),
      };

      await expect(
        tbContract.createBond(
          0,
          bondParam.maturityDate,
          bondParam.name,
          bondParam.minter
        )
      ).to.be.revertedWith("Address is invalid and Supply below 0");
    });

    it("should successfully create Bond", async () => {
      const bondParam = {
        initialSupply: 100000,
        maturityDate: 1740058156,
        name: "CMR BOND",
        minter: signers[3].getAddress(),
      };

      await expect(
        tbContract
          .connect(signers[0])
          .createBond(
            bondParam.initialSupply,
            bondParam.maturityDate,
            bondParam.name,
            bondParam.minter
          )
      )
        .to.emit(tbContract, "BondCreated")
        .withArgs(
          bondParam.minter,
          bondParam.name,
          bondParam.maturityDate,
          BigInt(
            "94728191037934580968850183277756393853664353133092476056182456800137316456183"
          )
        );
    });

    it("should fail if trying to recreate an existing bond", async () => {
      const bondParam = {
        initialSupply: 100000,
        maturityDate: 1740058156,
        name: "CMR BOND",
        minter: signers[3].getAddress(),
      };

      await expect(
        tbContract.createBond(
          bondParam.initialSupply,
          bondParam.maturityDate,
          bondParam.name,
          bondParam.minter
        )
      ).to.be.rejectedWith("Bond already exist");
    });
  });
});
