const { ethers } = require("ethers");

export class Transfer {
  from: string;
  transferDest: TransferDest[];
}

export class TransferDest {
  tokenId: number;
  amount: number;
  receiver: string;
}
const providerURL = "https://base-sepolia-rpc.publicnode.com";
const privateKey = "privateKey here";
const proxyContractAddress = "0x4F1F97302C598109BEeCFa328D743d21991cf456";

const provider = new ethers.providers.JsonRpcProvider(providerURL);
const signer = new ethers.Wallet(privateKey, provider);

(async () => {
  const proxyContract = new ethers.Contract(
    proxyContractAddress,
    implementationAbi,
    signer
  );

  const transfers: Transfer[] = [
    {
      from: "0xd59ba1d313685E79753Fbe3dAe0FD60a01BE79F3",
      transferDest: [
        {
          tokenId: 1,
          amount: 100000,
          receiver: "0x435E4c824E5913180B724BA34c28c1ea61cBC8E6",
        },
        {
          tokenId: 2,
          amount: 5000,
          receiver: "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
        },
      ],
    },
  ];

  await proxyContract.transfer(transfers);
})();

const implementationAbi = [];
