// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MCBDC.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract VoucherContract is ERC1155, Ownable {
    struct Voucher {
        string campaignId;
        uint256 voucherId;
        string[] suitableProductIds;
        uint256 expirationDate;
        uint256 minSpend;
        uint256 value;
        string valueCurrency;
        uint256 amount;
        address organizer;
        string uri;
    }
    MCBDC public mcbdc;
    mapping(uint256 => Voucher) public vouchers;
    uint256 public _voucherId;
    mapping(address => mapping(uint256 => bool)) public claimedList;
    mapping(address => bool) blacklist;

    constructor(address _mcbdc) ERC1155("Voucher") Ownable(msg.sender) {
        mcbdc = MCBDC(_mcbdc);
    }

    function createVoucher(
        string memory _campaignId,
        string[] memory _suitableProductIds,
        uint256 _expirationDate,
        uint256 _minSpend,
        uint256 _value,
        string memory _valueCurrency,
        uint256 _amount,
        string memory _cid
    ) external {
        require(
            _expirationDate > block.timestamp,
            "Expiration date should be after today!"
        );
        vouchers[_voucherId] = Voucher(
            _campaignId,
            _voucherId,
            _suitableProductIds,
            _expirationDate,
            _minSpend,
            _value,
            _valueCurrency,
            _amount,
            msg.sender,
            string(
                abi.encodePacked(
                    "https://",
                    _cid,
                    ".ipfs.nftstorage.link"
                )
            )
        );
        mcbdc.localTransfer(
            owner(),
            _value * _amount,
            _valueCurrency,
            string(
                abi.encodePacked(
                    "pay funds for voucher (Id: ",
                    Strings.toString(_voucherId),
                    ") to"
                )
            ),
            false,
            address(0)
        );
        payVoucher(_voucherId);
        _voucherId++;
    }

    function checkVoucherId() public view returns (uint256) {
        return _voucherId;
    }

    function getVoucherInfo(uint256 voucherId)
        public
        view
        returns (Voucher memory)
    {
        return vouchers[voucherId];
    }

    // frontend write contract with payRequest
    function payVoucher(uint256 voucherId) internal {
        require(
            msg.sender == vouchers[voucherId].organizer,
            "Not allowed to pay!"
        );
        distributeVoucher(voucherId, vouchers[voucherId].amount);
    }

    function distributeVoucher(uint256 voucherId, uint256 amount) internal {
        _mint(owner(), voucherId, amount, "");
    }

    function claimVoucher(uint256 voucherId) external {
        require(
            !claimedList[msg.sender][voucherId],
            "Voucher has already been claimed!"
        );
        require(
            block.timestamp <= vouchers[voucherId].expirationDate,
            "Voucher expired!"
        );
        require(!blacklist[msg.sender], "Recipient is blacklisted");
        _safeTransferFrom(owner(), msg.sender, voucherId, 1, "");
        addToClaimedList(msg.sender, voucherId);
    }

    function validateVoucher(
        uint256 voucherId,
        string memory productId,
        uint256 price,
        string memory priceCurrency
    ) internal view {
        require(
            block.timestamp <= vouchers[voucherId].expirationDate,
            "Voucher expired!"
        );
        require(
            Strings.equal(vouchers[voucherId].valueCurrency, priceCurrency),
            "Voucher currency is not available!"
        );
        require(
            price >= vouchers[voucherId].minSpend,
            "Voucher min spend amount is not reached!"
        );

        bool isSuitable = false;
        for (
            uint256 j = 0;
            j < vouchers[voucherId].suitableProductIds.length;
            j++
        ) {
            if (
                Strings.equal(
                    vouchers[voucherId].suitableProductIds[j],
                    productId
                )
            ) {
                isSuitable = true;
                break;
            }
        }

        require(isSuitable, "Voucher is not allowed to use!");
    }

    function redeemVoucher(uint256 voucherId, address seller) internal {
        if (vouchers[voucherId].value > 0) {
            _burn(tx.origin, voucherId, 1);
            uint256 valueToReimburse = vouchers[voucherId].value;

            mcbdc.localTransfer(
                seller,
                valueToReimburse,
                vouchers[voucherId].valueCurrency,
                "use voucher",
                true,
                owner()
            );
        }
    }

    function redeemVouchers(
        uint256[] memory voucherIds,
        string memory productId,
        uint256 price,
        string memory priceCurrency,
        address seller
    ) public returns (uint256) {
        uint256 originalPrice = price;
        for (uint256 i = 0; i < voucherIds.length; i++) {
            validateVoucher(voucherIds[i], productId, price, priceCurrency);
            redeemVoucher(voucherIds[i], seller);
            originalPrice -= vouchers[voucherIds[i]].value;
        }

        return originalPrice;
    }

    // call this function every mins at the fe
    function getExpiredVouchers() public view returns (bool[] memory) {
        bool[] memory expiredVouchers = new bool[](_voucherId);
        for (uint256 i = 0; i < _voucherId; i++) {
            if (block.timestamp > vouchers[i].expirationDate) {
                // Add the voucher ID to the list of expired vouchers
                expiredVouchers[i] = true;
            } else {
                expiredVouchers[i] = false;
            }
        }
        return expiredVouchers;
    }

    // platform owner should decrease the allowance by vouchers[i].value * balanceOf(owner(), i) after burning
    function burnVoucher() public onlyOwner {
        bool[] memory voucherIds = getExpiredVouchers();
        for (uint256 i = 0; i < voucherIds.length; i++) {
            if (balanceOf(owner(), i) > 0 && voucherIds[i]) {
                // Burn the expired and unredeemed vouchers
                mcbdc.localTransfer(
                    vouchers[i].organizer,
                    vouchers[i].value * balanceOf(owner(), i),
                    vouchers[i].valueCurrency,
                    string(
                        abi.encodePacked(
                            "burn",
                            Strings.toString(balanceOf(owner(), i)),
                            " unused voucher(Id: ",
                            Strings.toString(i),
                            "). Allowance be decreased: ",
                            Strings.toString(
                                (vouchers[i].value * balanceOf(owner(), i)) /
                                    1e18
                            ),
                            " D",
                            vouchers[i].valueCurrency
                        )
                    ),
                    true,
                    owner()
                );
                _burn(owner(), i, balanceOf(owner(), i));
            }
        }
    }

    function addToClaimedList(address user, uint256 voucherId) internal {
        claimedList[user][voucherId] = true;
    }

    function addToBlacklist(address user) public onlyOwner {
        blacklist[user] = true;
    }

    function removeFromBlacklist(address user) public onlyOwner {
        blacklist[user] = false;
    }
}
