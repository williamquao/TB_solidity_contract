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

// export class Transfer {
//   bondId: BigInt;
//   amount: number;
//   receiver: string;
// }
