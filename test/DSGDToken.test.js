const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DSGDToken", () => {
  let DSGDToken;
  let dsgdToken;
  let owner;
  let allowedContract;
  let recipient;

  beforeEach(async () => {
    // Get accounts from the network
    [owner, allowedContract, recipient] = await ethers.getSigners();

    // Deploy DSGDToken contract using the deployContract helper
    DSGDToken = await ethers.getContractFactory("DSGDToken");
    dsgdToken = await DSGDToken.connect(owner).deploy();

    // Connect DSGDToken contract to the owner's signer
    dsgdToken = dsgdToken.connect(owner);
  });

  it("should deploy with the correct name and symbol", async () => {
    const name = await dsgdToken.name();
    const symbol = await dsgdToken.symbol();

    expect(name).to.equal("DSGD Token");
    expect(symbol).to.equal("DSGD");
  });

  it("should set allowed contract", async () => {
    await dsgdToken.setAllowedContract(allowedContract.address);

    const allowedContractAddress = await dsgdToken.allowedContract();
    expect(allowedContractAddress).to.equal(allowedContract.address);
  });

  it("should mint tokens to recipient", async () => {
    const amountToMint = 100;

    await dsgdToken.setAllowedContract(allowedContract.address);
    await dsgdToken.mint(recipient.address, amountToMint);

    const finalBalanceRecipient = await dsgdToken.balanceOf(recipient.address);
    expect(Number(finalBalanceRecipient)).to.equal(amountToMint);
  });

  it("should burn tokens from recipient", async () => {
    const amountToBurn = 30;

    await dsgdToken.mint(recipient.address, amountToBurn);
    const initialBalanceRecipient = await dsgdToken.balanceOf(recipient.address);
    await dsgdToken.burn(recipient.address, amountToBurn);

    const finalBalanceRecipient = await dsgdToken.balanceOf(recipient.address);
    expect(Number(finalBalanceRecipient)).to.equal(Number(initialBalanceRecipient) - amountToBurn);
  });


  it("should transfer from contract", async () => {
    const amountToMint = 100;
    const amountToTransfer = 50;

    await dsgdToken.setAllowedContract(allowedContract.address);
    await dsgdToken.mint(recipient.address, amountToMint);

    const initialBalanceRecipient = await dsgdToken.balanceOf(
      recipient.address
    );
    const initialBalanceAllowedContract = await dsgdToken.balanceOf(
      allowedContract.address
    );

    await dsgdToken.transferFromContract(
      recipient.address,
      allowedContract.address,
      amountToTransfer
    );

    const finalBalanceRecipient = await dsgdToken.balanceOf(recipient.address);
    const finalBalanceAllowedContract = await dsgdToken.balanceOf(
      allowedContract.address
    );

    expect(Number(finalBalanceRecipient)).to.equal(
      Number(initialBalanceRecipient) - amountToTransfer
    );
    expect(Number(finalBalanceAllowedContract)).to.equal(
      Number(initialBalanceAllowedContract) + amountToTransfer
    );
  });
});
