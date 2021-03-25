// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


/*import "Initiative_Legislative_lib.sol";
import "Register.sol";
import "Citizens_Register.sol";
import "IVote.sol";*/

import "contracts/Initiative_Legislative_lib.sol";
import "contracts/Register.sol";
import "contracts/Citizens_Register.sol";
import "contracts/IVote.sol";

interface IConstitution_Delegation{
    function Get_Delegation_Legislatif_Process_Versions(address delegation_address) external view returns(uint);
    function Get_Delegation_Internal_Governance_Versions(address delegation_address) external view returns(uint);
    //function Get_Delegation_Versions(address delegation) external view returns(uint,uint);
    function Get_Delegation_Legislation_Process(address delegation) external view returns(uint[6] memory Uint256_Arg, uint8 Revert_Proposition_Petition_Rate, 
         uint8 Revert_Penalty_Rate);
    //function Get_Delegation_Controled_Register(address delegation_address) external view returns(bytes32[] memory);
    function Get_Delegation_Internal_Governance(address delegation) external view returns(uint Election_Duration, uint Mandate_Duration, uint Immunity_Duration,
        uint16 Num_Max_Members, uint8 New_Election_Petition_Rate);
    //function Get_Register(address register) external view returns(Register_Parameters memory);
}

library Delegation_Uils{
    using EnumerableSet for EnumerableSet.AddressSet;
    
    
    
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
    
   
    
    struct Mandate_Parameter{
        uint Election_Duration;
        uint Validation_Duration;
        uint Mandate_Duration;
        uint Immunity_Duration;
        uint16 Num_Max_Members;
        uint16 New_Election_Petition_Rate;
        address Ivote_address;
    }
    
    struct Mandate{
        EnumerableSet.AddressSet Members;
        EnumerableSet.AddressSet New_Election_Petitions;
        EnumerableSet.AddressSet Next_Mandate_Candidats;
        uint Inauguration_Timestamps;
        uint Version;
    }
    
    function Update_Mandate_Parameter(Mandate_Parameter storage mandate_param, uint Election_Duration, uint Validation_Duration, uint Mandate_Duration, uint Immunity_Duration,
        uint16 Num_Max_Members, uint16 New_Election_Petition_Rate, address Ivote_address) external {
            mandate_param.Election_Duration = Election_Duration;
            mandate_param.Validation_Duration = Validation_Duration;
            mandate_param.Mandate_Duration = Mandate_Duration;
            mandate_param.Immunity_Duration = Immunity_Duration;
            mandate_param.Num_Max_Members = Num_Max_Members;
            mandate_param.New_Election_Petition_Rate = New_Election_Petition_Rate;
            mandate_param.Ivote_address = Ivote_address;
        }
        
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
        }
    
    
        
    function Transition_Mandate(mapping (uint=>Mandate) storage Mandates, address ivote_address, uint last_mandate_num, uint Internal_Governance_Version) external{
        uint new_mandate_num=last_mandate_num++;
        uint[] memory results;
        IVote Vote_Instance = IVote(ivote_address);
        results = Vote_Instance.Get_Winning_Propositions(keccak256(abi.encodePacked(address(this),last_mandate_num)));
        for(uint i =0; i<results.length; i++){
            Mandates[new_mandate_num].Members.add(Mandates[last_mandate_num].Next_Mandate_Candidats.at(results[i]));
        }
        Mandates[new_mandate_num].Inauguration_Timestamps = block.timestamp;
        Mandates[new_mandate_num].Version = Internal_Governance_Version;
    }
    
    function Add_Candidats(Mandate storage mandate, address new_candidat)external{
        require(!mandate.Next_Mandate_Candidats.contains(new_candidat), "Already Candidate");
        mandate.Next_Mandate_Candidats.add(new_candidat);
    }
    
    function Remove_Candidats(Mandate storage mandate, address remove_candidat)external{
        require(mandate.Next_Mandate_Candidats.contains(remove_candidat), "Already Candidate");
        mandate.Next_Mandate_Candidats.remove(remove_candidat);
    }
    
    function Sign_Petition(Mandate storage mandate, uint Immunity_Duration, address signer)external{
        require(block.timestamp - mandate.Inauguration_Timestamps > Immunity_Duration, "Immunity Period");
        require(!mandate.New_Election_Petitions.contains(signer), "Already signed petition");
        mandate.New_Election_Petitions.add(signer);
    }
    
    function New_Election(Mandate storage mandate, Mandate_Parameter storage mandate_version, uint citizen_number, uint num_mandate, bytes4 contain_function_selector)external{
        require(mandate.New_Election_Petitions.length() >= Percentage(mandate_version.New_Election_Petition_Rate, citizen_number) || (block.timestamp - mandate.Inauguration_Timestamps) > mandate_version.Mandate_Duration, "New election impossible for now");
            
        IVote Vote_Instance = IVote(mandate_version.Ivote_address);
        Vote_Instance.Create_Ballot(keccak256(abi.encodePacked(address(this),num_mandate)), address(this), contain_function_selector, mandate_version.Election_Duration, mandate_version.Validation_Duration, mandate.Next_Mandate_Candidats.length(), mandate_version.Num_Max_Members);
        
    }
    
    function Set_First_Mandate(Mandate storage mandate, address[] memory Initial_members)external{
        mandate.Inauguration_Timestamps = block.timestamp;
        for(uint i=0; i<Initial_members.length; i++){
            mandate.Members.add(Initial_members[i]);
        }
        mandate.Version= 0;
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
    
    function Percentage(uint16 ratio, uint base) internal pure returns(uint){
        return (ratio*base)/10000 ;// ((ratio*base)/100) * 10^(-ratio_decimals)
    }
}




 contract Delegation is Institution{// Initiative_Legislative{
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeMath for uint;
    using Initiative_Legislative_Lib for Initiative_Legislative_Lib.Law_Project;
    using Delegation_Uils for Delegation_Uils.Mandate_Parameter;
    using Delegation_Uils for Delegation_Uils.Mandate;
    using Delegation_Uils for Delegation_Uils.Law_Project_Parameters;
    /*using Delegation_Uils for Delegation_Uils.Controlable_Register;
    using Delegation_Uils for Delegation_Uils.Delegation_Law_Project;
    using Delegation_Uils for Delegation_Uils.Status;*/
    
    enum Status{
        PROPOSITION,
        VOTE,
        CENSOR_LAW_PERIOD,
        ADOPTED,
        EXECUTED,
        ABORTED
    }
    
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
    
    struct Controlable_Register{
        bool Active;                //whether the register is still under the actual Delegation control in the Constitution.
        uint Law_Project_Counter;
    }
    
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
    
    /*struct Mandate_Parameter{
        uint Election_Duration;
        uint Validation_Duration;
        uint Mandate_Duration;
        uint Immunity_Duration;
        uint16 Num_Max_Members;
        uint16 New_Election_Petition_Rate;
        address Ivote_address;
    }*/
    
    
    /*struct Mandate{
        EnumerableSet.AddressSet Members;
        EnumerableSet.AddressSet New_Election_Petitions;
        EnumerableSet.AddressSet Next_Mandate_Candidats;
        uint Inauguration_Timestamps;
    }*/
    
    
    modifier Citizen_Only{
        require(Citizens.Contains(msg.sender),"Citizen Only");
        _;
    }
    
    modifier Delegation_Only{
        require(Mandates[Actual_Mandate].Members.contains(msg.sender), "Delegation Only");
        _;
    }
    
    bytes4 constant Contains_Function_Selector = 0x57f98d32;
    
    DemoCoin Democoin;
    Citizens_Register Citizens;
    address Agora_address;
    
    
    uint Potentialy_Lost_Amount;
    
    /*Legislatif Process*/
    
    mapping(bytes32 => Initiative_Legislative_Lib.Law_Project) public List_Law_Project;
    
    ///@notice Registers that can receive orders from the actual Delegation
    mapping(address=>Controlable_Register) public Controled_Registers;
    EnumerableSet.AddressSet List_Controled_Registers;
    
    mapping(bytes32=>Delegation_Law_Project) public Delegation_Law_Projects;
    bytes32[] List_Delegation_Law_Projects;
    mapping(uint=>Delegation_Uils.Law_Project_Parameters) public Law_Parameters_Versions;
    
    
    
    /*Internal Governance*/
    
    mapping(uint=>Delegation_Uils.Mandate) Mandates;
    mapping(uint=>Delegation_Uils.Mandate_Parameter) Mandates_Versions;
    
    
    
    uint Legislatif_Process_Version;
    uint Internal_Governance_Version;
    uint Actual_Mandate;
    bool In_election_stage;
    
    
    constructor(address[] memory Initial_members, address token_address, address citizen_address, address agora_address){
        Type_Institution = Institution_Type.DELEGATION;
        Democoin = DemoCoin(token_address);
        Citizens = Citizens_Register(citizen_address);
        Agora_address = agora_address;
        
        Mandates[1].Set_First_Mandate( Initial_members);
        /*Mandates[1].Inauguration_Timestamps = block.timestamp;
        for(uint i=0; i<Initial_members.length; i++){
            Mandates[1].Members.add(Initial_members[i]);
        }
        Mandates[1].Version= 0;*/
        Actual_Mandate = 1;
    }
    
    
    /*Members Election related functions*/
    
    function Candidate_Election() external Citizen_Only{
        require(!In_election_stage, "Election Time");
        Mandates[Actual_Mandate].Add_Candidats(msg.sender);
        /*uint num_mandate = Actual_Mandate;
        require(!Mandates[num_mandate].Next_Mandate_Candidats.contains(msg.sender), "Already Candidate");
        Mandates[num_mandate].Next_Mandate_Candidats.add(msg.sender);*/
    }
    
    function Remove_Candidature()external{
        require(!In_election_stage, "Election Time");
        Mandates[Actual_Mandate].Remove_Candidats(msg.sender);
        /*uint num_mandate = Actual_Mandate;
        require(Mandates[num_mandate].Next_Mandate_Candidats.contains(msg.sender), "Not Candidate");
        require(!In_election_stage, "Election Time");
        Mandates[num_mandate].Next_Mandate_Candidats.remove(msg.sender);*/
    }
    
    function New_Election() external Citizen_Only {
        uint num_mandate = Actual_Mandate;
        Mandates[num_mandate].New_Election(Mandates_Versions[Mandates[num_mandate].Version], Citizens.Get_Citizen_Number(), num_mandate, Contains_Function_Selector);
        In_election_stage=true;
        /*uint num_mandate = Actual_Mandate;
        uint version = Mandates[num_mandate].Version;
    
        require(Mandates[num_mandate].New_Election_Petitions.length() >= Percentage(Mandates_Versions[version].New_Election_Petition_Rate, Citizens.Get_Citizen_Number()) || block.timestamp.sub(Mandates[num_mandate].Inauguration_Timestamps) > Mandates_Versions[version].Mandate_Duration, "New election impossible for now");
            
        IVote Vote_Instance = IVote(Law_Parameters_Versions[version].Ivote_address);
        Vote_Instance.Create_Ballot(keccak256(abi.encodePacked(address(this),num_mandate)), address(this), Contains_Function_Selector, Mandates_Versions[version].Election_Duration, Mandates_Versions[version].Validation_Duration, Mandates[num_mandate].Next_Mandate_Candidats.length(), Mandates_Versions[version].Num_Max_Members);
        In_election_stage=true;*/
    }
    
    function Sign_New_Election_Petition() external Citizen_Only{
        uint num_mandate = Actual_Mandate;
        Mandates[num_mandate].Sign_Petition(Mandates_Versions[Mandates[num_mandate].Version].Immunity_Duration, msg.sender);
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
    
    function End_Election()external{
       
        uint num_mandate = Actual_Mandate;
        //uint new_num_mandate = num_mandate.add(1);
        Delegation_Uils.Transition_Mandate(Mandates, Law_Parameters_Versions[Mandates[num_mandate].Version].Ivote_address, num_mandate, Internal_Governance_Version);
        Actual_Mandate = num_mandate + 1;
        In_election_stage=false;
    }
    
    
    /*Legislatif Process related functions*/
    
    
    function Add_Law_Project(address register_address, bytes calldata Title, bytes calldata Description)external Delegation_Only{
        //_Update_Law_Project();
        require(Controled_Registers[register_address].Active, "Register Not Controled");
        
        bytes32 key = keccak256(abi.encode(Title,Description));
        require(Delegation_Law_Projects[key].Version==0,"Law project already created");
        
        uint version =Legislatif_Process_Version;
        Token_Consumption_Handler(msg.sender, Law_Parameters_Versions[version].Law_Initialisation_Price, key );
        
        
        Delegation_Law_Projects[key].Institution_Address = register_address;
        Delegation_Law_Projects[key].Version = version;
        Delegation_Law_Projects[key].Creation_Timestamp = block.timestamp;
        
        List_Delegation_Law_Projects.push(key);
        
        List_Law_Project[key].Add_Law_Project(Title, Description);
        //Add_Law_Project(Title,  Description, key);
    }
    
    
    function Add_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) external Delegation_Only{
        require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.PROPOSITION, "Not at PROPOSITION status");
        uint version = Delegation_Law_Projects[law_project].Version;
        require( version != 0, "No existing Law Project");
        
        Token_Consumption_Handler(msg.sender, Law_Parameters_Versions[version].FunctionCall_Price.mul(New_Function_Call.length), law_project);
        uint proposal_index = List_Law_Project[law_project].Proposal_Count.add(1);
        List_Law_Project[law_project].Proposals_Tree[proposal_index].Author = msg.sender;
       // Add_Corpus_Proposal( law_project, Parent, Parent_Proposals_Reuse, New_Function_Call, Description) ;
       List_Law_Project[law_project].Add_Corpus_Proposal(Parent, Parent_Proposals_Reuse, New_Function_Call, Description);
    }
    
    /*function Add_Item(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) external Delegation_Only{
        require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.PROPOSITION, "Law Not at PROPOSITION status");
        uint version = Delegation_Law_Projects[law_project].Version;
        require( version != 0, "No existing Law Project");
        require(New_Items.length == Indexs.length, "Array different size");
        Token_Consumption_Handler(msg.sender, Law_Parameters_Versions[version].FunctionCall_Price.mul(New_Items.length), law_project);
        
        //Add_Item_Proposal(law_project, Proposal, New_Items, Indexs, msg.sender);
        List_Law_Project[law_project].Add_Item_Proposal( Proposal, New_Items, Indexs, msg.sender);
    }*/
    
    function Start_Vote(bytes32 law_project)external Delegation_Only{
        uint version = Delegation_Law_Projects[law_project].Version;
        require( version != 0, "No existing Law Project");
        require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.PROPOSITION, "Law Not at PROPOSITION status");
        require(block.timestamp.sub(Delegation_Law_Projects[law_project].Creation_Timestamp) > Law_Parameters_Versions[version].Proposition_Duration, "PROPOSITION stage not finished");
        
        IVote Vote_Instance = IVote(Law_Parameters_Versions[version].Ivote_address);
        Vote_Instance.Create_Ballot(law_project, address(this), Contains_Function_Selector, Law_Parameters_Versions[version].Vote_Duration,0, List_Law_Project[law_project].Proposal_Count, 1);
        
        Delegation_Law_Projects[law_project].Start_Vote_Timestamps = block.timestamp;
        Delegation_Law_Projects[law_project].Law_Project_Status = Status.VOTE;
    }
    
    function Achiev_Vote(bytes32 law_project) external Delegation_Only{
        //require( version != 0, "No existing Law Project");
        //require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.VOTE, "Law Not at VOTE status");
        //require(block.timestamp.sub(Delegation_Law_Projects[law_project].Start_Vote_Timestamps) > Law_Parameters_Versions[version].Vote_Duration, "VOTE stage not finished");
        
        IVote Vote_Instance = IVote(Law_Parameters_Versions[Delegation_Law_Projects[law_project].Version].Ivote_address);
        List_Law_Project[law_project].Winning_Proposal = Vote_Instance.Get_Winning_Proposition_byId(law_project,0);
        
        Delegation_Law_Projects[law_project].Start_Censor_Law_Period_Timestamps = block.timestamp;
        Delegation_Law_Projects[law_project].Law_Project_Status = Status.CENSOR_LAW_PERIOD;
    }
    
    function Censor_Law(bytes32 law_project)external Citizen_Only{

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
        }
        
        Delegation_Law_Projects[law_project].Censor_Law_Petition_Counter = counter;
    }
    
    function Adopt_Law(bytes32 law_project)external Delegation_Only{
        require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.CENSOR_LAW_PERIOD, "Law Not at CENSOR LAW status");
        require(block.timestamp.sub(Delegation_Law_Projects[law_project].Start_Censor_Law_Period_Timestamps) > Law_Parameters_Versions[Delegation_Law_Projects[law_project].Version].Law_Censor_Period_Duration, "CENSOR LAW PERIOD not over");
        
        Delegation_Law_Projects[law_project].Law_Project_Status = Status.ADOPTED;
    }
    
    function Execute_Law(bytes32 law_project, uint num_function_call_ToExecute)external Delegation_Only nonReentrant{
        require(Delegation_Law_Projects[law_project].Law_Project_Status == Status.ADOPTED, "Law Not ADOPTED");
        //if(Execute_Winning_Proposal(law_project, num_function_call_ToExecute, Delegation_Law_Projects[law_project].Institution_Address)){
        if(List_Law_Project[law_project].Execute_Winning_Proposal(num_function_call_ToExecute, Delegation_Law_Projects[law_project].Institution_Address)){
            Delegation_Law_Projects[law_project].Law_Project_Status = Status.EXECUTED;
            Potentialy_Lost_Amount = Potentialy_Lost_Amount.sub(Delegation_Law_Projects[law_project].Law_Total_Potentialy_Lost);
            Update_Controled_Registers(Delegation_Law_Projects[law_project].Institution_Address);
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
         
    function Update_Legislatif_Process(uint[6] calldata Uint256_Legislatifs_Arg, uint16 Censor_Proposition_Petition_Rate, 
         uint16 Censor_Penalty_Rate, address Ivote_address)external Constitution_Only{
             
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
    }  
         
    function Update_Internal_Governance( uint Election_Duration, uint Validation_Duration, uint Mandate_Duration, uint Immunity_Duration,
        uint16 Num_Max_Members, uint16 New_Election_Petition_Rate, address Ivote_address)external Constitution_Only{
            
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
    }
         
         
    
    /**
     * @notice Add a register that can be ruled by the delegation
     * @dev This function is called by the Constitution
     * */
    function Add_Controled_Register(address register_address) external Constitution_Only {
        Controled_Registers[register_address].Active = true;
        List_Controled_Registers.add(register_address);
    }
    
    /**
     * @notice Remove a register from the list of conductor that can be ruled by the delegation
     * @dev This function is called by the Constitution. If there are pending law that depend on this register, the delegation would not be immeditely removed from register's Authorithies list. 
     * */
    function Remove_Controled_Register(address register_address) external Constitution_Only {
        require(Controled_Registers[register_address].Active, "Register Not Controled");
        Controled_Registers[register_address].Active = false;
        if(Controled_Registers[register_address].Law_Project_Counter ==0){
            Register(register_address).Remove_Authority(address(this));
            List_Controled_Registers.remove(register_address);
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
     * */
    function Token_Consumption_Handler(address sender, uint amount, bytes32 key) internal{
        
        uint version = Delegation_Law_Projects[key].Version;
        require(Delegation_Law_Projects[key].Members_Token_Consumption[sender] <= Law_Parameters_Versions[version].Member_Max_Token_Usage, "Member consumption exceeded");
        
        uint amount_potentialy_lost = Percentage(Law_Parameters_Versions[version].Censor_Penalty_Rate, amount);
        uint new_potentialy_lost_amount = Potentialy_Lost_Amount.add(amount_potentialy_lost);
        require(new_potentialy_lost_amount <= Democoin.balanceOf(address(this)), "No enough colaterals funds");
        
        Delegation_Law_Projects[key].Members_Token_Consumption[sender].add(amount);
        Delegation_Law_Projects[key].Law_Total_Potentialy_Lost = Delegation_Law_Projects[key].Law_Total_Potentialy_Lost.add(amount_potentialy_lost);
        Potentialy_Lost_Amount = new_potentialy_lost_amount;
    }
    
    /**
     * @dev Decrease the counter ("Law_Project_Counter" field of Controlable_Register struct) of pending law project related to the register of address "institution_address". If the counter become null and the "Actual" field of Controlable_Registers struct is false,
     * then the corresponding register is removed from List_Controled_Registers and the delegation removes it self from the register's Authorithies list ("Register_Authorities" state variable)
    */
    function Update_Controled_Registers(address institution_address) internal{
        //address institution_address = Law_Projects[law_project].Institution_Address;
        uint counter = Controled_Registers[institution_address].Law_Project_Counter.sub(1);
        if(counter==0 && !Controled_Registers[institution_address].Active){
            Register(institution_address).Remove_Authority(address(this));
            List_Controled_Registers.remove(institution_address);
        }
        Controled_Registers[institution_address].Law_Project_Counter = counter;
    }
    
   
    
    /*Getters*/
    
    function Contains(address member_address) external view returns(bool){
      return Mandates[Actual_Mandate].Members.contains(member_address);
    }
    
    function Get_List_Law_Register()external view returns(bytes32[] memory Law_Project_List, bytes32[] memory Controled_Register ){
        return (List_Delegation_Law_Projects, List_Controled_Registers._inner._values);
    }
    
    /*function Get_Member_Amount_Consumed(bytes32 key, address member)external view returns(uint amount){
        return Delegation_Law_Projects[key].Members_Token_Consumption[member];
    }
 */
    function Get_Delegation_Infos()external view returns (uint legislatif_process_version, uint internal_governance_version, uint actual_mandate, uint potentialy_lost_amount, bool in_election_stage){
        return (Legislatif_Process_Version, Internal_Governance_Version, Actual_Mandate, Potentialy_Lost_Amount, In_election_stage);
    }
    
    function Get_Proposal(bytes32 key, uint id)external view returns(bytes memory description, uint[] memory childrens, bytes[] memory function_calls, uint func_call_counter, uint parent){
        function_calls = List_Law_Project[key].Get_Proposal_FunctionCall_List(id);
        (description, childrens,func_call_counter, parent) = List_Law_Project[key].Get_Proposal_Infos(id);
    }
    /*Overite functions*/
    /*function Before_Add_Law_Project(bytes calldata Title, bytes calldata Description) internal override returns(bytes32){
        
    }
    
    function Before_Add_Corpus_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) internal override{
        
    }
    
    function Before_Add_Item_Proposal(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) internal override{
        
    }*/
}
