// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDelegation{
    
    
    function Update_Legislatif_Process(uint[6] calldata Uint256_Legislatifs_Arg, uint16 Censor_Proposition_Petition_Rate, 
         uint16 Censor_Penalty_Rate, address Ivote_address)external ;
         
    function Update_Internal_Governance( uint Election_Duration, uint Validation_Duration, uint Mandate_Duration, uint Immunity_Duration,
        uint16 Num_Max_Members, uint16 New_Election_Petition_Rate, address Ivote_address)external;
        
    function Add_Controled_Register(address register_address) external;
    
    function Remove_Controled_Register(address register_address) external;
        
    function Contains(address member_address) external view returns(bool);
}