export class MintBond {
  interestRate: number;
  expirationDate: number;
  tokenId: number;
  amount: number;
  custodial: boolean;
}

export class Transfer {
  tokenId: number;
  amount: number;
  sender: string;
  receiver: string;
}

export class Withdraw {
  bondId: BigInt;
  amount: number;
}

export class Minter {
  oldMinter: string;
  newMinter: string;
}

enum OperatorAction {
  Add = "Add",
  Remove = "Remove",
}

export class OperatorParam {
  action: OperatorAction;
  owner: string;
  tokenId: number;
  operator: string;
}
