// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/** 
 * @dev IVote is an interface for contracts that implements a voting system. IVote contract should allow voters to chose M Winning Propositions among N Candidates Propositions (M<N). 
 * Propositions are represented by numbers going from 1 to N. 0 proposition is the default proposition and represent the blank vote. 
 * Voting choices can be clear or hashed with a bytes32 salt in order to prevent voters that hasn't voted yet from being influenced by oders voter's voting choices. 
 * If votes are hashed, voters should validate their vote after the voting period is over, by submiting their clear voting choice with the corresponding salt.
 * Serverals voting sessions with different parameters can be hold at the same time for various use case. 
 * Each new ballot should be provided with the address of a "Voter register" contract that contain a whitelist of account allowed to vote and with the function selector of a "Voter register" contract function that allow to check whether an account is allowed to vote or not.
 * */

interface IVote{
    
    /** 
     * @dev Creates a new voting session
     * @param key Id of the new voting session
     * @param Voters_Register_Address address of the contract that store account that are allowed to vote in this voting session
     * @param Check_Voter_Selector Function Selector of a Voters_Register_Address contract's function in charge of checking whether an address belongs to accounts allowed to vote. The function should take an address in parameters and return a boolean. 
     * @param Vote_Duration Duration of the stage in which members are allowed to vote 
     * @param Vote_Validation_Duration Duration of the stage in which accounts who have voted have to validate their voting choice.
     * @param Propositions_Number Number N of candidats Propositions
     * @param Max_Winning_Propositions_Number Number M of places.
    */
    function Create_Ballot(bytes32 key, address Voters_Register_Address, bytes4 Check_Voter_Selector, uint Vote_Duration, uint Vote_Validation_Duration, uint Propositions_Number, uint Max_Winning_Propositions_Number) external;
    
    /**
     * @dev Allows a voter to vote clear in a voting session. Only callable during Voting stage of a voting session.
     * @param key Id of the voting session
     * @param Choices Array of propositions Ids that correspond to voter choice
     */
    function Vote_Clear(bytes32 key, uint[] calldata Choices) external;
    
     /**
     * @dev Allows a voter to vote in a voting session with an hashed voting choice in order to keep it secret until the vote validation stage. Only callable during Voting stage of a voting session.
     * @param key Id of the voting session
     * @param Choice Hash of the Array of propositions Ids that correspond to voter's choice with a salt bytes32 value created by the voter.
     */
    function Vote_Hashed(bytes32 key, bytes32 Choice) external;
    
    /**
     * @dev End the voting stage if it is over. If votes are hashed then we start the validation stage, else votes are tailled and we should have access to winning propositions
     * @param key Id of the voting session
     */
    function End_Vote(bytes32 key)external;
    
    /**
     * @dev Allows voter to validate their hashed voting choice by submitting it coupled with the salt bytes32 value that has been used to hash it. nly callable during Validation stage of a voting session.
     * @param key Id of the voting session
     * @param Choices Array of propositions Ids that correspond to voter choice
     * @param salt bytes32 value that has been used to hash the "Choice" value.
     */ 
    function Valdiate_Vote(bytes32 key, uint[] calldata Choices, bytes32 salt )external;
    
     /**
     * @dev End the validation stage if it is over. Votes are tailled and we should have access to winning propositions
     * @param key Id of the voting session
     */
    function End_Validation_Vote(bytes32 key) external;
    
     /**
     * @dev Get winning propositions list of a voting session. Only callable if the ballot have been tailled (after End_Vote of End_Validation_Vote call).
     * @param key Id of the voting session
     * @return Winning_Propositions_List List of winning propositions list.
     */
    function Get_Winning_Propositions(bytes32 key)external view returns(uint[] memory Winning_Propositions_List);
    
    /**
     * @dev Get a winning proposition by it's rank. Only callable if the ballot have been tailled (after End_Vote of End_Validation_Vote call).
     * @param key Id of the voting session
     * @param Id Rank (index) of the proposition we want to get in the List of winning propositions.
     * @return Winning_Propositions 
     */
    function Get_Winning_Proposition_byId(bytes32 key, uint Id)external view returns(uint Winning_Propositions);
    
     /**
     * @dev Check whether an account has voted or not.
     * @param key Id of the voting session
     * @param voter_address Address of the account 
     * @return hasvoted Boolean. 
     */
    function HasVoted(bytes32 key, address voter_address) external view returns(bool hasvoted);
    
     /**
     * @dev Check whether an account has Validated his vote or not.
     * @param key Id of the voting session
     * @param voter_address Address of the account 
     * @return Validated Boolean. 
     * @return Choice Validated voting choice.
     */
    function HasValidated(bytes32 key, address voter_address) external view returns(bool Validated, bytes32 Choice);    
    
    /**
    * @dev Get the number of accounts that have voted in the Voting session
    * @param key Id of the voting session
    * @return voter_num
    */
    function Get_Voter_Number(bytes32 key)external view returns(uint voter_num);
}