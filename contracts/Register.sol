// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//pragma experimental ABIEncoderV2;

//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol";
import "contracts/Institution.sol";
//import "Institution.sol";

abstract contract  Register is Institution{
    using EnumerableSet for EnumerableSet.AddressSet;
    
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
    
   
    
    
    
    
    function Add_Authority(address authority) virtual external Constitution_Only(){
        require(!Register_Authorities.contains(authority), "Already existing authority");
        Register_Authorities.add(authority);
        emit Authority_Added(authority);
    }
    
    function Remove_Authority(address authority) virtual external{
        require(msg.sender == authority || msg.sender == Constitution_Address, "Not Allowed Removing Authorities");
        require(Register_Authorities.contains(authority), "Not existing authority account");
        Register_Authorities.remove(authority);
        emit Authority_Removed(authority);
    }
    
    /*function Get_Register_Function_List() external view returns(bytes4[] memory){
        return Register_Function_List;
    }*/
    
    function Get_Authorities() external virtual view returns(bytes32[] memory){
        return Register_Authorities._inner._values;
    } 
    
    //function Check_Function_Call(bytes memory Data) public virtual view returns(bool);
}