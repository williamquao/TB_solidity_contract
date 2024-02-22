const { expect } = require("chai");
const { ethers } = require("hardhat");

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
    signers = await ethers.getSigners();

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

    // attach proxy to implementation contract
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
    it("should fail if bondId doesn't exist", async () => {
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
      const userAddress = signers[5].getAddress();
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
    it("should fail if bondId doesn't exist", async () => {
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

    it("should successfully withdraw", async () => {
      const withdraw = await tbContract
        .connect(signers[5])
        .withdraw(bondId, 6000);
      const retrieveWithdraw = await tbContract
        .connect(signers[5])
        .BondDepositWithdraws(bondId, 0);

      expect(withdraw.hash).to.not.be.undefined;
      expect(withdraw.hash).to.be.a("string");
      expect(retrieveWithdraw).to.not.be.undefined;
    });
  });

  describe("Replace bond minter", () => {
    it("should fail if bondId doesn't exist", async () => {
      const nonExistentBondId = 123;

      await expect(
        tbContract.updateBondMinter(
          nonExistentBondId,
          await signers[2].getAddress()
        )
      ).to.rejectedWith("Bond doesn't exist");
    });

    it("should fail if bond is paused", async () => {
      await tbContract.pauseBond(bondId);
      await expect(
        tbContract.updateBondMinter(bondId, await signers[2].getAddress())
      ).to.rejectedWith("Bond is paused");
    });

    it("should fail if new minter address is invalid", async () => {
      const invalidAddress = "0x0000000000000000000000000000000000000000";
      await tbContract.resumeBond(bondId);
      await expect(
        tbContract.updateBondMinter(bondId, invalidAddress)
      ).to.rejectedWith("Address is invalid");
    });

    it("should fail if new minter address is current minter", async () => {
      await expect(
        tbContract.updateBondMinter(bondId, await signers[1].getAddress())
      ).to.rejectedWith("Already current minter");
    });

    it("should successfully replace minter", async () => {
      const newMinter = await tbContract.updateBondMinter(
        bondId,
        await signers[2].getAddress()
      );
      expect(newMinter.hash).to.not.be.undefined;
      expect(newMinter.hash).to.be.a("string");
    });

    it("should successfully replace minters from various bonds", async () => {
      const bondParam = {
        initialSupply: 100000,
        maturityDate: 1740058156,
        name: "CHD BOND",
        minter: signers[4].getAddress(),
      };

      await tbContract.createBond(
        bondParam.initialSupply,
        bondParam.maturityDate,
        bondParam.name,
        bondParam.minter
      );
      const bondId2 = BigInt(
        "99585765400637793826986894605043180923646758378210384443056622005821239312192"
      );

      const newMinter1 = await signers[1].getAddress();
      const newMinter2 = await signers[3].getAddress();

      const replaceMintTuples = [
        { bondId, newMinter: newMinter1 },
        { bondId: bondId2, newMinter: newMinter2 },
      ];

      const replaceBulk = await tbContract.replaceMintBulk(replaceMintTuples);
      expect(replaceBulk.hash).to.not.be.undefined;
      expect(replaceBulk.hash).to.be.a("string");
    });
  });

  describe("Bond pause", () => {
    it("should fail if caller is not contract owner", async () => {
      await expect(
        tbContract.connect(signers[2]).pauseBond(bondId)
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should fail if bond doesn't exist", async () => {
      const nonExistentBondId = 123;

      await expect(tbContract.pauseBond(nonExistentBondId)).to.rejectedWith(
        "Bond doesn't exist"
      );
    });

    it("should fail if bond is already paused", async () => {
      await tbContract.pauseBond(bondId);
      await expect(tbContract.pauseBond(bondId)).to.rejectedWith(
        "Bond is paused"
      );
    });

    it("should successfully pause bond", async () => {
      await tbContract.resumeBond(bondId);

      const bond = await tbContract.pauseBond(bondId);
      expect(bond.hash).to.not.be.undefined;
      expect(bond.hash).to.be.a("string");
    });
  });

  describe("Bond resume", () => {
    it("should fail if caller is not contract owner", async () => {
      await expect(
        tbContract.connect(signers[2]).resumeBond(bondId)
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should fail if bond doesn't exist", async () => {
      const nonExistentBondId = 123;

      await expect(tbContract.resumeBond(nonExistentBondId)).to.rejectedWith(
        "Bond doesn't exist"
      );
    });

    it("should fail if bond has already resume", async () => {
      await tbContract.resumeBond(bondId);
      await expect(tbContract.resumeBond(bondId)).to.rejectedWith(
        "Bond not paused"
      );
    });

    it("should successfully resume bond", async () => {
      await tbContract.pauseBond(bondId);

      const bond = await tbContract.resumeBond(bondId);
      expect(bond.hash).to.not.be.undefined;
      expect(bond.hash).to.be.a("string");
    });
  });

  describe("Enable bond inter transfer", () => {
    it("should fail if caller is not contract owner", async () => {
      await expect(
        tbContract.connect(signers[2]).enableInterTransfer(bondId)
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should fail if bond doesn't exist", async () => {
      const nonExistentBondId = 123;

      await expect(
        tbContract.enableInterTransfer(nonExistentBondId)
      ).to.rejectedWith("Bond doesn't exist");
    });

    it("should fail if bond is paused", async () => {
      await tbContract.pauseBond(bondId);
      await expect(tbContract.enableInterTransfer(bondId)).to.rejectedWith(
        "Bond is paused"
      );
    });

    it("should fail if bond already has inter transfer enabled", async () => {
      await tbContract.resumeBond(bondId);
      await tbContract.enableInterTransfer(bondId);
      await expect(tbContract.enableInterTransfer(bondId)).to.rejectedWith(
        "Already enabled"
      );
    });

    it("should successfully enable inter transfer of bonds", async () => {
      await tbContract.disableInterTransfer(bondId);

      const bond = await tbContract.enableInterTransfer(bondId);
      expect(bond.hash).to.not.be.undefined;
      expect(bond.hash).to.be.a("string");
    });
  });

  describe("Disable bond inter transfer", () => {
    it("should fail if caller is not contract owner", async () => {
      await expect(
        tbContract.connect(signers[2]).disableInterTransfer(bondId)
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should fail if bond doesn't exist", async () => {
      const nonExistentBondId = 123;

      await expect(
        tbContract.disableInterTransfer(nonExistentBondId)
      ).to.rejectedWith("Bond doesn't exist");
    });

    it("should fail if bond is paused", async () => {
      await tbContract.pauseBond(bondId);
      await expect(tbContract.disableInterTransfer(bondId)).to.rejectedWith(
        "Bond is paused"
      );
    });

    it("should fail if bond already has inter transfer disabled", async () => {
      await tbContract.resumeBond(bondId);

      await tbContract.disableInterTransfer(bondId);
      await expect(tbContract.disableInterTransfer(bondId)).to.rejectedWith(
        "Already disabled"
      );
    });

    it("should successfully disable inter transfer of bonds", async () => {
      await tbContract.enableInterTransfer(bondId);

      const bond = await tbContract.disableInterTransfer(bondId);
      expect(bond.hash).to.not.be.undefined;
      expect(bond.hash).to.be.a("string");
    });
  });

  describe("Bond inter transfer amongst users", () => {
    it("should fail if bond doesn't exist", async () => {
      const nonExistentBondId = 123;

      await expect(
        tbContract.transferBondAmongUsers(
          nonExistentBondId,
          100,
          await signers[7].getAddress()
        )
      ).to.rejectedWith("Bond doesn't exist");
    });

    it("should fail if bond is paused", async () => {
      await tbContract.pauseBond(bondId);
      await expect(
        tbContract.transferBondAmongUsers(
          bondId,
          100,
          await signers[7].getAddress()
        )
      ).to.rejectedWith("Bond is paused");
    });

    it("should fail if bond inter transfer is disabled", async () => {
      await tbContract.resumeBond(bondId);

      await expect(
        tbContract.transferBondAmongUsers(
          bondId,
          100,
          await signers[7].getAddress()
        )
      ).to.rejectedWith("Bond is not transferable");
    });

    it("should fail if amount of bond sent isn't in multiples of unit price ", async () => {
      tbContract.enableInterTransfer(bondId);

      await expect(
        tbContract
          .connect(signers[5])
          .transferBondAmongUsers(bondId, 1020, await signers[7].getAddress())
      ).to.rejectedWith("Amount must be in multiples of unit price");
    });

    it("should fail if sender's balance is insufficient", async () => {
      tbContract.enableInterTransfer(bondId);

      await expect(
        tbContract
          .connect(signers[5])
          .transferBondAmongUsers(
            bondId,
            10000000,
            await signers[7].getAddress()
          )
      ).to.rejectedWith("Insufficient balance");
    });

    it("should successfully inter transfer bonds amongst users", async () => {
      const interTransfer = await tbContract
        .connect(signers[5])
        .transferBondAmongUsers(bondId, 1000, await signers[7].getAddress());
      expect(interTransfer.hash).to.not.be.undefined;
      expect(interTransfer.hash).to.be.a("string");
    });
  });
});
