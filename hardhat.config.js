require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || ''
const COIN_MARKET_API_KEY = process.env.COIN_MARKET_API_KEY || ''

// API Envs
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''
const DSGD_OWNER_PRIVATE_KEY = process.env.DSGD_OWNER_PRIVATE_KEY || '' 
const DMYR_OWNER_PRIVATE_KEY = process.env.DMYR_OWNER_PRIVATE_KEY || '' 
const MCBDC_OWNER_PRIVATE_KEY = process.env.MCBDC_OWNER_PRIVATE_KEY || ''
const VOUCHER_OWNER_PRIVATE_KEY = process.env.VOUCHER_OWNER_PRIVATE_KEY || '' 
const ECOMMERCE_OWNER_PRIVATE_KEY = process.env.ECOMMERCE_OWNER_PRIVATE_KEY || ''

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
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [DSGD_OWNER_PRIVATE_KEY,DMYR_OWNER_PRIVATE_KEY, MCBDC_OWNER_PRIVATE_KEY, VOUCHER_OWNER_PRIVATE_KEY, ECOMMERCE_OWNER_PRIVATE_KEY],
      chainId: 11155111,
    }
  },
    etherscan: {
      apiKey: {
        sepolia: ETHERSCAN_API_KEY,
      },
    },
    gasReporter: {
      enabled: true,
      token: 'SETH',
      currency: 'SGD',
      outputFile: 'gas-report.txt',
      coinmarketcap: COIN_MARKET_API_KEY,
      noColors:true
    }
  }
