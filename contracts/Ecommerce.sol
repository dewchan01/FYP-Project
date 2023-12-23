// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MCBDC.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract ECommerce {
    address public owner;
    MCBDC public mcbdc;

    constructor(address _mcbdc) {
        owner = msg.sender;
        mcbdc = MCBDC(_mcbdc);
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
            msg.sender == products[_productId].seller,
            "Not authorized to delete product"
        );
        require(
            products[_productId].isActive,
            "Product does not exist or is already deleted"
        );

        // Find the index of the product
        uint256 indexToDelete;
        for (uint256 i = 0; i < allProducts.length; i++) {
            if (Strings.equal(allProducts[i].productId, _productId)) {
                indexToDelete = i;
                break;
            }
        }

        require(indexToDelete < allProducts.length, "Product not found");

        // Swap with the last product in the array
        allProducts[indexToDelete] = allProducts[allProducts.length - 1];

        products[_productId].isActive = false;

        allProducts.pop();
    }

    function buyProduct(string memory _productId, string memory fromCurrency)
        public
    {
        require(users[msg.sender].isCreated && products[_productId].isActive, "Product is not found!");
        (, address _fromCurrency) = mcbdc.showToken(fromCurrency);
        require(
            _fromCurrency != address(0),
            "Paying Currency is not supported!"
        );
        if (Strings.equal(fromCurrency, products[_productId].priceCurrency)) {
            mcbdc.localTransfer(
                products[_productId].seller,
                products[_productId].price,
                fromCurrency,
                string(
                    abi.encodePacked(
                        Strings.toHexString(uint160(msg.sender), 20),
                        " buy ",
                        _productId,
                        " from ",
                        Strings.toHexString(
                            uint160(products[_productId].seller),
                            20
                        )
                    )
                )
            );
        } else {
            (uint256 rate,bool isFxRateValid,) = mcbdc.getFxRateInfo();
            require(isFxRateValid,"FX Rate is expired!");
            mcbdc.swapToken(
                products[_productId].price*1e18/rate,
                products[_productId].seller,
                fromCurrency,
                products[_productId].priceCurrency,
                string(
                    abi.encodePacked(
                        Strings.toHexString(uint160(msg.sender), 20),
                        " buy ",
                        _productId,
                        " from ",
                        Strings.toHexString(
                            uint160(products[_productId].seller),
                            20
                        )
                    )
                )
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
        sellerShipments[products[_productId].seller][purchaseId].orderedBy = msg
            .sender;
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
                .orderedBy == msg.sender,
            "Not Authorized!"
        );
        require(
            sellerShipments[products[_productId].seller][_purchaseId].isActive,
            "Order has been canceled!"
        );
        sellerShipments[products[_productId].seller][_purchaseId]
            .shipmentStatus = "Order Canceled By Buyer, Payment will Be Refunded";
        sellerShipments[products[_productId].seller][_purchaseId]
            .isCanceled = true;
    }

    function refund(string memory _productId, uint256 _purchaseId) public {
        require(sellerShipments[msg.sender][_purchaseId].isCanceled);
        if (
            Strings.equal(
                sellerShipments[msg.sender][_purchaseId].payByCurrency,
                products[_productId].priceCurrency
            )
        ) {
            mcbdc.localTransfer(
                sellerShipments[msg.sender][_purchaseId].orderedBy,
                products[_productId].price,
                products[_productId].priceCurrency,
                string(
                    abi.encodePacked(
                        Strings.toHexString(uint160(msg.sender), 20),
                        " refund ",
                        _productId,
                        " to ",
                        Strings.toHexString(
                            uint160(
                                sellerShipments[msg.sender][_purchaseId]
                                    .orderedBy
                            ),
                            20
                        )
                    )
                )
            );
        } else {
            mcbdc.swapToken(
                products[_productId].price,
                sellerShipments[msg.sender][_purchaseId].orderedBy,
                products[_productId].priceCurrency,
                sellerShipments[msg.sender][_purchaseId].payByCurrency,
                string(
                    abi.encodePacked(
                        Strings.toHexString(uint160(msg.sender), 20),
                        " refund ",
                        _productId,
                        " to ",
                        Strings.toHexString(
                            uint160(
                                sellerShipments[msg.sender][_purchaseId]
                                    .orderedBy
                            ),
                            20
                        )
                    )
                )
            );
        }
        sellerShipments[products[_productId].seller][_purchaseId]
            .shipmentStatus = "Order Canceled By Buyer, Payment Refunded";
    }

    //getters
    function getOrdersPlacedLength() public view returns (uint256) {
        return sellerOrders[msg.sender].length;
    }

    function getProductsLength() public view returns (uint256) {
        return allProducts.length;
    }

    function getMyOrdersLength() public view returns (uint256) {
        return userOrders[msg.sender].length;
    }

    function myOrders(uint256 _index)
        public
        view
        returns (
            string memory,
            string memory,
            uint256,
            string memory
        )
    {
        return (
            userOrders[msg.sender][_index].productId,
            userOrders[msg.sender][_index].orderStatus,
            userOrders[msg.sender][_index].purchaseId,
            sellerShipments[
                products[userOrders[msg.sender][_index].productId].seller
            ][userOrders[msg.sender][_index].purchaseId].shipmentStatus
        );
    }

    function getShipmentProductId(uint256 _purchaseId)
        public
        view
        returns (string memory)
    {
        return (sellerShipments[msg.sender][_purchaseId].productId);
    }

    function getShipmentStatus(uint256 _purchaseId)
        public
        view
        returns (string memory)
    {
        return (sellerShipments[msg.sender][_purchaseId].shipmentStatus);
    }

    function getShipmentOrderedBy(uint256 _purchaseId)
        public
        view
        returns (address)
    {
        return (sellerShipments[msg.sender][_purchaseId].orderedBy);
    }

    function getShipmentAddress(uint256 _purchaseId)
        public
        view
        returns (string memory)
    {
        return (sellerShipments[msg.sender][_purchaseId].deliveryAddress);
    }

    function getOrdersPlaced(uint256 _index)
        public
        view
        returns (
            string memory,
            uint256,
            address,
            string memory
        )
    {
        return (
            sellerOrders[msg.sender][_index].productId,
            sellerOrders[msg.sender][_index].purchaseId,
            sellerOrders[msg.sender][_index].orderedBy,
            sellerShipments[msg.sender][
                sellerOrders[msg.sender][_index].purchaseId
            ].shipmentStatus
        );
    }
}
