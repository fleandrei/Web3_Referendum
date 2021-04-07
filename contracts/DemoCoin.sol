// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableSet.sol";*/

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";


/**
 *  It's an ERC20 token used for submiting referendum propositions and rewarding voters of a Web3 Direct Democracy DAO. 
 * It offers features for handling address that are allowed to mint and burn tokens.
 */

contract DemoCoin is ERC20{
    using EnumerableSet for EnumerableSet.AddressSet;
    
    ///@notice Address of the costitution of the DAO.
    address public Constitution_Address;
    
    EnumerableSet.AddressSet Mint_Authorities;
    
    EnumerableSet.AddressSet Burn_Authorities;
    
    event Minter_Added(address minter);
    event Minter_Removed(address minter);
    event Burner_Added(address burner);
    event Burner_Removed(address burner);
    
    
    /** 
     * @dev Set parameters of token
     * 
     * @param name_ Name of the token
     * @param symbol_ Symbole of the token
     * @param initials_accounts Addesses of initials owners of the token
     * @param initials_amount List of amount of token to attribute to {initials_accounts}
    */
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



    function Set_Constitution(address new_constitution)external{
        require(msg.sender==Constitution_Address,"Constitution_Only");
        Mint_Authorities.remove(Constitution_Address);
        Burn_Authorities.remove(Constitution_Address);
        Constitution_Address = new_constitution;
        Mint_Authorities.add(new_constitution);
        Burn_Authorities.add(new_constitution);
    }
    
    /**
     * @dev Add an address to the list of accounts allowed to mint token
     * @param minter New account allowed to mint token
     * */    
     function Add_Minter(address minter) external{
        require(msg.sender == Constitution_Address, "Constitution Only");
        require(!Mint_Authorities.contains(minter), "Is already minter");
        Mint_Authorities.add(minter);
        emit Minter_Added(minter);
    }
    
    /**
     * @dev Add an address to the list of accounts allowed to burn token
     * @param burner New account allowed to burn token
    */
    function Add_Burner(address burner) external{
        require(msg.sender == Constitution_Address, "Constitution Only");
        require(!Burn_Authorities.contains(burner), "Is already burner");
        Burn_Authorities.add(burner);
        emit Burner_Added(burner);
    }
    
    /**
     * @dev Remove an address from the list of accounts allowed to mint token
     * @param minter Minter address removed from {Mint_Authorities}
     * */
    function Remove_Minter(address minter) external{
        require(msg.sender == Constitution_Address, "Constitution Only");
        require(Mint_Authorities.contains(minter), "minter don't exist");
        require(msg.sender != minter, "Constitution can't be removed");
        
        Mint_Authorities.remove(minter);
        emit Minter_Removed(minter);
    }
    
    /**
     * @dev Remove an address from the list of accounts allowed to burn token
     * @param burner Burner address removed from {Burn_Authorities]
     * */
    function Remove_Burner(address burner) external{
        require(msg.sender == Constitution_Address, "Constitution Only");
        require(Burn_Authorities.contains(burner), "burner don't exist");
        require(msg.sender != burner, "Constitution can't be removed");
        Burn_Authorities.remove(burner);
        emit Burner_Removed(burner);
    }
    
    
    /**
     * @dev This function is used to mint token. It's only callable by members of {Mint_Authorities}
     * @param account Address to mint token to.
     * @param amount Amount of token to mint.
     * */
    function Mint(address account, uint256 amount) external{
        require(Mint_Authorities.contains(msg.sender), "Address Not Allowed to mint");
        _mint(account, amount);
    }
    
    /**
     * @dev This function is used to burn token. It's only callable by members of {Burn_Authorities}
     * @param account Address to burn token from.
     * @param amount Amount of token to burn.
     * */
    function Burn(address account, uint256 amount) external{
        require(Burn_Authorities.contains(msg.sender), "Address Not Allowed to burn");
        _burn(account, amount);
    }
    
    
        
    /**
     * @dev Getter for {Mint_Authorities}
     * @return Return all address allowed to mint tokens
    **/
    function Get_Mint_Authorities() external view returns(bytes32[] memory){
        return Mint_Authorities._inner._values;
    }
    
     /**
     * @dev Getter for {Burn_Authorities}
     * @return Return all address allowed to burn tokens
    **/
    function Get_Burn_Authorities() external view returns(bytes32[] memory){
        return Burn_Authorities._inner._values;
    }
    
}