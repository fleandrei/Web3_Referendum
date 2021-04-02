// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*import "Initiative_Legislative_lib.sol";
import "Citizens_Register.sol";
import "IVote.sol";*/


import "contracts/Initiative_Legislative_lib.sol";
import "contracts/Citizens_Register.sol";
import "contracts/IVote.sol";


interface IConstitution_Agora{
    function Get_Register_Parameter(address register) external view returns(uint,uint);
    function Get_Register_Referendum_Parameters(address register) external view returns(uint[7] memory Uint256_Arg, uint16 Assembly_Max_Members, uint8[7] memory Uint8_Arg, address OffChain_Vote_Delegation, address Assembly_Associated_Delegation);
    //function Get_Register(address register) external view returns(Register_Parameters memory);
}

contract Agora is Institution{
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using SafeMath for uint;
    using Initiative_Legislative_Lib for Initiative_Legislative_Lib.Law_Project;
    enum Status{
        PETITIONS,
        VOTE,
        ADOPTED,
        EXECUTED,
        REJECTED
    }
    
    /*struct Referendum_Parameters{
        uint Petition_Duration;
         uint Vote_Duration;
         uint Vote_Checking_Duration;
         uint Helper_Max_Duration;
         uint Law_Initialisation_Price;
         uint FunctionCall_Price;
         uint Helper_Amount_Escrow;
         uint16 Assembly_Max_Members;
         
         uint8 Required_Petition_Rate;
         uint8 Representatives_Rates;
         uint8 Voters_Reward_Rate;
         uint8 Helper_Reward_Rate;
         uint8 Assembly_Voluteer_Reward_Rate;
         //uint8 OffChain_Delegation_Reward;
         uint8 Vote_Type;
         //address OffChain_Vote_Delegation;   
         address Assembly_Associated_Delegation;
         address Ivote_address;
    }*/
    
    struct Referendum_Parameters{
        uint Petition_Duration;
         uint Vote_Duration;
         uint Vote_Checking_Duration;
         uint Law_Initialisation_Price;
         uint FunctionCall_Price;

         uint16 Required_Petition_Rate;
         //uint8 Voters_Reward_Rate;
         //uint8 Helper_Reward_Rate;
         address Ivote_address;
    }
    
    struct Referendum_Register{
        uint Last_Version;
        Institution_Type Type;
        bytes32[] List_Referendums;
        mapping(uint=>Referendum_Parameters) Parameters_Versions;
    }
    
    struct Referendum{
        //EnumerableSet.AddressSet Assembly_Volunteer;
        uint Token_Amount_Consummed;
        uint Petition_Counter;
        uint Version;
        uint Creation_Timestamps;
        uint Start_Vote_Timestamps;
        uint Winning_Proposition;
        uint Voter_Reward;
        Status Referendum_Status;
        mapping(address=>bool) Petitions;
        mapping(address=>bool) Voter_Rewarded;
    }
    
    
    modifier Citizen_Only{
        require(Citizens.Contains(msg.sender),"Citizen Only");
        _;
    }
    
    
    /*EVENTS*/
    event Referendum_Parameters_Updated(address register_address, uint new_version);
    event New_Referendum(address register_address, bytes32 key);
    event New_Proposal(address register, bytes32 key, uint proposal_index);
    event Proposal_Modified(address register, bytes32 key, uint proposal_index);
    event Voting_Stage_Started(address register, bytes32 key);
    event Projet_Signed(address register, bytes32 key);
    event Projet_Rejected(address register, bytes32 key);
    event Project_Adopted(address register, bytes32 key);
    event Project_Executed(address register, bytes32 key);
    
    /*STATE*/
    IConstitution_Agora public Constitution_Interface ;
    
    mapping(bytes32 => Initiative_Legislative_Lib.Law_Project) public List_Law_Project;
    
    mapping(address=>Referendum_Register) Referendums_Registers;
    mapping(bytes32=>Referendum) public Referendums;
    
    ///@notice Token amount consummed for emmiting propositions during Petition stage and not yet redistributed
    uint public Total_Token_To_Redistribute;
    
    
    DemoCoin Democoin;
    Citizens_Register Citizens;
    
    
    
    constructor(string memory Name, address token_address, address citizen_address)Institution(Name){
        Type_Institution =Institution_Type.AGORA;
        Constitution_Interface= IConstitution_Agora(Constitution_Address);
        
        Democoin = DemoCoin(token_address);
        Citizens = Citizens_Register(citizen_address);
    }
    
    
    function Add_Law_Project(address register_address, bytes calldata Title, bytes calldata Description)external Citizen_Only{
       
        //_Update_Register_Referendum(register_address);
        uint version = Referendums_Registers[register_address].Last_Version;
        require(version!=0, "Register unknown");
        uint Law_Initialisation_Price = Referendums_Registers[register_address].Parameters_Versions[version].Law_Initialisation_Price;
        //uint Description_Max_Size = Registers_Referendums[register_address].Parameters_Versions[version].Description_Max_Size;
        
        /*Token operations AND Size checking*/
        require(Democoin.allowance(msg.sender, address(this)) >= Law_Initialisation_Price, "Increase Tooken Allowance");
        
        bytes32 key = keccak256(abi.encode(Title,Description));
        require(Referendums[key].Version==0,"Referendums project already created");
        
        List_Law_Project[key].Add_Law_Project(Title,  Description);
        
        Referendums[key].Version = version;
        Referendums[key].Creation_Timestamps = block.timestamp;
        Referendums[key].Petitions[msg.sender] = true;
        Referendums[key].Petition_Counter = Referendums[key].Petition_Counter+1;
        
        Referendums_Registers[register_address].List_Referendums.push(key);
        
        Democoin.transferFrom(msg.sender, address(this), Law_Initialisation_Price);
        Referendums[key].Token_Amount_Consummed +=Law_Initialisation_Price;
        Total_Token_To_Redistribute+=Law_Initialisation_Price;
        
        emit New_Referendum(register_address, key);
    }
    
    
    function Add_Proposal(address register_address, bytes32 referendum_key, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) external Citizen_Only{
        uint version = Referendums[referendum_key].Version;
        require(version!=0,"No existing Referendum Project");
        require(Referendums[referendum_key].Referendum_Status == Status.PETITIONS, "Not at PETITIONS status");
        
        
        uint Cost = Referendums_Registers[register_address].Parameters_Versions[version].FunctionCall_Price*New_Function_Call.length;
        
        require(Democoin.allowance(msg.sender, address(this)) >= Cost, "Increase Tooken Allowance");
        Democoin.transferFrom(msg.sender, address(this), Cost);
        Referendums[referendum_key].Token_Amount_Consummed +=Cost;
        Total_Token_To_Redistribute+=Cost;
        
        if(!Referendums[referendum_key].Petitions[msg.sender]){
            Referendums[referendum_key].Petitions[msg.sender] = true;
            Referendums[referendum_key].Petition_Counter = Referendums[referendum_key].Petition_Counter+1;
        }
        
        uint proposal_index = List_Law_Project[referendum_key].Proposal_Count +1;
        List_Law_Project[referendum_key].Proposals_Tree[proposal_index].Author = msg.sender;
        List_Law_Project[referendum_key].Add_Corpus_Proposal(Parent, Parent_Proposals_Reuse, New_Function_Call, Description);
        emit New_Proposal( register_address,referendum_key, proposal_index);
    }
    
    function Add_Item(address register_address, bytes32 referendum_key, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) external Citizen_Only{
        uint version = Referendums[referendum_key].Version;
        require(version!=0,"No existing Referendum Project");
        require(Referendums[referendum_key].Referendum_Status == Status.PETITIONS, "Not at PETITIONS status");
        
        uint Cost = Referendums_Registers[register_address].Parameters_Versions[version].FunctionCall_Price*New_Items.length;
        
        require(Democoin.allowance(msg.sender, address(this)) >= Cost, "Increase Tooken Allowance");
        Democoin.transferFrom(msg.sender, address(this), Cost);
        Referendums[referendum_key].Token_Amount_Consummed +=Cost;
        Total_Token_To_Redistribute+=Cost;
        
        List_Law_Project[referendum_key].Add_Item_Proposal( Proposal, New_Items, Indexs, msg.sender);
        emit Proposal_Modified(register_address, referendum_key, Proposal);
    }
    
    function Sign_Petition(address register_address, bytes32 referendum_key) external Citizen_Only{
        uint version = Referendums[referendum_key].Version;
        require(version!=0,"No existing Referendum Project");
        require(Referendums[referendum_key].Referendum_Status == Status.PETITIONS, "Not at PETITIONS status");
        require(!Referendums[referendum_key].Petitions[msg.sender], "Already Signed");
        Referendums[referendum_key].Petitions[msg.sender]=true;
        emit Projet_Signed(register_address, referendum_key);
    }
    
    function Achiev_Proposition(address register_address, bytes32 referendum_key)external Citizen_Only{
        uint version = Referendums[referendum_key].Version;
        require(version!=0,"No existing Referendum Project");
        require(Referendums[referendum_key].Referendum_Status == Status.PETITIONS, "Not at PETITIONS status");
        require(block.timestamp - Referendums[referendum_key].Creation_Timestamps > Referendums_Registers[register_address].Parameters_Versions[version].Petition_Duration, "PETITIONS stage not finished");
        
        if(Referendums[referendum_key].Petition_Counter >= Percentage(Referendums_Registers[register_address].Parameters_Versions[version].Required_Petition_Rate, Citizens.Get_Citizen_Number()) ){
            IVote Vote_Instance = IVote(Referendums_Registers[register_address].Parameters_Versions[version].Ivote_address);
            Vote_Instance.Create_Ballot(referendum_key, address(Citizens), Citizens.Contains_Function_Selector(), Referendums_Registers[register_address].Parameters_Versions[version].Vote_Duration, Referendums_Registers[register_address].Parameters_Versions[version].Vote_Checking_Duration, List_Law_Project[referendum_key].Proposal_Count, 1);
            
            Referendums[referendum_key].Start_Vote_Timestamps = block.timestamp;
            Referendums[referendum_key].Referendum_Status = Status.VOTE;
            
            emit Voting_Stage_Started(register_address, referendum_key);
        }else{
            Referendums[referendum_key].Referendum_Status = Status.REJECTED;
            Total_Token_To_Redistribute -= Referendums[referendum_key].Token_Amount_Consummed;
            emit Projet_Rejected(register_address, referendum_key);
        }
    }
    
    
    function End_Vote(address register_address, bytes32 referendum_key)external Citizen_Only{
        uint version = Referendums[referendum_key].Version;
        //require(version!=0,"No existing Referendum Project");
        require(Referendums[referendum_key].Referendum_Status == Status.VOTE, "Not at VOTE status");
        
        IVote Vote_Instance = IVote(Referendums_Registers[register_address].Parameters_Versions[version].Ivote_address);
        uint winning_proposal= Vote_Instance.Get_Winning_Proposition_byId(referendum_key,0);
        List_Law_Project[referendum_key].Winning_Proposal = winning_proposal;
        
        if(winning_proposal==0){
            Referendums[referendum_key].Referendum_Status = Status.REJECTED;
            emit Projet_Rejected(register_address, referendum_key);
        }else{
            Referendums[referendum_key].Referendum_Status = Status.ADOPTED;
            emit Project_Adopted(register_address, referendum_key);
        }
    }
    
    function Execute_Law(address register_address, bytes32 referendum_key, uint num_function_call_ToExecute)external Citizen_Only nonReentrant{
        require(Referendums[referendum_key].Referendum_Status ==  Status.ADOPTED, "Project Not ADOPTED");
        //if(Execute_Winning_Proposal(law_project, num_function_call_ToExecute, Delegation_Law_Projects[law_project].Institution_Address)){
        if(List_Law_Project[referendum_key].Execute_Winning_Proposal(num_function_call_ToExecute, register_address)){
            Referendums[referendum_key].Referendum_Status = Status.EXECUTED;
            uint Total_Reward = Referendums[referendum_key].Token_Amount_Consummed;
            IVote Vote_Instance = IVote(Referendums_Registers[register_address].Parameters_Versions[Referendums[referendum_key].Version].Ivote_address);
            uint num_voter = Vote_Instance.Get_Voter_Number(referendum_key);
            uint bonnus_amount = Democoin.balanceOf(address(this)) - Total_Token_To_Redistribute; //If there is an amount of token on Agora account that doesn't come from proposition submission, it is redistributed to voters
            if(bonnus_amount>0){
                 Total_Token_To_Redistribute +=bonnus_amount;
                 Total_Reward+=bonnus_amount;
            }
            Referendums[referendum_key].Voter_Reward = Total_Reward/num_voter;
            Total_Token_To_Redistribute-=Total_Reward%num_voter;   
            emit Project_Executed(register_address, referendum_key);
        }
    }
    
    function Get_Voter_Reward(address register_address, bytes32 referendum_key)external {
        require(!Referendums[referendum_key].Voter_Rewarded[msg.sender], "Voter already rewarded");
        require(Referendums[referendum_key].Referendum_Status ==  Status.EXECUTED, "Project Not EXECUTED");
        uint version = Referendums[referendum_key].Version;
        IVote Vote_Instance = IVote(Referendums_Registers[register_address].Parameters_Versions[version].Ivote_address);
        
        if(Referendums_Registers[register_address].Parameters_Versions[version].Vote_Checking_Duration>0){
            (bool HasValidated,)= Vote_Instance.HasValidated(referendum_key, msg.sender);
            require(HasValidated, "Vote hasn't been validated");
        }else{
            require(Vote_Instance.HasVoted(referendum_key, msg.sender), "You haven't voted");
        }
        
        Democoin.transfer(msg.sender, Referendums[referendum_key].Voter_Reward);
    }
    
    
    
    /*Constitution_Only functions*/
    
    function Create_Register_Referendum(address register_address, uint8 register_type) external Constitution_Only {
        
        //Registers_Referendums[register_address].Last_Version = 1;
        Referendums_Registers[register_address].Type = Institution_Type(register_type);
    }
    
    
    function Update_Register_Referendum_Parameters(address register_address, uint Petition_Duration, uint Vote_Duration, uint Vote_Checking_Duration, uint Law_Initialisation_Price, uint FunctionCall_Price, uint16 Required_Petition_Rate, address Ivote_address) external Constitution_Only{
        
        uint new_version = Referendums_Registers[register_address].Last_Version +1;
        Referendums_Registers[register_address].Parameters_Versions[new_version].Petition_Duration= Petition_Duration;
        Referendums_Registers[register_address].Parameters_Versions[new_version].Vote_Duration = Vote_Duration;
        Referendums_Registers[register_address].Parameters_Versions[new_version].Vote_Checking_Duration = Vote_Checking_Duration;
        Referendums_Registers[register_address].Parameters_Versions[new_version].Law_Initialisation_Price = Law_Initialisation_Price;
        Referendums_Registers[register_address].Parameters_Versions[new_version].FunctionCall_Price = FunctionCall_Price;

        Referendums_Registers[register_address].Parameters_Versions[new_version].Required_Petition_Rate = Required_Petition_Rate;
        
        Referendums_Registers[register_address].Parameters_Versions[new_version].Ivote_address =Ivote_address;
        
        Referendums_Registers[register_address].Last_Version = new_version;
        
        emit Referendum_Parameters_Updated( register_address,  new_version);
    }
    
    /*function Update_Register_Referendum_Parameters(address register_address, uint[7] memory Uint256_Arg, uint16 Assembly_Max_Members, uint8[6] memory Uint8_Arg, address Assembly_Associated_Delegation, address Ivote_address) external Constitution_Only{
        uint new_version = Referendums_Registers[register_address].Last_Version.add(1);
        Referendums_Registers[register_address].Parameters_Versions[new_version].Petition_Duration= Uint256_Arg[0];
        Referendums_Registers[register_address].Parameters_Versions[new_version].Vote_Duration = Uint256_Arg[1];
        Referendums_Registers[register_address].Parameters_Versions[new_version].Vote_Checking_Duration = Uint256_Arg[2];
        //Referendums_Registers[register_address].Parameters_Versions[new_version].Helper_Max_Duration = Uint256_Arg[3];
        Referendums_Registers[register_address].Parameters_Versions[new_version].Law_Initialisation_Price = Uint256_Arg[4];
        Referendums_Registers[register_address].Parameters_Versions[new_version].FunctionCall_Price = Uint256_Arg[5];
        //Referendums_Registers[register_address].Parameters_Versions[new_version].Helper_Amount_Escrow = Uint256_Arg[6];
        
        //Referendums_Registers[register_address].Parameters_Versions[new_version].Assembly_Max_Members = Assembly_Max_Members;
        
        Referendums_Registers[register_address].Parameters_Versions[new_version].Required_Petition_Rate = Uint8_Arg[0];
        //Referendums_Registers[register_address].Parameters_Versions[new_version].Representatives_Rates = Uint8_Arg[1];
        //Referendums_Registers[register_address].Parameters_Versions[new_version].Voters_Reward_Rate = Uint8_Arg[2];
        //Referendums_Registers[register_address].Parameters_Versions[new_version].Helper_Reward_Rate = Uint8_Arg[3];
        //Referendums_Registers[register_address].Parameters_Versions[new_version].Assembly_Voluteer_Reward_Rate = Uint8_Arg[4];
        //Referendums_Registers[register_address].Parameters_Versions[new_version].OffChain_Delegation_Reward = Uint8_Arg[5];
        //Referendums_Registers[register_address].Parameters_Versions[new_version].Vote_Type = Uint8_Arg[5];
        
        //Referendums_Registers[register_address].Parameters_Versions[new_version].Assembly_Associated_Delegation = Assembly_Associated_Delegation;
        Referendums_Registers[register_address].Parameters_Versions[new_version].Ivote_address; Ivote_address;
        
        Referendums_Registers[register_address].Last_Version = new_version;
        
        emit Referendum_Parameters_Updated( register_address,  new_version);
    }*/
    
    
    
    
    

    /*GETTER*/
    
    function Get_Referendum_Register(address register_address) external view returns(uint last_version, Institution_Type institution_type){
        return (Referendums_Registers[register_address].Last_Version, Referendums_Registers[register_address].Type);
    }
    
    function Get_Referendum_Register_Parameters(address register_address, uint version) external view returns(Referendum_Parameters memory){
        return (Referendums_Registers[register_address].Parameters_Versions[version]);
    }
    
    /*TEMP*/
    /*function Set_Constitution(address consti)external{
        Constitution_Address = consti;
        Constitution_Interface = IConstitution_Agora(consti);
    }*/
}