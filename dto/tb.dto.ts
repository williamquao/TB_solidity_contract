export class NewBond {
  initialSupply: number;
  maturityDate: number;
  name: string;
  minter: string;
}

export class Deposit {
  bondId: number;
  amount: number;
  receiver: string;
}

export class Withdraw {
  bondId: number;
  amount: number;
}

export class Minter {
  bondId: number;
  newMinter: string;
}

export class Transfer {
  bondId: number;
  amount: number;
  receiver: string;
}
