# Paypal Blockchain Wallet

[![Netlify Status](https://api.netlify.com/api/v1/badges/c91f8479-72fb-4672-ae13-2b20c2565652/deploy-status)](https://app.netlify.com/sites/web3wallet-migrate-api/deploys)

This project demonstrates a blockchain Wallet that can facilitate cross-border transaction and e-commerce payment. It comes with four contracts, tests for all contracts, and scripts that deploy the contracts.

Real Time Website: https://web3wallet-migrate.netlify.app/

To start this program, you need to prepare your own env scripts for env variables for frontend and backend part.

```
ALCHEMY_API_KEY/REACT_APP_ALCHEMY_API_KEY = ""
SEPOLIA_RPC_URL = ""
ETHERSCAN_API_KEY = ""
COIN_MARKET_API_KEY=""
NFT_STORAGE_TOKEN/REACT_APP_NFT_STORAGE_TOKEN = ""

DSGD_OWNER_PRIVATE_KEY = ""
DMYR_OWNER_PRIVATE_KEY = ""
MCBDC_OWNER_PRIVATE_KEY = ""
VOUCHER_OWNER_PRIVATE_KEY = ""
ECOMMERCE_OWNER_PRIVATE_KEY = ""

DSGDTOKEN_CONTRACT_ADDRESS/REACT_APP_DSGD_CONTRACT_ADDRESS = ""
DMYRTOKEN_CONTRACT_ADDRESS/REACT_APP_DMYR_CONTRACT_ADDRESS = ""
MCBDC_CONTRACT_ADDRESS/REACT_APP_MCBDC_CONTRACT_ADDRESS = ""
VOUCHER_CONTRACT_ADDRESS/REACT_APP_VOUCHER_CONTRACT_ADDRESS = ""
ECOMMERCE_CONTRACT_ADDRESS/REACT_APP_ECOMMERCE_CONTRACT_ADDRESS = ""

REACT_APP_DSGD_CONTRACT_OWNER = ""
REACT_APP_DMYR_CONTRACT_OWNER = ""
REACT_APP_VOUCHER_CONTRACT_OWNER = ""

```
Basic Commands:

```shell
npm run start
cd frontend && npm run start
```
Other Useful Commands:
```shell
npx hardhat test
npx hardhat run scripts/deploy.js
```
