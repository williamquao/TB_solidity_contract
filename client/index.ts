import { TBClient } from "../client/tb-client";
import { Transfer } from "../dto/tb.dto";

(async () => {
  const privateKey = "privateKey here";
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

  const tbClient: TBClient = new TBClient(privateKey);

  await tbClient.transfer(transfers);
})();
