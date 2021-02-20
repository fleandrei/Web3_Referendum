pragma solidity ^0.8.0;
//pragma experimental ABIEncoderV2;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol";
import "Institution.sol";

abstract contract  Register is Institution{
    
    
    mapping(bytes4=>Function_Argument) public Register_API;
    bytes4[] Register_Function_List;
    
    function Get_Register_Function_Number() external view returns(uint256){
        return Register_Function_List.length;
    }
    
    function Check_Function_Call(bytes memory Data) public virtual view returns(bool);
}