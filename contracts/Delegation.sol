// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import "Initiative_Legislative.sol";
//import "IDelegation.sol";
//import "Agora.sol";
/*import "Initiative_Legislative_lib.sol";
import "Register.sol";
import "Citizens_Register.sol";
import "IVote.sol";
import "IDelegation.sol";*/


import "contracts/Initiative_Legislative_lib.sol";
import "contracts/Register.sol";
import "contracts/Citizens_Register.sol";
import "contracts/IVote.sol";
import "contracts/IDelegation.sol";




/** 
 * @dev Delegation_Uils library is used to reduce the size of Delegation contract in order to avoid to exceed contract limit size. It contains heavy functions and data structures.
*/

library Delegation_Uils{
    using EnumerableSet for EnumerableSet.AddressSet;
    
    
    /**
     * @dev Parameters related to the democratic process of registers governance.
     *          - Member_Max_Token_Usage: The maximum amount of token a member is allowed to use for a specific law project elaboration
     *          - Law_Initialisation_Price: The price in token for creating a law project
     *          - FunctionCall_Price: The price in token for one FunctionCall.
     *          - Proposition_Duration: The duration of the stage in which members are allowed to submit propositions
     *          - Vote_Duration: The duration of the stage in which members are allowed to vote for the proposition they want
     *          - Law_Censor_Period_Duration: The duration of the stage in which all citizens are allowed to sign a etition against the law project proposed by the Delegation
     *          - Censor_Proposition_Petition_Rate The minimum ratio of citizens required to cancel a law project
     *          - Censor_Penalty_Rate The amount of token the delegation will lost if their law project is rejected by citizens
     *          - Ivote_address Address of the IVote contract that will be used during voting stage
    */
    struct Law_Project_Parameters{
        //uint Revert_Penalty_Limit;
        uint Member_Max_Token_Usage;
        uint Law_Initialisation_Price;
        uint FunctionCall_Price; 
        uint Proposition_Duration;
        uint Vote_Duration;
        uint Law_Censor_Period_Duration;
        uint16 Censor_Proposition_Petition_Rate;
        uint16 Censor_Penalty_Rate;
        address Ivote_address;
        //EnumerableSet.AddressSet Associated_Institutions;
    }
    
   
     
    /**
     * @dev Structure reresenting parameters related to the democratic process of registers governance.
     *          - Election_Duration Duration of the stage in which citizens are allowed to vote for Candidats they prefer
     *          - Validation_Duration Duration of the stage in which citizens can validate their hased vote by revealing their choice and the salt that has been used for hasing 
     *          - Mandate_Duration Duration of a delegation mandate
     *          - Immunity_Duration Amount of time after the beginning of a new mandate during which delegation's members can't be revoked
     *          - Next_Mandate_Max_Members Maximum number of members in the delegation.
     *          - New_Election_Petition_Rate The minimum ratio of citizens required to revoke the current delegation's members and start a new election
     *          - Ivote_address Address of the IVote contract that will be used during election stage
    */
    struct Mandate_Parameter{
        uint Election_Duration;
        uint Validation_Duration;
        uint Mandate_Duration;
        uint Immunity_Duration;
        uint16 Next_Mandate_Max_Members;
        uint16 New_Election_Petition_Rate;
        address Ivote_address;
    }
    
    /**
     * @dev Structure representing a mandate.
     *          - Members Duration : List of members of the delegation
     *          - New_Election_Petitions: List of citizens who have signed petition for revoking the current delegation's members.
     *          - Next_Mandate_Candidats: List of accounts that are candidates for the next election
     *          - Inauguration_Timestamps: Beginning of current mandate
     *          - Election_Timestamps: Beginning of election
     *          - Version: Version of parameters (Id of {Mandate_Parameter} object) used by this mandate
    */
    struct Mandate{
        EnumerableSet.AddressSet Members;
        EnumerableSet.AddressSet New_Election_Petitions;
        EnumerableSet.AddressSet Next_Mandate_Candidats;
        uint Inauguration_Timestamps;
        uint Election_Timestamps;
        uint Version;
    }
    
    
    event Governance_Parameters_Updated();
    event Legislatif_Parameters_Updated();
    event New_Candidat(address Candidat);
    event Remove_Candidat(address Candidat);
    event Sign();
    event New_election(bytes32 Vote_key);
    event New_Mandate();
    
    ///@dev Function used for updating parameters related to the democratic process of rmembers election. See {Update_Internal_Governance] function of {Delegation} or {IDelegation} contract
    function Update_Mandate_Parameter(Mandate_Parameter storage mandate_param, uint Election_Duration, uint Validation_Duration, uint Mandate_Duration, uint Immunity_Duration,
        uint16 Next_Mandate_Max_Members, uint16 New_Election_Petition_Rate, address Ivote_address) external {
            mandate_param.Election_Duration = Election_Duration;
            mandate_param.Validation_Duration = Validation_Duration;
            mandate_param.Mandate_Duration = Mandate_Duration;
            mandate_param.Immunity_Duration = Immunity_Duration;
            mandate_param.Next_Mandate_Max_Members = Next_Mandate_Max_Members;
            mandate_param.New_Election_Petition_Rate = New_Election_Petition_Rate;
            mandate_param.Ivote_address = Ivote_address;
            
            emit Governance_Parameters_Updated();
        }
        
        ///@dev Function used for updating parameters related to the democratic process of registers governance. See {Update_Legislatif_Process] function of {Delegation} or {IDelegation} contract
        function Update_Law_Parameters(Law_Project_Parameters storage projet_param, uint[6] calldata Uint256_Legislatifs_Arg, uint16 Censor_Proposition_Petition_Rate, 
         uint16 Censor_Penalty_Rate, address Ivote_address) external {
             projet_param.Member_Max_Token_Usage = Uint256_Legislatifs_Arg[0];
             projet_param.Law_Initialisation_Price = Uint256_Legislatifs_Arg[1];
             projet_param.FunctionCall_Price = Uint256_Legislatifs_Arg[2];
             projet_param.Proposition_Duration = Uint256_Legislatifs_Arg[3];
             projet_param.Vote_Duration = Uint256_Legislatifs_Arg[4];
             projet_param.Law_Censor_Period_Duration = Uint256_Legislatifs_Arg[5];
             projet_param.Censor_Proposition_Petition_Rate = Censor_Proposition_Petition_Rate;
             projet_param.Censor_Penalty_Rate = Censor_Penalty_Rate;
             projet_param.Ivote_address = Ivote_address;
             
             emit Legislatif_Parameters_Updated();
        }
    
    
        /**
         * @dev Function called by {End_Election} function of {Delegation} Contract to end the current contract and start a new one.
         * @param Mandates mapping of Mandate structure idexed by uint corresponding to their order of apparition
         * @param ivote_address Address of IVote contract used by citizens to vote during election.
         * @param last_mandate_num Index in {Mandates} mapping of the last mandate
         * @param Internal_Governance_Version Version of Parameters ({Mandate_Parameter} structur) u.sed by the current mandate
         * */
    function Transition_Mandate(mapping (uint=>Mandate) storage Mandates, address ivote_address, uint last_mandate_num, uint Internal_Governance_Version) external{
        uint new_mandate_num=last_mandate_num+1;
        uint[] memory results;
        IVote Vote_Instance = IVote(ivote_address);
        results = Vote_Instance.Get_Winning_Propositions(keccak256(abi.encodePacked(address(this),Mandates[last_mandate_num].Election_Timestamps)));
        
        if(results[0]==0){
            uint actual_member_length = Mandates[last_mandate_num].Members.length();
            for(uint i =0; i<actual_member_length; i++){
                Mandates[new_mandate_num].Members.add(Mandates[last_mandate_num].Members.at(i));
            }
        }else{
            for(uint i =0; i<results.length; i++){
                Mandates[new_mandate_num].Members.add(Mandates[last_mandate_num].Next_Mandate_Candidats.at(results[i]-1));
            }
        }
        
        Mandates[new_mandate_num].Inauguration_Timestamps = block.timestamp;
        Mandates[new_mandate_num].Version = Internal_Governance_Version;
        emit New_Mandate();
    }
    
    /**
     * @dev Function called by {Candidate_Election} function of {Delegation} contract to add a new account to the list of candidats for next election
     * @param mandate Current Mandate object
     * @param new_candidat Account to add to the list of candidats
    */
    function Add_Candidats(Mandate storage mandate, address new_candidat)external{
        require(!mandate.Next_Mandate_Candidats.contains(new_candidat), "Already Candidate");
        mandate.Next_Mandate_Candidats.add(new_candidat);
        emit New_Candidat(new_candidat);
    
    }
    
    /**
     * @dev Function called by {Remove_Candidature} function of {Delegation} contract to remove an account from the list of candidats for next election
     * @param mandate Current Mandate object
     * @param remove_candidat Account to remove from the list of candidats
    */
    function Remove_Candidats(Mandate storage mandate, address remove_candidat)external{
        require(mandate.Next_Mandate_Candidats.contains(remove_candidat), "Not Candidate");
        mandate.Next_Mandate_Candidats.remove(remove_candidat);
        emit Remove_Candidat(remove_candidat);
    }
    
    /**
     * @dev Function called by {Sign_New_Election_Petition} function of {Delegation} contract to add an account to list petition for revoking current delegation members
     * @param mandate Current Mandate object
     * @param Immunity_Duration Amount of time after the beginning of a new mandate during which delegation's members can't be revoked
     * @param signer Address of account who want to sign the petition
    */
    function Sign_Petition(Mandate storage mandate, uint Immunity_Duration, address signer)external{
        require(block.timestamp - mandate.Inauguration_Timestamps > Immunity_Duration, "Immunity Period");
        require(!mandate.New_Election_Petitions.contains(signer), "Already signed petition");
        mandate.New_Election_Petitions.add(signer);
        emit Sign();
    }
    
    /**
     * @dev Function called by {New_Election} function of {Delegation} contract to start a new election
     * @param Mandates mapping of Mandate structure idexed by uint corresponding to their order of apparition
     * @param mandate_version Mandate_Parameter object corresponding to parameters that are used by current mandate
     * @param num_mandate Index of the current mandate in the {Mandates} mapping
     * @param citizen_register_address Address of {Citizens_Register} contract used in the current project to handle citizens registration 
    */
    function New_Election(mapping(uint=>Mandate) storage Mandates, Mandate_Parameter storage mandate_version, uint num_mandate, address citizen_register_address)external returns(bool new_election){
        uint candidats_number = Mandates[num_mandate].Next_Mandate_Candidats.length();
        Citizens_Register citizen = Citizens_Register(citizen_register_address);
        require(candidats_number>0, "No Candidats");
        require(Mandates[num_mandate].New_Election_Petitions.length() >= Percentage(mandate_version.New_Election_Petition_Rate, citizen.Get_Citizen_Number()) || (block.timestamp - Mandates[num_mandate].Inauguration_Timestamps) > mandate_version.Mandate_Duration, "New election impossible for now");
        if(candidats_number <= mandate_version.Next_Mandate_Max_Members){
            uint new_mandate_num = num_mandate+1;
            for(uint i =0; i<candidats_number; i++){
                Mandates[new_mandate_num].Members.add(Mandates[num_mandate].Next_Mandate_Candidats.at(i));
            }
            Mandates[new_mandate_num].Inauguration_Timestamps = block.timestamp;
            
            emit New_Mandate();
            return false;
        }else{
            Mandates[num_mandate].Election_Timestamps = block.timestamp;
            IVote Vote_Instance = IVote(mandate_version.Ivote_address);
            bytes32 key = keccak256(abi.encodePacked(address(this),block.timestamp));
            emit New_election(key);
            Vote_Instance.Create_Ballot(key, citizen_register_address, Citizens_Register(citizen_register_address).Contains_Function_Selector(), mandate_version.Election_Duration, mandate_version.Validation_Duration, candidats_number, mandate_version.Next_Mandate_Max_Members);
           
            return true;
        }
        
    }
    
    /**
     * @dev Function called by the constructor function of {Delegation} contract to start the first mandate.
     * @param mandate Current Mandate object 
     * @param Initial_members Members of the first Delegation
    */
    function Set_First_Mandate(Mandate storage mandate, address[] memory Initial_members)external{
        mandate.Inauguration_Timestamps = block.timestamp;
        for(uint i=0; i<Initial_members.length; i++){
            mandate.Members.add(Initial_members[i]);
        }
        mandate.Version= 1;
    }
    
    /*function Set_Legislatif_Process_Param(uint[6] calldata Uint256_Legislatifs_Arg, uint16 Censor_Proposition_Petition_Rate, uint16 Censor_Penalty_Rate, address Ivote_address, uint version)external{
        this.Law_Parameters_Versions[version].Member_Max_Token_Usage = Uint256_Legislatifs_Arg[0];
        this.Law_Parameters_Versions[version].Law_Initialisation_Price = Uint256_Legislatifs_Arg[1];
        this.Law_Parameters_Versions[version].FunctionCall_Price = Uint256_Legislatifs_Arg[2];
        this.Law_Parameters_Versions[version].Proposition_Duration = Uint256_Legislatifs_Arg[3];
        this.Law_Parameters_Versions[version].Vote_Duration = Uint256_Legislatifs_Arg[4];
        this.Law_Parameters_Versions[version].Law_Censor_Period_Duration = Uint256_Legislatifs_Arg[5];
        this.Law_Parameters_Versions[version].Censor_Proposition_Petition_Rate = Censor_Proposition_Petition_Rate;
        this.Law_Parameters_Versions[version].Censor_Penalty_Rate = Censor_Penalty_Rate;
        this.Law_Parameters_Versions[version].Ivote_address = Ivote_address;
    }*/
    
    
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




/**
 * @dev Delegation contract is an implementation of IDelegation and thus aims at implementing a governance system in which a group of elected accounts is allowed to rule one or more controled registers contract. 
*/

 contract Delegation is Institution, IDelegation{// Initiative_Legislative{
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeMath for uint;
    using Initiative_Legislative_Lib for Initiative_Legislative_Lib.Law_Project;
    using Delegation_Uils for Delegation_Uils.Mandate_Parameter;
    using Delegation_Uils for Delegation_Uils.Mandate;
    using Delegation_Uils for Delegation_Uils.Law_Project_Parameters;
    /*using Delegation_Uils for Delegation_Uils.Controlable_Register;
    using Delegation_Uils for Delegation_Uils.Delegation_Law_Project;
    using Delegation_Uils for Delegation_Uils.Status;*/
    
    /**
     * @dev status of a law project
     */
    enum Status{
        PROPOSITION,
        VOTE,
        CENSOR_LAW_PERIOD,
        ADOPTED,
        EXECUTED,
        ABORTED
    }
    
    /**
     * @dev Structure representing parameters related to the democratic process of registers governance. 
     * 
     * - Member_Max_Token_Usage: The maximum amount of token a member is allowed to use for a law project elaboration
     * - Law_Initialisation_Price: The price in token for creating a law project
     * - FunctionCall_Price: The price in token for one FunctionCall.
     * - Proposition_Duration: The duration of the stage in which members are allowed to submit propositions
     * - Vote_Duration: The duration of the stage in which members are allowed to vote for the proposition they want
     * - Law_Censor_Period_Duration: The duration of the stage in which all citizens are allowed to sign a etition against the law project proposed by the Delegation
     * - Censor_Proposition_Petition_Rate The minimum ratio of citizens required to cancel a law project
     * - Censor_Penalty_Rate Ratio of total amount of token belonged by the delegation that will be lost if a law project is rejected by citizens
     * - Ivote_address Address of the IVote contract that will be used during voting stage
     */
    struct Law_Project_Parameters{
        //uint Revert_Penalty_Limit;
        uint Member_Max_Token_Usage;
        uint Law_Initialisation_Price;
        uint FunctionCall_Price; 
        uint Proposition_Duration;
        uint Vote_Duration;
        uint Law_Censor_Period_Duration;
        uint16 Censor_Proposition_Petition_Rate;
        uint16 Censor_Penalty_Rate;
        address Ivote_address;
        //EnumerableSet.AddressSet Associated_Institutions;
    }
    
    /**
     * @dev Structure representing {Register} contract that are controled by the Delegation
     *  - Active: Whether the register is still under the actual Delegation control in the Constitution.
     *  - Law_Project_Counter: Number of pending law project related to this register
     * The Register can't be removed from delegation's control if there are pending law project related to it. However if {Active} field is false, then we can't start a new law project whose controled register is the current one.
    */
    struct Controlable_Register{
        bool Active;                
        uint Law_Project_Counter;
    }
    
     /**
     * @dev Structure representing a law project
     *  - Institution_Address: Address of register being concerned by this law project
     *  - Law_Project_Status: Status ({Status} structure) of the law project 
     *  - Version: Version of Parameters ({Law_Project_Parameters} structure) used by the current law project
     *  - Creation_Timestamp: Beginning of current law project
     *  - Start_Vote_Timestamps: Beginning of voting stage 
     *  - Start_Censor_Law_Period_Timestamps: Beginning of law project censorable stage
     *  - Law_Total_Potentialy_Lost: Amount of token that could be lost in penalty fee if all pending law project were to be censored by citizens petition
     *  - Censor_Law_Petition_Counter: Number of citizens that have signed the petition to censor the current law project
     *  - Censor_Law_Petitions: List of citizens that have signed the petition to censor the current law project
     *  - Members_Token_Consumption: Mapping of the amount of token consummed by each member of the delegation
    */
    struct Delegation_Law_Project{
        address Institution_Address;
        Status Law_Project_Status;
        uint Version;
        uint Creation_Timestamp;
        uint Start_Vote_Timestamps;
        uint Start_Censor_Law_Period_Timestamps;
        uint Law_Total_Potentialy_Lost;
        uint Censor_Law_Petition_Counter;
        mapping(address=>bool) Censor_Law_Petitions;
        mapping(address=>uint) Members_Token_Consumption;
    }
    
    
    modifier Citizen_Only{
        require(Citizens.Contains(msg.sender),"Citizen Only");
        _;
    }
    
    modifier Delegation_Only{
        require(Mandates[Actual_Mandate].Members.contains(msg.sender), "Delegation Only");
        _;
    }
    
    event Governance_Parameters_Updated();
    event Legislatif_Parameters_Updated();
    event New_Candidat(address Candidat);
    event Remove_Candidat(address Candidat);
    event Sign();
    event New_election(bytes32 Vote_key);
    event New_Mandate();
    
    event Controled_Register_Added(address register);
    event Controled_Register_Canceled(address register);
    event Controled_Register_Removed(address register);
    event New_Law(bytes32 key);
    event New_Proposal(bytes32 key, uint proposal_index);
    event Proposal_Modified(bytes32 key, uint proposal_index);
    event Voting_Stage_Started(bytes32 law_project, bytes32 key);
    event Voting_Stage_Achieved(bytes32 key);
    event Law_Aborted(bytes32 key);
    event Law_Adopted(bytes32 key);
    event Law_executed(bytes32 key);
    event Function_Call_Executed( bytes32 key, uint num_function_call_ToExecute);
    
    
    
    //event New_Proposal(bytes32 key, uint num);
    
    /// @dev function selector of {Contains} function used to check Whether an account is member of the delegation
    bytes4 constant Contains_Function_Selector = 0x57f98d32;
    
    ///@dev Instance of the {DemoCoin} token used by the Project
    DemoCoin Democoin;
    
    ///@dev Instance of the {Citizens_Register} contract used by the Project
    Citizens_Register Citizens;
    
    //dev Address of the {Agora} contract used by the Project
    address Agora_address;
    
    ///@dev Total amount of token potentially lost via penalty fee. 
    uint Potentialy_Lost_Amount;
    
    /*Legislatif Process*/
    
    /** @dev Mapping of {Law_Project} structure ({Initiative_Legislative_Lib} library)
     * 
     * */
    mapping(bytes32 => Initiative_Legislative_Lib.Law_Project) public List_Law_Project;
    
    ///@dev Mapping of Registers ({Controlable_Register} structure) that can receive orders from the actual Delegation
    mapping(address=>Controlable_Register) public Controled_Registers;
    /// @dev List of Controled Registers
    EnumerableSet.AddressSet List_Controled_Registers;
    
    ///@dev Mapping of {Delegation_Law_Project} structure corresponding to law project of delegation (pending, aborted and passed)
    mapping(bytes32=>Delegation_Law_Project) public Delegation_Law_Projects;
    ///@dev List of law projects
    bytes32[] List_Delegation_Law_Projects;
    ///@dev Mapping of versions of Parameters ({Law_Project_Parameters} of {Delegation_Uils} library) used for law project process
    mapping(uint=>Delegation_Uils.Law_Project_Parameters) public Law_Parameters_Versions;
    
    
    
    /*Internal Governance*/
    ///@dev Mapping of {Mandate} structure ({Delegation_Uils} library) corresponding to mandates of delegation (pending and passed)
    mapping(uint=>Delegation_Uils.Mandate) Mandates;
    ///@dev Mapping of versions of Parameters ({Mandate_Parameter} of {Delegation_Uils} library) used for delegation internal governance.
    mapping(uint=>Delegation_Uils.Mandate_Parameter) public Mandates_Versions;
    
    
    ///@dev Current version of parameters related to law project process 
    uint Legislatif_Process_Version;
    ///@dev Current version of parameters related to delegation internal governance
    uint Internal_Governance_Version;
    /// @dev Id in {Mandate} mapping  of the current mandate 
    uint Actual_Mandate;
    /// @dev Boolean set whether we are in election stage or not.
    bool In_election_stage;
    
    
     /** 
     * @param Name name of the Institution
     * @param Initial_members List of initial members of the delegation 
     * @param token_address Address of {DemoCoin} token that will be used to transfert initial token amount to new registered citizens 
     * @param citizen_address Address of the {Citizens_Register} contract used in the Project 
     * @param agora_address Address of the {Agora} contract used in the project.
    */
    constructor(string memory Name, address[] memory Initial_members, address token_address, address citizen_address, address agora_address) Institution(Name) {
        Type_Institution = Institution_Type.DELEGATION;
        Democoin = DemoCoin(token_address);
        Citizens = Citizens_Register(citizen_address);
        Agora_address = agora_address;
        
        Mandates[0].Set_First_Mandate( Initial_members);
        /*Mandates[1].Inauguration_Timestamps = block.timestamp;
        for(uint i=0; i<Initial_members.length; i++){
            Mandates[1].Members.add(Initial_members[i]);
        }
        Mandates[1].Version= 0;*/
        //Actual_Mandate = 1;
    }
    
    
    /*Members Election related functions*/
    
    /** 
     * @dev Function called by a citizen who wish to candidate to next mandate's elections.
    */
    function Candidate_Election() external override Citizen_Only{
        require(!In_election_stage, "Election Time");
        Mandates[Actual_Mandate].Add_Candidats(msg.sender);
        emit New_Candidat(msg.sender);
        /*uint num_mandate = Actual_Mandate;
        require(!Mandates[num_mandate].Next_Mandate_Candidats.contains(msg.sender), "Already Candidate");
        Mandates[num_mandate].Next_Mandate_Candidats.add(msg.sender);*/
    }
    
     /** 
     * @dev Function called by a citizen who wish to remove his candidature from next mandate's elections.
    */
    function Remove_Candidature()external override{
        require(!In_election_stage, "Election Time");
        Mandates[Actual_Mandate].Remove_Candidats(msg.sender);
        emit Remove_Candidat(msg.sender);
        /*uint num_mandate = Actual_Mandate;
        require(Mandates[num_mandate].Next_Mandate_Candidats.contains(msg.sender), "Not Candidate");
        require(!In_election_stage, "Election Time");
        Mandates[num_mandate].Next_Mandate_Candidats.remove(msg.sender);*/
    }
    
    /** 
     * @dev When the current mandate duration is over or if the {New_Election_Petition_Rate} (see {Mandate} struct of {Delegation_Uils} library) is reached, any citizen can call this function to start a new election
    */
    function New_Election() external override Citizen_Only {
        require(!In_election_stage, "An Election is Pending");
        uint num_mandate = Actual_Mandate;
        if(Delegation_Uils.New_Election(Mandates,Mandates_Versions[Mandates[num_mandate].Version], num_mandate, address(Citizens))){
            In_election_stage= true;
            emit New_election(keccak256(abi.encodePacked(address(this),block.timestamp)));
        }else{
            uint new_mandate_num = num_mandate+1;
            Actual_Mandate = new_mandate_num;
            Mandates[new_mandate_num].Version = Internal_Governance_Version;
            emit New_Mandate();
        }
        
        //Mandates[num_mandate].New_Election(Mandates_Versions[Mandates[num_mandate].Version], Citizens.Get_Citizen_Number(), num_mandate, Contains_Function_Selector);
        //In_election_stage=true;
        /*uint num_mandate = Actual_Mandate;
        uint version = Mandates[num_mandate].Version;
    
        require(Mandates[num_mandate].New_Election_Petitions.length() >= Percentage(Mandates_Versions[version].New_Election_Petition_Rate, Citizens.Get_Citizen_Number()) || block.timestamp.sub(Mandates[num_mandate].Inauguration_Timestamps) > Mandates_Versions[version].Mandate_Duration, "New election impossible for now");
            
        IVote Vote_Instance = IVote(Law_Parameters_Versions[version].Ivote_address);
        Vote_Instance.Create_Ballot(keccak256(abi.encodePacked(address(this),num_mandate)), address(this), Contains_Function_Selector, Mandates_Versions[version].Election_Duration, Mandates_Versions[version].Validation_Duration, Mandates[num_mandate].Next_Mandate_Candidats.length(), Mandates_Versions[version].Num_Max_Members);
        In_election_stage=true;*/
    }
    
    
    /** 
     * @dev Function can be called by a citizen to sign petition for a new election
    */
    function Sign_New_Election_Petition() external override Citizen_Only{
        uint num_mandate = Actual_Mandate;
        Mandates[num_mandate].Sign_Petition(Mandates_Versions[Mandates[num_mandate].Version].Immunity_Duration, msg.sender);
        emit Sign();
        /*require(block.timestamp.sub(Mandates[num_mandate].Inauguration_Timestamps) > Mandates_Versions[Mandates[num_mandate].Version].Immunity_Duration);
        require(!Mandates[num_mandate].New_Election_Petitions.contains(msg.sender), "Already signed petition");
        Mandates[num_mandate].New_Election_Petitions.add(msg.sender);*/
    }
    
    /*function End_Election()external{
        uint num_mandate = Actual_Mandate;
        uint new_num_mandate = num_mandate.add(1);
        uint[] memory results;
        IVote Vote_Instance = IVote(Law_Parameters_Versions[Mandates[num_mandate].Version].Ivote_address);
        results = Vote_Instance.Get_Winning_Propositions(keccak256(abi.encodePacked(address(this),num_mandate)));
        for(uint i =0; i<results.length; i++){
            Mandates[new_num_mandate].Members.add(Mandates[num_mandate].Next_Mandate_Candidats.at(results[i]));
        }
        Mandates[new_num_mandate].Inauguration_Timestamps = block.timestamp;
        Mandates[num_mandate].Version=Internal_Governance_Version;
        Actual_Mandate = new_num_mandate;
        In_election_stage=false;
    }*/
    
    /** 
     * @dev When voting stage is over, any citizen can call this function to end the election and start a new mandate.
    */
    function End_Election()external override {
    
        require(In_election_stage, "Not in Election time");
        uint num_mandate = Actual_Mandate;
        //uint new_num_mandate = num_mandate.add(1);
          
        In_election_stage=false;
        Actual_Mandate = num_mandate + 1;
        emit New_Mandate();
        Delegation_Uils.Transition_Mandate(Mandates, Mandates_Versions[Mandates[num_mandate].Version].Ivote_address, num_mandate, Internal_Governance_Version);
        
    }
    
    
    
    
    /*Legislatif Process related functions*/
    
    /** 
     * @dev Function can be called by a delegation member to submit a new law project. This function put {Law_Initialisation_Price} (see {Law_Project_Parameters} struct of {Delegation_Uils library}) DemoCoin token of Delegation contract in Escrow.
     * @param register_address Address of the register contract the law project is about. Must be contained in Controled_Registers mapping.
     * @param Title Title of the law project. Can be an hash.
     * @param Description Text explaining the spirit and generals goals of the law project. Can be an hash.
    */
    function Add_Law_Project(address register_address, bytes calldata Title, bytes calldata Description)external override Delegation_Only{
        //_Update_Law_Project();
        require(Controled_Registers[register_address].Active, "Register Not Controled");
        
        bytes32 key = keccak256(abi.encode(Title,Description));
        require(Delegation_Law_Projects[key].Version==0,"Law project already created");
        
        uint version =Legislatif_Process_Version;
        Delegation_Law_Projects[key].Version = version;
        Token_Consumption_Handler(msg.sender, Law_Parameters_Versions[version].Law_Initialisation_Price, key);
        
        
        Delegation_Law_Projects[key].Institution_Address = register_address;
        Delegation_Law_Projects[key].Creation_Timestamp = block.timestamp;
        
        List_Delegation_Law_Projects.push(key);
        
        List_Law_Project[key].Title = Title;
        List_Law_Project[key].Description = Description;
        
        Controled_Registers[register_address].Law_Project_Counter++;
        
        emit New_Law(key);
        //List_Law_Project[key].Add_Law_Project(Title, Description);
        //Add_Law_Project(Title,  Description, key);
    }
    
     /** 
     * @dev Function can be called by a delegation member to submit a corpus of function calls propositions to an existing pending law project. This function put in Escrow {FunctionCall_Price} (see {Law_Project_Parameters} struct of {Delegation_Uils library}) DemoCoin token
     * multiplied by the number of function call contained in the proposition.
     * @param law_project Id of the law project hte caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     * @param Parent Proposition Id the caller wants to attach his proposition to. It's the parent proposition in the proposal tree. If there isn't any proposition in the tree we want to attach the new proposition to, we set Parent to 0
     * @param Parent_Proposals_Reuse List of Parent's function calls index we want to reuse in the new proposition. Function calls are ordered in the order we want them to be executed. 0 elements correspond to new function calls that have to be added by the caller in {New_Function_Call} argument.
     * @param New_Function_Call List of new function calls added by the caller. For each element of the New_Function_Call array, caller must set a 0 element in {Parent_Proposals_Reuse} array at the index he want the custom function call to be positioned 
     * @param Description Text to justify the new proposal. Can be an hash.
    */
    function Add_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) external override Delegation_Only{
        require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.PROPOSITION, "Not at PROPOSITION status");
        uint version = Delegation_Law_Projects[law_project].Version;
        require( version != 0, "No existing Law Project");
        
        Token_Consumption_Handler(msg.sender, Law_Parameters_Versions[version].FunctionCall_Price.mul(New_Function_Call.length), law_project);
        uint proposal_index = List_Law_Project[law_project].Proposal_Count.add(1);
        List_Law_Project[law_project].Proposals_Tree[proposal_index].Author = msg.sender;
       // Add_Corpus_Proposal( law_project, Parent, Parent_Proposals_Reuse, New_Function_Call, Description) ;
       List_Law_Project[law_project].Add_Corpus_Proposal(Parent, Parent_Proposals_Reuse, New_Function_Call, Description);
       emit New_Proposal( law_project, proposal_index);
    }
    
    /** 
     * @dev Function can be called by a delegation member to modify a proposition that he has already created (He have to be the author of the proposition). 
     * Caller must approve {FunctionCall_Price} (see {Law_Project_Parameters} struct of {Delegation_Uils library}) 
     * multiplied by the number of function call he wants to add to the proposition, token for Delegation contract.
     * @param law_project Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     * @param Proposal Proposition Id to modify.
     * @param New_Items Array of new function calls to add to the Proposition.
     * @param Indexs array of Proposition's function call list indexs to inser new function call (contained in {New_Items}) to. {New_Items} and {Indexs} have the same length.
    */
    function Add_Item(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) external override Delegation_Only{
        require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.PROPOSITION, "Law Not at PROPOSITION status");
        uint version = Delegation_Law_Projects[law_project].Version;
        require( version != 0, "No existing Law Project");
        
        Token_Consumption_Handler(msg.sender, Law_Parameters_Versions[version].FunctionCall_Price.mul(New_Items.length), law_project);
        
        //Add_Item_Proposal(law_project, Proposal, New_Items, Indexs, msg.sender);
        List_Law_Project[law_project].Add_Item_Proposal( Proposal, New_Items, Indexs, msg.sender);
        emit Proposal_Modified(law_project, Proposal);
    }
    
    /**
     * @dev When the period of proposition submiting is over, any citizen can call this function to start the voting stage. The Id of the ballot corresponding to current law project the IVote contract is computed by hashing {law_project} Id with current block timestamps.
     * @param law_project Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     */
    function Start_Vote(bytes32 law_project)external override Delegation_Only{
        uint version = Delegation_Law_Projects[law_project].Version;
        require( version != 0, "No existing Law Project");
        require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.PROPOSITION, "Law Not at PROPOSITION status");
        require(block.timestamp.sub(Delegation_Law_Projects[law_project].Creation_Timestamp) > Law_Parameters_Versions[version].Proposition_Duration, "PROPOSITION stage not finished");
        
        bytes32 key=keccak256(abi.encodePacked(law_project,block.timestamp));
        Delegation_Law_Projects[law_project].Start_Vote_Timestamps = block.timestamp;
        Delegation_Law_Projects[law_project].Law_Project_Status = Status.VOTE;
        
        emit Voting_Stage_Started(law_project, key);
        IVote Vote_Instance = IVote(Law_Parameters_Versions[version].Ivote_address);
        Vote_Instance.Create_Ballot(key, address(this), Contains_Function_Selector, Law_Parameters_Versions[version].Vote_Duration,0, List_Law_Project[law_project].Proposal_Count, 1);
        
        
    }
    
     /**
     * @dev When the voting period is over, any citizen can call this function to end the voting stage. If the winning proposition is the default proposition is the default one (Proposition 0) the law proejct is aborted. Otherwise, the Law Censoring stage is started.
     * @param law_project Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     */
    function Achiev_Vote(bytes32 law_project) external override Delegation_Only{
        //require( version != 0, "No existing Law Project");
        //require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.VOTE, "Law Not at VOTE status");
        //require(block.timestamp.sub(Delegation_Law_Projects[law_project].Start_Vote_Timestamps) > Law_Parameters_Versions[version].Vote_Duration, "VOTE stage not finished");
        
        IVote Vote_Instance = IVote(Law_Parameters_Versions[Delegation_Law_Projects[law_project].Version].Ivote_address);
        bytes32 key = keccak256(abi.encodePacked(law_project,Delegation_Law_Projects[law_project].Start_Vote_Timestamps));
        uint winning_proposal= Vote_Instance.Get_Winning_Proposition_byId(key,0);
        List_Law_Project[law_project].Winning_Proposal = winning_proposal;
        
        if(winning_proposal==0){
            Delegation_Law_Projects[law_project].Law_Project_Status = Status.ABORTED;
            emit Law_Aborted(law_project);
        }else{
            Delegation_Law_Projects[law_project].Start_Censor_Law_Period_Timestamps = block.timestamp;
            Delegation_Law_Projects[law_project].Law_Project_Status = Status.CENSOR_LAW_PERIOD;
            emit Voting_Stage_Achieved(law_project);
        }
    }
    
    /**
     * @dev If we are at the Law censor stage, any citizen can call this function to sign the petition for canceling the law project. If the {Censor_Proposition_Petition_Rate} (see {Law_Project_Parameters} structure) is reached, the law project is aborted.
     * @param law_project Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     */
    function Censor_Law(bytes32 law_project)external override Citizen_Only{

        require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.CENSOR_LAW_PERIOD, "Law Not at CENSOR LAW status");
        require(!Delegation_Law_Projects[law_project].Censor_Law_Petitions[msg.sender], "Already Signed");
        
        uint counter =Delegation_Law_Projects[law_project].Censor_Law_Petition_Counter.add(1);
        Delegation_Law_Projects[law_project].Censor_Law_Petitions[msg.sender]=true;
        
        if(counter>= Percentage(Law_Parameters_Versions[Delegation_Law_Projects[law_project].Version].Censor_Proposition_Petition_Rate,  Citizens.Get_Citizen_Number())){ //If the number of censure petitions signatures reach the minimum ratio.
            uint law_total_potentialy_lost = Delegation_Law_Projects[law_project].Law_Total_Potentialy_Lost;
            
            Delegation_Law_Projects[law_project].Law_Project_Status = Status.ABORTED;
            Potentialy_Lost_Amount = Potentialy_Lost_Amount.sub(law_total_potentialy_lost);
            Update_Controled_Registers(Delegation_Law_Projects[law_project].Institution_Address);
            Democoin.transfer(Agora_address,law_total_potentialy_lost);
            emit Law_Aborted(law_project);
        }
        
        Delegation_Law_Projects[law_project].Censor_Law_Petition_Counter = counter;
    }
    
    /**
     * @dev If the Law censor period is over and the law project hasn't been rejected by citizens, then any delegation member can call this function to set the law project as ADOPTED (see {Status} enumeration).
     * @param law_project Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     */
    function Adopt_Law(bytes32 law_project)external override Delegation_Only{
        require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.CENSOR_LAW_PERIOD, "Law Not at CENSOR LAW status");
        require(block.timestamp.sub(Delegation_Law_Projects[law_project].Start_Censor_Law_Period_Timestamps) > Law_Parameters_Versions[Delegation_Law_Projects[law_project].Version].Law_Censor_Period_Duration, "CENSOR LAW PERIOD not over");
        
        Delegation_Law_Projects[law_project].Law_Project_Status = Status.ADOPTED;
        emit Law_Adopted(law_project);
    }
    
    /**
     * @dev Once the law project has been adopted (ADOPTED value of {Status} enum) then any delegation member can call this function to execute all or some of the remaining function call of the winning proposition. 
     * For the law project to be fully executed all function call have to be executed.
     * @param law_project Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     * @param num_function_call_ToExecute Number of function calls to execute.
     */
    function Execute_Law(bytes32 law_project, uint num_function_call_ToExecute)external override Delegation_Only nonReentrant{
        require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.ADOPTED, "Law Not ADOPTED");
        //if(Execute_Winning_Proposal(law_project, num_function_call_ToExecute, Delegation_Law_Projects[law_project].Institution_Address)){
        emit Function_Call_Executed( law_project, num_function_call_ToExecute);
        if(List_Law_Project[law_project].Execute_Winning_Proposal(num_function_call_ToExecute, Delegation_Law_Projects[law_project].Institution_Address)){
            Delegation_Law_Projects[law_project].Law_Project_Status = Status.EXECUTED;
            Potentialy_Lost_Amount = Potentialy_Lost_Amount.sub(Delegation_Law_Projects[law_project].Law_Total_Potentialy_Lost);
            Update_Controled_Registers(Delegation_Law_Projects[law_project].Institution_Address);
            emit Law_executed(law_project);
        }
    }
    
    
    
    
    /*Constitution_Only Delegation paramters initialisation*/
    
    /*function Update_Legislatif_Process(uint Member_Max_Token_Usage, uint Law_Initialisation_Price, uint FunctionCall_Price, uint Proposition_Duration,
         uint Vote_Duration, uint Law_Censor_Period_Duration, uint16 Censor_Proposition_Petition_Rate, 
         uint16 Censor_Penalty_Rate, address Ivote_address)external Constitution_Only{
             
             uint version = Legislatif_Process_Version.add(1);
             
             Law_Parameters_Versions[version].Member_Max_Token_Usage = Member_Max_Token_Usage;
             Law_Parameters_Versions[version].Law_Initialisation_Price = Law_Initialisation_Price;
             Law_Parameters_Versions[version].FunctionCall_Price = FunctionCall_Price;
             Law_Parameters_Versions[version].Proposition_Duration = Proposition_Duration;
             Law_Parameters_Versions[version].Vote_Duration = Vote_Duration;
             Law_Parameters_Versions[version].Law_Censor_Period_Duration = Law_Censor_Period_Duration;
             Law_Parameters_Versions[version].Censor_Proposition_Petition_Rate = Censor_Proposition_Petition_Rate;
             Law_Parameters_Versions[version].Censor_Penalty_Rate = Censor_Penalty_Rate;
             Law_Parameters_Versions[version].Ivote_address = Ivote_address;
             
             Legislatif_Process_Version = version;
             
    }*/
         
    /**
     * @dev See {IDelegation} interface
     */
    function Update_Legislatif_Process(uint[6] calldata Uint256_Legislatifs_Arg, uint16 Censor_Proposition_Petition_Rate, 
         uint16 Censor_Penalty_Rate, address Ivote_address)external override Constitution_Only{
             
             uint version = Legislatif_Process_Version.add(1);
             Law_Parameters_Versions[version].Update_Law_Parameters(Uint256_Legislatifs_Arg, Censor_Proposition_Petition_Rate, 
            Censor_Penalty_Rate, Ivote_address);
             
             /*Law_Parameters_Versions[version].Member_Max_Token_Usage = Uint256_Legislatifs_Arg[0];
             Law_Parameters_Versions[version].Law_Initialisation_Price = Uint256_Legislatifs_Arg[1];
             Law_Parameters_Versions[version].FunctionCall_Price = Uint256_Legislatifs_Arg[2];
             Law_Parameters_Versions[version].Proposition_Duration = Uint256_Legislatifs_Arg[3];
             Law_Parameters_Versions[version].Vote_Duration = Uint256_Legislatifs_Arg[4];
             Law_Parameters_Versions[version].Law_Censor_Period_Duration = Uint256_Legislatifs_Arg[5];
             Law_Parameters_Versions[version].Censor_Proposition_Petition_Rate = Censor_Proposition_Petition_Rate;
             Law_Parameters_Versions[version].Censor_Penalty_Rate = Censor_Penalty_Rate;
             Law_Parameters_Versions[version].Ivote_address = Ivote_address;*/
             
             Legislatif_Process_Version = version;
             
            emit Legislatif_Parameters_Updated();
    }  
         
    /**
     * @dev See {IDelegation} interface
     */
    function Update_Internal_Governance( uint Election_Duration, uint Validation_Duration, uint Mandate_Duration, uint Immunity_Duration,
        uint16 Num_Max_Members, uint16 New_Election_Petition_Rate, address Ivote_address)external override Constitution_Only{
            
            
            uint version = Internal_Governance_Version.add(1);
            Mandates_Versions[version].Update_Mandate_Parameter(Election_Duration, Validation_Duration, Mandate_Duration, Immunity_Duration,
            Num_Max_Members, New_Election_Petition_Rate, Ivote_address);
         
            /*Mandates_Versions[version].Election_Duration = Election_Duration;
            Mandates_Versions[version].Validation_Duration = Validation_Duration;
            Mandates_Versions[version].Mandate_Duration = Mandate_Duration;
            Mandates_Versions[version].Immunity_Duration = Immunity_Duration;
            Mandates_Versions[version].Num_Max_Members = Num_Max_Members;
            Mandates_Versions[version].New_Election_Petition_Rate = New_Election_Petition_Rate;
            Mandates_Versions[version].Ivote_address = Ivote_address;*/
            
            Internal_Governance_Version = version;
            emit Governance_Parameters_Updated();
    }
         
         
    
    /**
     * @dev See {IDelegation} interface
     * */
    function Add_Controled_Register(address register_address) external override Constitution_Only {
        require(!Controled_Registers[register_address].Active, "Register already Controled");
        Controled_Registers[register_address].Active = true;
        List_Controled_Registers.add(register_address);
        emit Controled_Register_Added(register_address);
    
    }
    
    /**
     * @dev See {IDelegation} interface
     * */
    function Remove_Controled_Register(address register_address) external override Constitution_Only {
        require(Controled_Registers[register_address].Active, "Register Not Controled");
        Controled_Registers[register_address].Active = false;
        
        if(Controled_Registers[register_address].Law_Project_Counter ==0){
            Register(register_address).Remove_Authority(address(this));
            List_Controled_Registers.remove(register_address);
            emit Controled_Register_Removed(register_address);
        }else{
            emit Controled_Register_Canceled(register_address);
        }
    }
    
    
    
    /*Utils*/

    /*function _Update_Law_Project() internal{
        IConstitution_Delegation constitution = IConstitution_Delegation(Constitution_Address);
        uint new_version = constitution.Get_Delegation_Legislatif_Process_Versions(address(this));
        uint[6] memory Temp;
        if(new_version>Legislatif_Process_Version){
            
            (Temp, Law_Parameters_Versions[new_version].Censor_Proposition_Petition_Rate, Law_Parameters_Versions[new_version].Censor_Penalty_Rate) = constitution.Get_Delegation_Legislation_Process(address(this));
            
            Law_Parameters_Versions[new_version].Member_Max_Token_Usage = Temp[0];
            Law_Parameters_Versions[new_version].Law_Initialisation_Price = Temp[1];
            Law_Parameters_Versions[new_version].FunctionCall_Price = Temp[2];
            Law_Parameters_Versions[new_version].Proposition_Duration = Temp[3];
            Law_Parameters_Versions[new_version].Vote_Duration = Temp[4];
            Law_Parameters_Versions[new_version].Law_Censor_Period_Duration = Temp[5];
        }
        Legislatif_Process_Version = new_version;
    }*/
    

    /**
     * @notice Handle token consumption in the context of law project elaboration
     * @dev The function: check that:
     *              - check that the member's max token consumption limit for the current law project isn't exceeded by the sender
     *              - check that the Delegation has enough funds to afford penalties if current pending were to be reverted by citizens.
     *              - Update the value of the amount of token consumed by the sender for the law project identified by "key".
     *              - Update the "Law_Total_Potentialy_Lost" field of the corresponding "Delegation_Law_Project" struct.
     *              - Update the "Potentialy_Lost_Amount" state variable
     * 
     * @param sender Address of the sender of the transaction
     * @param amount Amount of DemoCoin sent in the transaction
     * @param key Id of the law project 
     * */
    function Token_Consumption_Handler(address sender, uint amount, bytes32 key) internal{
        
        uint version = Delegation_Law_Projects[key].Version;
        require(Delegation_Law_Projects[key].Members_Token_Consumption[sender] +amount <= Law_Parameters_Versions[version].Member_Max_Token_Usage, "Member consumption exceeded");
        
        
        uint amount_potentialy_lost = Percentage(Law_Parameters_Versions[version].Censor_Penalty_Rate, amount);
        uint new_potentialy_lost_amount = Potentialy_Lost_Amount.add(amount_potentialy_lost);
        require(new_potentialy_lost_amount <= Democoin.balanceOf(address(this)), "No enough colaterals funds");

        Delegation_Law_Projects[key].Members_Token_Consumption[sender] += amount;
        Delegation_Law_Projects[key].Law_Total_Potentialy_Lost = Delegation_Law_Projects[key].Law_Total_Potentialy_Lost.add(amount_potentialy_lost);
        Potentialy_Lost_Amount = new_potentialy_lost_amount;
    }
    
    /**
     * @dev Decrease the counter ("Law_Project_Counter" field of Controlable_Register struct) of pending law project related to the register of address "institution_address". If the counter becomes null and the "Actual" field of Controlable_Registers struct is false,
     * then the corresponding register is removed from List_Controled_Registers and the delegation removes it self from the register's Authorithies list ("Register_Authorities" state variable)
     * @param institution_address Address of the controled register to be updated.
    */
    function Update_Controled_Registers(address institution_address) internal{
        //address institution_address = Law_Projects[law_project].Institution_Address;
        uint counter = Controled_Registers[institution_address].Law_Project_Counter.sub(1);
        Controled_Registers[institution_address].Law_Project_Counter = counter;
        if(counter==0 && !Controled_Registers[institution_address].Active){
            Register(institution_address).Remove_Authority(address(this));
            List_Controled_Registers.remove(institution_address);
        }
       
    }
    
   
    
    /*Getters*/
    /**
     * @dev See {IDelegation} interface
     *  
     */
    function Contains(address member_address) external view override returns(bool contain){
      return Mandates[Actual_Mandate].Members.contains(member_address);
    }
    
    /**
     * @dev Get 2 arrays:
     *    - The list of law project Id 
     *    - The list of controled Register
     * @return Law_Project_List List of law project (pending, executed and aborted)
     * @return Controled_Register List of register address (represented in bytes32) whose contract is under Delegation control
     */
    function Get_List_Law_Register()external view returns(bytes32[] memory Law_Project_List, bytes32[] memory Controled_Register ){
        return (List_Delegation_Law_Projects, List_Controled_Registers._inner._values);
    }
    
    /**
     * @dev Get informations about a mandate
     * @param Id Id of the mandate
     * @return version Parameter Version used for this mandate
     * @return Inauguration_Timestamps Inauguration_Timestamps: Beginning of current mandate
     * @return Election_Timestamps Beginning of election
     * @return New_Election_Petition_Number Number of signatures obtained for revoking the delegation members related to {Id} Mandate
     * @return Members Array of {Id} mandate delegation member's address (represented in bytes32)
     * @return Candidats Array candidats address (represented in bytes32)
     */
    function Get_Mandate(uint Id)external view returns(uint version, uint Inauguration_Timestamps, uint Election_Timestamps, uint New_Election_Petition_Number, bytes32[] memory Members, bytes32[] memory Candidats){
        version = Mandates[Id].Version;
        Inauguration_Timestamps = Mandates[Id].Inauguration_Timestamps;
        Election_Timestamps= Mandates[Id].Election_Timestamps;
        New_Election_Petition_Number=Mandates[Id].New_Election_Petitions.length();
        Members = Mandates[Id].Members._inner._values;
        Candidats = Mandates[Id].Next_Mandate_Candidats._inner._values;
    }
    
    /**
     * @dev Get the amount of DemoCoin token owned by the Delegation and used by a Delegation member for a specific delegation law project.
     * @param key Id of law project
     * @param member Address of delegation member 
     * @return amount Amount of token used by {member} address for {key} law project
     * 
     */
    function Get_Member_Amount_Consumed(bytes32 key, address member)external view returns(uint amount){
        return Delegation_Law_Projects[key].Members_Token_Consumption[member];
    }
 
    /**
     * @dev Get various Delegation state variables values.
     * @return legislatif_process_version Current version of parameters related to delegation law project process.
     * @return internal_governance_version Current version of parameters related to delegation internal governance.
     * @return actual_mandate Id number of the current mandate 
     * @return potentialy_lost_amount Total amount of token potentially lost via penalty fee. 
     * @return in_election_stage Boolean assesing whether we are in election stage or not.
     */
    function Get_Delegation_Infos()external view returns (uint legislatif_process_version, uint internal_governance_version, uint actual_mandate, uint potentialy_lost_amount, bool in_election_stage){
        return (Legislatif_Process_Version, Internal_Governance_Version, Actual_Mandate, Potentialy_Lost_Amount, In_election_stage);
    }
    
    /**
     * @dev Get informations about a law project proposition
     * @param key Id of the law project
     * @param id Id of the proposition
     * @return description Description of the proposition
     * @return childrens Proposition node's children in the Proposal Tree. (See {Add_Corpus_Proposal} function of {Initiative_Legislative_Lib} library)
     * @return function_calls List of function calls proposed by the proposition
     * @return func_call_counter Number of function calls proposed by the proposition.
     * @return parent Id of the proposition's parent in the Proposal Tree
     * @return author Address of the author of the proposition.
     */
    function Get_Proposal(bytes32 key, uint id)external view returns(bytes memory description, uint[] memory childrens, bytes[] memory function_calls, uint func_call_counter, uint parent, address author){
        function_calls = List_Law_Project[key].Get_Proposal_FunctionCall_List(id);
        (description, childrens,func_call_counter, parent, author) = List_Law_Project[key].Get_Proposal_Infos(id);
    }
    
    /**
     * @dev Get Results of a law project
     * @return Winning_Proposal Id of the proposition that has been voted.
     * @return Receipts List of receipts of {Winning_Proposal} function call's execution.
     */
    function Get_Law_Results(bytes32 key)external view returns(uint Winning_Proposal, Initiative_Legislative_Lib.Function_Call_Result[] memory Receipts){
        return(List_Law_Project[key].Winning_Proposal, List_Law_Project[key].Function_Call_Receipts);
    }
    /*Overite functions*/
    /*function Before_Add_Law_Project(bytes calldata Title, bytes calldata Description) internal override returns(bytes32){
        
    }
    
    function Before_Add_Corpus_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) internal override{
        
    }
    
    function Before_Add_Item_Proposal(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) internal override{
        
    }*/
}
