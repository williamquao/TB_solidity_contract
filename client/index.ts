import { TBClient } from "../client/tb-client";
import { Transfer } from "../dto/tb.dto";

(async () => {
  const transfers: Transfer[] = [
    {
      tokenId: 1,
      amount: 100000,
      sender: "0x435E4c824E5913180B724BA34c28c1ea61cBC8E6",
      receiver: "0x435E4c824E5913180B724BA34c28c1ea61cBC8E6",
    },
    {
      tokenId: 2,
      amount: 6500000,
      sender: "0x435E4c824E5913180B724BA34c28c1ea61cBC8E6",
      receiver: "0x435E4c824E5913180B724BA34c28c1ea61cBC8E6",
    },
  ];

  const tbClient: TBClient = new TBClient();

  await tbClient.transfer(transfers);
})();
