// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVote{
    
    
    function Create_Ballot(bytes32 key, address Voters_Register_Address, bytes4 Check_Voter_Selector, uint Vote_Duration, uint Vote_Validation_Duration, uint Propositions_Number, uint Max_Winning_Propositions_Number) external;
    
    function Vote_Clear(bytes32 key, uint[] calldata Choices) external;
    
    function Vote_Hashed(bytes32 key, bytes32 Choice) external;
    
    function End_Vote(bytes32 key)external;
    
    function Valdiate_Vote(bytes32 key, uint[] calldata Choices, bytes32 salt )external;
    
    function End_Validation_Vote(bytes32 key) external;
    
    function Get_Winning_Propositions(bytes32 key)external view returns(uint[] memory);
    
    function Get_Winning_Proposition_byId(bytes32 key, uint Id)external view returns(uint);

    function HasVoted(bytes32 key, address voter_address) external view returns(bool hasvoted);
    
	function HasValidated(bytes32 key, address voter_address) external view returns(bool Validated, bytes32 Choice);    
	
	function Get_Voter_Number(bytes32 key)external view returns(uint voter_num);
}