// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*import "Initiative_Legislative_lib.sol";
import "Citizens_Register.sol";
import "IVote.sol";
*/

import "contracts/Initiative_Legislative_lib.sol";
import "contracts/Citizens_Register.sol";
import "contracts/IVote.sol";

//import "Constitution.sol";

interface IConstitution_Agora{
    function Get_Register_Parameter(address register) external view returns(uint,uint);
    function Get_Register_Referendum_Parameters(address register) external view returns(uint[7] memory Uint256_Arg, uint16 Assembly_Max_Members, uint8[7] memory Uint8_Arg, address OffChain_Vote_Delegation, address Assembly_Associated_Delegation);
    //function Get_Register(address register) external view returns(Register_Parameters memory);
}

/**
 * @notice In the ancient Greece the Agora was the public place where the population used to gather and which  was the center of social, economic and political life of the city. Etymologically, Agora means «gathering place», «Assembly». 
 * In a Web3 Direct Democracy project, the Agora is the contract used to implement direct democracy via a legislative referendum of people initiative.
 * @dev There is a single Agora contract in a Web3 Direct Democracy and all citizens can take part in it's democratic process.
*/
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
    event Voting_Stage_Started(address register, bytes32 key, bytes32 ballot_key);
    event Projet_Signed(address register, bytes32 key);
    event Projet_Rejected(address register, bytes32 key);
    event Project_Adopted(address register, bytes32 key);
    event Function_Call_Executed(address register, bytes32 key, uint Function_Call_Nbr);
    event Project_Executed(address register, bytes32 key);
    
    /*STATE*/
    /// @dev Mapping of {Law_Project} structure ({Initiative_Legislative_Lib} library)
    mapping(bytes32 => Initiative_Legislative_Lib.Law_Project) public List_Law_Project;
    
    mapping(address=>Referendum_Register) Referendums_Registers;
    
    ///@dev Mapping of {Referendum} structure corresponding to contract's referendum projects (pending, aborted and passed)
    mapping(bytes32=>Referendum) public Referendums;
    
    ///@notice Token amount consummed for emmiting propositions during Petition stage and not yet redistributed
    uint public Total_Token_To_Redistribute;
    
    
    DemoCoin Democoin;
    Citizens_Register Citizens;
    
    
    
    constructor(string memory Name, address token_address, address citizen_address)Institution(Name){
        Type_Institution =Institution_Type.AGORA;

        Democoin = DemoCoin(token_address);
        Citizens = Citizens_Register(citizen_address);
    }
    
    
    /** 
     * @dev Function can be called by any citizen to submit a new law project. Caller must approve {Law_Initialisation_Price} DemoCoin token for Agora contract
     * @param register_address Address of the register contract the law proposition is about. The address must be contained in Referendums_Registers mapping.
     * @param Title Title of the Referendum Proposition. Can be an hash.
     * @param Description Text explaining the spirit and generals goals of the referendum proposition. Can be an hash.
    */
    function Add_Law_Project(address register_address, bytes calldata Title, bytes calldata Description)external Citizen_Only{
       
        //_Update_Register_Referendum(register_address);
        uint version = Referendums_Registers[register_address].Last_Version;
        require(version!=0, "Register unknown");
        uint Law_Initialisation_Price = Referendums_Registers[register_address].Parameters_Versions[version].Law_Initialisation_Price;
        //uint Description_Max_Size = Registers_Referendums[register_address].Parameters_Versions[version].Description_Max_Size;
        
        /*Token operations AND Size checking*/
        require(Democoin.allowance(msg.sender, address(this)) >= Law_Initialisation_Price, "Increase Token Allowance");
        
        bytes32 key = keccak256(abi.encode(Title,Description));
        require(Referendums[key].Version==0,"Referendums project already created");
        
        List_Law_Project[key].Add_Law_Project(Title,  Description);
        
        Referendums[key].Version = version;
        Referendums[key].Creation_Timestamps = block.timestamp;
        Referendums[key].Petitions[msg.sender] = true;
        Referendums[key].Petition_Counter = Referendums[key].Petition_Counter+1;
        
        Referendums_Registers[register_address].List_Referendums.push(key);
        
        
        Referendums[key].Token_Amount_Consummed +=Law_Initialisation_Price;
        Total_Token_To_Redistribute+=Law_Initialisation_Price;
        
        Democoin.transferFrom(msg.sender, address(this), Law_Initialisation_Price);
        
        emit New_Referendum(register_address, key);
    }
    
    
    /** 
     * @dev Function can be called by a citizen to submit a corpus of function calls propositions to an existing pending law project. Caller must approve {FunctionCall_Price} DemoCoin Token multiplied by the number of function call contained in the proposition, token for Delegation contract.
     * @param register_address Address of the register concerned by the referendum project.
     * @param referendum_key Id of the referendum proposition the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the referendum proposition.
     * @param Parent Id of the parent proposition the caller wants to attach his proposition to. It's the parent proposition in the proposal tree. If there isn't any proposition in the tree we want to attach the new proposition to, we set Parent to 0
     * @param Parent_Proposals_Reuse List of Parent's function calls index we want to reuse in the new proposition. Function calls are ordered in the order we want them to be executed. 0 elements correspond to new function calls that have to be added by the caller in {New_Function_Call} argument.
     * @param New_Function_Call List of new function calls added by the caller. For each element of the New_Function_Call array, caller must set a 0 element in {Parent_Proposals_Reuse} array at the index he want the custom function call to be positioned 
     * @param Description Text to justify the new proposal. Can be an hash.
    */
    function Add_Proposal(address register_address, bytes32 referendum_key, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) external Citizen_Only{
        uint version = Referendums[referendum_key].Version;
        require(Referendums_Registers[register_address].Last_Version!=0,"Register unknown");
        require(version!=0,"No existing Referendum Project");
        require(Referendums[referendum_key].Referendum_Status == Status.PETITIONS, "Not at PETITIONS status");
        
        
        uint Cost = Referendums_Registers[register_address].Parameters_Versions[version].FunctionCall_Price*New_Function_Call.length;
        
        require(Democoin.allowance(msg.sender, address(this)) >= Cost, "Increase Token Allowance");
        
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
        
        Democoin.transferFrom(msg.sender, address(this), Cost);
    }
    
    /** 
     * @dev Function can be called by a citizen to modify a proposition that he has already created (He have to be the author of the proposition). 
     * Caller must approve {FunctionCall_Price} multiplied by the number of function call he wants to add to the proposition.
     * @param register_address Address of the register concerned by the referendum project.
     * @param referendum_key Id of the referendum proposition the caller wants to add function calls to. The Id is obtained by hashing the Title with the Description of the law project.
     * @param Proposal Proposition Id to modify.
     * @param New_Items Array of new function calls to add to the Proposition.
     * @param Indexs array of Proposition's function call list indexs to inser new function call (contained in {New_Items}) to. {New_Items} and {Indexs} have the same length.
    */
    function Add_Item(address register_address, bytes32 referendum_key, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) external Citizen_Only{
        uint version = Referendums[referendum_key].Version;
        require(Referendums_Registers[register_address].Last_Version!=0,"Register unknown");
        require(version!=0,"No existing Referendum Project");
        require(Referendums[referendum_key].Referendum_Status == Status.PETITIONS, "Not at PETITIONS status");
        
        uint Cost = Referendums_Registers[register_address].Parameters_Versions[version].FunctionCall_Price*New_Items.length;
        
        require(Democoin.allowance(msg.sender, address(this)) >= Cost, "Increase Token Allowance");
        
        Referendums[referendum_key].Token_Amount_Consummed +=Cost;
        Total_Token_To_Redistribute+=Cost;
        
        List_Law_Project[referendum_key].Add_Item_Proposal( Proposal, New_Items, Indexs, msg.sender);
        emit Proposal_Modified(register_address, referendum_key, Proposal);
        
        Democoin.transferFrom(msg.sender, address(this), Cost);
    }
    
     /** 
     * @dev Function can be called by any citizen to a Referendum proposition petition. A citizen can sign for a specific Referendum proposition only once.
     * @param register_address Address of the register contract the Referendum proposition is about. The address must be contained in Referendums_Registers mapping.
     * @param referendum_key Id of the referendum proposition the caller wants to sign. The Id is obtained by hashing the Title with the Description of the law project.
    */
    function Sign_Petition(address register_address, bytes32 referendum_key) external Citizen_Only{
        require(Referendums_Registers[register_address].Last_Version!=0,"Register unknown");
        uint version = Referendums[referendum_key].Version;
        require(version!=0,"No existing Referendum Project");
        require(Referendums[referendum_key].Referendum_Status == Status.PETITIONS, "Not at PETITIONS status");
        require(!Referendums[referendum_key].Petitions[msg.sender], "Already Signed");
        Referendums[referendum_key].Petitions[msg.sender]=true;
        Referendums[referendum_key].Petition_Counter++;
        emit Projet_Signed(register_address, referendum_key);
    }
    
    /** 
     * @dev Function can be called by any citizen to end the proposition stage if it's finished. If there are enough signatures then we pass to the Voting stage, else the referendum proposition is aborted.
     * @param register_address Address of the register contract the Referendum proposition is about. The address must be contained in Referendums_Registers mapping.
     * @param referendum_key Id of the referendum proposition. 
    */
    function End_Proposition_Stage(address register_address, bytes32 referendum_key)external Citizen_Only{
        uint version = Referendums[referendum_key].Version;
        require(Referendums_Registers[register_address].Last_Version!=0,"Register unknown");
        require(version!=0,"No existing Referendum Project");
        require(Referendums[referendum_key].Referendum_Status == Status.PETITIONS, "Not at PETITIONS status");
        require(block.timestamp - Referendums[referendum_key].Creation_Timestamps > Referendums_Registers[register_address].Parameters_Versions[version].Petition_Duration, "PETITIONS stage not finished");
        
        if(Referendums[referendum_key].Petition_Counter >= Percentage(Referendums_Registers[register_address].Parameters_Versions[version].Required_Petition_Rate, Citizens.Get_Citizen_Number()) && List_Law_Project[referendum_key].Proposal_Count>0){
            bytes32 ballot_key= keccak256(abi.encodePacked(referendum_key,block.timestamp));
            IVote Vote_Instance = IVote(Referendums_Registers[register_address].Parameters_Versions[version].Ivote_address);
            
            Referendums[referendum_key].Start_Vote_Timestamps = block.timestamp;
            Referendums[referendum_key].Referendum_Status = Status.VOTE;
            
            emit Voting_Stage_Started(register_address, referendum_key, ballot_key);
            
            Vote_Instance.Create_Ballot(ballot_key, address(Citizens), Citizens.Contains_Function_Selector(), Referendums_Registers[register_address].Parameters_Versions[version].Vote_Duration, Referendums_Registers[register_address].Parameters_Versions[version].Vote_Checking_Duration, List_Law_Project[referendum_key].Proposal_Count, 1);
            
            
        }else{
            Referendums[referendum_key].Referendum_Status = Status.REJECTED;
            Total_Token_To_Redistribute -= Referendums[referendum_key].Token_Amount_Consummed;
            emit Projet_Rejected(register_address, referendum_key);
        }
    }
    

    /**
     * @dev Function can be called by any citizen to end the voting stage if it's finished. If the winning proposal id is >0 then the proposal is adopted and can be executed, else if the default proposition is chosen, the referendum proposition is rejected.
     * @param register_address Address of the register contract the Referendum proposition is about.
     * @param referendum_key Id of the referendum proposition. 
    */
    function End_Vote(address register_address, bytes32 referendum_key)external Citizen_Only{
        uint version = Referendums[referendum_key].Version;
        //require(version!=0,"No existing Referendum Project");
        require(Referendums_Registers[register_address].Last_Version!=0,"Register unknown");
        require(Referendums[referendum_key].Referendum_Status == Status.VOTE, "Not at VOTE status");
        bytes32 ballot_key = keccak256(abi.encodePacked(referendum_key,  Referendums[referendum_key].Start_Vote_Timestamps));
        
        IVote Vote_Instance = IVote(Referendums_Registers[register_address].Parameters_Versions[version].Ivote_address);
        uint winning_proposal= Vote_Instance.Get_Winning_Proposition_byId(ballot_key,0);
        List_Law_Project[referendum_key].Winning_Proposal = winning_proposal;
        
        if(winning_proposal==0){
            Referendums[referendum_key].Referendum_Status = Status.REJECTED;
            emit Projet_Rejected(register_address, referendum_key);
        }else{
            Referendums[referendum_key].Referendum_Status = Status.ADOPTED;
            emit Project_Adopted(register_address, referendum_key);
        }
    }
    
     /**
     * @dev Once the referendum proposition has been adopted (ADOPTED value of {Status} enum) then any citizen can call this function to execute all or some of the remaining function call of the winning proposition. 
     * For the Referendum proposition to be fully executed all function call have to be executed.
     * @param register_address Address of the register contract the Referendum proposition is about.
     * @param referendum_key Id of the referendum proposition. 
     * @param num_function_call_ToExecute Number of function calls to execute.
     */
    function Execute_Law(address register_address, bytes32 referendum_key, uint num_function_call_ToExecute)external Citizen_Only nonReentrant{
        require(Referendums_Registers[register_address].Last_Version!=0,"Register unknown");
        require(Referendums[referendum_key].Referendum_Status ==  Status.ADOPTED, "Project Not ADOPTED");
        //if(Execute_Winning_Proposal(law_project, num_function_call_ToExecute, Delegation_Law_Projects[law_project].Institution_Address)){
        emit Function_Call_Executed( register_address, referendum_key, num_function_call_ToExecute);
        if(List_Law_Project[referendum_key].Execute_Winning_Proposal(num_function_call_ToExecute, register_address)){
            bytes32 ballot_key = keccak256(abi.encodePacked(referendum_key,  Referendums[referendum_key].Start_Vote_Timestamps));
            
            Referendums[referendum_key].Referendum_Status = Status.EXECUTED;
            uint Total_Reward = Referendums[referendum_key].Token_Amount_Consummed;
            IVote Vote_Instance = IVote(Referendums_Registers[register_address].Parameters_Versions[Referendums[referendum_key].Version].Ivote_address);
            uint num_voter = Vote_Instance.Get_Voter_Number(ballot_key);
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
    
    /**
     * @dev Once the referendum proposition has been executed (EXECUTED value of {status} enum), each citizen that has voted can get his DemoCoin token reward. If proposition proposition had a validation stage, then accounts must have voted AND validated their vote for getting their rewards.
     * @param register_address Address of the register contract the Referendum proposition is about.
     * @param referendum_key Id of the referendum proposition. 
     */
    function Get_Voter_Reward(address register_address, bytes32 referendum_key)external {
        require(Referendums_Registers[register_address].Last_Version!=0,"Register unknown");
        require(!Referendums[referendum_key].Voter_Rewarded[msg.sender], "Voter already rewarded");
        require(Referendums[referendum_key].Referendum_Status ==  Status.EXECUTED, "Project Not EXECUTED");
        uint version = Referendums[referendum_key].Version;
        uint voter_reward=Referendums[referendum_key].Voter_Reward;
        IVote Vote_Instance = IVote(Referendums_Registers[register_address].Parameters_Versions[version].Ivote_address);
        bytes32 ballot_key = keccak256(abi.encodePacked(referendum_key,  Referendums[referendum_key].Start_Vote_Timestamps));
        
        if(Referendums_Registers[register_address].Parameters_Versions[version].Vote_Checking_Duration>0){
            (bool HasValidated,)= Vote_Instance.HasValidated(ballot_key, msg.sender);
            require(HasValidated, "Vote hasn't been validated");
        }else{
            require(Vote_Instance.HasVoted(ballot_key, msg.sender), "You haven't voted");
        }
        Referendums[referendum_key].Voter_Rewarded[msg.sender]=true;
        Total_Token_To_Redistribute-= voter_reward;
        Democoin.transfer(msg.sender, voter_reward);
    }
    
    
    
    /*Constitution_Only functions*/
    
    
    /**
     * @dev Add a new register under Agora's control. Register's address is added as a {Referendum_Register} struct.
     * @param register_address Address of the register contract to add 
     * @param register_type Type of the new register ({Status} enum)
     */
    function Create_Register_Referendum(address register_address, uint8 register_type) external Constitution_Only {
        
        //Registers_Referendums[register_address].Last_Version = 1;
        Referendums_Registers[register_address].Type = Institution_Type(register_type);
    }
    
    /**
     * @dev Update parameters of referendums related to a specific register. Parameters are registered in a {Referendum_Parameters} struct
     * @param register_address Address of the register contract.
     * @param Petition_Duration Duration of the proposition/petition stage
     * @param Vote_Duration Duration of the voting stage
     * @param Vote_Duration Duration of the validation stage
     * @param Law_Initialisation_Price Amount of DemoCoin token to pay to submit a new Referendum proposition.
     * @param FunctionCall_Price Amount of DemoCoin token to pay for each new function call of a function call corpus proposal submission.
     * @param Required_Petition_Rate The minimum ratio of citizens signatures required to submit the referendum proposition as a referendum to all citizens.
     * @param Ivote_address Address of the IVote contract used in the voting and validation stage (see later in the Vote sub-section)
     */
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
    
    /**
     * @dev Get globals informations about a Register contract ruled by Agora: The last version of Parameters related to the Register contract, it's institution type and the list of referendums (represented by their Ids) that are related to it. 
     * @param register_address Address of the corresponding Register Contract
     * @return last_version Last Parameters version
     * @return institution_type Type of the Register Contract
     * @return list_referendums List of referendum Id that are related to the Register 
     */
    function Get_Referendum_Register(address register_address) external view returns(uint last_version, Institution_Type institution_type, bytes32[] memory list_referendums){
        return (Referendums_Registers[register_address].Last_Version, Referendums_Registers[register_address].Type, Referendums_Registers[register_address].List_Referendums);
    }
    
     /**
     * @dev Get Parameters related to a register Contract ruled by Agora. It return a {Referendum_Parameters} structure
     * @param register_address Address of the corresponding Register Contract
     * @param version Parameters version.
     * @return parameters 
     */
    function Get_Referendum_Register_Parameters(address register_address, uint version) external view returns(Referendum_Parameters memory parameters){
        return (Referendums_Registers[register_address].Parameters_Versions[version]);
    }
    
    /**
     * @dev Get informations about a proposal ({Corpus_Proposal} structure of {Initiative_Legislative_Lib} library) of a law project ({Law_Project} structure of {Initiative_Legislative_Lib} library.
     * @param key Id of the law project tha contains the proposal
     * @param id Id of the proposal in the law project
     * @return description Text describing the spirit and goals of the proposal. 
     * @return childrens List of Proposal's children in the Proposal tree
     * @return function_calls List of function calls proposed in the Proposal.
     * @return func_call_counter Number of function call contained in {function_calls}.
     * @return parent Proposal's parent in the Proposal Tree.
     * @return author Account that has submited the proposal.
     */
    function Get_Proposal(bytes32 key, uint id)external view returns(bytes memory description, uint[] memory childrens, bytes[] memory function_calls, uint func_call_counter, uint parent, address author){
        function_calls = List_Law_Project[key].Get_Proposal_FunctionCall_List(id);
        (description, childrens,func_call_counter, parent, author) = List_Law_Project[key].Get_Proposal_Infos(id);
    }
    
   
    /**
     * @dev Get results of a Referendum proposition.
     * @param key Id of the law project tha contains the proposal
     * @return Winning_Proposal Id of the proposal that has been voted by citizens.
     * @return Receipts Results of function calls to register functions.
     */ 
    function Get_Law_Results(bytes32 key)external view returns(uint Winning_Proposal, Initiative_Legislative_Lib.Function_Call_Result[] memory Receipts){
        return(List_Law_Project[key].Winning_Proposal, List_Law_Project[key].Function_Call_Receipts);
    }
    
    /*TEMP*/
    /*function Set_Constitution(address consti)external{
        Constitution_Address = consti;
        Constitution_Interface = IConstitution_Agora(consti);
    }*/
}