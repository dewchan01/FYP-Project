// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DSGDToken is ERC20, Ownable {
    constructor() ERC20("DSGD Token", "DSGD") Ownable(msg.sender){}
    address public allowedContract;

  modifier onlyAllowedPersonnel() {
        require(msg.sender == allowedContract || msg.sender == owner(), "Caller is not allowed");
        _;
    }
    function setAllowedContract(address _contractAddress) external onlyOwner {
        allowedContract = _contractAddress;
    }

    function burn(address _sender, uint256 _amount) public onlyAllowedPersonnel {
        _burn(_sender, _amount);
    }

    function mint(address _recipient, uint256 _amount) public onlyAllowedPersonnel{
        _mint(_recipient, _amount);
    }
    
}

contract DMYRToken is ERC20,Ownable {
    constructor() ERC20("DMYR Token", "DMYR") Ownable(msg.sender) {}
    address public allowedContract;

    modifier onlyAllowedPersonnel() {
        require(msg.sender == allowedContract || msg.sender == owner(), "Caller is not allowed");
        _;
    }
    function setAllowedContract(address _contractAddress) external onlyOwner {
        allowedContract = _contractAddress;
    }

    function burn(address _sender, uint256 _amount) public onlyAllowedPersonnel {
        _burn(_sender, _amount);
    }

    function mint(address _recipient, uint256 _amount) public onlyAllowedPersonnel{
        _mint(_recipient, _amount);
    }
}

contract MCBDC is ChainlinkClient,Ownable{
    using Chainlink for Chainlink.Request;

    struct request {
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

    string private chainlinkJobId;
    uint256 private chainlinkFee;
    bytes32 private jobId;
    uint256 private fee;
    uint256 public fxRateResponse;
    uint256 public _balanceOfLink;
    uint256 public fxRateResponseTimestamp;
    uint256 public responseExpiryTime = 30; // Set the expiration time in seconds

    mapping(address => request[]) public requests;
    mapping(string => TokenInfo) public supportedTokens;

    event CurrencyAdded(string currency, address tokenAddress);
    event RequestVolume(bytes32 indexed requestId, uint256 fxRateResponse);

    constructor()Ownable(msg.sender){
        setChainlinkToken(0x326C977E6efc84E512bB9C30f76E30c160eD06FB);
        setChainlinkOracle(0x40193c8518BB267228Fc409a613bDbD8eC5a97b3);
        jobId = "ca98366cc7314957b8c012c72f05aeeb";
        fee = (1 * LINK_DIVISIBILITY) / 10; // 0.1 * 10**18 (Varies by network and job)
    }

    function makeRequest(
        address sender,
        address recipient,
        uint256 amount,
        uint256 toAmount,
        string memory fromCurrency,
        string memory targetCurrency,
        string memory message
    ) public {
        request memory newRequest;
        newRequest.sender = sender;
        newRequest.recipient = recipient;
        newRequest.amount = amount;
        newRequest.toAmount = toAmount;
        newRequest.fromCurrency = fromCurrency;
        newRequest.targetCurrency = targetCurrency;
        newRequest.message = message;
        requests[sender].push(newRequest);
    }

     function checkActivity(address user)
        public
        view
        returns (request[] memory)
    {
        return requests[user];
    }

    function swapToken(
        uint256 amount,
        address recipient,
        string memory fromCurrency,
        string memory toCurrency,
        string memory message
    ) external  {
        // Add at least 0.1 link token to this contract
        // Request fx rate in client side
        address sender = msg.sender;
        require(
            supportedTokens[fromCurrency].tokenAddress != address(0),
            "From token not supported"
        );
        require(
            supportedTokens[toCurrency].tokenAddress != address(0),
            "To token not supported"
        );

        address fromToken = supportedTokens[fromCurrency].tokenAddress;
        address toToken = supportedTokens[toCurrency].tokenAddress;
        
        require(fxRateResponse > 0, "Invalid FX Rate!");
        require(isFxRateResponseValid(),"Fx Rate has expired!");

        (bool successBurn,) = fromToken.call(
            abi.encodeWithSignature("burn(address,uint256)", sender, amount)
        );
        require(
            successBurn,
            "Burn failed"
        );

        uint256 amountToMint = (amount * fxRateResponse) / 10**18;
        makeRequest(sender, recipient, amount, amountToMint, fromCurrency, toCurrency, message);
        (bool successMint,) = toToken.call(
            abi.encodeWithSignature(
                "mint(address,uint256)",
                recipient,
                amountToMint
            )
        );
        require(
            successMint,
            "Mint failed"
        );
    }

    function requestFxRate(string memory fromCurrency, string memory toCurrency)
        public
        returns (bytes32 requestId)
    {
        // Set the timeout duration in seconds (30 seconds in this example)
        // uint256 timeout = 30;
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
        // req.addUint("until", block.timestamp + timeout);
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
        return (block.timestamp <= fxRateResponseTimestamp + responseExpiryTime);
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

    function addNewToken(string memory symbol, address tokenAddress)
        public
        onlyOwner
    {
        supportedTokens[symbol] = TokenInfo(tokenAddress, symbol);
    }

    function removeToken(string memory symbol) public onlyOwner {
        require(
            supportedTokens[symbol].tokenAddress != address(0),
            "Token not found"
        );
        delete supportedTokens[symbol];
    }

    function showToken(string memory token)
        public
        view
        onlyOwner
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
}
