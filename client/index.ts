import { TBClient } from "../client/tb-client";
import { Deposit, Minter, Transfer, Withdraw } from "../dto/tb.dto";

export class TokenizedIndex {
  private tbClient;

  constructor(privateKey: string) {
    this.tbClient = new TBClient(privateKey);
  }

  async createBond() {
    const bondParam = {
      initialSupply: 1000000,
      maturityDate: 1735689600,
      name: "CMR Bond",
      minter: "0x40C5537f8b415099278021C5fAaB68989b757e4D",
    };
    await this.tbClient.createBond(bondParam);
  }

  async deposit() {
    const depositParam: Deposit = {
      bondId: BigInt(
        "94728191037934580968850183277756393853664353133092476056182456800137316456183"
      ),
      amount: 5000,
      user: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    };
    await this.tbClient.deposit(depositParam);
  }

  async bulkDeposit() {
    const depositParamList: Deposit[] = [
      {
        bondId: BigInt(
          "94728191037934580968850183277756393853664353133092476056182456800137316456183"
        ),
        amount: 15000,
        user: "0x25e11a136fA69E9AA4eE6A763bA643DA0D08E120",
      },
      {
        bondId: BigInt(
          "94728191037934580968850183277756393853664353133092476056182456800137316456183"
        ),
        amount: 7000,
        user: "0x9Acb258AC76a757744A05D93FE7cE8E5dcb267A6",
      },
    ];
    await this.tbClient.bulkDeposit(depositParamList);
  }

  async Withdraw() {
    const withdrawParam: Withdraw = {
      bondId: BigInt(
        "94728191037934580968850183277756393853664353133092476056182456800137316456183"
      ),
      amount: 2000,
    };
    await this.tbClient.withdraw(withdrawParam);
  }

  async replaceMinter() {
    const minterParam: Minter = {
      bondId: BigInt(
        "94728191037934580968850183277756393853664353133092476056182456800137316456183"
      ),
      newMinter: "0x9Acb258AC76a757744A05D93FE7cE8E5dcb267A6",
    };
    await this.tbClient.replaceMinter(minterParam);
  }

  async replaceMinters() {
    const replaceMinterParamList: Minter[] = [
      {
        bondId: BigInt(
          "94728191037934580968850183277756393853664353133092476056182456800137316456183"
        ),
        newMinter: "0x40C5537f8b415099278021C5fAaB68989b757e4D",
      },
      {
        bondId: BigInt(
          "76528191037934580968850183277756393853664353133092476056182456800137316456183"
        ),
        newMinter: "0x9Acb258AC76a757744A05D93FE7cE8E5dcb267A6",
      },
    ];
    await this.tbClient.replaceMintBulk(replaceMinterParamList);
  }

  async pauseBond() {
    const bondId = BigInt(
      "94728191037934580968850183277756393853664353133092476056182456800137316456183"
    );
    await this.tbClient.pauseBond(bondId);
  }

  async resumeBond() {
    const bondId = BigInt(
      "94728191037934580968850183277756393853664353133092476056182456800137316456183"
    );
    await this.tbClient.resumeBond(bondId);
  }

  async enableInterTransfer() {
    const bondId = BigInt(
      "94728191037934580968850183277756393853664353133092476056182456800137316456183"
    );
    await this.tbClient.enableInterTransfer(bondId);
  }

  async disableInterTransfer() {
    const bondId = BigInt(
      "94728191037934580968850183277756393853664353133092476056182456800137316456183"
    );
    await this.tbClient.disableInterTransfer(bondId);
  }

  async transferBondAmongUsers() {
    const transferParam: Transfer = {
      bondId: BigInt(
        "94728191037934580968850183277756393853664353133092476056182456800137316456183"
      ),
      amount: 1000,
      receiver: "0x25e11a136fA69E9AA4eE6A763bA643DA0D08E120",
    };
    await this.tbClient.transferBondAmongUsers(transferParam);
  }
}
