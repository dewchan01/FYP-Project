// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Transfer {
    address TokenAddress;

    constructor(address tokenAddress) {
        TokenAddress = tokenAddress;
    }

    function transferOutside(address to, uint256 amount) public {
        (bool success,) = TokenAddress.call(abi.encodeWithSignature("transferFromContract(address,address,uint256)", msg.sender, to, amount));
        require(success, "Failed to transfer!");    
    }
}
