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
};
