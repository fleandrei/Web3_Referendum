// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "Initiative_Legislative.sol";
import "IDelegation.sol";
import "Agora.sol";
import "Register.sol";
import "Citizens_Register.sol";

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

 contract Delegation is Initiative_Legislative, IDelegation{
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeMath for uint;
    
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
        uint8 Censor_Proposition_Petition_Rate;
        uint8 Censor_Penalty_Rate;
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
    
    struct Mandate_Parameter{
        uint Election_Duration;
        uint Mandate_Duration;
        uint Immunity_Duration;
        uint16 Num_Max_Members;
        uint8 New_Election_Petition_Rate;
    }
    
    
    struct Mandate{
        EnumerableSet.AddressSet Members;
        EnumerableSet.AddressSet New_Election_Petitions;
        uint Inauguration_Timestamps;
    }
    
    
    modifier Citizen_Only{
        require(Citizens.Contains(msg.sender),"Citizen Only");
        _;
    }
    
    
    
    DemoCoin Democoin;
    Citizens_Register Citizens;
    
    
    uint Potentialy_Lost_Amount;
    
    /*Legislatif Process*/
    
    ///@notice Registers that can receive orders from the actual Delegation
    mapping(address=>Controlable_Register) public Controled_Registers;
    EnumerableSet.AddressSet List_Controled_Registers;
    
    mapping(bytes32=>Delegation_Law_Project) public Law_Projects;
    bytes32[] List_Law_Projects;
    mapping(uint=>Law_Project_Parameters) public Law_Parameters_Versions;
    
    
    
    /*Internal Governance*/
    
    mapping(uint=>Mandate) Mandates;
    mapping(uint=>Mandate_Parameter) Mandates_Versions;
    
    EnumerableSet.AddressSet Candidats;
    
    uint Legislatif_Process_Version;
    uint Internal_Governance_Version;
    uint Actual_Mandate;
    
    
    constructor(address[] memory Initial_members, address token_address, address citizen_address){
        Type_Institution = Institution_Type.DELEGATION;
        Democoin = DemoCoin(token_address);
        Citizens = Citizens_Register(citizen_address);
        
        uint num_members = Initial_members.length;
        uint num_mandat = Actual_Mandate.add(1);
        
        Mandates[num_mandat].Inauguration_Timestamps = block.timestamp;
        for(uint i=0; i<num_members; i++){
            Mandates[num_mandat].Members.add(Initial_members[i]);
        }
    }
    
    function Candidate_Election() external Citizen_Only{
        require(!Candidats.contains(msg.sender), "Already Candidate");
        Candidats.add(msg.sender);
    }
    
    function Start_Election() external {
        uint num_mandate = Actual_Mandate;
        uint version = Legislatif_Process_Version;
        uint duration = block.timestamp.sub(Mandates[num_mandate].Inauguration_Timestamps);
        //require(duration > Mandates_Versions[version].Immunity_Duration || )
    }
    
    function Sign_New_Election_Petition() external Citizen_Only{
        uint num_mandate = Actual_Mandate;
        require(!Mandates[num_mandate].New_Election_Petitions.contains(msg.sender), "Already signed petition");
        Mandates[num_mandate].New_Election_Petitions.add(msg.sender);
    }
    
    
    function Add_Law_Project(address register_address, bytes calldata Title, bytes calldata Description)external{
        //_Update_Law_Project();
        require(Controled_Registers[register_address].Active, "Register Not Controled");
        
        bytes32 key = keccak256(abi.encode(Title,Description));
        require(Law_Projects[key].Version==0,"Law project already created");
        
        uint version =Legislatif_Process_Version;
        Token_Consumption_Handler(msg.sender, Law_Parameters_Versions[version].Law_Initialisation_Price, key );
        
        
        Law_Projects[key].Institution_Address = register_address;
        Law_Projects[key].Version = version;
        Law_Projects[key].Creation_Timestamp = block.timestamp;
        
        List_Law_Projects.push(key);
        
        Add_Law_Project(Title,  Description, key);
    }
    
    
    function Add_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) external{
        require(Law_Projects[law_project].Law_Project_Status == Status.PROPOSITION, "Law Not at PROPOSITION status");
        uint version = Law_Projects[law_project].Version;
        require( version != 0, "No existing Law Project");
        
        Token_Consumption_Handler(msg.sender, Law_Parameters_Versions[version].FunctionCall_Price.mul(New_Function_Call.length), law_project);
        uint proposal_index = List_Law_Project[law_project].Proposal_Count.add(1);
        List_Law_Project[law_project].Proposals_Tree[proposal_index].Author = msg.sender;
        Add_Corpus_Proposal( law_project, Parent, Parent_Proposals_Reuse, New_Function_Call, Description) ;
    }
    
    function Add_Item(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) external{
        require(Law_Projects[law_project].Law_Project_Status == Status.PROPOSITION, "Law Not at PROPOSITION status");
        uint version = Law_Projects[law_project].Version;
        require( version != 0, "No existing Law Project");
        require(New_Items.length == Indexs.length, "Array different size");
        Token_Consumption_Handler(msg.sender, Law_Parameters_Versions[version].FunctionCall_Price.mul(New_Items.length), law_project);
        
        Add_Item_Proposal(law_project, Proposal, New_Items, Indexs, msg.sender);
    }
    
    function Start_Vote(bytes32 law_project)external{
        uint version = Law_Projects[law_project].Version;
        require( version != 0, "No existing Law Project");
        require(Law_Projects[law_project].Law_Project_Status == Status.PROPOSITION, "Law Not at PROPOSITION status");
        require(block.timestamp.sub(Law_Projects[law_project].Creation_Timestamp) > Law_Parameters_Versions[version].Proposition_Duration, "PROPOSITION stage not finished");
        
        Law_Projects[law_project].Start_Vote_Timestamps = block.timestamp;
        Law_Projects[law_project].Law_Project_Status = Status.VOTE;
    }
    
    function End_Vote(bytes32 law_project) external{
        uint version = Law_Projects[law_project].Version;
        //require( version != 0, "No existing Law Project");
        require(Law_Projects[law_project].Law_Project_Status == Status.VOTE, "Law Not at VOTE status");
        require(block.timestamp.sub(Law_Projects[law_project].Start_Vote_Timestamps) > Law_Parameters_Versions[version].Vote_Duration, "VOTE stage not finished");
        
        Law_Projects[law_project].Start_Censor_Law_Period_Timestamps = block.timestamp;
        Law_Projects[law_project].Law_Project_Status = Status.CENSOR_LAW_PERIOD;
    }
    
    function Censor_Law(bytes32 law_project)external{
        uint version = Law_Projects[law_project].Version;
        require(Law_Projects[law_project].Law_Project_Status == Status.CENSOR_LAW_PERIOD, "Law Not at CENSOR LAW status");
        require(!Law_Projects[law_project].Censor_Law_Petitions[msg.sender], "Already Signed");
        
        uint counter =Law_Projects[law_project].Censor_Law_Petition_Counter.add(1);
        Law_Projects[law_project].Censor_Law_Petitions[msg.sender]=true;
        
        /*TODO*/
        
        Law_Projects[law_project].Censor_Law_Petition_Counter = counter;
    }
    
    function Adopt_Law(bytes32 law_project)external{
        uint version = Law_Projects[law_project].Version;
        require(Law_Projects[law_project].Law_Project_Status == Status.CENSOR_LAW_PERIOD, "Law Not at CENSOR LAW status");
        require(block.timestamp.sub(Law_Projects[law_project].Start_Censor_Law_Period_Timestamps) > Law_Parameters_Versions[version].Law_Censor_Period_Duration, "CENSOR LAW PERIOD not over");
        
        Law_Projects[law_project].Law_Project_Status = Status.ADOPTED;
    }
    
    function Execute_Law(bytes32 law_project, uint num_function_call_ToExecute)external{
        uint version = Law_Projects[law_project].Version;
        require(Law_Projects[law_project].Law_Project_Status == Status.ADOPTED, "Law Not ADOPTED");
        if(Execute_Winning_Proposal(law_project, num_function_call_ToExecute, Law_Projects[law_project].Institution_Address)){
            Law_Projects[law_project].Law_Project_Status = Status.EXECUTED;
            Potentialy_Lost_Amount = Potentialy_Lost_Amount.sub(Law_Projects[law_project].Law_Total_Potentialy_Lost);
            Update_Controled_Registers(Law_Projects[law_project].Institution_Address);
        }
    }
    
    
    
    function Update_Legislatif_Process(uint Member_Max_Token_Usage, uint Law_Initialisation_Price, uint FunctionCall_Price, uint Proposition_Duration,
         uint Vote_Duration, uint Law_Censor_Period_Duration, uint8 Censor_Proposition_Petition_Rate, 
         uint8 Censor_Penalty_Rate)external Constitution_Only{
             
             uint version = Legislatif_Process_Version.add(1);
             
             Law_Parameters_Versions[version].Member_Max_Token_Usage = Member_Max_Token_Usage;
             Law_Parameters_Versions[version].Law_Initialisation_Price = Law_Initialisation_Price;
             Law_Parameters_Versions[version].FunctionCall_Price = FunctionCall_Price;
             Law_Parameters_Versions[version].Proposition_Duration = Proposition_Duration;
             Law_Parameters_Versions[version].Vote_Duration = Vote_Duration;
             Law_Parameters_Versions[version].Law_Censor_Period_Duration = Law_Censor_Period_Duration;
             Law_Parameters_Versions[version].Censor_Proposition_Petition_Rate = Censor_Proposition_Petition_Rate;
             Law_Parameters_Versions[version].Censor_Penalty_Rate = Censor_Penalty_Rate;
             
             Legislatif_Process_Version = version;
    }
         
         
    function Update_Internal_Governance( uint Election_Duration, uint Mandate_Duration, uint Immunity_Duration,
        uint16 Num_Max_Members, uint8 New_Election_Petition_Rate)external Constitution_Only{
            
            uint version = Internal_Governance_Version.add(1);
            
            Mandates_Versions[version].Election_Duration = Election_Duration;
            Mandates_Versions[version].Mandate_Duration = Mandate_Duration;
            Mandates_Versions[version].Immunity_Duration = Immunity_Duration;
            Mandates_Versions[version].Num_Max_Members = Num_Max_Members;
            Mandates_Versions[version].New_Election_Petition_Rate = New_Election_Petition_Rate;
            
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

    function _Update_Law_Project() internal{
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
    }
    
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
        
        uint version = Law_Projects[key].Version;
        require(Law_Projects[key].Members_Token_Consumption[sender] <= Law_Parameters_Versions[version].Member_Max_Token_Usage, "Member consumption exceeded");
        
        uint penalty_rate = Law_Parameters_Versions[version].Censor_Penalty_Rate;
        
        
        uint potentialy_lost_amount = Potentialy_Lost_Amount;
        uint amount_potentialy_lost = Percentage(penalty_rate, amount);
        uint new_potentialy_lost_amount = potentialy_lost_amount.add(amount_potentialy_lost);
        require(new_potentialy_lost_amount <= Democoin.balanceOf(address(this)), "No enough colaterals funds");
        
        Law_Projects[key].Members_Token_Consumption[sender].add(amount);
        Law_Projects[key].Law_Total_Potentialy_Lost = Law_Projects[key].Law_Total_Potentialy_Lost.add(amount_potentialy_lost);
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
    
    
    /*Overite functions*/
    /*function Before_Add_Law_Project(bytes calldata Title, bytes calldata Description) internal override returns(bytes32){
        
    }
    
    function Before_Add_Corpus_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) internal override{
        
    }
    
    function Before_Add_Item_Proposal(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) internal override{
        
    }*/
}
