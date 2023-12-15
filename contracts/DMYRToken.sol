// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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