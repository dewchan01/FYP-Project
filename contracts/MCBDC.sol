// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract MCBDC is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    struct Attribute {
        address sender;
        address recipient;
        uint256 amount;
        uint256 toAmount;
        string fromCurrency;
        string targetCurrency;
        string message;
    }

    struct TokenInfo {
        address tokenAddress;
        string tokenSymbol;
    }
    address immutable owner;
    string private chainlinkJobId;
    uint256 private chainlinkFee;
    bytes32 private jobId;
    uint256 private fee;
    uint256 public fxRateResponse;
    uint256 public _balanceOfLink;
    uint256 public fxRateResponseTimestamp;
    uint256 public responseExpiryTime = 180; // Set the expiration time in seconds

    mapping(address => Attribute[]) public history;
    mapping(address => Attribute[]) public requests;
    mapping(string => TokenInfo) public supportedTokens;

    event CurrencyAdded(string currency, address tokenAddress);
    event RequestVolume(bytes32 indexed requestId, uint256 fxRateResponse);

    constructor() {
        setChainlinkToken(0x326C977E6efc84E512bB9C30f76E30c160eD06FB);
        setChainlinkOracle(0x40193c8518BB267228Fc409a613bDbD8eC5a97b3);
        jobId = "ca98366cc7314957b8c012c72f05aeeb";
        fee = (1 * LINK_DIVISIBILITY) / 10; // 0.1 * 10**18 (Varies by network and job)
        owner = msg.sender;
    }

    function addHistory(
        address recipient,
        uint256 amount,
        uint256 toAmount,
        string memory fromCurrency,
        string memory targetCurrency,
        string memory message
    ) public {
        Attribute memory newHistory;
        newHistory.sender = tx.origin;
        newHistory.recipient = recipient;
        newHistory.amount = amount;
        newHistory.toAmount = toAmount;
        newHistory.fromCurrency = fromCurrency;
        newHistory.targetCurrency = targetCurrency;
        newHistory.message = message;
        if (tx.origin != recipient) {
            history[tx.origin].push(newHistory);
            history[recipient].push(newHistory);
        } else {
            history[tx.origin].push(newHistory);
        }
    }

    function getMyHistory()
        public
        view
        returns (Attribute[] memory)
    {
        return history[tx.origin];
    }

    function swapToken(
        uint256 amount,
        address recipient,
        string memory fromCurrency,
        string memory toCurrency,
        string memory message
    ) public {
        // Add at least 0.1 link token to this contract
        // Request fx rate in client side
        require(
            supportedTokens[fromCurrency].tokenAddress != address(0),
            "From token not supported"
        );
        require(
            supportedTokens[toCurrency].tokenAddress != address(0),
            "To token not supported"
        );

        (,bytes memory balance ) = supportedTokens[fromCurrency].tokenAddress.call(
            abi.encodeWithSignature("balanceOf(address)", tx.origin)
        );
        require(abi.decode(balance, (uint256))>=amount, "Not enough balance");

        address fromToken = supportedTokens[fromCurrency].tokenAddress;
        address toToken = supportedTokens[toCurrency].tokenAddress;

        require(fxRateResponse > 0, "Invalid FX Rate!");
        require(isFxRateResponseValid(), "Fx Rate has expired!");

        (bool successBurn, ) = fromToken.call(
            abi.encodeWithSignature("burn(address,uint256)", tx.origin, amount)
        );
        require(successBurn, "Burn failed");

        uint256 amountToMint = (amount * fxRateResponse) / 10**18;
        addHistory(
            recipient,
            amount,
            amountToMint,
            fromCurrency,
            toCurrency,
            message
        );
        (bool successMint, ) = toToken.call(
            abi.encodeWithSignature(
                "mint(address,uint256)",
                recipient,
                amountToMint
            )
        );
        require(successMint, "Mint failed");
    }

    function requestFxRate(string memory fromCurrency, string memory toCurrency)
        public
        returns (bytes32 requestId)
    {
        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );
        req.add(
            "get",
            string(
                abi.encodePacked(
                    "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=",
                    fromCurrency,
                    "&tsyms=",
                    toCurrency
                )
            )
        );
        req.add(
            "path",
            string(
                abi.encodePacked(
                    "RAW,",
                    fromCurrency,
                    ",",
                    toCurrency,
                    ",PRICE"
                )
            )
        );

        int256 timesAmount = 10**18;
        req.addInt("times", timesAmount);
        fxRateResponseTimestamp = block.timestamp;
        return sendChainlinkRequest(req, fee);
    }

    function fulfill(bytes32 _requestId, uint256 _fxRateResponse)
        public
        recordChainlinkFulfillment(_requestId)
    {
        emit RequestVolume(_requestId, _fxRateResponse);
        fxRateResponse = _fxRateResponse;
        fxRateResponseTimestamp = block.timestamp;
    }

    function isFxRateResponseValid() public view returns (bool) {
        return (block.timestamp <=
            fxRateResponseTimestamp + responseExpiryTime);
    }

    function withdrawLink() external {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer"
        );
    }

    function balanceOfLink() external {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        _balanceOfLink = link.balanceOf(address(this));
    }

    function addNewToken(string memory symbol, address tokenAddress) public {
        require(msg.sender == owner);
        supportedTokens[symbol] = TokenInfo(tokenAddress, symbol);
    }

    function removeToken(string memory symbol) public {
        require(msg.sender == owner);
        require(
            supportedTokens[symbol].tokenAddress != address(0),
            "Token not found"
        );
        delete supportedTokens[symbol];
    }

    function showToken(string memory token)
        public
        view
        returns (string memory, address)
    {
        require(
            supportedTokens[token].tokenAddress != address(0),
            "Token not found"
        );
        return (
            supportedTokens[token].tokenSymbol,
            supportedTokens[token].tokenAddress
        );
    }

    function createRequest(
        address sender,
        uint256 toAmount,
        string memory targetCurrency,
        string memory message
    ) public {
        Attribute memory newRequest;
        newRequest.sender = sender;
        newRequest.recipient = tx.origin;
        newRequest.toAmount = toAmount;

        require(
            supportedTokens[targetCurrency].tokenAddress != address(0),
            "Target Currency not supported"
        );

        newRequest.amount = 0;
        newRequest.fromCurrency = "";
        newRequest.targetCurrency = targetCurrency;
        newRequest.message = message;
        requests[sender].push(newRequest);
    }

    function getMyRequests()
        public
        view
        returns (Attribute[] memory)
    {
        return requests[tx.origin];
    }

    // Pay a Request, RequestID => Request Index
    function payRequest(uint256 _requestID, string memory fromCurrency) public {
        require(_requestID < requests[tx.origin].length, "No Such Request");
        Attribute[] storage myRequests = requests[tx.origin];
        Attribute storage payableRequest = myRequests[_requestID];

        require(
            supportedTokens[fromCurrency].tokenAddress != address(0),
            "From currency not supported"
        );

        payableRequest.fromCurrency = fromCurrency;

        if (!Strings.equal(fromCurrency, payableRequest.targetCurrency)) {
            require(fxRateResponse > 0, "Invalid FX Rate!");
            require(isFxRateResponseValid(), "Fx Rate has expired!");
            uint256 _amount = (payableRequest.toAmount * 10**18) /
                (fxRateResponse);
            payableRequest.amount = _amount;
            swapToken(
                payableRequest.amount,
                payableRequest.recipient,
                payableRequest.fromCurrency,
                payableRequest.targetCurrency,
                payableRequest.message
            );
        } else {
            localTransfer(
                payableRequest.recipient,
                payableRequest.toAmount,
                payableRequest.targetCurrency,
                payableRequest.message
            );
        }

        deleteRequest(_requestID);
    }

    function deleteRequest(uint256 _requestID) public {
        require(_requestID < requests[tx.origin].length, "No Such Request");
        Attribute[] storage myRequests = requests[tx.origin];
        myRequests[_requestID] = myRequests[myRequests.length - 1];
        myRequests.pop();
    }

    function localTransfer(
        address recipient,
        uint256 amount,
        string memory currency,
        string memory message
    ) public {
        require(
            supportedTokens[currency].tokenAddress != address(0),
            "Local Currency not supported"
        );

        (,bytes memory balance) = supportedTokens[currency].tokenAddress.call(
            abi.encodeWithSignature("balanceOf(address)", tx.origin)
        );
        require(abi.decode(balance,(uint256))>=amount, "Not enough balance");

        (bool successTransfer, ) = supportedTokens[currency].tokenAddress.call(
            abi.encodeWithSignature(
                "transferFromContract(address,address,uint256)",
                tx.origin,
                recipient,
                amount
            )
        );
        require(successTransfer, "Local Transaction Failed!");
        addHistory(
            recipient,
            amount,
            amount,
            currency,
            currency,
            message
        );
    }

    function getFxRateInfo() public view returns (uint256,bool,uint256){
        return (fxRateResponse,isFxRateResponseValid(),responseExpiryTime);
    }
}
