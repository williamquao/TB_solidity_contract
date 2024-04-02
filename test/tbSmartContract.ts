const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Tokenized bonds Test", () => {
  let tbContract;
  let tbProxyContract;
  let tbImplementationContract;
  let signers;
  const bondId = BigInt(
    "12459123034594101601133848791414057143407166679711044500175648910976503210763"
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

  describe("Test Minter Add", async () => {
    it("should fail if caller is not contract owner", async () => {
      await expect(
        tbContract.connect(signers[2]).addMinter(await signers[2].getAddress())
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
    it("should successfully add a minter", async () => {
      const minter = await tbContract.addMinter(await signers[2].getAddress());
      expect(minter.hash).to.not.be.undefined;
      expect(minter.hash).to.be.a("string");
    });
  });

  describe("Test Minter Replace", async () => {
    it("should fail if caller is not contract owner", async () => {
      await expect(
        tbContract
          .connect(signers[2])
          .replaceMinter(
            await signers[2].getAddress(),
            await signers[3].getAddress()
          )
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should fail if contract is paused", async () => {
      await tbContract.pause();
      await expect(
        tbContract.replaceMinter(
          await signers[2].getAddress(),
          await signers[3].getAddress()
        )
      ).to.be.rejectedWith("Contract is paused");
    });

    it("should fail if new minter address is invalid", async () => {
      await tbContract.resume();
      await expect(
        tbContract.replaceMinter(await signers[2].getAddress(), invalidAddress)
      ).to.be.rejectedWith("Address is invalid");
    });

    it("should fail if previous minter doesn't exist", async () => {
      await expect(
        tbContract.replaceMinter(
          await signers[1].getAddress(),
          await signers[3].getAddress()
        )
      ).to.be.rejectedWith("Old minter does not exist");
    });

    it("should fail if new minter already exist", async () => {
      await expect(
        tbContract.replaceMinter(
          await signers[2].getAddress(),
          await signers[2].getAddress()
        )
      ).to.be.rejectedWith("New minter exist");
    });

    it("should successfully replace a minter", async () => {
      const minter = await tbContract.replaceMinter(
        await signers[2].getAddress(),
        await signers[1].getAddress()
      );
      expect(minter.hash).to.not.be.undefined;
      expect(minter.hash).to.be.a("string");
    });
  });

  describe("Test Minter Removal", async () => {
    it("should fail if caller is not contract owner", async () => {
      await expect(
        tbContract
          .connect(signers[1])
          .removeMinter(await signers[1].getAddress())
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
    it("should fail if contract is paused", async () => {
      await tbContract.pause();
      await expect(
        tbContract.removeMinter(await signers[1].getAddress())
      ).to.be.rejectedWith("Contract is paused");
    });
    it("should fail if new minter address is invalid", async () => {
      await expect(tbContract.removeMinter(invalidAddress)).to.be.rejectedWith(
        "Address is invalid"
      );
    });
    it("should fail if caller is not contract owner", async () => {
      await tbContract
        .connect(signers[1])
        .mint(100, 1, 1743458951, 1000000, true);
      await expect(
        tbContract.removeMinter(await signers[1].getAddress())
      ).to.be.rejectedWith("Cannot remove minter");
    });
    it("should successfully remove a minter", async () => {
      await tbContract.addMinter(signers[2]);
      const minter = await tbContract.removeMinter(
        await signers[2].getAddress()
      );
      expect(minter.hash).to.not.be.undefined;
      expect(minter.hash).to.be.a("string");
    });
  });

  describe("Test Bond Minting", async () => {
    it("should fail if contract is paused", async () => {
      await tbContract.pause();
      await expect(
        tbContract
          .connect(signers[6])
          .mint(1743458951, 10, 1, 1000000, true, "CMR Bond")
      ).to.be.rejectedWith("Contract is paused");
    });
    it("should fail if caller is not minter", async () => {
      await tbContract.resume();
      await expect(
        tbContract
          .connect(signers[6])
          .mint(1743458951, 10, 1, 1000000, true, "CMR Bond")
      ).to.be.rejectedWith("Minter does not exist");
    });
    it("should fail if expiration date is less than present", async () => {
      await expect(
        tbContract
          .connect(signers[1])
          .mint(1643458951, 10, 1, 1000000, true, "CMR Bond")
      ).to.be.rejectedWith("Expiration date must be above current time");
    });
    it("should fail if expiration date is less than present", async () => {
      await expect(
        tbContract
          .connect(signers[1])
          .mint(1743458951, 10, 1, 100, true, "CMR Bond")
      ).to.be.rejectedWith("Amount must be in multiples of unit price");
    });
    it("should fail if interest rate is <= 0", async () => {
      await expect(
        tbContract
          .connect(signers[1])
          .mint(1743458951, 0, 1, 1000000, true, "CMR Bond")
      ).to.be.rejectedWith("Interest rate cannot be 0");
    });
    it("should successfully mint a token", async () => {
      const trx = await tbContract.mint(
        1743458951,
        10,
        1,
        100000,
        true,
        "CMR Bond"
      );
      expect(trx.hash).to.not.be.undefined;
      expect(trx.hash).to.be.a("string");
    });
    it("should fail if token id already exist", async () => {
      await expect(
        tbContract
          .connect(signers[1])
          .mint(1743458951, 10, 1, 100000, true, "CMR Bond")
      ).to.be.rejectedWith("Token already exist");
    });
  });

  describe("Test Token Burning", async () => {
    it("should fail if contract is paused", async () => {
      await tbContract.pause();
      await expect(
        tbContract.connect(signers[6]).burn(1, 1000000)
      ).to.be.rejectedWith("Contract is paused");
    });
    it("should fail if token id doesn't exist", async () => {
      await tbContract.resume();
      await expect(
        tbContract.connect(signers[6]).burn(3, 1000000)
      ).to.be.rejectedWith("Token does not exist");
    });
    it("should fail if caller is not minter", async () => {
      await expect(
        tbContract.connect(signers[1]).burn(1, 0)
      ).to.be.rejectedWith("Amount cannot be less than 0");
    });
    it("should fail if amount is greater than minter's balance", async () => {
      await expect(
        tbContract.connect(signers[1]).burn(1, 1000000000)
      ).to.be.rejectedWith("Amount must be less than balance");
    });

    it("should successfully burn a token", async () => {
      const trx = await tbContract.connect(signers[1]).burn(1, 1000);
      expect(trx.hash).to.not.be.undefined;
      expect(trx.hash).to.be.a("string");
    });
  });
  describe("Test Token Freezing", async () => {
    it("should fail if caller is not contract owner", async () => {
      await expect(
        tbContract.connect(signers[2]).freezeToken(1)
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should successfully freeze a token", async () => {
      const minter = await tbContract.freezeToken(1);
      expect(minter.hash).to.not.be.undefined;
      expect(minter.hash).to.be.a("string");
    });

    it("should fail if token is already frozen", async () => {
      await expect(tbContract.freezeToken(1)).to.be.rejectedWith(
        "Token already frozen"
      );
    });
  });

  describe("Test Token unFreezing", async () => {
    it("should fail if caller is not contract owner", async () => {
      await expect(
        tbContract.connect(signers[2]).unfreezeToken(1)
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should successfully unfreeze a token", async () => {
      const minter = await tbContract.unfreezeToken(1);
      expect(minter.hash).to.not.be.undefined;
      expect(minter.hash).to.be.a("string");
    });

    it("should fail if token is not frozen", async () => {
      await expect(tbContract.unfreezeToken(1)).to.be.rejectedWith(
        "Token not frozen"
      );
    });
  });

  describe("Test pause InterTransfer", async () => {
    it("should fail if caller is not contract owner", async () => {
      await expect(
        tbContract.connect(signers[2]).pauseInterTransfer(1)
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should fail if token doesn't exist", async () => {
      await expect(tbContract.pauseInterTransfer(8)).to.be.rejectedWith(
        "Token does not exist"
      );
    });

    it("should successfully pause InterTransfer for a token", async () => {
      const minter = await tbContract.pauseInterTransfer(1);
      expect(minter.hash).to.not.be.undefined;
      expect(minter.hash).to.be.a("string");
    });

    it("should fail if token InterTransfer is already paused", async () => {
      await expect(tbContract.pauseInterTransfer(1)).to.be.rejectedWith(
        "InterTransfer is already paused"
      );
    });
  });
  describe("Test resume InterTransfer", async () => {
    it("should fail if caller is not contract owner", async () => {
      await expect(
        tbContract.connect(signers[2]).resumeInterTransfer(1)
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should fail if token doesn't exist", async () => {
      await expect(tbContract.resumeInterTransfer(8)).to.be.rejectedWith(
        "Token does not exist"
      );
    });

    it("should successfully InterTransfer for a token", async () => {
      const minter = await tbContract.resumeInterTransfer(1);
      expect(minter.hash).to.not.be.undefined;
      expect(minter.hash).to.be.a("string");
    });

    it("should fail if token InterTransfer is already resumed", async () => {
      await expect(tbContract.resumeInterTransfer(1)).to.be.rejectedWith(
        "InterTransfer is not paused"
      );
    });

    describe("Test resume InterTransfer After Expiry", async () => {
      it("should fail if caller is not contract owner", async () => {
        await expect(
          tbContract.connect(signers[2]).pauseItrAfterExpiry(1)
        ).to.be.rejectedWith("OwnableUnauthorizedAccount");
      });
    });
  });
  //   describe("Test bond minting", () => {
  //     it("should fail if caller is not contract owner", async () => {
  //       const bondParam = {
  //         initialSupply: 100000,
  //         maturityDate: 1740058156,
  //         name: "jane bond",
  //         minter: signers[3].getAddress(),
  //       };

  //       await expect(
  //         tbContract
  //           .connect(signers[2])
  //           .createBond(
  //             bondParam.initialSupply,
  //             bondParam.maturityDate,
  //             bondParam.name,
  //             bondParam.minter
  //           )
  //       ).to.be.rejectedWith("OwnableUnauthorizedAccount");
  //     });

  //     it("should fail if minter address is invalid", async () => {
  //       const bondParam = {
  //         initialSupply: 100000,
  //         maturityDate: 1740058156,
  //         name: "CMR BOND",
  //         minter: signers[3].getAddress(),
  //       };
  //       await expect(
  //         tbContract.createBond(
  //           bondParam.initialSupply,
  //           bondParam.maturityDate,
  //           bondParam.name,
  //           invalidAddress
  //         )
  //       ).to.be.rejectedWith("Address is invalid and Supply below 0");
  //     });

  //     it("should fail if maturity date is below present date", async () => {
  //       const bondParam = {
  //         initialSupply: 100000,
  //         maturityDate: 123,
  //         name: "CMR BOND",
  //         minter: signers[3].getAddress(),
  //       };
  //       await expect(
  //         tbContract.createBond(
  //           bondParam.initialSupply,
  //           bondParam.maturityDate,
  //           bondParam.name,
  //           bondParam.minter
  //         )
  //       ).to.be.revertedWith("Maturity date must be above current time");
  //     });

  //     it("should fail if initial supply is 0", async () => {
  //       const bondParam = {
  //         initialSupply: 100000,
  //         maturityDate: 1740058156,
  //         name: "CMR BOND",
  //         minter: signers[3].getAddress(),
  //       };

  //       await expect(
  //         tbContract.createBond(
  //           0,
  //           bondParam.maturityDate,
  //           bondParam.name,
  //           bondParam.minter
  //         )
  //       ).to.be.revertedWith("Address is invalid and Supply below 0");
  //     });

  //     it("should successfully create Bond", async () => {
  //       const bondParam = {
  //         initialSupply: 100000000,
  //         maturityDate: 1740058156,
  //         name: "CMR BOND",
  //         minter: signers[1].getAddress(),
  //       };

  //       await expect(
  //         tbContract
  //           .connect(signers[0])
  //           .createBond(
  //             bondParam.initialSupply,
  //             bondParam.maturityDate,
  //             bondParam.name,
  //             bondParam.minter
  //           )
  //       )
  //         .to.emit(tbContract, "BondCreated")
  //         .withArgs(
  //           bondParam.minter,
  //           bondParam.name,
  //           bondParam.maturityDate,
  //           bondParam.initialSupply,
  //           bondId
  //         );
  //     });

  //     it("should fail if trying to recreate an existing bond", async () => {
  //       const bondParam = {
  //         initialSupply: 100000000,
  //         maturityDate: 1740058156,
  //         name: "CMR BOND",
  //         minter: signers[3].getAddress(),
  //       };

  //       await expect(
  //         tbContract.createBond(
  //           bondParam.initialSupply,
  //           bondParam.maturityDate,
  //           bondParam.name,
  //           bondParam.minter
  //         )
  //       ).to.be.rejectedWith("Bond already exist");
  //     });
  //   });

  //   describe("Bond transfer from minter to User", () => {
  //     it("should fail if bondId doesn't exist", async () => {
  //       const nonExistentBondId = 123;
  //       const userAddress = "0xDC5B997B6aF291FDD575De44fd89205BbBAeF8da";
  //       await expect(
  //         tbContract.deposit(nonExistentBondId, 5000, userAddress)
  //       ).to.rejectedWith("Bond does not exist");
  //     });

  //     it("should fail if sender is not minter", async () => {
  //       const userAddress = "0xDC5B997B6aF291FDD575De44fd89205BbBAeF8da";
  //       await expect(
  //         tbContract.connect(signers[2]).deposit(bondId, 5000, userAddress)
  //       ).to.rejectedWith("Caller is not minter");
  //     });

  //     it("should fail if bond is paused", async () => {
  //       await tbContract.pauseBond(bondId);
  //       const userAddress = "0xDC5B997B6aF291FDD575De44fd89205BbBAeF8da";
  //       await expect(
  //         tbContract.connect(signers[1]).deposit(bondId, 5000, userAddress)
  //       ).to.rejectedWith("Bond is paused");
  //     });

  //     it("should fail if amount is not in multiple of unit price", async () => {
  //       await tbContract.resumeBond(bondId);
  //       const userAddress = "0xDC5B997B6aF291FDD575De44fd89205BbBAeF8da";
  //       await expect(
  //         tbContract.connect(signers[1]).deposit(bondId, 5200, userAddress)
  //       ).to.rejectedWith("Amount must be in multiples of unit price");
  //     });

  //     it("should fail if sending more than account balance", async () => {
  //       const userAddress = "0xDC5B997B6aF291FDD575De44fd89205BbBAeF8da";
  //       await expect(
  //         tbContract.connect(signers[1]).deposit(bondId, 200000000, userAddress)
  //       ).to.rejectedWith("Insufficient balance");
  //     });

  //     it("should successfully deposit asset to user", async () => {
  //       const userAddress = signers[5].getAddress();
  //       const deposit = await tbContract
  //         .connect(signers[1])
  //         .deposit(bondId, 5000, userAddress);
  //       expect(deposit.hash).to.not.be.undefined;
  //       expect(deposit.hash).to.be.a("string");
  //     });

  //     it("should fail if sending a bulk deposit beyond 15", async () => {
  //       const user1 = await signers[5].getAddress();
  //       const user2 = await signers[10].getAddress();

  //       const depositsTuples = [
  //         { bondId, amount: 1000, user: user1 },
  //         { bondId, amount: 1000, user: user2 },
  //         { bondId, amount: 1000, user: user1 },
  //         { bondId, amount: 1000, user: user2 },
  //         { bondId, amount: 1000, user: user1 },
  //         { bondId, amount: 1000, user: user2 },
  //         { bondId, amount: 1000, user: user1 },
  //         { bondId, amount: 1000, user: user2 },
  //         { bondId, amount: 1000, user: user1 },
  //         { bondId, amount: 1000, user: user2 },
  //         { bondId, amount: 1000, user: user1 },
  //         { bondId, amount: 1000, user: user2 },
  //         { bondId, amount: 1000, user: user1 },
  //         { bondId, amount: 1000, user: user2 },
  //         { bondId, amount: 1000, user: user1 },
  //         { bondId, amount: 1000, user: user2 },
  //         { bondId, amount: 1000, user: user1 },
  //         { bondId, amount: 1000, user: user2 },
  //       ];

  //       await expect(
  //         tbContract.connect(signers[1]).depositBulk(depositsTuples)
  //       ).to.rejectedWith("Deposit list should not be above 15");
  //     });

  //     it("should successfully do a bulk deposit to various users", async () => {
  //       const user1 = await signers[5].getAddress();

  //       const user2 = await signers[10].getAddress();

  //       const depositsTuples = [
  //         { bondId, amount: 1000, user: user1 },
  //         { bondId, amount: 1000, user: user2 },
  //       ];

  //       const deposit = await tbContract
  //         .connect(signers[1])
  //         .depositBulk(depositsTuples);
  //       expect(deposit.hash).to.not.be.undefined;
  //       expect(deposit.hash).to.be.a("string");
  //     });
  //   });

  //   describe("Bond withdraw by Users", () => {
  //     it("should fail if bondId doesn't exist", async () => {
  //       const nonExistentBondId = 123;
  //       await expect(
  //         tbContract.connect(signers[5]).withdraw(nonExistentBondId, 5000)
  //       ).to.rejectedWith("Bond does not exist");
  //     });

  //     it("should fail if bond is paused", async () => {
  //       await tbContract.pauseBond(bondId);
  //       await expect(
  //         tbContract.connect(signers[5]).withdraw(bondId, 5000)
  //       ).to.rejectedWith("Bond is paused");
  //     });

  //     it("should fail if amount to withdraw is not in multiple of unit price", async () => {
  //       await tbContract.resumeBond(bondId);
  //       await expect(
  //         tbContract.connect(signers[5]).withdraw(bondId, 2300)
  //       ).to.rejectedWith("Amount must be in multiples of unit price");
  //     });

  //     it("should fail if insufficient balance", async () => {
  //       await expect(
  //         tbContract.connect(signers[5]).withdraw(bondId, 20000000)
  //       ).to.rejectedWith("Insufficient balance");
  //     });

  //     it("should successfully withdraw", async () => {
  //       const withdraw = await tbContract
  //         .connect(signers[5])
  //         .withdraw(bondId, 5000);
  //       const retrieveWithdraw = await tbContract
  //         .connect(signers[5])
  //         .BondDepositWithdraws(bondId, 0);

  //       expect(withdraw.hash).to.not.be.undefined;
  //       expect(withdraw.hash).to.be.a("string");
  //       expect(retrieveWithdraw).to.not.be.undefined;
  //     });
  //   });

  //   describe("Replace bond minter", () => {
  //     it("should fail if bondId doesn't exist", async () => {
  //       const nonExistentBondId = 123;

  //       await expect(
  //         tbContract.updateBondMinter(
  //           nonExistentBondId,
  //           await signers[2].getAddress()
  //         )
  //       ).to.rejectedWith("Bond does not exist");
  //     });

  //     it("should fail if bond is paused", async () => {
  //       await tbContract.pauseBond(bondId);
  //       await expect(
  //         tbContract.updateBondMinter(bondId, await signers[2].getAddress())
  //       ).to.rejectedWith("Bond is paused");
  //     });

  //     it("should fail if new minter address is invalid", async () => {
  //       const invalidAddress = "0x0000000000000000000000000000000000000000";
  //       await tbContract.resumeBond(bondId);
  //       await expect(
  //         tbContract.updateBondMinter(bondId, invalidAddress)
  //       ).to.rejectedWith("Address is invalid");
  //     });

  //     it("should fail if new minter address is current minter", async () => {
  //       await expect(
  //         tbContract.updateBondMinter(bondId, await signers[1].getAddress())
  //       ).to.rejectedWith("Already current minter");
  //     });

  //     it("should successfully replace minter", async () => {
  //       const newMinter = await tbContract.updateBondMinter(
  //         bondId,
  //         await signers[2].getAddress()
  //       );
  //       expect(newMinter.hash).to.not.be.undefined;
  //       expect(newMinter.hash).to.be.a("string");
  //     });

  //     it("should successfully replace minters from various bonds", async () => {
  //       const bondParam = {
  //         initialSupply: 100000,
  //         maturityDate: 1740058156,
  //         name: "CHD BOND",
  //         minter: signers[4].getAddress(),
  //       };

  //       await tbContract.createBond(
  //         bondParam.initialSupply,
  //         bondParam.maturityDate,
  //         bondParam.name,
  //         bondParam.minter
  //       );
  //       const bondId2 = BigInt(
  //         "99585765400637793826986894605043180923646758378210384443056622005821239312192"
  //       );

  //       const newMinter1 = await signers[1].getAddress();
  //       const newMinter2 = await signers[3].getAddress();

  //       const replaceMintTuples = [
  //         { bondId, newMinter: newMinter1 },
  //         { bondId: bondId2, newMinter: newMinter2 },
  //       ];

  //       const replaceBulk = await tbContract.replaceMintBulk(replaceMintTuples);
  //       expect(replaceBulk.hash).to.not.be.undefined;
  //       expect(replaceBulk.hash).to.be.a("string");
  //     });
  //   });

  //   describe("Bond pause", () => {
  //     it("should fail if caller is not contract owner", async () => {
  //       await expect(
  //         tbContract.connect(signers[2]).pauseBond(bondId)
  //       ).to.be.rejectedWith("OwnableUnauthorizedAccount");
  //     });

  //     it("should fail if bond doesn't exist", async () => {
  //       const nonExistentBondId = 123;

  //       await expect(tbContract.pauseBond(nonExistentBondId)).to.rejectedWith(
  //         "Bond does not exist"
  //       );
  //     });

  //     it("should fail if bond is already paused", async () => {
  //       await tbContract.pauseBond(bondId);
  //       await expect(tbContract.pauseBond(bondId)).to.rejectedWith(
  //         "Bond is paused"
  //       );
  //     });

  //     it("should successfully pause bond", async () => {
  //       await tbContract.resumeBond(bondId);

  //       const bond = await tbContract.pauseBond(bondId);
  //       expect(bond.hash).to.not.be.undefined;
  //       expect(bond.hash).to.be.a("string");
  //     });
  //   });

  //   describe("Bond resume", () => {
  //     it("should fail if caller is not contract owner", async () => {
  //       await expect(
  //         tbContract.connect(signers[2]).resumeBond(bondId)
  //       ).to.be.rejectedWith("OwnableUnauthorizedAccount");
  //     });

  //     it("should fail if bond doesn't exist", async () => {
  //       const nonExistentBondId = 123;

  //       await expect(tbContract.resumeBond(nonExistentBondId)).to.rejectedWith(
  //         "Bond does not exist"
  //       );
  //     });

  //     it("should fail if bond has already resume", async () => {
  //       await tbContract.resumeBond(bondId);
  //       await expect(tbContract.resumeBond(bondId)).to.rejectedWith(
  //         "Bond not paused"
  //       );
  //     });

  //     it("should successfully resume bond", async () => {
  //       await tbContract.pauseBond(bondId);

  //       const bond = await tbContract.resumeBond(bondId);
  //       expect(bond.hash).to.not.be.undefined;
  //       expect(bond.hash).to.be.a("string");
  //     });
  //   });

  //   describe("Enable bond inter transfer", () => {
  //     it("should fail if caller is not contract owner", async () => {
  //       await expect(
  //         tbContract.connect(signers[2]).enableInterTransfer(bondId)
  //       ).to.be.rejectedWith("OwnableUnauthorizedAccount");
  //     });

  //     it("should fail if bond doesn't exist", async () => {
  //       const nonExistentBondId = 123;

  //       await expect(
  //         tbContract.enableInterTransfer(nonExistentBondId)
  //       ).to.rejectedWith("Bond does not exist");
  //     });

  //     it("should fail if bond is paused", async () => {
  //       await tbContract.pauseBond(bondId);
  //       await expect(tbContract.enableInterTransfer(bondId)).to.rejectedWith(
  //         "Bond is paused"
  //       );
  //     });

  //     it("should fail if bond already has inter transfer enabled", async () => {
  //       await tbContract.resumeBond(bondId);
  //       await tbContract.enableInterTransfer(bondId);
  //       await expect(tbContract.enableInterTransfer(bondId)).to.rejectedWith(
  //         "Already enabled"
  //       );
  //     });

  //     it("should successfully enable inter transfer of bonds", async () => {
  //       await tbContract.disableInterTransfer(bondId);

  //       const bond = await tbContract.enableInterTransfer(bondId);
  //       expect(bond.hash).to.not.be.undefined;
  //       expect(bond.hash).to.be.a("string");
  //     });
  //   });

  //   describe("Disable bond inter transfer", () => {
  //     it("should fail if caller is not contract owner", async () => {
  //       await expect(
  //         tbContract.connect(signers[2]).disableInterTransfer(bondId)
  //       ).to.be.rejectedWith("OwnableUnauthorizedAccount");
  //     });

  //     it("should fail if bond doesn't exist", async () => {
  //       const nonExistentBondId = 123;

  //       await expect(
  //         tbContract.disableInterTransfer(nonExistentBondId)
  //       ).to.rejectedWith("Bond does not exist");
  //     });

  //     it("should fail if bond is paused", async () => {
  //       await tbContract.pauseBond(bondId);
  //       await expect(tbContract.disableInterTransfer(bondId)).to.rejectedWith(
  //         "Bond is paused"
  //       );
  //     });

  //     it("should fail if bond already has inter transfer disabled", async () => {
  //       await tbContract.resumeBond(bondId);

  //       await tbContract.disableInterTransfer(bondId);
  //       await expect(tbContract.disableInterTransfer(bondId)).to.rejectedWith(
  //         "Already disabled"
  //       );
  //     });

  //     it("should successfully disable inter transfer of bonds", async () => {
  //       await tbContract.enableInterTransfer(bondId);

  //       const bond = await tbContract.disableInterTransfer(bondId);
  //       expect(bond.hash).to.not.be.undefined;
  //       expect(bond.hash).to.be.a("string");
  //     });
  //   });

  //   describe("Bond inter transfer amongst users", () => {
  //     it("should fail if bond doesn't exist", async () => {
  //       const nonExistentBondId = 123;

  //       await expect(
  //         tbContract.transferBondAmongUsers(
  //           nonExistentBondId,
  //           100,
  //           await signers[7].getAddress()
  //         )
  //       ).to.rejectedWith("Bond does not exist");
  //     });

  //     it("should fail if bond is paused", async () => {
  //       await tbContract.pauseBond(bondId);
  //       await expect(
  //         tbContract.transferBondAmongUsers(
  //           bondId,
  //           100,
  //           await signers[7].getAddress()
  //         )
  //       ).to.rejectedWith("Bond is paused");
  //     });

  //     it("should fail if bond inter transfer is disabled", async () => {
  //       await tbContract.resumeBond(bondId);

  //       await expect(
  //         tbContract.transferBondAmongUsers(
  //           bondId,
  //           100,
  //           await signers[7].getAddress()
  //         )
  //       ).to.rejectedWith("Bond is not transferable");
  //     });

  //     it("should fail if amount of bond sent isn't in multiples of unit price ", async () => {
  //       tbContract.enableInterTransfer(bondId);

  //       await expect(
  //         tbContract
  //           .connect(signers[5])
  //           .transferBondAmongUsers(bondId, 1020, await signers[7].getAddress())
  //       ).to.rejectedWith("Amount must be in multiples of unit price");
  //     });

  //     it("should fail if sender's balance is insufficient", async () => {
  //       tbContract.enableInterTransfer(bondId);

  //       await expect(
  //         tbContract
  //           .connect(signers[5])
  //           .transferBondAmongUsers(
  //             bondId,
  //             10000000,
  //             await signers[7].getAddress()
  //           )
  //       ).to.rejectedWith("Insufficient balance");
  //     });

  //     it("should successfully inter transfer bonds amongst users", async () => {
  //       const interTransfer = await tbContract
  //         .connect(signers[5])
  //         .transferBondAmongUsers(bondId, 1000, await signers[7].getAddress());
  //       expect(interTransfer.hash).to.not.be.undefined;
  //       expect(interTransfer.hash).to.be.a("string");
  //     });
  //   });
});
