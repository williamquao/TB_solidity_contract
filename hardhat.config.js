require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: "https://ethereum-sepolia.publicnode.com",
      accounts: [TESTNET_PRIVATE_KEY],
    },
    basesepolia: {
      url: "https://base-sepolia-rpc.publicnode.com",
      chainId: 84532,
      accounts: [TESTNET_PRIVATE_KEY],
    },
    mainnet: {
      url: "YOUR_MAINNET_PROVIDER_URL",
      chainId: 1,
      accounts: [MAINNET_PRIVATE_KEY],
    },
  },
};
