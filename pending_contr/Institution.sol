pragma solidity ^0.8.0;
//pragma experimental ABIEncoderV2;

/*
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableSet.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/math/SafeMath.sol";
*/ 

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";



contract Institution{
    event Institution_Created(address Address, Institution_Type Type);
    
    enum Institution_Type{
        CONSTITUTION,
        LOI,
        API,
        AGORA,
        DELEGATION,
        REGISTRATION,
        CUSTOM
    }
    
    enum Argument_Type{
        UINT,
        INT,
        BYTES,
        STRING,
        ADDRESS,
        BOOL,
        UINT_ARRAY,
        INT_ARRAY,
        BYTES_ARRAY,
        STRING_ARRAY,
        ADDRESS_ARRAY,
        BOOL_ARRAY
    }
    
    struct Function_Argument{
        //string name;
        Argument_Type _type;
        uint Type_Size;
        uint Array_Length;
    }
    
    struct Register_Function{
        bytes4 selector;
        Function_Argument[] arg_list;
    }
    
    struct Function_Call{
        bytes Data;
        address contract_address;
    }
    
    modifier Constitution_Only(){
        require(msg.sender == Constitution_Address, "Constitution Only");
        _;
    }
    
    /*TEMP DEBUG EVENT*/
    event LogUint(uint);
    event LogString(string);
    event LogBytes(bytes);
    event LogBytes32(bytes32);
    event LogAddress(address);
    
    /*STATE*/
    string public name;
    address public Constitution_Address;
    Institution_Type public Type_Institution;
    
    constructor(){
        Constitution_Address = msg.sender;
    }
}

