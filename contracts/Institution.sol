// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//pragma experimental ABIEncoderV2;


/*import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/structs/EnumerableSet.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/math/SafeMath.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/security/ReentrancyGuard.sol";
import "DemoCoin.sol";*/

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "contracts/DemoCoin.sol";


/** 
 * @notice This abstract contract is inherited by almost all contracts of "Web3 Direct Democracy" (except "DemoCoin" token and ballot contracts inheriting from "IVote" interface). 
 * It gathers some common features such as constitution address handling.
*/
abstract contract Institution is ReentrancyGuard{
    event Institution_Created(address Address, Institution_Type Type);
    event Constitution_Changed(address new_constitution);
    event Name_Changed();
    
    ///notice Type of the institution
    enum Institution_Type{
        CONSTITUTION,
        CITIZENS_REGISTRATION,
        AGORA,
        LOI,
        API,
        DELEGATION,
        CUSTOM
    }
    
    
    ///@dev Check that the caller address is the {Constitution_Address}
    modifier Constitution_Only(){
        require(msg.sender == Constitution_Address, "Constitution Only");
        _;
    }
    
    
    /*STATE*/
    
    ///@notice Name of the institution
    string public Name;
    ///@notice Address of the constitution of the DAO
    address public Constitution_Address;
    
    ///@notice Type of the Institution
    Institution_Type public Type_Institution;
    
    /**
     * @dev Set the name of the new institution and the address of the constitution.
     * @param name Name of the new institution
    */
    constructor(string memory name){
        Name=name;
        Constitution_Address = msg.sender; //All Institution contract whether are called by created by the Constitution contract or are the Constitution contract
    }
    
    /**
     * @dev The function Allows to change the Constitution contract the current Institution obey to. The function is only callable by the {Constitution_Address}
     * @param new_constitution Address of the new Constitution contract.
    */
    function Set_Constitution(address new_constitution)external Constitution_Only{
        require(new_constitution!=address(0), "Address 0");
        Constitution_Address= new_constitution;
        emit Constitution_Changed(new_constitution);
    }

    function Set_Name(string calldata name)external Constitution_Only{
        Name=name;
        emit Name_Changed();
    }
    
    /*UTILS*/
    /** 
     * @dev Utility function for computing Percentage.
     * @param ratio The ratio is represented with 2 decimals
     * @param base The base's number of decimal is arbitrary
     * @return Return the {ratio}% of {base}. The result is represented with the number of decimals of {base} 
    */
    function Percentage(uint16 ratio, uint base) internal pure returns(uint){
        return (ratio*base)/10000 ;// ((ratio*base)/100) * 10^(-ratio_decimals)
    }
}

