export class NewBond {
  initialSupply: number;
  maturityDate: number;
  name: string;
  minter: string;
}

export class Deposit {
  bondId: BigInt;
  amount: number;
  user: string;
}

export class Withdraw {
  bondId: BigInt;
  amount: number;
}

export class Minter {
  bondId: BigInt;
  newMinter: string;
}

export class Transfer {
  bondId: BigInt;
  amount: number;
  receiver: string;
}
