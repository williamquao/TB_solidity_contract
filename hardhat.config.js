require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv")
dotenv.config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  optimizer: {
    enabled: true,
    runs: 200, 
  },
  defaultNetwork: "baseSepolia",
  networks: {
    sepolia: {
      url: "https://rpc2.sepolia.org",
      chainId: 11155111,
      accounts: [process.env.TESTNET_PRIVATE_KEY],
    },
    baseSepolia: {
      url: "https://base-sepolia.public.blastapi.io",
      chainId: 84532,
      accounts: [process.env.BASE_TESTNET_PRIVATE_KEY],
    },
    baseMainnet: {
      url: "https://base-mainnet.public.blastapi.io",
      chainId: 8453,
      accounts: [process.env.MAINNET_PRIVATE_KEY],
    },
  },
};
