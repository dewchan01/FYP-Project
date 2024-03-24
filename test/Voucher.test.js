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

    MCBDC = await ethers.getContractFactory("MCBDC");
    mcbdc = await MCBDC.connect(mcbdcTokenOwner).deploy();

    VoucherContract = await ethers.getContractFactory("VoucherContract");
    voucherContract = await VoucherContract.connect(owner).deploy(mcbdc.target);
    
    await dsgdToken.setAllowedContract(mcbdc.target);
    await mcbdc.addNewToken("SGD", dsgdToken.target);
  });

  it("should create and claim a voucher", async () => {
    await dsgdToken.mint(owner.address, 10);
    await voucherContract.connect(owner).createVoucher(
      "Campaign123",
      ["Product123"],
      Math.floor(Date.now() / 1000) + 3600, 
      50,
      10,
      "SGD",
      1, 
      "cid123"
    );

    const voucherId = Number(await voucherContract.checkVoucherId()) - 1;

    await voucherContract.connect(user).claimVoucher(voucherId);

    const isClaimed = await voucherContract.claimedList(user.address, voucherId);
    expect(isClaimed).to.be.true;

    const balance = await voucherContract.balanceOf(user.address, voucherId);
    expect(balance).to.equal(1);
  });

  it("should redeem vouchers", async () => {
    await dsgdToken.connect(dsgdTokenOwner).mint(seller.address, 13);
    await dsgdToken.connect(dsgdTokenOwner).mint(user.address, 20);
    await voucherContract.connect(seller).createVoucher("CampaignA", ["ProductC"], Math.floor(Date.now() / 1000) + 3600, 20, 5, "SGD", 1, "cidA");
    await voucherContract.connect(seller).createVoucher("CampaignB", ["ProductC"], Math.floor(Date.now() / 1000) + 3600, 20, 8, "SGD", 1, "cidB");

    const voucherIdA = Number(await voucherContract.checkVoucherId()) - 2;
    const voucherIdB = Number(await voucherContract.checkVoucherId()) - 1;

    await voucherContract.connect(user).claimVoucher(voucherIdA);
    await voucherContract.connect(user).claimVoucher(voucherIdB);

    await dsgdToken.connect(owner).approve(mcbdc.target,20);
    await voucherContract.connect(user).redeemVouchers([voucherIdA, voucherIdB], "ProductC", 20, "SGD", seller.address);
    expect(await dsgdToken.balanceOf(seller.address)).to.equal(13);

    expect(await voucherContract.balanceOf(user.address, voucherIdA)).to.equal(0);
    expect(await voucherContract.balanceOf(user.address, voucherIdB)).to.equal(0);

    expect(await voucherContract.claimedList(user.address, voucherIdA)).to.be.true;
    expect(await voucherContract.claimedList(user.address, voucherIdB)).to.be.true;

    expect(await voucherContract.balanceOf(owner.address, voucherIdA)).to.equal(0);
    expect(await voucherContract.balanceOf(owner.address, voucherIdB)).to.equal(0);
  });

  it("should burn expired vouchers", async () => {
    await dsgdToken.connect(dsgdTokenOwner).mint(seller.address, 20);
    await voucherContract.connect(seller).createVoucher("CampaignA", ["ProductA"], Math.floor(Date.now()/1000) + 3600, 20, 5, "SGD", 1, "cidA");
    await time.increase(3601); 

    await expect(voucherContract.connect(user).claimVoucher(0)).to.be.revertedWith('Voucher expired!')
    const expiredVoucherId = Number(await voucherContract.checkVoucherId()) - 1;

    await dsgdToken.connect(owner).approve(mcbdc.target,20);
    await voucherContract.connect(owner).burnVoucher();

    const expiredVoucherBalance = await voucherContract.balanceOf(owner.address, expiredVoucherId);
    expect(expiredVoucherBalance).to.equal(0);
  });

  it("should add and remove user from blacklist", async () => {
    await dsgdToken.connect(dsgdTokenOwner).mint(seller.address, 13);
    await voucherContract.connect(seller).createVoucher("CampaignA", ["ProductC"], Math.floor(Date.now() / 1000) + 3600 * 24 * 7, 20, 5, "SGD", 1, "cidA");

    await voucherContract.addToBlacklist(user.address);
    const voucherId = Number(await voucherContract.checkVoucherId()) -1;
    await expect(voucherContract.connect(user).claimVoucher(voucherId)).to.be.revertedWith('Recipient is blacklisted');
    await voucherContract.removeFromBlacklist(user.address);
    expect(await voucherContract.connect(user).claimVoucher(voucherId));
    expect(await voucherContract.balanceOf(user.address, voucherId)).to.equal(1);
  });
});
