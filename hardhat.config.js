require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");

const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || ''

// API Envs
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || ''
const DSGD_OWNER_PRIVATE_KEY = process.env.DSGD_OWNER_PRIVATE_KEY || '' 
const DMYR_OWNER_PRIVATE_KEY = process.env.DMYR_OWNER_PRIVATE_KEY || '' 
const MCBDC_OWNER_PRIVATE_KEY = process.env.MCBDC_OWNER_PRIVATE_KEY || '' 

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.22",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
    },
    polygonMumbai: {
      url: POLYGON_RPC_URL,
      accounts: [DSGD_OWNER_PRIVATE_KEY,DMYR_OWNER_PRIVATE_KEY, MCBDC_OWNER_PRIVATE_KEY],
      chainId: 80001,
    }
  },
    etherscan: {
      apiKey: {
        polygonMumbai: POLYGONSCAN_API_KEY,
      },
    }
  }
