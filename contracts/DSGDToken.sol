// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DSGDToken is ERC20, Ownable {
    constructor() ERC20("DSGD Token", "DSGD") Ownable(msg.sender) {}

    address public allowedContract;

    modifier onlyAllowedPersonnel() {
        require(
            msg.sender == allowedContract || msg.sender == owner(),
            "Caller is not allowed"
        );
        _;
    }

    function setAllowedContract(address _contractAddress) external onlyOwner {
        allowedContract = _contractAddress;
    }

    function burn(address _sender, uint256 _amount)
        public
        onlyAllowedPersonnel
    {
        _burn(_sender, _amount);
    }

    function mint(address _recipient, uint256 _amount)
        public
        onlyAllowedPersonnel
    {
        _mint(_recipient, _amount);
    }

    function transferFromContract(address _from, address _recipient, uint256 _amount)
        public
        onlyAllowedPersonnel
    {
        _transfer(_from, _recipient, _amount);
    }

    function balanceOf(address _user) public view override returns (uint256) {
        return super.balanceOf(_user);
    }
}
