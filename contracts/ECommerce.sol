// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MCBDC.sol";
import "./Voucher.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract ECommerce {
    address public owner;
    MCBDC public mcbdc;
    VoucherContract public voucherContract;

    constructor(address _mcbdc, address _voucherContract) {
        owner = msg.sender;
        mcbdc = MCBDC(_mcbdc);
        voucherContract = VoucherContract(_voucherContract);
    }

    uint256 id;
    uint256 purchaseId;

    struct product {
        string productId;
        string productName;
        string Category;
        uint256 price;
        string priceCurrency;
        string description;
        address seller;
        bool isActive;
    }
    struct ordersPlaced {
        string productId;
        uint256 purchaseId;
        address orderedBy;
    }
    struct orders {
        string productId;
        string orderStatus;
        string payByCurrency;
        uint256 purchaseId;
        string shipmentStatus;
    }
    struct user {
        string name;
        string email;
        string deliveryAddress;
        bool isCreated;
    }

    struct sellerShipment {
        string productId;
        uint256 purchaseId;
        string shipmentStatus;
        string deliveryAddress;
        address orderedBy;
        uint256 payAmount;
        string payByCurrency;
        bool isActive;
        bool isCanceled;
    }
    struct seller {
        string name;
        address addr;
    }
    product[] public allProducts;

    mapping(string => product) products;
    mapping(address => orders[]) userOrders;
    mapping(address => user) users;
    mapping(address => seller) public sellers;
    mapping(address => ordersPlaced[]) sellerOrders;
    mapping(address => mapping(uint256 => sellerShipment)) sellerShipments;

    function addProduct(
        string memory _productId,
        string memory _productName,
        string memory _category,
        string memory _priceCurrency,
        uint256 _price,
        string memory _description
    ) public {
        require(sellers[msg.sender].addr != address(0), "Not seller!");
        require(!products[_productId].isActive);

        product memory newProduct = product(
            _productId,
            _productName,
            _category,
            _price,
            _priceCurrency,
            _description,
            msg.sender,
            true
        );
        products[_productId].productId = _productId;
        products[_productId].productName = _productName;
        products[_productId].Category = _category;
        products[_productId].description = _description;
        products[_productId].price = _price;
        products[_productId].priceCurrency = _priceCurrency;
        products[_productId].seller = msg.sender;
        products[_productId].isActive = true;
        allProducts.push(newProduct);
    }

    function deleteProduct(string memory _productId) public {
        require(
            msg.sender == products[_productId].seller &&
                products[_productId].isActive,
            "No product is found!"
        );
        uint256 indexToDelete;
        for (uint256 i = 0; i < allProducts.length; i++) {
            if (Strings.equal(allProducts[i].productId, _productId)) {
                indexToDelete = i;
                break;
            }
        }
        allProducts[indexToDelete] = allProducts[allProducts.length - 1];
        products[_productId].isActive = false;
        allProducts.pop();
    }

    function buyProduct(
        string memory _productId,
        string memory fromCurrency,
        uint256[] memory _voucherCodes
    ) public {
        require(users[msg.sender].isCreated && products[_productId].isActive);
        uint256 discountedPrice = products[_productId].price;
        if (_voucherCodes.length > 0) {
            discountedPrice = voucherContract.redeemVouchers(
                _voucherCodes,
                _productId,
                products[_productId].price,
                products[_productId].priceCurrency,
                products[_productId].seller
            );
        }

        string memory message = string(
            abi.encodePacked(
                // Strings.toHexString(uint160(msg.sender), 20),
                "buy ",
                _productId,
                " from"
                // Strings.toHexString(uint160(products[_productId].seller), 20)
            )
        );
        bool sameCurrency = Strings.equal(fromCurrency, products[_productId].priceCurrency);
        if (sameCurrency) {
            mcbdc.localTransfer(
                products[_productId].seller,
                discountedPrice,
                fromCurrency,
                message,
                false,
                address(0)
            );
        } else {
            (uint256 rate, bool isFxRateValid, ) = mcbdc.getFxRateInfo();
            require(isFxRateValid, "FX Rate is expired!");
            discountedPrice = (discountedPrice * 1e18) / rate;
            mcbdc.swapToken(
                discountedPrice,
                products[_productId].seller,
                fromCurrency,
                products[_productId].priceCurrency,
                message
            );
        }
        purchaseId = id++;
        orders memory order = orders(
            _productId,
            "Order Placed With Seller",
            fromCurrency,
            purchaseId,
            sellerShipments[products[_productId].seller][purchaseId]
                .shipmentStatus
        );
        userOrders[msg.sender].push(order);
        ordersPlaced memory ord = ordersPlaced(
            _productId,
            purchaseId,
            msg.sender
        );
        sellerOrders[products[_productId].seller].push(ord);

        sellerShipments[products[_productId].seller][purchaseId]
            .productId = _productId;
        sellerShipments[products[_productId].seller][purchaseId]
        .orderedBy = msg.sender;
        sellerShipments[products[_productId].seller][purchaseId]
            .payAmount = discountedPrice;
        sellerShipments[products[_productId].seller][purchaseId]
            .payByCurrency = fromCurrency;
        sellerShipments[products[_productId].seller][purchaseId]
            .purchaseId = purchaseId;
        sellerShipments[products[_productId].seller][purchaseId]
            .deliveryAddress = users[msg.sender].deliveryAddress;
        sellerShipments[products[_productId].seller][purchaseId]
            .isActive = true;
    }

    function createAccount(
        string memory _name,
        string memory _email,
        string memory _deliveryAddress
    ) public {
        users[msg.sender].name = _name;
        users[msg.sender].email = _email;
        users[msg.sender].deliveryAddress = _deliveryAddress;
        users[msg.sender].isCreated = true;
    }

    function updateShipment(uint256 _purchaseId, string memory _shipmentDetails)
        public
    {
        require(sellerShipments[msg.sender][_purchaseId].isActive);

        sellerShipments[msg.sender][_purchaseId]
            .shipmentStatus = _shipmentDetails;
    }

    function sellerSignUp(string memory _name) public {
        sellers[msg.sender].name = _name;
        sellers[msg.sender].addr = msg.sender;
    }

    function cancelOrder(string memory _productId, uint256 _purchaseId) public {
        require(
            sellerShipments[products[_productId].seller][_purchaseId]
                .orderedBy ==
                msg.sender &&
                sellerShipments[products[_productId].seller][_purchaseId]
                    .isActive
        );
        sellerShipments[products[_productId].seller][_purchaseId]
            .shipmentStatus = "Order Canceled By Buyer, Payment will Be Refunded";
        sellerShipments[products[_productId].seller][_purchaseId]
            .isCanceled = true;

        if (
            !(
                Strings.equal(
                    sellerShipments[products[_productId].seller][_purchaseId]
                        .payByCurrency,
                    products[_productId].priceCurrency
                )
            )
        ) {
            mcbdc.createRequest(
                products[_productId].seller,
                sellerShipments[products[_productId].seller][_purchaseId]
                    .payAmount,
                sellerShipments[products[_productId].seller][_purchaseId]
                    .payByCurrency,
                string(
                    abi.encodePacked("refund ", _productId, " / ", Strings.toString(_purchaseId))
                )
            );
            // sellerShipments[products[_productId].seller][_purchaseId]
            //     .shipmentStatus = "Order Canceled By Buyer, Payment Refunded";
        }
    }

    // check refund request has been paid at the frontend first if the two currencies are different
    function refund(string memory _productId, uint256 _purchaseId) public {
        require(
            sellerShipments[msg.sender][_purchaseId].isCanceled &&
                sellerShipments[products[_productId].seller][_purchaseId]
                    .isActive
        );
        if (
            Strings.equal(
                sellerShipments[msg.sender][_purchaseId].payByCurrency,
                products[_productId].priceCurrency
            )
        ) {
            mcbdc.localTransfer(
                sellerShipments[msg.sender][_purchaseId].orderedBy,
                sellerShipments[msg.sender][_purchaseId].payAmount,
                products[_productId].priceCurrency,
                string(
                    abi.encodePacked(
                        // Strings.toHexString(uint160(msg.sender), 20),
                        "refund ",
                        _productId,
                        " to"
                        // Strings.toHexString(
                        //     uint160(
                        //         sellerShipments[msg.sender][_purchaseId]
                        //             .orderedBy
                        //     ),
                        //     20
                        // )
                    )
                ),
                false,
                address(0)
            );
        }
        sellerShipments[products[_productId].seller][_purchaseId]
            .shipmentStatus = "Order Canceled By Buyer, Payment Refunded";
    }

    function getAllProducts() public view returns (product[] memory) {
        return allProducts;
    }

    function myOrders()
        public
        view
        returns (
            string[] memory,
            string[] memory,
            uint256[] memory,
            string[] memory
        )
    {
        uint256 length = userOrders[msg.sender].length;

        string[] memory productIds = new string[](length);
        string[] memory orderStatuses = new string[](length);
        uint256[] memory purchaseIds = new uint256[](length);
        string[] memory shipmentStatuses = new string[](length);

        for (uint256 i = 0; i < length; i++) {
            productIds[i] = userOrders[msg.sender][i].productId;
            orderStatuses[i] = userOrders[msg.sender][i].orderStatus;
            purchaseIds[i] = userOrders[msg.sender][i].purchaseId;
            shipmentStatuses[i] = sellerShipments[
                products[productIds[i]].seller
            ][purchaseIds[i]].shipmentStatus;
        }

        return (productIds, orderStatuses, purchaseIds, shipmentStatuses);
    }

    function getOrdersPlaced()
        public
        view
        returns (
            string[] memory,
            uint256[] memory,
            address[] memory,
            string[] memory,
            string[] memory,
            string[] memory,
            bool[] memory
        )
    {
        uint256 length = sellerOrders[msg.sender].length;

        string[] memory productIds = new string[](length);
        uint256[] memory purchaseIds = new uint256[](length);
        address[] memory orderedBys = new address[](length);
        string[] memory shipmentStatuses = new string[](length);
        string[] memory deliveryAddresses = new string[](length);
        string[] memory payByCurrencies = new string[](length);
        bool[] memory areCanceled = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            productIds[i] = sellerOrders[msg.sender][i].productId;
            purchaseIds[i] = sellerOrders[msg.sender][i].purchaseId;
            orderedBys[i] = sellerOrders[msg.sender][i].orderedBy;
            shipmentStatuses[i] = sellerShipments[msg.sender][purchaseIds[i]]
                .shipmentStatus;
            deliveryAddresses[i] = sellerShipments[msg.sender][purchaseIds[i]]
                .deliveryAddress;
            payByCurrencies[i] = sellerShipments[msg.sender][purchaseIds[i]]
                .payByCurrency;
            areCanceled[i] = sellerShipments[msg.sender][purchaseIds[i]]
                .isCanceled;
        }

        return (
            productIds,
            purchaseIds,
            orderedBys,
            shipmentStatuses,
            deliveryAddresses,
            payByCurrencies,
            areCanceled
        );
    }

    function checkValidUser(address _user) public view returns (bool) {
        bool isValidUser = users[_user].isCreated;
        return (isValidUser);
    }
}
