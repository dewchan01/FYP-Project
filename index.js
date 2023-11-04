const express = require("express");
const axios = require("axios");
require("dotenv").config();

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const app = express();
const port = 3001;

const web3 = createAlchemyWeb3(process.env.POLYGON_RPC_URL); // Replace with your Alchemy API key

const contractAddress = process.env.CONTRACT_ADDRESS; // Replace with your smart contract address
console.debug(contractAddress)
const contractABI = require("./artifacts/contracts/Payment.sol/Payment.json").abi;

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
  const getNameFunction = new web3.eth.Contract(contractABI,contractAddress).methods.getMyName(userAddress);
  const name = await getNameFunction.call();

  // Get the balance
  const balance = await web3.eth.getBalance(userAddress);

  // Fetch native balance
  const balanceInEth = web3.utils.fromWei(balance, "ether");

  // Fetch token price (replace with the actual token address)
  const tokenPriceResponse = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=sgd`);

  // Convert balance to dollars (replace with the actual conversion rate) 
  const tokenPrice = tokenPriceResponse.data["matic-network"].sgd;

  // Calculate balance in dollars
  const balanceInDollars = (balanceInEth * tokenPrice).toFixed(2);

  // Fetch transaction history using your smart contract ABI (modify based on your contract)
  const contract = new web3.eth.Contract(contractABI, contractAddress); // Replace with your contract address
  const history = await contract.methods.getMyHistory(userAddress).call();

  // Fetch user requests using your smart contract ABI (modify based on your contract)
  const requests = await contract.methods.getMyRequests(userAddress).call();

  // Transform history and requests (modify based on your data structure)
  const jsonResponseHistory = convertArrayToObjects(history);
  const jsonResponseRequests = requests;

  const jsonResponse = {
    name,
    balance,
    dollars: balanceInDollars,
    history: jsonResponseHistory, // Modify this to include transaction history
    requests: jsonResponseRequests, // Modify this to include user requests
  };
  console.log(jsonResponse);
  return res.status(200).json(jsonResponse);
});

app.listen(port, () => {
  console.log(`Listening for API Calls on port ${port}`);
});
