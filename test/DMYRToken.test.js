const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DMYRToken", () => {
  let DMYRToken;
  let dmyrToken;
  let owner;
  let allowedContract;
  let recipient;

  beforeEach(async () => {
    // Get accounts from the network
    [owner, allowedContract, recipient] = await ethers.getSigners();

    // Deploy DMYRToken contract using the deployContract helper
    DMYRToken = await ethers.getContractFactory("DMYRToken");
    dmyrToken = await DMYRToken.connect(owner).deploy();

    // Connect DMYRToken contract to the owner's signer
    dmyrToken = dmyrToken.connect(owner);
  });

  it("should deploy with the correct name and symbol", async () => {
    const name = await dmyrToken.name();
    const symbol = await dmyrToken.symbol();

    expect(name).to.equal("DMYR Token");
    expect(symbol).to.equal("DMYR");
  });

  it("should set allowed contract", async () => {
    await dmyrToken.setAllowedContract(allowedContract.address);

    const allowedContractAddress = await dmyrToken.allowedContract();
    expect(allowedContractAddress).to.equal(allowedContract.address);
  });

  it("should mint tokens to recipient", async () => {
    const amountToMint = 100;

    await dmyrToken.setAllowedContract(allowedContract.address);
    await dmyrToken.mint(recipient.address, amountToMint);

    const finalBalanceRecipient = await dmyrToken.balanceOf(recipient.address);
    expect(Number(finalBalanceRecipient)).to.equal(amountToMint);
});

it("should burn tokens from recipient", async () => {
    const amountToBurn = 30;

    await dmyrToken.mint(recipient.address, amountToBurn);
    const initialBalanceRecipient = await dmyrToken.balanceOf(recipient.address);
    await dmyrToken.burn(recipient.address, amountToBurn);

    const finalBalanceRecipient = await dmyrToken.balanceOf(recipient.address);
    expect(Number(finalBalanceRecipient)).to.equal(Number(initialBalanceRecipient) - amountToBurn);
});

  it("should transfer from contract", async () => {
    const amountToMint = 100;
    const amountToTransfer = 50;

    await dmyrToken.setAllowedContract(allowedContract.address);
    await dmyrToken.mint(recipient.address, amountToMint);

    const initialBalanceRecipient = await dmyrToken.balanceOf(
      recipient.address
    );
    const initialBalanceAllowedContract = await dmyrToken.balanceOf(
      allowedContract.address
    );

    await dmyrToken.transferFromContract(
      recipient.address,
      allowedContract.address,
      amountToTransfer
    );

    const finalBalanceRecipient = await dmyrToken.balanceOf(recipient.address);
    const finalBalanceAllowedContract = await dmyrToken.balanceOf(
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
