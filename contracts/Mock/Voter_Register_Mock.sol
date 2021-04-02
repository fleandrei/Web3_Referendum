
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/EnumerableSet.sol";
//import "contracts/Institution.sol";
//import "Institution.sol";

contract  Voter_Register_Mock {
    using EnumerableSet for EnumerableSet.AddressSet;
    
    EnumerableSet.AddressSet Members;

    constructor(address[] memory members) {
        for(uint i =0; i<members.length; i++){
            Members.add(members[i]);
        }
    }

    function Contains(address member) external view returns(bool){
        return Members.contains(member);
    }
    
}