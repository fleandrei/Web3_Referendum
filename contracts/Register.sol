// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//pragma experimental ABIEncoderV2;

//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol";
import "contracts/Institution.sol";
//import "Institution.sol";

/**
 * @dev Register contract
 * This abstract contract is supposed to be inherited by contract that contains function (register function) that are only callable via a democratic processn(via Agora's contract referendums and/or Delegation's members voting). 
 * Theses contracts are "Constitution", "Loi", "API_Register" and "Citizens_Register". 
 * Register contract inherit from Institution abstract contract. It offer features for handling address that are allowed to call register functions. These address are registered in the {Register_Authorities} list.
 * 
 */
abstract contract  Register is Institution{
    using EnumerableSet for EnumerableSet.AddressSet;
    
    
    /// @notice Check that the sender belongs to {Register_Authorities}
    modifier Register_Authorities_Only(){
        require(Register_Authorities.contains(msg.sender), "Authorities Only");
        _;
    }
    
    event Authority_Added(address authority);
    event Authority_Removed(address authority);

    
    //mapping(address=>bool) public Register_Authorities;
    EnumerableSet.AddressSet Register_Authorities;
    //mapping(bytes4=>Function_Argument) public Register_API;
    //bytes4[] Register_Function_List;
    
   
    /**
     * @dev Set the name of the new register.
     * @param name Name of the new Register
    */
   constructor(string memory name) Institution(name){
       
   }
    
    /**
     * @notice Add an account address to {Register_Authorities}
     * @param authority address to add to the {Register_Authorities}
     * */
    function Add_Authority(address authority) virtual external Constitution_Only(){
        require(!Register_Authorities.contains(authority), "Already existing authority");
        Register_Authorities.add(authority);
        emit Authority_Added(authority);
    }
    
    /**
     * @notice Removes an account address from the {Register_Authorities}
     * @param authority address to remove from the {Register_Authorities}
     * */
    function Remove_Authority(address authority) virtual external{
        require(msg.sender == authority || msg.sender == Constitution_Address, "Not Allowed Removing Authorities");
        require(Register_Authorities.contains(authority), "Not existing authority account");
        Register_Authorities.remove(authority);
        emit Authority_Removed(authority);
    }
    
   
    /**
     * @notice Getter for {Register_Authorities}
     * @return return address registered in the {Register_Authorities}
    */
    function Get_Authorities() external virtual view returns(bytes32[] memory){
        return Register_Authorities._inner._values;
    } 
    
    //function Check_Function_Call(bytes memory Data) public virtual view returns(bool);
}