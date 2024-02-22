const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = require("ethers");

describe("Tokenized bonds Test", () => {
  let tbContract;
  let tbProxyContract;
  let tbImplementationContract;
  let signers;
  const bondId = BigInt(
    "94728191037934580968850183277756393853664353133092476056182456800137316456183"
  );

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
        minter: signers[1].getAddress(),
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
          bondId
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

  describe("Bond transfer from minter to User", () => {
    it("should fail if bondId does't exist", async () => {
      const nonExistentBondId = 123;
      const userAddress = "0xDC5B997B6aF291FDD575De44fd89205BbBAeF8da";
      await expect(
        tbContract.deposit(nonExistentBondId, 5000, userAddress)
      ).to.rejectedWith("Bond doesn't exist");
    });

    it("should fail if sender is not minter", async () => {
      const userAddress = "0xDC5B997B6aF291FDD575De44fd89205BbBAeF8da";
      await expect(
        tbContract.connect(signers[2]).deposit(bondId, 5000, userAddress)
      ).to.rejectedWith("Caller is not minter");
    });
    it("should fail if bond is paused", async () => {
      await tbContract.pauseBond(bondId);
      const userAddress = "0xDC5B997B6aF291FDD575De44fd89205BbBAeF8da";
      await expect(
        tbContract.connect(signers[1]).deposit(bondId, 5000, userAddress)
      ).to.rejectedWith("Bond is paused");
    });

    it("should fail if amount is not in multiple of unit price", async () => {
      await tbContract.resumeBond(bondId);
      const userAddress = "0xDC5B997B6aF291FDD575De44fd89205BbBAeF8da";
      await expect(
        tbContract.connect(signers[1]).deposit(bondId, 5200, userAddress)
      ).to.rejectedWith("Amount must be in multiples of unit price");
    });

    it("should fail if sending more than account balance", async () => {
      const userAddress = "0xDC5B997B6aF291FDD575De44fd89205BbBAeF8da";
      await expect(
        tbContract.connect(signers[1]).deposit(bondId, 50000000, userAddress)
      ).to.rejectedWith("Insufficient balance");
    });

    it("should successfully deposit asset to user", async () => {
      const userAddress = "0xDC5B997B6aF291FDD575De44fd89205BbBAeF8da";
      const deposit = await tbContract
        .connect(signers[1])
        .deposit(bondId, 5000, userAddress);
      expect(deposit.hash).to.not.be.undefined;
      expect(deposit.hash).to.be.a("string");
    });

    it("should successfully do a bulk deposit to various users", async () => {
      const user1 = await signers[5].getAddress();
      const user2 = await signers[6].getAddress();

      const depositsTuples = [
        { bondId, amount: 5000, user: user1 },
        { bondId, amount: 2000, user: user2 },
      ];

      const deposit = await tbContract
        .connect(signers[1])
        .depositBulk(depositsTuples);
      expect(deposit.hash).to.not.be.undefined;
      expect(deposit.hash).to.be.a("string");
    });
  });

  describe("Bond withdraw by Users", () => {
    it("should fail if bondId does't exist", async () => {
      const nonExistentBondId = 123;
      await expect(
        tbContract.connect(signers[5]).withdraw(nonExistentBondId, 5000)
      ).to.rejectedWith("Bond doesn't exist");
    });

    it("should fail if bond is paused", async () => {
      await tbContract.pauseBond(bondId);
      await expect(
        tbContract.connect(signers[5]).withdraw(bondId, 5000)
      ).to.rejectedWith("Bond is paused");
    });

    it("should fail if amount to withdraw is not in multiple of unit price", async () => {
      await tbContract.resumeBond(bondId);
      await expect(
        tbContract.connect(signers[5]).withdraw(bondId, 2300)
      ).to.rejectedWith("Amount must be in multiples of unit price");
    });

    it("should fail if insufficient balance", async () => {
      await expect(
        tbContract.connect(signers[5]).withdraw(bondId, 20000000)
      ).to.rejectedWith("Insufficient balance");
    });
  });
});
