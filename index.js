const express = require("express");
require("dotenv").config();

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

const app = express();
app.use(express.json());
const db = require('./db/conn');
const port = 3001;
const web3 = createAlchemyWeb3(process.env.POLYGON_RPC_URL);

const DSGDTokenAddress = process.env.DSGDTOKEN_CONTRACT_ADDRESS;
const DMYRTokenAddress = process.env.DMYRTOKEN_CONTRACT_ADDRESS;
const MCBDCContractAddress = process.env.MCBDC_CONTRACT_ADDRESS;
const ECommerceContractAddress = process.env.ECOMMERCE_CONTRACT_ADDRESS;
const VoucherContractAddress = process.env.VOUCHER_CONTRACT_ADDRESS;

const DSGDTokenContractABI = require("./artifacts/contracts/DSGDToken.sol/DSGDToken.json").abi;
const DMYRTokenContractABI = require("./artifacts/contracts/DMYRToken.sol/DMYRToken.json").abi;
const MCBDCContractABI = require("./artifacts/contracts/MCBDC.sol/MCBDC.json").abi;
const ECommerceContractABI = require("./artifacts/contracts/ECommerce.sol/ECommerce.json").abi;
const VoucherContractABI = require("./artifacts/contracts/Voucher.sol/VoucherContract.json").abi;

const MCBDCContract = new web3.eth.Contract(MCBDCContractABI, MCBDCContractAddress);
const DMYRTokenContract = new web3.eth.Contract(DMYRTokenContractABI, DMYRTokenAddress);
const DSGDTokenContract = new web3.eth.Contract(DSGDTokenContractABI, DSGDTokenAddress);
const ECommerceContract = new web3.eth.Contract(ECommerceContractABI, ECommerceContractAddress);
const VoucherContract = new web3.eth.Contract(VoucherContractABI, VoucherContractAddress);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  next();
});

app.get("/db", async (req, res) => {
  try {
    let collection = await db.collection("visited_user");
    let distinctAddresses = await collection.aggregate([
      { $group: { _id: "$address" } },
      { $count: "count" }
    ]).next();
    
    let results = distinctAddresses ? distinctAddresses.count : 0;    
    console.log("Total visited user:", results);
    res.send(results.toString()).status(200);
  } catch (error) {
    console.error("Error when fetching visited user from db:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/user_last_log_in", async (req, res) => {
  try {
    const { userAddress } = req.query;
    let collection = await db.collection("visited_user");
    let results = await collection.findOne({ address: userAddress }, { sort: { time: -1 } });
    if (results) {
      console.log(results);
      res.send(results).status(200);
    } else {
      const timestampString = new Date().toJSON();
      res.send(timestampString).status(200);
    }
  } catch (error) {
    console.error("Error when fetching user log in time from db:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/db", async (req, res) => {
  try {
    console.log(req.body);
    let collection = await db.collection("visited_user");
    let results = await collection.insertOne(req.body);
    res.send(results).status(200);
  } catch (error) {
    console.error("Error when inserting data to db:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/getBalance", async (req, res) => {
  try {
    const { userAddress } = req.query;

    console.log("balanceInEth");

    const nativeBalance = await web3.eth.getBalance(userAddress);
    const balanceInEth = web3.utils.fromWei(nativeBalance, "ether");
    const DSGDbalance = await DSGDTokenContract.methods.balanceOf(userAddress).call();
    const DMYRbalance = await DMYRTokenContract.methods.balanceOf(userAddress).call();

    const jsonResponse = {
      balance: balanceInEth,
      sgd: String(DSGDbalance / (1e18)),
      myr: String(DMYRbalance / (1e18)),
    };
    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error fetching balance:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getHistory", async (req, res) => {
  try {
    const { userAddress } = req.query;
    console.log(userAddress);
    const history = await MCBDCContract.methods.getMyHistory().call({ from: userAddress });

    const jsonResponse = {
      history: history
    };
    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error fetching history:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getRequests", async (req, res) => {
  try {
    const { userAddress } = req.query;
    const requests = await MCBDCContract.methods.getMyRequests().call({ from: userAddress });

    const jsonResponseRequests = requests;
    const jsonResponse = {
      requests: jsonResponseRequests,
    };
    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getBalanceOfLink", async (req, res) => {
  try {
    const balanceOfLink = await MCBDCContract.methods._balanceOfLink().call();
    const jsonResponse = {
      balanceOfLink: balanceOfLink, 
    };
    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error fetching balance of link:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/getFXRate", async (req, res) => {
  try {
    const rate = await MCBDCContract.methods.fxRateResponse().call();
    const expiringTime = await MCBDCContract.methods.responseExpiryTime().call();
    const checkAvailableRequests = await MCBDCContract.methods.isFxRateResponseValid().call();
    const jsonResponse = {
      rate: rate,
      expiringTime: expiringTime,
      availableStatus: checkAvailableRequests,
    };
    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error fetching Fx Rate:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
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

    return res.status(200).json(dataArray);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/allProducts", async (req, res) => {
  try {
    const allProducts = await ECommerceContract.methods.getAllProducts().call();
    const allProductsInfo = allProducts.map(array => ({
      productId: array[0],
      productName: array[1],
      category: array[2],
      price: array[3],
      priceCurrency: array[4],
      description: array[5],
      seller: array[6],
      isActive: array[7]
    }));
    return res.status(200).json(allProductsInfo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/myOrders", async (req, res) => {
  const { userAddress } = req.query;
  try {
    const allOrders = await ECommerceContract.methods.myOrders().call({ from: userAddress });
    const allOrdersData = Object.keys(allOrders[0]).map((index) => ({
      productId: allOrders[0][index],
      orderStatus: allOrders[1][index],
      purchaseId: allOrders[2][index],
      shipmentStatus: allOrders[3][index],
    }));
    return res.status(200).json(allOrdersData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/ordersPlaced", async (req, res) => {
  const { userAddress } = req.query;
  try {
    const allOrdersPlaced = await ECommerceContract.methods.getOrdersPlaced().call({ from: userAddress });
    const allOrdersPlacedData = Object.keys(allOrdersPlaced[0]).map((index) => ({
      productId: allOrdersPlaced["0"][index],
      purchaseId: allOrdersPlaced["1"][index],
      orderedBy: allOrdersPlaced["2"][index],
      shipmentStatus: allOrdersPlaced["3"][index],
      deliveryAddress: allOrdersPlaced["4"][index],
      payByCurrency: allOrdersPlaced["5"][index],
      isCanceled: allOrdersPlaced['6'][index]
    }))
    return res.status(200).json(allOrdersPlacedData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/isValidUser", async (req, res) => {
  const { userAddress } = req.query;
  try {
    const isValidUser = await ECommerceContract.methods.checkValidUser(userAddress).call();
    return res.status(200).json(isValidUser);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/isValidSeller", async (req, res) => {
  const { userAddress } = req.query;
  try {
    const sellerInfo = await ECommerceContract.methods.sellers(userAddress).call();
    const isValidSeller = (sellerInfo['1'] !== '0x0000000000000000000000000000000000000000');
    return res.status(200).json(isValidSeller);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
})
app.get("/getVoucherInfo", async (req, res) => {
  const { voucherId } = req.query;
  try {
    const voucher = await VoucherContract.methods.getVoucherInfo(voucherId).call();
    const voucherInfo = {
      campaignId: voucher[0],
      voucherId: voucher[1],
      suitableProductIds: voucher[2],
      expirationDate: voucher[3],
      minSpend: voucher[4],
      value: voucher[5],
      valueCurrency: voucher[6],
      amount: voucher[7],
      organizer: voucher[8],
      uri: voucher[9],
    };
    return res.status(200).json(voucherInfo);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/getAllVouchers", async (req, res) => {
  try {
    const voucherLength = await VoucherContract.methods.checkVoucherId().call();
    const allVouchersInfo = [];

    for (let i = 0; i < voucherLength; i++) {
      const voucher = await VoucherContract.methods.getVoucherInfo(i).call();

      const voucherInfo = {
        campaignId: voucher[0],
        voucherId: voucher[1],
        suitableProductIds: voucher[2],
        expirationDate: voucher[3],
        minSpend: voucher[4],
        value: voucher[5],
        valueCurrency: voucher[6],
        amount: voucher[7],
        organizer: voucher[8],
        uri: voucher[9],
      };

      allVouchersInfo.push(voucherInfo);
    }

    return res.status(200).json(allVouchersInfo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/getExpiredVouchers", async (req, res) => {
  try {
    const vouchers = await VoucherContract.methods.getExpiredVouchers().call();
    const allExpiredVoucherIds = [];

    for (let i = 0; i < vouchers.length; i++) {
      allExpiredVoucherIds.push(vouchers[i]);
    }
    return res.status(200).json(allExpiredVoucherIds);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/getClaimedList", async (req, res) => {
  const { userAddress } = req.query;
  const voucherLength = await VoucherContract.methods.checkVoucherId().call();
  const allClaimedVoucherIds = [];
  try {
    for (let i = 0; i < voucherLength; i++) {
      const isVoucherClaimed = await VoucherContract.methods.claimedList(userAddress, i).call();
      if (isVoucherClaimed) {
        allClaimedVoucherIds.push(i.toString());
      }
    }
    return res.status(200).json(allClaimedVoucherIds);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

app.get("/getBalanceOfVoucher", async (req, res) => {
  const { userAddress } = req.query;
  const voucherLength = await VoucherContract.methods._voucherId().call();
  const balancesOfVouchers = [];
  try {
    for (let i = 0; i < voucherLength; i++) {
      const balanceOfVoucher = await VoucherContract.methods.balanceOf(userAddress, i).call();
      balancesOfVouchers.push(balanceOfVoucher);
    }
    return res.status(200).json(balancesOfVouchers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }

})
const server = app.listen(port, () => {
  console.log(`Listening for API Calls on port ${port}`);
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received. Closing server gracefully.');
  server.close(() => {
    console.log('Server closed. Exiting process.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.info('SIGINT signal received. Closing server gracefully.');
  server.close(() => {
    console.log('Server closed. Exiting process.');
    process.exit(0);
  });
});

//With cache implementation, not recommended due to blocking of rerendering

// const express = require("express");
// require("dotenv").config();

// const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

// const app = express();
// app.use(express.json());
// const port = 3001;
// const web3 = createAlchemyWeb3(process.env.POLYGON_RPC_URL);

// const DSGDTokenAddress = process.env.DSGDTOKEN_CONTRACT_ADDRESS;
// const DMYRTokenAddress = process.env.DMYRTOKEN_CONTRACT_ADDRESS;
// const MCBDCContractAddress = process.env.MCBDC_CONTRACT_ADDRESS;
// const ECommerceContractAddress = process.env.ECOMMERCE_CONTRACT_ADDRESS;
// const VoucherContractAddress = process.env.VOUCHER_CONTRACT_ADDRESS;

// const DSGDTokenContractABI = require("./artifacts/contracts/DSGDToken.sol/DSGDToken.json").abi;
// const DMYRTokenContractABI = require("./artifacts/contracts/DMYRToken.sol/DMYRToken.json").abi;
// const MCBDCContractABI = require("./artifacts/contracts/MCBDC.sol/MCBDC.json").abi;
// const ECommerceContractABI = require("./artifacts/contracts/ECommerce.sol/ECommerce.json").abi;
// const VoucherContractABI = require("./artifacts/contracts/Voucher.sol/VoucherContract.json").abi;

// const MCBDCContract = new web3.eth.Contract(MCBDCContractABI, MCBDCContractAddress);
// const DMYRTokenContract = new web3.eth.Contract(DMYRTokenContractABI, DMYRTokenAddress);
// const DSGDTokenContract = new web3.eth.Contract(DSGDTokenContractABI, DSGDTokenAddress);
// const ECommerceContract = new web3.eth.Contract(ECommerceContractABI, ECommerceContractAddress);
// const VoucherContract = new web3.eth.Contract(VoucherContractABI, VoucherContractAddress);

// app.use((_, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   next();
// });

// const NodeCache = require("node-cache");
// const myCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
// app.get("/getBalance", async (req, res) => {
//   try {
//     const { userAddress } = req.query;
//     const cacheKey = `balance-${userAddress}`;

//     // Check cache
//     const cachedBalance = myCache.get(cacheKey);
//     if (cachedBalance) {
//       console.log("Returning cached balance");
//       return res.status(200).json(cachedBalance);
//     }

//     // Get the balance
//     console.log("balanceInEth");

//     const nativeBalance = await web3.eth.getBalance(userAddress);
//     console.log(nativeBalance);
//     // Fetch native balance
//     const balanceInEth = web3.utils.fromWei(nativeBalance, "ether");
//     const DSGDbalance = await DSGDTokenContract.methods.balanceOf(userAddress).call();
//     const DMYRbalance = await DMYRTokenContract.methods.balanceOf(userAddress).call();

//     // Transform history and requests (modify based on your data structure)
//     const jsonResponse = {
//       balance: balanceInEth,
//       sgd: String(DSGDbalance / (1e18)),
//       myr: String(DMYRbalance / (1e18)),
//     };
//     console.log(jsonResponse);

//     // Set cache
//     myCache.set(cacheKey, jsonResponse);

//     return res.status(200).json(jsonResponse);
//   } catch (error) {
//     console.error("Error fetching balance:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// app.get("/getHistory", async (req, res) => {
//   try {
//     const { userAddress } = req.query;
//     const cacheKey = `history-${userAddress}`;

//     // Check cache
//     const cachedHistory = myCache.get(cacheKey);
//     if (cachedHistory) {
//       console.log("Returning cached history");
//       return res.status(200).json(cachedHistory);
//     }

//     // Fetch transaction history using your smart contract ABI (modify based on your contract)
//     const history = await MCBDCContract.methods.getMyHistory().call({ from: userAddress });

//     // Set cache

//     const jsonResponse = {
//       history: history
//     };
//     console.log(jsonResponse);
//     myCache.set(cacheKey, jsonResponse);
//     return res.status(200).json(jsonResponse);
//   } catch (error) {
//     console.error("Error fetching history:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// app.get("/getRequests", async (req, res) => {
//   try {
//     const { userAddress } = req.query;
//     const cacheKey = `requests-${userAddress}`;

//     // Check cache
//     const cachedRequests = myCache.get(cacheKey);
//     if (cachedRequests) {
//       console.log("Returning cached requests");
//       return res.status(200).json(cachedRequests);
//     }

//     // Fetch user requests using your smart contract ABI (modify based on your contract)
//     const requests = await MCBDCContract.methods.getMyRequests().call({ from: userAddress });

//     // Set cache

//     const jsonResponseRequests = requests;
//     const jsonResponse = {
//       requests: jsonResponseRequests, // Modify this to include user requests
//     };
//     console.log(jsonResponse);
//     myCache.set(cacheKey, jsonResponse);
//     return res.status(200).json(jsonResponse);
//   } catch (error) {
//     console.error("Error fetching requests:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// app.get("/getBalanceOfLink", async (req, res) => {
//   try {
//     const cacheKey = `balanceOfLink`;

//     // Check cache
//     const cachedBalanceOfLink = myCache.get(cacheKey);
//     if (cachedBalanceOfLink) {
//       console.log("Returning cached balance of link");
//       return res.status(200).json(cachedBalanceOfLink);
//     }

//     const balanceOfLink = await MCBDCContract.methods._balanceOfLink().call();

//     // Set cache
//     const jsonResponse = {
//       balanceOfLink: balanceOfLink, // Modify this to include user requests
//     };
//     console.log(jsonResponse);
//     myCache.set(cacheKey, jsonResponse);
//     return res.status(200).json(jsonResponse);
//   } catch (error) {
//     console.error("Error fetching balance of link:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// })

// app.get("/getFXRate", async (req, res) => {
//   try {
//     const cacheKey = `fxRate`;

//     // Check cache
//     const cachedFxRate = myCache.get(cacheKey);
//     if (cachedFxRate) {
//       console.log("Returning cached Fx Rate");
//       return res.status(200).json(cachedFxRate);
//     }

//     const rate = await MCBDCContract.methods.fxRateResponse().call();
//     const expiringTime = await MCBDCContract.methods.responseExpiryTime().call();
//     const checkAvailableRequests = await MCBDCContract.methods.isFxRateResponseValid().call();
//     const jsonResponse = {
//       rate: rate,
//       expiringTime: expiringTime,
//       availableStatus: checkAvailableRequests,
//     };

//     // Set cache
//     myCache.set(cacheKey, jsonResponse);

//     console.log(jsonResponse);
//     return res.status(200).json(jsonResponse);
//   } catch (error) {
//     console.error("Error fetching Fx Rate:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// })

// app.get("/showTokenAddress", async (req, res) => {
//   try {
//     const { token } = req.query;
//     console.log("Symbol:", token);

//     const cacheKey = `token-${token}`;

//     // Check cache
//     const cachedTokenInfo = myCache.get(cacheKey);
//     if (cachedTokenInfo) {
//       console.log("Returning cached TokenInfo");
//       return res.status(200).json(cachedTokenInfo);
//     }

//     const tokenInfo = await MCBDCContract.methods.showToken(token).call();
//     console.log("TokenInfo:", tokenInfo);

//     const dataArray = {
//       tokenSymbol: tokenInfo['0'],
//       tokenAddress: tokenInfo['1'],
//     };

//     // Set cache
//     myCache.set(cacheKey, dataArray);

//     console.log("JsonResponse:", dataArray);

//     return res.status(200).json(dataArray);
//   } catch (error) {
//     console.error("Error:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// })

// app.get("/allProducts", async (req, res) => {
//   const cacheKey = `allProducts`;

//   // Check cache
//   const cachedAllProducts = myCache.get(cacheKey);
//   if (cachedAllProducts) {
//     console.log("Returning cached all products");
//     return res.status(200).json(cachedAllProducts);
//   }

//   try {
//     const allProducts = await ECommerceContract.methods.getAllProducts().call();
//     const allProductsInfo = allProducts.map(array => ({
//       productId: array[0],
//       productName: array[1],
//       category: array[2],
//       price: array[3],
//       priceCurrency: array[4],
//       description: array[5],
//       seller: array[6],
//       isActive: array[7]
//     }));

//     // Set cache
//     myCache.set(cacheKey, allProductsInfo);

//     return res.status(200).json(allProductsInfo);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// })

// app.get("/myOrders", async (req, res) => {
//   const { userAddress } = req.query;
//   const cacheKey = `myOrders_${userAddress}`;

//   // Check cache
//   const cachedMyOrders = myCache.get(cacheKey);
//   if (cachedMyOrders) {
//     console.log("Returning cached my orders");
//     return res.status(200).json(cachedMyOrders);
//   }

//   try {
//     const allOrders = await ECommerceContract.methods.myOrders().call({ from: userAddress });
//     const allOrdersData = Object.keys(allOrders[0]).map((index) => ({
//       productId: allOrders[0][index],
//       orderStatus: allOrders[1][index],
//       purchaseId: allOrders[2][index],
//       shipmentStatus: allOrders[3][index],
//     }));

//     // Set cache
//     myCache.set(cacheKey, allOrdersData);

//     return res.status(200).json(allOrdersData);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// })

// app.get("/ordersPlaced", async (req, res) => {
//   const { userAddress } = req.query;
//   const cacheKey = `ordersPlaced_${userAddress}`;

//   // Check cache
//   const cachedOrdersPlaced = myCache.get(cacheKey);
//   if (cachedOrdersPlaced) {
//     console.log("Returning cached orders placed");
//     return res.status(200).json(cachedOrdersPlaced);
//   }

//   try {
//     const allOrdersPlaced = await ECommerceContract.methods.getOrdersPlaced().call({ from: userAddress });
//     const allOrdersPlacedData = Object.keys(allOrdersPlaced[0]).map((index) => ({
//       productId: allOrdersPlaced["0"][index],
//       purchaseId: allOrdersPlaced["1"][index],
//       orderedBy: allOrdersPlaced["2"][index],
//       shipmentStatus: allOrdersPlaced["3"][index],
//       deliveryAddress: allOrdersPlaced["4"][index],
//       payByCurrency: allOrdersPlaced["5"][index],
//       isCanceled: allOrdersPlaced['6'][index]
//     }))

//     // Set cache
//     myCache.set(cacheKey, allOrdersPlacedData);

//     return res.status(200).json(allOrdersPlacedData);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// })

// app.get("/isValidUser", async (req, res) => {
//   const { userAddress } = req.query;
//   const cacheKey = `isValidUser_${userAddress}`;

//   // Check cache
//   const cachedIsValidUser = myCache.get(cacheKey);
//   if (cachedIsValidUser) {
//     console.log("Returning cached isValidUser");
//     return res.status(200).json(cachedIsValidUser);
//   }

//   try {
//     const isValidUser = await ECommerceContract.methods.checkValidUser(userAddress).call();

//     // Set cache
//     myCache.set(cacheKey, isValidUser);

//     return res.status(200).json(isValidUser);
//   } catch (error) {
//     return res.status(500).json({ error: "Internal server error" });
//   }
// })

// app.get("/isValidSeller", async (req, res) => {
//   const { userAddress } = req.query;
//   const cacheKey = `isValidSeller_${userAddress}`;

//   // Check cache
//   const cachedIsValidSeller = myCache.get(cacheKey);
//   if (cachedIsValidSeller) {
//     console.log("Returning cached isValidSeller");
//     return res.status(200).json(cachedIsValidSeller);
//   }

//   try {
//     const sellerInfo = await ECommerceContract.methods.sellers(userAddress).call();
//     const isValidSeller = (sellerInfo['1'] !== '0x0000000000000000000000000000000000000000');

//     // Set cache
//     myCache.set(cacheKey, isValidSeller);

//     return res.status(200).json(isValidSeller);
//   } catch (error) {
//     return res.status(500).json({ error: "Internal server error" });
//   }
// })

// app.get("/getVoucherInfo", async (req, res) => {
//   const { voucherId } = req.query;
//   const cacheKey = `getVoucherInfo_${voucherId}`;

//   // Check cache
//   const cachedVoucherInfo = myCache.get(cacheKey);
//   if (cachedVoucherInfo) {
//     console.log("Returning cached voucher info");
//     return res.status(200).json(cachedVoucherInfo);
//   }

//   try {
//     const voucher = await VoucherContract.methods.getVoucherInfo(voucherId).call();
//     const voucherInfo = {
//       campaignId: voucher[0],
//       voucherId: voucher[1],
//       suitableProductIds: voucher[2],
//       expirationDate: voucher[3],
//       minSpend: voucher[4],
//       value: voucher[5],
//       valueCurrency: voucher[6],
//       amount: voucher[7],
//       organizer: voucher[8],
//       uri: voucher[9],
//     };

//     // Set cache
//     myCache.set(cacheKey, voucherInfo);

//     return res.status(200).json(voucherInfo);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// })

// app.get("/getAllVouchers", async (req, res) => {
//   const cacheKey = "getAllVouchers";

//   // Check cache
//   const cachedAllVouchersInfo = myCache.get(cacheKey);
//   if (cachedAllVouchersInfo) {
//     console.log("Returning cached all vouchers info");
//     return res.status(200).json(cachedAllVouchersInfo);
//   }
//   try {
//     const voucherLength = await VoucherContract.methods.checkVoucherId().call();
//     const allVouchersInfo = [];

//     for (let i = 0; i < voucherLength; i++) {
//       const voucher = await VoucherContract.methods.getVoucherInfo(i).call();

//       // Map voucher data to the desired format
//       const voucherInfo = {
//         campaignId: voucher[0],
//         voucherId: voucher[1],
//         suitableProductIds: voucher[2],
//         expirationDate: voucher[3],
//         minSpend: voucher[4],
//         value: voucher[5],
//         valueCurrency: voucher[6],
//         amount: voucher[7],
//         organizer: voucher[8],
//         uri: voucher[9],
//       };

//       allVouchersInfo.push(voucherInfo);
//     }

//       // Set cache
//       myCache.set(cacheKey, allVouchersInfo);


//     return res.status(200).json(allVouchersInfo);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// })

// app.get("/getExpiredVouchers", async (req, res) => {
//   const cacheKey = "getExpiredVouchers";

//   // Check cache
//   const cachedExpiredVouchers = myCache.get(cacheKey);
//   if (cachedExpiredVouchers) {
//     console.log("Returning cached expired vouchers");
//     return res.status(200).json(cachedExpiredVouchers);
//   }
//   try {
//     const vouchers = await VoucherContract.methods.getExpiredVouchers().call();
//     const allExpiredVoucherIds = [];

//     for (let i = 0; i < vouchers.length; i++) {
//       allExpiredVoucherIds.push(vouchers[i]);
//     }

//     myCache.set(cacheKey,cachedExpiredVouchers);
//     return res.status(200).json(allExpiredVoucherIds);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// })

// app.get("/getClaimedList", async (req, res) => {
//   const cacheKey = "getClaimedList";

//   // Check cache
//   const cachedClaimedList = myCache.get(cacheKey);
//   if (cachedClaimedList) {
//     console.log("Returning cached claimed list");
//     return res.status(200).json(cachedClaimedList);
//   }
//   const { userAddress } = req.query;
//   const voucherLength = await VoucherContract.methods.checkVoucherId().call();
//   const allClaimedVoucherIds = [];
//   try {
//     for (let i = 0; i < voucherLength; i++) {
//       const isVoucherClaimed = await VoucherContract.methods.claimedList(userAddress, i).call();
//       if (isVoucherClaimed) {
//         allClaimedVoucherIds.push(i.toString());
//       }
//     }
//     myCache.set(cacheKey, allClaimedVoucherIds);
//     return res.status(200).json(allClaimedVoucherIds);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// })

// app.get("/getBalanceOfVoucher", async (req, res) => {
//   const cacheKey = "getBalanceOfVoucher";

//   // Check cache
//   const cachedBalanceOfVoucher = myCache.get(cacheKey);
//   if (cachedBalanceOfVoucher) {
//     console.log("Returning cached balance of voucher");
//     return res.status(200).json(cachedBalanceOfVoucher);
//   }
//   const { userAddress } = req.query;
//   const voucherLength = await VoucherContract.methods._voucherId().call();
//   const balancesOfVouchers = [];
//   try {
//     for (let i = 0; i < voucherLength; i++) {
//       const balanceOfVoucher = await VoucherContract.methods.balanceOf(userAddress, i).call();
//       balancesOfVouchers.push(balanceOfVoucher);
//     }
//     console.log(balancesOfVouchers);
//     myCache.set(cacheKey, balancesOfVouchers);
//     return res.status(200).json(balancesOfVouchers);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal server error" });
//   }

// })
// const server = app.listen(port, () => {
//   console.log(`Listening for API Calls on port ${port}`);
// });

// process.on('SIGTERM', () => {
//   console.info('SIGTERM signal received. Closing server gracefully.');
//   server.close(() => {
//     console.log('Server closed. Exiting process.');
//     process.exit(0);
//   });
// });

// process.on('SIGINT', () => {
//   console.info('SIGINT signal received. Closing server gracefully.');
//   server.close(() => {
//     console.log('Server closed. Exiting process.');
//     process.exit(0);
//   });
// });
