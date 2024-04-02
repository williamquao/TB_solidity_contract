require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  optimizer: {
    enabled: true,
    runs: 200, 
  },
  defaultNetwork: "sepolia",
  networks: {
    sepolia: {
      url: "https://rpc2.sepolia.org",
      chainId: 11155111,
      accounts: [TESTNET_PRIVATE_KEY],
    },
    basesepolia: {
      url: "https://base-sepolia-rpc.publicnode.com",
      chainId: 84532,
      accounts: [TESTNET_PRIVATE_KEY],
    },
    mainnet: {
      url: "MAINNET_PROVIDER_URL",
      chainId: 1,
      accounts: [MAINNET_PRIVATE_KEY],
    },
  },
};
