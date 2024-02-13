// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TBTokens is ERC20 {
    
    mapping(uint => address) public bondToOwner;
    address public bondOwner;
    address public owner;

    constructor(string memory _name, string memory _symbol, uint _initialSupply, uint _bondId, address _bondOwner) ERC20(_name, _symbol) {
        bondOwner = _bondOwner;
        _mint(bondOwner, _initialSupply * 10 ** decimals());
        bondToOwner[_bondId] = bondOwner;
        owner = msg.sender;
    }

    modifier onlyOwner(){
      require(owner == msg.sender, "Not owner");
      _;
    }

    function mint(address _addr, uint _amount) public  onlyOwner {
        require(_addr != address(0), "Invalid minter address");
        _mint(_addr, _amount);
    }

    function transferToken(address _originalCaller, address to, uint256 amount) external returns (bool) {
     _transfer(_originalCaller, to, amount);
    return true;
    }

    function burn(address _minter, uint256 _amount) external onlyOwner returns (bool) {
     _burn(_minter, _amount);
    return true;
    }

    function approveTokenUsage(address _owner, address _spender, uint256 _amount) external returns (bool){
        _approve(_owner, _spender, _amount);
        return true;
    }

}

