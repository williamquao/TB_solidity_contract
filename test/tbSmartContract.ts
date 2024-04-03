const { ethers } = require("hardhat");
const {expect} = require("chai");


describe("Tokenized bonds Test", () => {
  let tbContract;
  let tbProxyContract;
  let tbImplementationContract;
  let signers;

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
      await tbContract.resume();
      await expect(tbContract.removeMinter(invalidAddress)).to.be.rejectedWith(
        "Address is invalid"
      );
    });
    it("should fail if minter is tight to a mint", async () => {
      await tbContract
        .connect(signers[1])
        .mint(1775147997, 10, 3, 1000000, true, "CMR Bond");
      await expect(
        tbContract.removeMinter(await signers[1].getAddress())
      ).to.be.rejectedWith("Cannot remove minter");
    });
    it("should successfully remove a minter", async () => {
      const signerAddr = await signers[4].getAddress();
      await tbContract.addMinter(signerAddr);
      const minter = await tbContract.removeMinter(signerAddr);
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
      const trx = await tbContract.connect(signers[1]).mint(
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
        tbContract.connect(signers[6]).burn(6, 1000000)
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
      
      const trx = await tbContract.pauseInterTransfer(1);
      expect(trx.hash).to.not.be.undefined;
      expect(trx.hash).to.be.a("string");
    });

    it("should fail if token InterTransfer is already paused", async () => {
      await expect(tbContract.pauseInterTransfer(1)).to.be.rejectedWith(
        "InterTransfer is already paused"
      );
    });
  });

  describe("Test Operator", async () => {

    it("should update Operators", async () => {
    const operators = [
      {
      action: 0,
      owner: await signers[3].getAddress(),
      tokenId: 3,
      operator: await signers[4].getAddress()
      },
      {
        action: 0,
        owner: await signers[3].getAddress(),
        tokenId: 1,
        operator: await signers[5].getAddress()
        }
      ]
    await tbContract.connect(signers[3]).updateOperators(operators);

  })
  it("should update Operators For All", async () => {
    const operators = [
      await signers[3].getAddress(),
      await signers[4].getAddress(),
      await signers[5].getAddress()
      ]
     await tbContract.connect(signers[1]).updateOperatorsForAll(operators);
  })
})

  describe("Test Transfer", async () => {
    it("should Transfers", async () => {
      await tbContract.resumeInterTransfer(1);
      const transfer1 = [{
        tokenId: 3,
        amount: 100000,
        sender: await signers[1].getAddress(),
        receiver: await signers[3].getAddress(),
      },
      {
        tokenId: 1,
        amount: 80000,
        sender: await signers[1].getAddress(),
        receiver: await signers[3].getAddress(),
      },
      {
        tokenId: 3,
        amount: 5000,
        sender: await signers[3].getAddress(),
        receiver: await signers[1].getAddress(),
      }]
    const transfers = [
      {
        tokenId: 1,
        amount: 1000,
        sender: await signers[3].getAddress(),
        receiver: await signers[4].getAddress(),
      },

    ]
    await tbContract.connect(signers[1]).makeTransfer(transfer1);

    await tbContract.connect(signers[3]).makeTransfer(transfers);
  })
  })

})
  