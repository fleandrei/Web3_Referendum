// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableSet.sol";*/

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

contract DemoCoin is ERC20{
    using EnumerableSet for EnumerableSet.AddressSet;
    
    address public Constitution_Address;
    EnumerableSet.AddressSet Mint_Authorities;
    EnumerableSet.AddressSet Burn_Authorities;
    
    event Minter_Added(address minter);
    event Minter_Removed(address minter);
    event Burner_Added(address burner);
    event Burner_Removed(address burner);
    
    constructor(string memory name_, string memory symbol_, address[] memory initials_accounts, uint[] memory initials_amount) ERC20(name_, symbol_){
        uint len = initials_accounts.length;
        require(len == initials_amount.length, "Arrays of different size");
        Constitution_Address = msg.sender;
        Mint_Authorities.add(msg.sender);
        Burn_Authorities.add(msg.sender);
        
        for(uint i=0; i<len; i++){
            if(initials_amount[i] !=0){
                _mint(initials_accounts[i], initials_amount[i]);
            }
        }
        
    }
    
    function Add_Minter(address minter) external{
        require(msg.sender == Constitution_Address, "Constitution Only");
        require(!Mint_Authorities.contains(minter), "Is already minter");
        Mint_Authorities.add(minter);
        emit Minter_Added(minter);
    }
    
    function Add_Burner(address burner) external{
        require(msg.sender == Constitution_Address, "Constitution Only");
        require(!Burn_Authorities.contains(burner), "Is already burner");
        Burn_Authorities.add(burner);
        emit Burner_Added(burner);
    }
    
    function Remove_Minter(address minter) external{
        require(msg.sender == Constitution_Address, "Constitution Only");
        require(Mint_Authorities.contains(minter), "minter don't exist");
        require(msg.sender != minter, "Constitution can't be removed");
        
        Mint_Authorities.remove(minter);
        emit Minter_Removed(minter);
    }
    
    function Remove_Burner(address burner) external{
        require(msg.sender == Constitution_Address, "Constitution Only");
        require(Burn_Authorities.contains(burner), "burner don't exist");
        require(msg.sender != burner, "Constitution can't be removed");
        Burn_Authorities.remove(burner);
        emit Burner_Removed(burner);
    }
    
    
    
    function Mint(address account, uint256 amount) external{
        require(Mint_Authorities.contains(msg.sender), "Address Not Allowed to mint");
        _mint(account, amount);
    }
    
    function Burn(address account, uint256 amount) external{
        require(Burn_Authorities.contains(msg.sender), "Address Not Allowed to burn");
        _burn(account, amount);
    }
    
    
        
    
    function Get_Mint_Authorities() external view returns(bytes32[] memory){
        return Mint_Authorities._inner._values;
    }
    
    function Get_Burn_Authorities() external view returns(bytes32[] memory){
        return Burn_Authorities._inner._values;
    }
    
}