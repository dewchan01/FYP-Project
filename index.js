const express = require("express");
const axios = require("axios");
require("dotenv").config();

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const app = express();
const port = 3001;

const web3 = createAlchemyWeb3(process.env.POLYGON_RPC_URL); // Replace with your Alchemy API key

const DSGDTokenAddress = process.env.DSGDTOKEN_CONTRACT_ADDRESS;
const DMYRTokenAddress = process.env.DMYRTOKEN_CONTRACT_ADDRESS;
const MCBDCContractAddress = process.env.MCBDC_CONTRACT_ADDRESS;
const EcommerceContractAddress = process.env.ECOMMERCE_CONTRACT_ADDRESS;

const DSGDTokenContractABI = require("./artifacts/contracts/DSGDToken.sol/DSGDToken.json").abi;
const DMYRTokenContractABI = require("./artifacts/contracts/DMYRToken.sol/DMYRToken.json").abi;
const MCBDCContractABI = require("./artifacts/contracts/MCBDC.sol/MCBDC.json").abi;
const EcommerceContractABI = require("./artifacts/contracts/Ecommerce.sol/Ecommerce.json").abi;

const MCBDCContract = new web3.eth.Contract(MCBDCContractABI, MCBDCContractAddress);
const DMYRTokenContract = new web3.eth.Contract(DMYRTokenContractABI, DMYRTokenAddress);
const DSGDTokenContract = new web3.eth.Contract(DSGDTokenContractABI, DSGDTokenAddress);
const EcommerceContract = new web3.eth.Contract(EcommerceContractABI, EcommerceContractAddress);

app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get("/getBalance", async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error fetching balance:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getHistory", async (req, res) => {
  const { userAddress } = req.query;
  console.log(userAddress);
  // Fetch transaction history using your smart contract ABI (modify based on your contract)
  const history = await MCBDCContract.methods.getMyHistory().call({from: userAddress});

  const jsonResponse = {
    history: history
  };
  console.log(jsonResponse);
  return res.status(200).json(jsonResponse);
});

app.get("/getRequests", async (req, res) => {
  const { userAddress } = req.query;
  // Fetch user requests using your smart contract ABI (modify based on your contract)
  const requests = await MCBDCContract.methods.getMyRequests().call({from: userAddress});

  const jsonResponseRequests = requests;
  const jsonResponse = {
    requests: jsonResponseRequests, // Modify this to include user requests
  };
  console.log(jsonResponse);
  return res.status(200).json(jsonResponse);
});

app.get("/getBalanceOfLink", async (req, res) => {
  const balanceOfLink = await MCBDCContract.methods._balanceOfLink().call();
  const jsonResponse = {
    balanceOfLink: balanceOfLink, // Modify this to include user requests
  };
  console.log(jsonResponse);
  return res.status(200).json(jsonResponse);
})

app.get("/getFXRate", async (req, res) => {
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

app.get("/showTokenAddress", async (req, res) => {
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

app.get("/allProducts", async (req, res) => {
  try {
    const allProductsLength = await EcommerceContract.methods.getProductsLength().call();
    const allProducts = [];

    for (let i = 0; i < allProductsLength; i++) {
      const product = await EcommerceContract.methods.allProducts(i).call();
      const productData = {
        index: i,
        productId: product[0],
        productName: product[1],
        category: product[2],
        price: product[3],
        priceCurrency: product[4],
        description: product[5],
        seller: product[6],
        isActive: product[7],
      };
      allProducts.push(productData);
    }

    return res.status(200).json(allProducts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/myOrders", async (req, res) => {
  try {
    const myOrdersLength = await EcommerceContract.methods.getMyOrdersLength().call();
    const allOrders = [];

    for (let i = 0; i < myOrdersLength; i++) {
      const order = await EcommerceContract.methods.myOrders(i).call();
      const orderData = {
        index: i,
        productId: order[0],
        orderStatus: order[1],
        purchaseId: order[2],
        shipmentStatus: order[3],
      };
      allOrders.push(orderData);
    }

    return res.status(200).json(allProducts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/ordersPlaced", async (req, res) => {
  try {
    const ordersPlacedLength = await EcommerceContract.methods.getOrdersPlacedLength().call();
    const allOrdersPlaced = [];

    for (let i = 0; i < ordersPlacedLength; i++) {
      const orderPlaced = await EcommerceContract.methods.getOrdersPlacedLength(i).call();
      const orderPlacedData = {
        index: i,
        productId: orderPlaced[0],
        orderStatus: orderPlaced[1],
        purchaseId: orderPlaced[2],
        shipmentStatus: orderPlaced[3],
      };
      allOrdersPlaced.push(orderPlacedData);
    }
    return res.status(200).json(allProducts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/seller/shipmentInfo", async (req, res) => {
  try {
    const { purchaseId } = req.query;
    const shipmentProductId = await EcommerceContract.methods.getShipmentAddress(purchaseId).call();
    const shipmentStatus = await EcommerceContract.methods.getShipmentStatus(purchaseId).call();
    const shipmentOrderedBy = await EcommerceContract.methods.getShipmentOrderedBy(purchaseId).call();
    const shipmentAddress = await EcommerceContract.methods.getShipmentAddress(purchaseId).call();

    const dataArray = {
      productId: shipmentProductId,
      status: shipmentStatus,
      orderedBy: shipmentOrderedBy,
      address: shipmentAddress
    };

    return res.status(200).json(dataArray);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.listen(port, () => {
  console.log(`Listening for API Calls on port ${port}`);
});
