const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MCBDC Contract", function () {
    let MCBDC;
    let mcbdc;
    let owner;
    let user;
    let DSGDToken;
    let dsgdTokenOwner;
    let dsgdToken

    beforeEach(async () => {
        [owner, dsgdTokenOwner, allowedContract, recipient] = await ethers.getSigners();
        DSGDToken = await ethers.getContractFactory("DSGDToken");
        MCBDC = await ethers.getContractFactory("MCBDC");
        dsgdToken = await DSGDToken.connect(dsgdTokenOwner).deploy();
        mcbdc = await MCBDC.connect(owner).deploy();
        await dsgdToken.setAllowedContract(mcbdc.target);
    });

    it("should add a new supported token", async () => {
        const tokenSymbol = "SGD";
        const tokenAddress = dsgdToken.target;

        await mcbdc.addNewToken(tokenSymbol, tokenAddress);

        const tokenInfo = await mcbdc.supportedTokens(tokenSymbol);
        expect(tokenInfo.tokenAddress).to.equal(tokenAddress);
        expect(tokenInfo.tokenSymbol).to.equal(tokenSymbol);
    });

    it("should create and pay a request", async () => {
        const [sender, recipient] = await ethers.getSigners();
        const targetCurrency = "SGD";
        const tokenAddress = dsgdToken.target;
        const message = "Payment for services";

        await mcbdc.addNewToken(targetCurrency, tokenAddress);
        await dsgdToken.mint(sender.address, 100);
        expect(await dsgdToken.balanceOf(sender.address)).to.equal(100);

        await mcbdc.connect(recipient).createRequest(sender.address, 100, "SGD", "Payment for services");
        const senderRequests = await mcbdc.connect(sender).getMyRequests();
        expect(senderRequests.length).to.equal(1);

        await mcbdc.connect(sender).payRequest(0, "SGD");
        const recipientRequests = await mcbdc.connect(recipient).getMyRequests();
        expect(recipientRequests.length).to.equal(0);

        const recipientHistory = await mcbdc.connect(recipient).getMyHistory(recipient);
        const senderHistory = await mcbdc.connect(sender).getMyHistory(sender);
        expect(recipientHistory.length).to.equal(1);
        expect(senderHistory.length).to.equal(1);
        const paymentEntry = recipientHistory[0];
        expect(paymentEntry.amount).to.equal(100);
        expect(paymentEntry.fromCurrency).to.equal(targetCurrency);
        expect(paymentEntry.targetCurrency).to.equal(targetCurrency);
        expect(paymentEntry.message).to.equal(message);
        expect(paymentEntry.amount).to.equal(senderHistory[0].amount);
        expect(paymentEntry.fromCurrency).to.equal(senderHistory[0].fromCurrency);
        expect(paymentEntry.targetCurrency).to.equal(senderHistory[0].targetCurrency);
        expect(paymentEntry.message).to.equal(senderHistory[0].message);
    });

    it("should add and remove a supported token", async () => {
        const newTokenSymbol = "DMYR";
        const newTokenAddress = owner.address;

        await mcbdc.addNewToken(newTokenSymbol, newTokenAddress);
        const addedTokenInfo = await mcbdc.supportedTokens(newTokenSymbol);
        expect(addedTokenInfo.tokenAddress).to.equal(newTokenAddress);
        expect(addedTokenInfo.tokenSymbol).to.equal(newTokenSymbol);

        await mcbdc.removeToken(newTokenSymbol);
        const removedTokenInfo = await mcbdc.supportedTokens(newTokenSymbol);
        expect(removedTokenInfo.tokenAddress).to.equal("0x0000000000000000000000000000000000000000");
        expect(removedTokenInfo.tokenSymbol).to.equal("");
    });

    it("should delete a request", async () => {
        const targetCurrency = "DMYR";
        const message = "Test request deletion";

        await mcbdc.addNewToken(targetCurrency, owner.address);
    
        await mcbdc.createRequest(owner.address, 100, targetCurrency, message);
        const userRequestsBefore = await mcbdc.getMyRequests();
        expect(userRequestsBefore.length).to.equal(1);
    
        await mcbdc.deleteRequest(0);
        const userRequestsAfter = await mcbdc.getMyRequests();
        expect(userRequestsAfter.length).to.equal(0);
    });
    
    it("should perform a local transfer", async () => {
        const [owner,recipient] = await ethers.getSigners();
        const amount = 50;
        const currency = "DSGD";
        const message = "Test local transfer";
        await mcbdc.addNewToken(currency, dsgdToken.target);
    
        await dsgdToken.mint(owner.address, 100);
    
        await mcbdc.localTransfer(recipient.address, amount, currency, message, false, "0x0000000000000000000000000000000000000000");
    
        const balanceRecipient = await dsgdToken.balanceOf(recipient.address);
        expect(balanceRecipient).to.equal(amount);
    
        const recipientHistory = await mcbdc.getMyHistory(recipient);
        expect(recipientHistory.length).to.equal(1);
        const transferredEvent = recipientHistory[0];
        expect(transferredEvent.sender).to.equal(owner.address);
        expect(transferredEvent.recipient).to.equal(recipient);
        expect(transferredEvent.amount).to.equal(amount);
        expect(transferredEvent.fromCurrency).to.equal(currency);
        expect(transferredEvent.targetCurrency).to.equal(currency);
        expect(transferredEvent.message).to.equal(message);
    });   
    
    xit("should perform a token swap", async () => {
        const fromCurrency = "TEST";
        const toCurrency = "USDC";
        const amountToSwap = 100;

        await mcbdc.addNewToken(fromCurrency, owner.address);
        await mcbdc.addNewToken(toCurrency, owner.address);

        const LinkToken = await ethers.getContractFactory("LinkToken");
        const linkToken = await LinkToken.deploy();
        await linkToken.deployed();
        await linkToken.transfer(mcbdc.address, ethers.utils.parseEther("0.1"));

        await mcbdc.requestFxRate(fromCurrency, toCurrency);
        const fxRateBefore = await mcbdc.getFxRateInfo();

        await mcbdc.swapToken(amountToSwap, user.address, fromCurrency, toCurrency, "Test Swap");

        const fxRateAfter = await mcbdc.getFxRateInfo();
        expect(fxRateAfter[0]).to.not.equal(fxRateBefore[0]);
        expect(fxRateAfter[1]).to.equal(true); 
        const userHistory = await mcbdc.getMyHistory();
        expect(userHistory.length).to.equal(1);
        const swapEntry = userHistory[0];
        expect(swapEntry.amount).to.equal(amountToSwap);
        expect(swapEntry.fromCurrency).to.equal(fromCurrency);
        expect(swapEntry.targetCurrency).to.equal(toCurrency);
        expect(swapEntry.message).to.equal("Test Swap");
    });

});
