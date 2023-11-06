const express = require("express");
const axios = require("axios");
require("dotenv").config();

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const app = express();
const port = 3001;

const web3 = createAlchemyWeb3(process.env.POLYGON_RPC_URL); // Replace with your Alchemy API key

const PaymentContractAddress = process.env.PAYMENT_CONTRACT_ADDRESS; // Replace with your smart contract address
const DSGDTokenAddress = process.env.DSGDTOKEN_CONTRACT_ADDRESS;
console.debug(PaymentContractAddress)
const PaymentContractABI = require("./artifacts/contracts/Payment.sol/Payment.json").abi;
const DSGDTokenContractABI = require("./artifacts/contracts/DSGDToken.sol/DSGDToken.json").abi;

function convertArrayToObjects(arr) {
    if (!Array.isArray(arr)) {
      // Handle the case where arr is not an array (e.g., empty or undefined)
      return [];
    }
  
    const dataArray = arr.map((transaction, index) => ({
      key: (arr.length + 1 - index).toString(),
      type: transaction[0],
      amount: transaction[1],
      message: transaction[2],
      address: `${transaction[3].slice(0, 4)}...${transaction[3].slice(0, 4)}`,
      subject: transaction[4],
    }));  
    return dataArray.reverse();
}

app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get("/getNameAndBalance", async (req, res) => {
  const { userAddress } = req.query;
  // Get the name
  const getNameFunction = new web3.eth.Contract(PaymentContractABI,PaymentContractAddress).methods.getMyName(userAddress);
  const name = await getNameFunction.call();

  // Get the balance
  const nativeBalance = await web3.eth.getBalance(userAddress);
  

  // Fetch native balance
  const balanceInEth = web3.utils.fromWei(nativeBalance, "ether");

  // Fetch token price (replace with the actual token address)
  const tokenPriceResponse = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=sgd`);

  // Convert balance to dollars (replace with the actual conversion rate) 
  const tokenPrice = tokenPriceResponse.data["matic-network"].sgd;

  // Calculate balance in dollars
  // const balanceInDollars = (balanceInEth * tokenPrice).toFixed(2);

  // Fetch transaction history using your smart contract ABI (modify based on your contract)
  const PaymentContract = new web3.eth.Contract(PaymentContractABI, PaymentContractAddress); // Replace with your contract address
  const history = await PaymentContract.methods.getMyHistory(userAddress).call();

  // Fetch user requests using your smart contract ABI (modify based on your contract)
  const requests = await PaymentContract.methods.getMyRequests(userAddress).call();
  
  const DSGDTokenContract = new web3.eth.Contract(DSGDTokenContractABI, DSGDTokenAddress); // Replace with your contract address
  const balance = await DSGDTokenContract.methods.balanceOf(userAddress).call();
  // Transform history and requests (modify based on your data structure)
  const jsonResponseHistory = convertArrayToObjects(history);
  const jsonResponseRequests = requests;

  const jsonResponse = {
    name,
    balance:balanceInEth,
    dollars: String(balance/(1e18)),
    history: jsonResponseHistory, // Modify this to include transaction history
    requests: jsonResponseRequests, // Modify this to include user requests
  };
  console.log(jsonResponse);
  return res.status(200).json(jsonResponse);
});

app.listen(port, () => {
  console.log(`Listening for API Calls on port ${port}`);
});
