const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ECommerce", () => {
  let ECommerce;
  let ecommerce;
  let MCBDC;
  let mcbdc;
  let VoucherContract;
  let voucherContract;
  let owner;
  let dsgdToken;
  let DSGDToken;
  let dsgdTokenOwner;
  let user;
  let seller;
  let organizer;

  beforeEach(async () => {
    [owner, dsgdTokenOwner, user, seller,organizer] = await ethers.getSigners();

    DSGDToken = await ethers.getContractFactory("DSGDToken");
    dsgdToken = await DSGDToken.connect(dsgdTokenOwner).deploy();
    
    MCBDC = await ethers.getContractFactory("MCBDC");
    mcbdc = await MCBDC.connect(owner).deploy();

    VoucherContract = await ethers.getContractFactory("VoucherContract");
    voucherContract = await VoucherContract.connect(owner).deploy(mcbdc.target);

    ECommerce = await ethers.getContractFactory("ECommerce");
    ecommerce = await ECommerce.connect(owner).deploy(mcbdc.target, voucherContract.target);

    await dsgdToken.setAllowedContract(mcbdc.target);
    await mcbdc.addNewToken("SGD", dsgdToken.target);

    await dsgdToken.connect(dsgdTokenOwner).mint(user.address, 100);
    await dsgdToken.connect(dsgdTokenOwner).mint(organizer.address, 100);

    await ecommerce.connect(seller).sellerSignUp("Seller Name");
    await ecommerce.connect(seller).addProduct(
      "prod123",
      "Product Name",
      "Category",
      "SGD",
      10,
      "Product Description"
    );

    await ecommerce.connect(user).createAccount("User Name", "user@example.com", "Delivery Address");

    await voucherContract.connect(organizer).createVoucher(
      "Campaign123",
      ["prod123"],
      Math.floor(Date.now() / 1000) + 3600,
      10, 
      1,
      "SGD",
      10, 
      "cid123"
    );

    const voucherId = Number(await voucherContract.checkVoucherId()) - 1;

    await voucherContract.connect(user).claimVoucher(voucherId);

    await dsgdToken.connect(owner).approve(mcbdc.target, 1);

    expect(await ecommerce.connect(user).buyProduct("prod123", "SGD", [voucherId]))
    expect(await dsgdToken.balanceOf(user.address)).to.equal(91);
    expect(await dsgdToken.balanceOf(organizer.address)).to.equal(90);
    expect(await dsgdToken.balanceOf(seller.address)).to.equal(10);
  });

  it("should add a product and allow user to buy with voucher", async () => {
    const shipmentInfo = await ecommerce.connect(user).myOrders();
    expect(shipmentInfo[0][0]).to.be.equal("prod123");
    expect(shipmentInfo[1][0]).to.be.equal("Order Placed With Seller");
    expect(shipmentInfo[2][0]).to.be.equal(0); 
  });

it("should update shipment status by seller", async () => {
    expect(await ecommerce.connect(seller).updateShipment(0, "Shipped"))
    const shipmentInfo = await ecommerce.connect(user).myOrders();
    expect(shipmentInfo[3][0]).to.be.equal("Shipped"); 
  });
  
  it("should allow user to cancel an order and receive a refund", async () => {

    expect(await ecommerce.connect(user).cancelOrder("prod123", 0))
    const shipmentInfo = await ecommerce.connect(user).myOrders();
    expect(shipmentInfo[3][0]).to.be.equal("Order Canceled By Buyer, Payment will Be Refunded");
    expect(await ecommerce.connect(seller).refund("prod123", 0));
    const userBalance = await dsgdToken.balanceOf(user.address);
    expect(userBalance).to.equal(100); 
    const sellerBalance = await dsgdToken.balanceOf(seller.address);
    expect(sellerBalance).to.equal(1);

  });
  
  it("should get all products", async () => {
    await ecommerce.connect(seller).addProduct("prod1", "Product 1", "Category", "SGD", 100, "Description 1");
    await ecommerce.connect(seller).addProduct("prod2", "Product 2", "Category", "SGD", 150, "Description 2");
    await ecommerce.connect(seller).addProduct("prod3", "Product 3", "Category", "SGD", 200, "Description 3");
  
    const allProducts = await ecommerce.getAllProducts();
    expect(allProducts.length).to.equal(4);
    expect(allProducts[1].productId).to.equal("prod1");
    expect(allProducts[2].productId).to.equal("prod2");
    expect(allProducts[3].productId).to.equal("prod3");
  });
  
  it("should get user's order details", async () => {
    
    await ecommerce.connect(seller).addProduct("prod4", "Product Name", "Category", "SGD", 300, "Product Description");
  
    await dsgdToken.mint(user.address, 300);
    await ecommerce.connect(user).buyProduct("prod4", "SGD", []);
  
    const [productIds, orderStatuses, purchaseIds, shipmentStatuses] = await ecommerce.connect(user).myOrders();
    expect(productIds.length).to.equal(2);
    expect(productIds[1]).to.equal("prod4");
    expect(orderStatuses[1]).to.equal("Order Placed With Seller");
    expect(purchaseIds[1]).to.equal(1); 
    expect(shipmentStatuses[1]).to.equal(""); 
  });
  
  it("should get seller's orders placed details", async () => {
    
    const [productIds, purchaseIds, orderedBys, shipmentStatuses, deliveryAddresses, payByCurrencies, areCanceled] = await ecommerce.connect(seller).getOrdersPlaced();
    expect(productIds.length).to.equal(1);
    expect(productIds[0]).to.equal("prod123");
    expect(purchaseIds[0]).to.equal(0); 
    expect(orderedBys[0]).to.equal(user.address);
    expect(shipmentStatuses[0]).to.equal(""); 
    expect(deliveryAddresses[0]).to.equal("Delivery Address");
    expect(payByCurrencies[0]).to.equal("SGD");
    expect(areCanceled[0]).to.equal(false); 
  });
  
  it("should check if a user is valid", async () => {
    await ecommerce.connect(user).createAccount("User Name", "user@example.com", "Delivery Address");
  
    const isValidUser = await ecommerce.checkValidUser(user.address);
    expect(isValidUser).to.equal(true);
  });
    });
