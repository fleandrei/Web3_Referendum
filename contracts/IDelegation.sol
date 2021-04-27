// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/** 
    @dev IDelegation is an interface for contracts that implement a governance system in which a group of elected accounts is allowed to rule one or more controled registers contract. 
    It allows to implement a repesentativ democracy system in which representatives (delegation members) mandate and decisions can be canceled via direct democracy.
    Delegation.sol contract is an implementation of this interface.
    By implementing this interface you can develop your own custom Delegations and plug them into a DAO project via the Constitution contract.
*/


interface IDelegation{
    
    /** 
     * @dev Change parameters related to the democratic process of registers governance. 
     * 
     * @param Uint256_Legislatifs_Arg It's an array (We use an array to prevent the "stack to deep error") of uint256 arguments representing respectively: 
     *          - Member_Max_Token_Usage: The maximum amount of token a member is allowed to use for a law project elaboration
     *          - Law_Initialisation_Price: The price in token for creating a law project
     *          - FunctionCall_Price: The price in token for one FunctionCall.
     *          - Proposition_Duration: The duration of the stage in which members are allowed to submit propositions
     *          - Vote_Duration: The duration of the stage in which members are allowed to vote for the proposition they want
     *          - Law_Censor_Period_Duration: The duration of the stage in which all citizens are allowed to sign a etition against the law project proposed by the Delegation
     *  
     * 
     * @param Censor_Proposition_Petition_Rate The minimum ratio of citizens required to cancel a law project
     * @param Censor_Penalty_Rate Ratio of total amount of token belonged by the delegation that will be lost if a law project is rejected by citizens
     * @param Ivote_address Address of the IVote contract that will be used during voting stage
    */
    function Update_Legislatif_Process(uint[6] calldata Uint256_Legislatifs_Arg, uint16 Censor_Proposition_Petition_Rate, 
         uint16 Censor_Penalty_Rate, address Ivote_address)external ;
         
    /** 
     * @dev Change parameters related to the democratic process of Delegation's members election.
     * 
     * @param Election_Duration Duration of the stage in which citizens are allowed to vote for Candidats they prefer
     * @param Validation_Duration Duration of the stage in which citizens can validate their hased vote by revealing their choice and the salt that has been used for hasing 
     * @param Mandate_Duration Duration of a delegation mandate
     * @param Immunity_Duration Amount of time after the beginning of a new mandate during which delegation's members can't be revoked
     * @param Num_Max_Members Maximum number of members in the delegation.
     * @param New_Election_Petition_Rate The minimum ratio of citizens required to revoke the current delegation's members and start a new election
     * @param Ivote_address Address of the IVote contract that will be used during election stage
    */
    function Update_Internal_Governance( uint Election_Duration, uint Validation_Duration, uint Mandate_Duration, uint Immunity_Duration,
        uint16 Num_Max_Members, uint16 New_Election_Petition_Rate, address Ivote_address)external;
        
    /** 
     * @dev Function used to add a register contract under the control of current delegation.
     * 
     * @param register_address Address of the register contract that can now be ruled by current delegation
    */
    function Add_Controled_Register(address register_address) external;
    
     /** 
     * @dev Function used to remove the control of a register contract from current delegation.
     * @param register_address Address of the register contract that isn't rulable anymore by current delegation
    */
    function Remove_Controled_Register(address register_address) external;
    
    
    /**
    * @dev Allows to check if an account belong to current delegation
    * @param member_address address of the account we want to check whether it belongs to current delegation or not.
    * @return contain Boolean indicating whether the account belongs to current delegation or not.
    */    
    function Contains(address member_address) external view returns(bool contain);
    
     /** 
     * @dev Function called by a citizen who wish to candidate to next mandate's elections.
    */
    function Candidate_Election() external;
    
     /** 
     * @dev Function called by a citizen who wish to remove his candidature from next mandate's elections.
    */
    function Remove_Candidature()external;
    
     /** 
     * @dev When the current mandate duration is over or if the {New_Election_Petition_Rate} (see {Mandate} struct of {Delegation_Uils} library) is reached, any citizen can call this function to start a new election
    */
    function New_Election() external;
    
    /** 
     * @dev Function can be called by a citizen to sign petition for a new election
    */
    function Sign_New_Election_Petition() external;
    
    
    /** 
     * @dev When voting stage is over, any citizen can call this function to end the election and start a new mandate.
    */
    function End_Election()external;
    
    /** 
     * @dev Function can be called by a delegation member to submit a new law project. This function put {Law_Initialisation_Price} (see {Law_Project_Parameters} struct of {Delegation_Uils library}) DemoCoin token of Delegation contract in Escrow.
     * @param register_address Address of the register contract the law project is about. Must be contained in Controled_Registers mapping.
     * @param Title Title of the law project. Can be an hash.
     * @param Description Text explaining the spirit and generals goals of the law project. Can be an hash.
    */
    function Add_Law_Project(address register_address, bytes calldata Title, bytes calldata Description)external;
    
    
    /** 
     * @dev Function can be called by a delegation member to submit a corpus of function calls propositions to an existing pending law project. This function put in Escrow {FunctionCall_Price} (see {Law_Project_Parameters} struct of {Delegation_Uils library}) DemoCoin token
     * multiplied by the number of function call contained in the proposition.
     * @param law_project Id of the law project hte caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     * @param Parent Proposition Id the caller wants to attach his proposition to. It's the parent proposition in the proposal tree. If there isn't any proposition in the tree we want to attach the new proposition to, we set Parent to 0
     * @param Parent_Proposals_Reuse List of Parent's function calls index we want to reuse in the new proposition. Function calls are ordered in the order we want them to be executed. 0 elements correspond to new function calls that have to be added by the caller in {New_Function_Call} argument.
     * @param New_Function_Call List of new function calls added by the caller. For each element of the New_Function_Call array, caller must set a 0 element in {Parent_Proposals_Reuse} array at the index he want the custom function call to be positioned 
     * @param Description Text to justify the new proposal. Can be an hash.
    */
    function Add_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) external;
    
    
    /** 
     * @dev Function can be called by a delegation member to modify a proposition that he has already created (He have to be the author of the proposition). 
     * Caller must approve {FunctionCall_Price} (see {Law_Project_Parameters} struct of {Delegation_Uils library}) 
     * multiplied by the number of function call he wants to add to the proposition, token for Delegation contract.
     * @param law_project Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     * @param Proposal Proposition Id to modify.
     * @param New_Items Array of new function calls to add to the Proposition.
     * @param Indexs array of Proposition's function call list indexs to inser new function call (contained in {New_Items}) to. {New_Items} and {Indexs} have the same length.
    */
    function Add_Item(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) external;
    
    
     /**
     * @dev When the period of proposition submiting is over, any citizen can call this function to start the voting stage. The Id of the ballot corresponding to current law project the IVote contract is computed by hashing {law_project} Id with current block timestamps.
     * @param law_project Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     */
    function Start_Vote(bytes32 law_project)external;
    
    
     /**
     * @dev When the voting period is over, any citizen can call this function to end the voting stage. If the winning proposition is the default proposition is the default one (Proposition 0) the law proejct is aborted. Otherwise, the Law Censoring stage is started.
     * @param law_project Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     */
    function Achiev_Vote(bytes32 law_project) external;
    
    
    /**
     * @dev If we are at the Law censor stage, any citizen can call this function to sign the petition for canceling the law project. If the {Censor_Proposition_Petition_Rate} (see {Law_Project_Parameters} structure) is reached, the law project is aborted.
     * @param law_project Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     */
    function Censor_Law(bytes32 law_project)external;
    
    
    /**
     * @dev If the Law censor period is over and the law project hasn't been rejected by citizens, then any delegation member can call this function to set the law project as ADOPTED (see {Status} enumeration).
     * @param law_project Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     */
    function Adopt_Law(bytes32 law_project)external;
    
     /**
     * @dev Once the law project has been adopted (ADOPTED value of {Status} enum) then any delegation member can call this function to execute all or some of the remaining function call of the winning proposition. 
     * For the law project to be fully executed all function call have to be executed.
     * @param law_project Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     * @param num_function_call_ToExecute Number of function calls to execute.
     */
    function Execute_Law(bytes32 law_project, uint num_function_call_ToExecute)external;
    
    
}