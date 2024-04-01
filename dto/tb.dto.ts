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

// export class Transfer {
//   bondId: BigInt;
//   amount: number;
//   receiver: string;
// }
