require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");

const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || ''

// API Envs
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || ''
const PRIVATE_KEY = process.env.PRIVATE_KEY || '' 

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
    },
    polygonMumbai: {
      url: POLYGON_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 80001,
    }
  },
    etherscan: {
      apiKey: {
        polygonMumbai: POLYGONSCAN_API_KEY,
      },
    }
  }
