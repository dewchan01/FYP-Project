const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("VoucherContract", () => {
  let VoucherContract;
  let voucherContract;
  let MCBDC;
  let mcbdc;
  let owner;
  let allowedContract;
  let recipient;
  let seller;

  beforeEach(async () => {
    [owner, dsgdTokenOwner, mcbdcTokenOwner, allowedContract, recipient,user,seller] = await ethers.getSigners();

    DSGDToken = await ethers.getContractFactory("DSGDToken");
    dsgdToken = await DSGDToken.connect(dsgdTokenOwner).deploy();

    // Deploy MCBDC contract
    MCBDC = await ethers.getContractFactory("MCBDC");
    mcbdc = await MCBDC.connect(mcbdcTokenOwner).deploy();

    // Deploy VoucherContract contract and connect it to MCBDC
    VoucherContract = await ethers.getContractFactory("VoucherContract");
    voucherContract = await VoucherContract.connect(owner).deploy(mcbdc.target);
    
    await dsgdToken.setAllowedContract(mcbdc.target);
    await mcbdc.addNewToken("SGD", dsgdToken.target);
  });

  it("should create and claim a voucher", async () => {
    await dsgdToken.mint(owner.address, 10);
    // Create a voucher
    await voucherContract.connect(owner).createVoucher(
      "Campaign123",
      ["Product123"],
      Math.floor(Date.now() / 1000) + 3600, // Expiration time 1 hour from now
      50, // Min spend
      10, // Value
      "SGD",
      1, // Amount
      "cid123"
    );

    // Get the voucher ID
    const voucherId = Number(await voucherContract.checkVoucherId()) - 1;

    // Claim the voucher
    await voucherContract.connect(user).claimVoucher(voucherId);

    // Check if the voucher has been claimed
    const isClaimed = await voucherContract.claimedList(user.address, voucherId);
    expect(isClaimed).to.be.true;

    // Check if the voucher balance has been transferred to the recipient
    const balance = await voucherContract.balanceOf(user.address, voucherId);
    expect(balance).to.equal(1);
  });

  it("should redeem vouchers", async () => {
    // Create multiple vouchers
    await dsgdToken.connect(dsgdTokenOwner).mint(seller.address, 13);
    await dsgdToken.connect(dsgdTokenOwner).mint(user.address, 20);
    await voucherContract.connect(seller).createVoucher("CampaignA", ["ProductC"], Math.floor(Date.now() / 1000) + 3600, 20, 5, "SGD", 1, "cidA");
    await voucherContract.connect(seller).createVoucher("CampaignB", ["ProductC"], Math.floor(Date.now() / 1000) + 3600, 20, 8, "SGD", 1, "cidB");

    // Get the voucher IDs
    const voucherIdA = Number(await voucherContract.checkVoucherId()) - 2;
    const voucherIdB = Number(await voucherContract.checkVoucherId()) - 1;

    // Claim the vouchers
    await voucherContract.connect(user).claimVoucher(voucherIdA);
    await voucherContract.connect(user).claimVoucher(voucherIdB);

    await dsgdToken.connect(owner).approve(mcbdc.target,20);
    // Redeem the vouchers
    await voucherContract.connect(user).redeemVouchers([voucherIdA, voucherIdB], "ProductC", 20, "SGD", seller.address);
    // Check if the original price is correct
    expect(await dsgdToken.balanceOf(seller.address)).to.equal(13);

    // Check if the voucher balances have been transferred to the recipient
    expect(await voucherContract.balanceOf(user.address, voucherIdA)).to.equal(0);
    expect(await voucherContract.balanceOf(user.address, voucherIdB)).to.equal(0);

    // Check if the voucher IDs have been removed from the claimedList
    expect(await voucherContract.claimedList(user.address, voucherIdA)).to.be.true;
    expect(await voucherContract.claimedList(user.address, voucherIdB)).to.be.true;

    // Check if the voucher IDs have been removed from the voucherId array
    expect(await voucherContract.balanceOf(owner.address, voucherIdA)).to.equal(0);
    expect(await voucherContract.balanceOf(owner.address, voucherIdB)).to.equal(0);
  });

  it("should burn expired vouchers", async () => {
    // Create an expired voucher
    await dsgdToken.connect(dsgdTokenOwner).mint(seller.address, 20);
    await voucherContract.connect(seller).createVoucher("CampaignA", ["ProductA"], Math.floor(Date.now()/1000) + 3600, 20, 5, "SGD", 1, "cidA");
    await time.increase(3601); // Increase time by 1 hour

    await expect(voucherContract.connect(user).claimVoucher(0)).to.be.revertedWith('Voucher expired!')
    // Get the expired voucher ID
    const expiredVoucherId = Number(await voucherContract.checkVoucherId()) - 1;

    await dsgdToken.connect(owner).approve(mcbdc.target,20);
    // Burn expired vouchers
    await voucherContract.connect(owner).burnVoucher();

    // Check if the expired voucher balance is 0 after burning
    const expiredVoucherBalance = await voucherContract.balanceOf(owner.address, expiredVoucherId);
    expect(expiredVoucherBalance).to.equal(0);
  });

  it("should add and remove user from blacklist", async () => {
    await dsgdToken.connect(dsgdTokenOwner).mint(seller.address, 13);
    await voucherContract.connect(seller).createVoucher("CampaignA", ["ProductC"], Math.floor(Date.now() / 1000) + 3600 * 24 * 7, 20, 5, "SGD", 1, "cidA");
    // Add user to the blacklist
    console.log(Math.floor(Date.now()/1000) + 3600)

    await voucherContract.addToBlacklist(user.address);
    const voucherId = Number(await voucherContract.checkVoucherId()) -1;
    await expect(voucherContract.connect(user).claimVoucher(voucherId)).to.be.revertedWith('Recipient is blacklisted');
    // Remove user from the blacklist
    await voucherContract.removeFromBlacklist(user.address);
    expect(await voucherContract.connect(user).claimVoucher(voucherId));
    expect(await voucherContract.balanceOf(user.address, voucherId)).to.equal(1);
  });
});
