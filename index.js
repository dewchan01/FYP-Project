const express = require("express");
const axios = require("axios");
require("dotenv").config();

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const app = express();
const port = 3001;

const web3 = createAlchemyWeb3(process.env.POLYGON_RPC_URL); // Replace with your Alchemy API key

// const PaymentContractAddress = process.env.PAYMENT_CONTRACT_ADDRESS; // Replace with your smart contract address
const DSGDTokenAddress = process.env.DSGDTOKEN_CONTRACT_ADDRESS;
const DMYRTokenAddress = process.env.DMYRTOKEN_CONTRACT_ADDRESS;
const MCBDCContractAddress = process.env.MCBDC_CONTRACT_ADDRESS;

// const PaymentContractABI = require("./artifacts/contracts/Payment.sol/Payment.json").abi;
const DSGDTokenContractABI = require("./artifacts/contracts/DSGDToken.sol/DSGDToken.json").abi;
const DMYRTokenContractABI = require("./artifacts/contracts/DMYRToken.sol/DMYRToken.json").abi;
const MCBDCContractABI = require("./artifacts/contracts/MCBDC.sol/MCBDC.json").abi;

const MCBDCContract = new web3.eth.Contract(MCBDCContractABI, MCBDCContractAddress); 
const DMYRTokenContract = new web3.eth.Contract(DMYRTokenContractABI, DMYRTokenAddress); 
const DSGDTokenContract = new web3.eth.Contract(DSGDTokenContractABI, DSGDTokenAddress); 

// function convertArrayToObjects(arr) {
//   if (!Array.isArray(arr)) {
//     // Handle the case where arr is not an array (e.g., empty or undefined)
//     return [];
//   }

//   const dataArray = arr.map((transaction, index) => ({
//     key: (arr.length + 1 - index).toString(),
//     type: transaction[0],
//     amount: transaction[1],
//     message: transaction[2],
//     address: `${transaction[3].slice(0, 4)}...${transaction[3].slice(0, 4)}`,
//     subject: transaction[4],
//   }));
//   return dataArray.reverse();
// }

app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get("/getBalance", async (req, res) => {
  const { userAddress } = req.query;

  // Get the balance
  const nativeBalance = await web3.eth.getBalance(userAddress);

  // Fetch native balance
  const balanceInEth = web3.utils.fromWei(nativeBalance, "ether");
  const DSGDbalance = await DSGDTokenContract.methods.balanceOf(userAddress).call();
  const DMYRbalance = await DMYRTokenContract.methods.balanceOf(userAddress).call();

  // Transform history and requests (modify based on your data structure)
  const jsonResponse = {
    balance: balanceInEth,
    sgd: String(DSGDbalance / (1e18)),
    myr: String(DMYRbalance / (1e18)),
  };
  console.log(jsonResponse);
  return res.status(200).json(jsonResponse);
});

app.get("/getHistory", async (req, res) => {
  const { userAddress } = req.query;

  // Fetch transaction history using your smart contract ABI (modify based on your contract)
  const history = await MCBDCContract.methods.getMyHistory(userAddress).call();

  const jsonResponse = {
    history: history
  };
  console.log(jsonResponse);
  return res.status(200).json(jsonResponse);
});

app.get("/getRequests", async (req, res) => {
  const { userAddress } = req.query;

  // Fetch user requests using your smart contract ABI (modify based on your contract)
  const requests = await MCBDCContract.methods.getMyRequests(userAddress).call();

  const jsonResponseRequests = requests;
  const jsonResponse = {
    requests: jsonResponseRequests, // Modify this to include user requests
  };
  console.log(jsonResponse);
  return res.status(200).json(jsonResponse);
});

app.get("/getBalanceOfLink",async(req,res)=>{
  const balanceOfLink = await MCBDCContract.methods._balanceOfLink().call();
  const jsonResponse = {
    balanceOfLink: balanceOfLink, // Modify this to include user requests
  };
  console.log(jsonResponse);
  return res.status(200).json(jsonResponse);
})

app.get("/getFXRate",async(req,res)=>{
  const rate = await MCBDCContract.methods.fxRateResponse().call();
  const expiringTime = await MCBDCContract.methods.responseExpiryTime().call();
  const checkAvailableRequests = await MCBDCContract.methods.isFxRateResponseValid().call();
  const jsonResponse = {
    rate: rate,
    expiringTime: expiringTime,
    availableStatus: checkAvailableRequests, 
  };
  console.log(jsonResponse);
  return res.status(200).json(jsonResponse);
})

app.get("/showTokenAddress",async(req,res)=>{
  try {
    const { token } = req.query;
    console.log("Symbol:", token);

    const tokenInfo = await MCBDCContract.methods.showToken(token).call();
    console.log("TokenInfo:", tokenInfo);

    const dataArray = {
      tokenSymbol: tokenInfo['0'],
      tokenAddress: tokenInfo['1'],
    };

    console.log("JsonResponse:", dataArray);

    return res.status(200).json(dataArray);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.listen(port, () => {
  console.log(`Listening for API Calls on port ${port}`);
});
