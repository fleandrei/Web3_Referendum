// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "contracts/Register.sol";
//import "Register.sol";



/**
 * @notice Contract registering an API of third party contract functions callable via Web3 Direct Democracy democratic process. 
 * API functions can be edited (add, remove) and executed by address contained in {Register_Authorities} list (Defined in the "Register" inherited contract)
 * 
 * */
 contract API_Register is Register{
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    
    struct Receipt{
        bool Success;
        bytes Receipt;
        uint Timestamps;
    }
    
    struct Function{
        uint Index;
        Receipt[] FunctionCall_receipts;
    }
    
    struct Smart_Contract{
        bytes Name;
        bytes Description;
        mapping(bytes4=>Function) Callables_functions;
        bytes4[] List_Functions;
        uint Timestamps;
    }
    
    event Contract_Created(address contract_address);
    event Function_Added(address contract_address, bytes4 function_selector);
    event Function_Removed(address contract_address, bytes4 function_selector);
    event Contract_Removed(address contract_address);
    event Contract_param_Changed(address contract_address);
    event Function_Executed(address contract_address, bytes4 function_selector);
    
    mapping(address=>Smart_Contract) public Contracts;
    EnumerableSet.AddressSet List_Contracts;
    
    
    /**
     * @dev Add the address of Agora Contract to {Register_Authorities}.
     * 
     * @param agora Address of Agora contract
     * */
    constructor(string memory Name, address agora) Register(Name){
        Type_Institution = Institution_Type.API;
        Register_Authorities.add(agora);
    }
    
    
    /*Register API functions. Callable by Register_Authorities contracts*/
    
    /** 
     * @dev Add a third party smart contract to the API (it's address is added to {Contract} mapping and {List_Contracts} list)
     * @param contract_address Address of the third party smart contract to add to the API
     * @param name Name of the smart contract.
     * @param description Text describing the smart contract and justifying it's add to the API. Can be a hash
    */ 
    function Add_Contract(address contract_address, bytes calldata name, bytes calldata description)external Register_Authorities_Only{
        //require(contract_address!=address(0), "Contract address null");
        require(Contracts[contract_address].Timestamps==0, "Already created contract");
        Contracts[contract_address].Name=name;
        Contracts[contract_address].Description=description;
        Contracts[contract_address].Timestamps=block.timestamp;
        List_Contracts.add(contract_address);
        
        emit Contract_Created(contract_address);
    }
    
     
    /** 
     * @dev Add a third party smart contract's function to the list of functions callable via the API.
     * @param contract_address Address of the third party smart contract.
     * @param function_selector Function selector of the function
    */
    function Add_Function(address contract_address, bytes4 function_selector)external Register_Authorities_Only{
        //require(function_selector!=bytes4(0), "function selector null");
        require(Contracts[contract_address].Callables_functions[function_selector].Index==0, "function already registered");
        require(Contracts[contract_address].Timestamps!=0, "Not registered contract");
        Contracts[contract_address].List_Functions.push(function_selector);
        Contracts[contract_address].Callables_functions[function_selector].Index=Contracts[contract_address].List_Functions.length;
        
        emit Function_Added(contract_address, function_selector);
    }
    
     /** 
     * @dev Modify the name and description of third party contract registered in the API
     * @param contract_address Address of the third party smart contract.
     * @param name New name of the contract.
     * @param description New description of the contract
    */
    function Set_Param(address contract_address, bytes calldata name, bytes calldata description)external Register_Authorities_Only{
        require(Contracts[contract_address].Timestamps!=0, "Not registered contract");
        Contracts[contract_address].Name=name;
        Contracts[contract_address].Description=description;
        
        emit Contract_param_Changed(contract_address);
    }
    
    /** 
     * @dev Remove a function from the list of third party smart contract's functions callable via the API
     * @param contract_address Address of the third party smart contract.
     * @param function_selector Function selector of the function to remove.
    */
    function Remove_Function(address contract_address, bytes4 function_selector)external Register_Authorities_Only{
        uint valueIndex = Contracts[contract_address].Callables_functions[function_selector].Index;
        require(valueIndex!=0, "function not registered");
        
        uint remove_index = valueIndex - 1;
        uint lastIndex = Contracts[contract_address].List_Functions.length - 1;
        
        bytes4 lastvalue = Contracts[contract_address].List_Functions[lastIndex];

        Contracts[contract_address].List_Functions[remove_index] = lastvalue;
        Contracts[contract_address].Callables_functions[lastvalue].Index = valueIndex; // Replace lastvalue's index to valueIndex

        Contracts[contract_address].List_Functions.pop();
        delete Contracts[contract_address].Callables_functions[function_selector];
        
        emit Function_Removed(contract_address, function_selector);
    }
    
    
    /** 
     * @dev Remove a third party smart contract from the API
     * @param contract_address Address of the third party smart contract to remove from the API
    */
    function Remove_Contract(address contract_address)external Register_Authorities_Only{
        require(Contracts[contract_address].Timestamps!=0, "Not registered contract");
        
        /*for(uint i=Contracts[contract_address].List_Functions.length-1; i>=0; i--){
            delete Contracts[contract_address].Callables_functions[Contracts[contract_address].List_Functions[i]];
        }*/
        
        for(uint i=0; i<Contracts[contract_address].List_Functions.length; i++){
            delete Contracts[contract_address].Callables_functions[Contracts[contract_address].List_Functions[i]];
        }
        
        delete Contracts[contract_address];
        List_Contracts.remove(contract_address);
        
        emit Contract_Removed(contract_address);
    }
    
    /** 
     * @dev Make a call to a function of a third party smart contract belonging to the API
     * @param contract_address Address of the third party smart contract 
     * @param data Data corresponding to the function call. It's a bytes composed by the function selector + encoded parameters. It correspond to the field {data} of a transaction.
    */
    function Execute_Function(address contract_address, bytes memory data)external Register_Authorities_Only nonReentrant{
        bytes4 selector= (bytes4(data[0]) | bytes4(data[1]) >> 8 |
            bytes4(data[2]) >> 16 | bytes4(data[3]) >> 24);//= bytes4(data);
        /*assembly {
            selector := mload(add(data, 0x04))
        }*/
        require(Contracts[contract_address].Callables_functions[selector].Index!=0, "Function not registered");
        
        (bool Success, bytes memory Data)=contract_address.call(data);
        
        Contracts[contract_address].Callables_functions[selector].FunctionCall_receipts.push(Receipt(Success, Data, block.timestamp));
        
        emit Function_Executed(contract_address, selector);
    }
    
   /*GETTER*/
    
    /** 
     * @dev Get the list of all third party smart contract registered in the API.
     * @return list_contracts
    */
    function Get_List_Contract() external view returns(bytes32[] memory list_contracts){
        list_contracts = List_Contracts._inner._values;
    }
    
     /** 
     * @dev Get the list of all function selector of a contract registered in the API.
     * @param contract_address Address of the contract
     * @return list_functions
    */
    function Get_Contract_List_Functions(address contract_address) external view returns(bytes4[] memory list_functions){
        list_functions = Contracts[contract_address].List_Functions;
    }
    
     /** 
     * @dev Get the receipts of all call to a function of a contract registered in the API. It also returns the index of the function selector in the contract structure's {List_Functions} array.
     * @param contract_address Address of the contract
     * @param function_selector Function selector of the function
     * @return index
     * @return receipts
    */
    function Get_Functions_By_Selector(address contract_address, bytes4 function_selector) external view returns(uint index, Receipt[] memory receipts){
        index = Contracts[contract_address].Callables_functions[function_selector].Index;
        receipts = Contracts[contract_address].Callables_functions[function_selector].FunctionCall_receipts;
    }
    
 }