import { TBClient } from "../client/tb-client";
import { Transfer } from "../dto/tb.dto";

(async () => {
  const privateKey = 'privateKey here';
  const transfers: Transfer[] = [
    {
      tokenId: 1,
      amount: 100000,
      sender: "0xd59ba1d313685E79753Fbe3dAe0FD60a01BE79F3",
      receiver: "0x435E4c824E5913180B724BA34c28c1ea61cBC8E6",
    },
    {
      tokenId: 2,
      amount: 5000,
      sender: "0x435E4c824E5913180B724BA34c28c1ea61cBC8E6",
      receiver: "0xd59ba1d313685E79753Fbe3dAe0FD60a01BE79F3",
    },
  ];

  const tbClient: TBClient = new TBClient(privateKey);

  await tbClient.transfer(transfers);
})();


