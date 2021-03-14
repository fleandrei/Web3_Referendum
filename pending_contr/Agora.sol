// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "Initiative_Legislative.sol";
import "Citizens_Register.sol";
//import "Constitution.sol";

interface IConstitution_Agora{
    function Get_Register_Parameter(address register) external view returns(uint,uint);
    function Get_Register_Referendum_Parameters(address register) external view returns(uint[7] memory Uint256_Arg, uint16 Assembly_Max_Members, uint8[7] memory Uint8_Arg, address OffChain_Vote_Delegation, address Assembly_Associated_Delegation);
    //function Get_Register(address register) external view returns(Register_Parameters memory);
}

contract Agora is Initiative_Legislative{
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using SafeMath for uint;
    enum Status{
        PETITIONS,
        VOTE,
        VOTE_CHECKING,
        EXECUTED,
        ABORTED
    }
    
    struct Referendum_Parameters{
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
    }
    
    struct Register_Referendum{
        uint Last_Version;
        Institution_Type Type;
        bytes32[] List_Referendums;
        mapping(uint=>Referendum_Parameters) Parameters_Versions;
    }
    
    struct Referendum{
        mapping(address=>bool) Petition;
        EnumerableSet.AddressSet Assembly_Volunteer;
        uint Petition_Counter;
        uint Version;
        uint Creation_Timestamps;
        uint Winning_Proposition;
        Status Referendum_Status;
    }
    
    
    modifier Citizen_Only{
        require(Citizens.Contains(msg.sender),"Citizen Only");
        _;
    }
    
    
    /*EVENTS*/
    event Referendum_Parameters_Updated(address register_address, uint new_version);
    event New_Referendum(address register_address, bytes32 key);
    
    /*STATE*/
    IConstitution_Agora public Constitution_Interface ;
    
    mapping(address=>Register_Referendum) Registers_Referendums;
    mapping(bytes32=>Referendum) Referendums;
    
    
    DemoCoin Democoin;
    Citizens_Register Citizens;
    
    
    
    constructor(address token_address, address citizen_address){
        Type_Institution =Institution_Type.AGORA;
        Constitution_Interface= IConstitution_Agora(Constitution_Address);
        
        Democoin = DemoCoin(token_address);
        Citizens = Citizens_Register(citizen_address);
    }
    
    
    function Add_Law_Project(address register_address, bytes calldata Title, bytes calldata Description)external Citizen_Only{
       
        //_Update_Register_Referendum(register_address);
        uint version = Registers_Referendums[register_address].Last_Version;
        uint Law_Initialisation_Price = Registers_Referendums[register_address].Parameters_Versions[version].Law_Initialisation_Price;
        //uint Description_Max_Size = Registers_Referendums[register_address].Parameters_Versions[version].Description_Max_Size;
        
        /*Token operations AND Size checking*/
        
        bytes32 key = keccak256(abi.encode(Title,Description));
        require(Referendums[key].Version==0,"Law project already created");
        
        Add_Law_Project(Title,  Description, key);
        
        Referendums[key].Version = version;
        Referendums[key].Creation_Timestamps = block.timestamp;
        Referendums[key].Petition[msg.sender] = true;
        Referendums[key].Petition_Counter = Referendums[key].Petition_Counter.add(1);
        
        Registers_Referendums[register_address].List_Referendums.push(key);
        
        emit New_Referendum(register_address, key);
    }
    
    
    
    
    /*Constitution_Only functions*/
    
    function Create_Register_Referendum(address register_address, uint register_type) external Constitution_Only {
        require(Registers_Referendums[register_address].Last_Version==0, "Register Already Existing");
        //Registers_Referendums[register_address].Last_Version = 1;
        Registers_Referendums[register_address].Type = Institution_Type(register_type);
    }
    
    function Update_Register_Referendum_Parameters(address register_address, uint[7] memory Uint256_Arg, uint16 Assembly_Max_Members, uint8[6] memory Uint8_Arg, address Assembly_Associated_Delegation) external Constitution_Only{
        uint new_version = Registers_Referendums[register_address].Last_Version.add(1);
        Registers_Referendums[register_address].Parameters_Versions[new_version].Petition_Duration= Uint256_Arg[0];
        Registers_Referendums[register_address].Parameters_Versions[new_version].Vote_Duration = Uint256_Arg[1];
        Registers_Referendums[register_address].Parameters_Versions[new_version].Vote_Checking_Duration = Uint256_Arg[2];
        Registers_Referendums[register_address].Parameters_Versions[new_version].Helper_Max_Duration = Uint256_Arg[3];
        Registers_Referendums[register_address].Parameters_Versions[new_version].Law_Initialisation_Price = Uint256_Arg[4];
        Registers_Referendums[register_address].Parameters_Versions[new_version].FunctionCall_Price = Uint256_Arg[5];
        Registers_Referendums[register_address].Parameters_Versions[new_version].Helper_Amount_Escrow = Uint256_Arg[6];
        
        Registers_Referendums[register_address].Parameters_Versions[new_version].Assembly_Max_Members = Assembly_Max_Members;
        
        Registers_Referendums[register_address].Parameters_Versions[new_version].Required_Petition_Rate = Uint8_Arg[0];
        Registers_Referendums[register_address].Parameters_Versions[new_version].Representatives_Rates = Uint8_Arg[1];
        Registers_Referendums[register_address].Parameters_Versions[new_version].Voters_Reward_Rate = Uint8_Arg[2];
        Registers_Referendums[register_address].Parameters_Versions[new_version].Helper_Reward_Rate = Uint8_Arg[3];
        Registers_Referendums[register_address].Parameters_Versions[new_version].Assembly_Voluteer_Reward_Rate = Uint8_Arg[4];
        //Registers_Referendums[register_address].Parameters_Versions[new_version].OffChain_Delegation_Reward = Uint8_Arg[5];
        Registers_Referendums[register_address].Parameters_Versions[new_version].Vote_Type = Uint8_Arg[5];
        
        Registers_Referendums[register_address].Parameters_Versions[new_version].Assembly_Associated_Delegation = Assembly_Associated_Delegation;
        
        Registers_Referendums[register_address].Last_Version = new_version;
        
        emit Referendum_Parameters_Updated( register_address,  new_version);
    }
    
    /*function _Update_Register_Referendum(address register_address)internal returns(bool){
        //uint version = Registers_Referendums[register_address].Last_Version;
        
        (uint new_version, uint register_type) = Constitution_Interface.Get_Register_Parameter(register_address);
        
        
        if(new_version==0){
            return false;
        }
        
        if(Registers_Referendums[register_address].Last_Version<new_version){
            if(Registers_Referendums[register_address].Last_Version==0){
                Registers_Referendums[register_address].Type = Institution_Type(register_type);
            }
                
            Registers_Referendums[register_address].Last_Version= new_version;
            
            uint[7] memory Uint256_Arg;
            uint16 Assembly_Max_Members;
            uint8[7] memory Uint8_Arg; 
            (Uint256_Arg, Assembly_Max_Members, Uint8_Arg, Registers_Referendums[register_address].Parameters_Versions[new_version].OffChain_Vote_Delegation, Registers_Referendums[register_address].Parameters_Versions[new_version].Assembly_Associated_Delegation) = Constitution_Interface.Get_Register_Referendum_Parameters(register_address);
            
            Registers_Referendums[register_address].Parameters_Versions[new_version].Petition_Duration = Uint256_Arg[0];
            Registers_Referendums[register_address].Parameters_Versions[new_version].Vote_Duration = Uint256_Arg[1];
            Registers_Referendums[register_address].Parameters_Versions[new_version].Vote_Checking_Duration = Uint256_Arg[2];
            Registers_Referendums[register_address].Parameters_Versions[new_version].Helper_Max_Duration = Uint256_Arg[3];
            Registers_Referendums[register_address].Parameters_Versions[new_version].Law_Initialisation_Price = Uint256_Arg[4];
            Registers_Referendums[register_address].Parameters_Versions[new_version].FunctionCall_Price = Uint256_Arg[5];
            Registers_Referendums[register_address].Parameters_Versions[new_version].Helper_Amount_Escrow = Uint256_Arg[6];
            
            Registers_Referendums[register_address].Parameters_Versions[new_version].Assembly_Max_Members = Assembly_Max_Members;
            //Registers_Referendums[register_address].Parameters_Versions[new_version].Description_Max_Size = Uint16_Arg[1];
            
            //Registers_Referendums[register_address].Parameters_Versions[new_version].FunctionCall_Max_Number = Uint8_Arg[0];
            Registers_Referendums[register_address].Parameters_Versions[new_version].Required_Petition_Rate = Uint8_Arg[0];
            Registers_Referendums[register_address].Parameters_Versions[new_version].Representatives_Rates = Uint8_Arg[1];
            Registers_Referendums[register_address].Parameters_Versions[new_version].Voters_Reward_Rate = Uint8_Arg[2];
            Registers_Referendums[register_address].Parameters_Versions[new_version].Helper_Reward_Rate = Uint8_Arg[3];
            Registers_Referendums[register_address].Parameters_Versions[new_version].Assembly_Voluteer_Reward_Rate = Uint8_Arg[4];
            Registers_Referendums[register_address].Parameters_Versions[new_version].OffChain_Delegation_Reward = Uint8_Arg[5];
            Registers_Referendums[register_address].Parameters_Versions[new_version].Vote_Type = Uint8_Arg[6];
            
            emit Referendum_Parameters_Updated( register_address,  new_version);
            
            
            }
            return true;
    }
    */
    
    
    
    /*Overite functions*/
    /*function Before_Add_Law_Project(bytes calldata Title, bytes calldata Description) internal override returns(bytes32){
        
    }
    
    function Before_Add_Corpus_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) internal override{
        
    }
    
    function Before_Add_Item_Proposal(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) internal override{
        
    }
    */
    /*GETTER*/
    
    function Get_Register_Referendum(address register_address) external view returns(uint, Institution_Type){
        return (Registers_Referendums[register_address].Last_Version, Registers_Referendums[register_address].Type);
    }
    
    function Get_Register_Referendum_Parameters(address register_address, uint version) external view returns(Referendum_Parameters memory){
        return (Registers_Referendums[register_address].Parameters_Versions[version]);
    }
    
    /*TEMP*/
    function Set_Constitution(address consti)external{
        Constitution_Address = consti;
        Constitution_Interface = IConstitution_Agora(consti);
    }
}