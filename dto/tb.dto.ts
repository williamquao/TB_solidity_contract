export class MintBond {
  expirationDate: number;
  interestRate: number;
  tokenId: number;
  amount: number;
  custodial: boolean;
  name: string;
}

export class Transfer {
  from: string;
  transferDest: TransferDest[];
}

export class TransferDest {
  tokenId: number;
  amount: number;
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
