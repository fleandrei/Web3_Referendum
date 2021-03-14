// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//pragma experimental ABIEncoderV2;

//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol";
import "Institution.sol";

abstract contract  Register is Institution{
    using EnumerableSet for EnumerableSet.AddressSet;
    
    modifier Register_Authorities_Only(){
        require(Register_Authorities.contains(msg.sender), "Authorities Only");
        _;
    }
    
    //mapping(address=>bool) public Register_Authorities;
    EnumerableSet.AddressSet Register_Authorities;
    mapping(bytes4=>Function_Argument) public Register_API;
    bytes4[] Register_Function_List;
    
   
    
    
    
    
    function Add_Authority(address authority) external Constitution_Only(){
        Register_Authorities.add(authority);
    }
    
    function Remove_Authority(address authority) external{
        require(msg.sender == authority, "Not Allowed Removing Authorities");
        require(Register_Authorities.contains(authority));
        Register_Authorities.remove(authority);
    }
    
    function Get_Register_Function_List() external view returns(bytes4[] memory){
        return Register_Function_List;
    }
    
    function Get_Authorities() external view returns(bytes32[] memory){
        return Register_Authorities._inner._values;
    }
    
    //function Check_Function_Call(bytes memory Data) public virtual view returns(bool);
}