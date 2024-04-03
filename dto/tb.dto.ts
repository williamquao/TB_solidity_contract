export class MintBond {
  expirationDate: number;
  interestRate: number;
  tokenId: number;
  amount: number;
  custodial: boolean;
  name: string;
}

export class Transfer {
  tokenId: number;
  amount: number;
  sender: string;
  receiver: string;
}

export class Minter {
  oldMinter: string;
  newMinter: string;
}

enum OperatorAction {
  Add = 0,
  Remove = 1,
}

export class OperatorParam {
  action: OperatorAction;
  owner: string;
  tokenId: number;
  operator: string;
}
