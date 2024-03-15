const express = require("express");
const serverless = require("serverless-http");
require("dotenv").config();

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

const app = express();
const router = express.Router();
const web3 = createAlchemyWeb3(process.env.POLYGON_RPC_URL);

const DSGDTokenAddress = process.env.DSGDTOKEN_CONTRACT_ADDRESS;
const DMYRTokenAddress = process.env.DMYRTOKEN_CONTRACT_ADDRESS;
const MCBDCContractAddress = process.env.MCBDC_CONTRACT_ADDRESS;
const ECommerceContractAddress = process.env.ECOMMERCE_CONTRACT_ADDRESS;
const VoucherContractAddress = process.env.VOUCHER_CONTRACT_ADDRESS;

const DSGDTokenContractABI = require("./ABI/DSGDToken.json");
const DMYRTokenContractABI = require("./ABI/DMYRToken.json");
const MCBDCContractABI = require("./ABI/MCBDC.json");
const ECommerceContractABI = require("./ABI/ECommerce.json");
const VoucherContractABI = require("./ABI/VoucherContract.json");

const MCBDCContract = new web3.eth.Contract(MCBDCContractABI, MCBDCContractAddress);
const DMYRTokenContract = new web3.eth.Contract(DMYRTokenContractABI, DMYRTokenAddress);
const DSGDTokenContract = new web3.eth.Contract(DSGDTokenContractABI, DSGDTokenAddress);
const ECommerceContract = new web3.eth.Contract(ECommerceContractABI, ECommerceContractAddress);
const VoucherContract = new web3.eth.Contract(VoucherContractABI, VoucherContractAddress);

router.get("/getBalance", async (req, res) => {
  try {
    const { userAddress } = req.query;

    // Get the balance
    console.log("balanceInEth");

    const nativeBalance = await web3.eth.getBalance(userAddress);
    console.log(nativeBalance);
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

router.get("/getHistory", async (req, res) => {
  try {
    const { userAddress } = req.query;
    console.log(userAddress);
    // Fetch transaction history using your smart contract ABI (modify based on your contract)
    const history = await MCBDCContract.methods.getMyHistory().call({ from: userAddress });

    const jsonResponse = {
      history: history
    };
    console.log(jsonResponse);
    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error fetching history:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getRequests", async (req, res) => {
  try {
    const { userAddress } = req.query;
    // Fetch user requests using your smart contract ABI (modify based on your contract)
    const requests = await MCBDCContract.methods.getMyRequests().call({ from: userAddress });

    const jsonResponseRequests = requests;
    const jsonResponse = {
      requests: jsonResponseRequests, // Modify this to include user requests
    };
    console.log(jsonResponse);
    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getBalanceOfLink", async (req, res) => {
  try {
    const balanceOfLink = await MCBDCContract.methods._balanceOfLink().call();
    const jsonResponse = {
      balanceOfLink: balanceOfLink, // Modify this to include user requests
    };
    console.log(jsonResponse);
    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Error fetching balance of link:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

router.get("/getFXRate", async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error fetching Fx Rate:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
})

router.get("/showTokenAddress", async (req, res) => {
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

router.get("/allProducts", async (req, res) => {
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

router.get("/myOrders", async (req, res) => {
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

router.get("/ordersPlaced", async (req, res) => {
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

router.get("/isValidUser", async (req, res) => {
  const { userAddress } = req.query;
  try {
    const isValidUser = await ECommerceContract.methods.checkValidUser(userAddress).call();
    return res.status(200).json(isValidUser);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
})

router.get("/isValidSeller", async (req, res) => {
  const { userAddress } = req.query;
  try {
    const sellerInfo = await ECommerceContract.methods.sellers(userAddress).call();
    const isValidSeller = (sellerInfo['1'] !== '0x0000000000000000000000000000000000000000');
    return res.status(200).json(isValidSeller);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
})
router.get("/getVoucherInfo", async (req, res) => {
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

router.get("/getAllVouchers", async (req, res) => {
  try {
    const voucherLength = await VoucherContract.methods.checkVoucherId().call();
    const allVouchersInfo = [];

    for (let i = 0; i < voucherLength; i++) {
      const voucher = await VoucherContract.methods.getVoucherInfo(i).call();

      // Map voucher data to the desired format
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

router.get("/getExpiredVouchers", async (req, res) => {
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

router.get("/getClaimedList", async (req, res) => {
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

router.get("/getBalanceOfVoucher", async (req, res) => {
  const { userAddress } = req.query;
  const voucherLength = await VoucherContract.methods._voucherId().call();
  const balancesOfVouchers = [];
  try {
    for (let i = 0; i < voucherLength; i++) {
      const balanceOfVoucher = await VoucherContract.methods.balanceOf(userAddress, i).call();
      balancesOfVouchers.push(balanceOfVoucher);
    }
    console.log(balancesOfVouchers);
    return res.status(200).json(balancesOfVouchers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }

})

app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app)