pragma solidity ^0.8.0;
//pragma experimental ABIEncoderV2;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol";


contract Institution{
    event Institution_Created(address Address, Institution_Type Type);
    
    enum Institution_Type{
        CONSTITUTION,
        LEGISLATION,
        API,
        ADMINISTRATION,
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
    
    
    /*STATE*/
    string public name;
    
}

