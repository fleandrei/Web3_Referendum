// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "Register.sol";
import "Agora.sol";
import "Loi.sol";
import "Delegation.sol";
import "Citizens_Register.sol";
import "IVote.sol";

library Constitution_Register{

     
    function Create_Loi(address agora)external returns(address){
         Loi loi = new Loi(agora);
         //loi.Add_Authority(authority);
         return address(loi);
     }
     
     function Create_Citizens(address[] calldata Initial_members, address token_address, uint new_citizen_mint_amount)external returns(address){
         return address(new Citizens_Register(Initial_members, token_address, new_citizen_mint_amount));
     }
    
}


library Constitution_Delegation{

    function Create_Delegation(address[] memory Initial_members, address Token_Address, address citizen_address, address agora_address)external returns(address){
         Delegation delegation = new Delegation(Initial_members, Token_Address, citizen_address, agora_address);
         return address(delegation);
    }


         
     
}








 //contract Constitution is Register, IConstitution_Agora, IConstitution_Delegation{
contract Constitution is Register{
     using EnumerableSet for EnumerableSet.AddressSet;
     using SafeMath for uint;
     //using Constitution_Register for Constitution_Register.Register_Parameters;
     //using Constitution_Delegation for Constitution_Delegation.Delegation_Parameters;
     //using SafeMath for uint8;
     
    /* struct Register_Parameters{
         //uint Index; // index in Registers_Address_List array
         uint Actual_Version;
         uint Petition_Duration;
         uint Vote_Duration;
         uint Vote_Checking_Duration;
         uint Helper_Max_Duration;
         uint Law_Initialisation_Price;
         uint FunctionCall_Price;
         uint Helper_Amount_Escrow;
         uint16 Assembly_Max_Members;
         uint16 Description_Max_Size;
         uint8 FunctionCall_Max_Number;
         uint8 Required_Petition_Rate;
         uint8 Representatives_Rates;
         uint8 Voters_Reward_Rate;
         uint8 Helper_Reward_Rate;
         uint8 Assembly_Voluteer_Reward_Rate;
         uint8 OffChain_Delegation_Reward;
         uint8 Vote_Type;
         uint8 Register_Type;
         address OffChain_Vote_Delegation;   // Delegation in charge of filling in on chain the result of the off-chain vote
         address Assembly_Associated_Delegation;    // Delegation allowed to take part in the Agora Assembly in charge of voting for the good proposition
     }*/
     
     /*struct Register_Parameters{
         uint Index; // index in Registers_Address_List array
         uint8 Register_Type;
         mapping(uint=>Referendum_Parameters) Parameter_Versions;
         uint Actual_Version;
     }*/
     
     /*struct Delegation_Parameters{
         //uint Index;
         //uint Revert_Penalty_Limit;
         uint Legislatif_Process_Version;
         uint Internal_Governance_Version;
         uint Member_Max_Token_Usage;
         uint Law_Initialisation_Price;
         uint FunctionCall_Price; 
         uint Proposition_Duration;
         uint Vote_Duration;
         uint Election_Duration;
         uint Law_Revertable_Period_Duration;
         uint Mandate_Duration;
         uint Immunity_Duration;
         uint16 Num_Max_Members;
         uint8 Revert_Proposition_Petition_Rate;
         uint8 New_Election_Petition_Rate;
         uint8 Revert_Penalty_Rate;
         EnumerableSet.AddressSet Controled_Register;
     }*/
     
     event Register_Parameters_Modified(address);
     
     Agora public Agora_Instance;
     Citizens_Register public Citizen_Instance;
     DemoCoin public Democoin;
     IVote public majority_judgment_ballot;
     //address public Citizens_Address;
     
     address public Transitional_Government;
     
     //mapping(address=>Constitution_Register.Register_Parameters)  Registers;
     EnumerableSet.AddressSet Registers_Address_List;
     
     //mapping(address=>Constitution_Delegation.Delegation_Parameters) Delegations;
    EnumerableSet.AddressSet Delegation_Address_List;
    
     
     address public Citizen_Registering_Address;
 
     
     
     //uint8 public Account_Max_Token_Rate;  //Each account can't pocess more than "Account_Max_Token_Rate"% of the entire token supply.
     
     
     constructor(address transition_government, address[] memory initial_citizens, string memory Token_Name, string memory Token_Symbole, uint[] memory initial_citizens_token_amount, uint new_citizen_mint_amount){
         require(transition_government !=address(0));
         
         Constitution_Address = address(this);
         //Type_Institution = Institution_Type.CONSTITUTION;
         Democoin = new DemoCoin(Token_Name, Token_Symbole, initial_citizens, initial_citizens_token_amount);
         
         Citizen_Instance = new Citizens_Register(initial_citizens, address(Democoin), new_citizen_mint_amount);
         Agora_Instance = new Agora(address(Democoin), address(Citizen_Instance));
         
         //majority_judgment_ballot = new majority_judgment_ballot();
         //Citizens_Address = Constitution_Register.Create_Citizens(initial_citizens);
         
         Transitional_Government = transition_government;
         Register_Authorities.add(Transitional_Government);
         Register_Authorities.add(address(Agora_Instance));
         
     }
     
     
     function End_Transition_Government()external{
         require(msg.sender == Transitional_Government, "Transitional_Government only");
         Register_Authorities.remove(Transitional_Government);
     }
     
     
     
    /*FUNCTIONCALL API functions*/
    
    function Set_Citizen_Mint_Amount(uint amount) external Register_Authorities_Only{
        Citizen_Instance.Set_Citizen_Mint_Amount(amount);
    }
    
    function Set_Minnter(address[] calldata Add_Minter, address[] calldata Remove_Minter)external Register_Authorities_Only{
        uint add_len=Add_Minter.length;
        uint remove_len = Remove_Minter.length;
        for(uint i =0; i<add_len;i++){
            Democoin.Add_Minter(Add_Minter[i]);
        }
        for(uint j=0; j<remove_len; j++){
            Democoin.Remove_Minter(Remove_Minter[j]);
        }
    }
    
    function Set_Burner(address[] calldata Add_Burner, address[] calldata Remove_Burner)external Register_Authorities_Only{
        uint add_len=Add_Burner.length;
        uint remove_len = Remove_Burner.length;
        for(uint i =0; i<add_len;i++){
            Democoin.Add_Burner(Add_Burner[i]);
        }
        for(uint j=0; j<remove_len; j++){
            Democoin.Remove_Burner(Remove_Burner[j]);
        }
    }
    
    
    /*Citizens_Register  Handling*/
    
    function Citizen_Register_Remove_Authority(address removed_authority) external Register_Authorities_Only{
        Citizen_Instance.Remove_Authority(removed_authority);
    }
    
    function Add_Registering_Authority(address new_authority)external Register_Authorities_Only{
        Citizen_Instance.Add_Registering_Authority(new_authority);
     }
     
     /*function Remove_Registering_Authority(address removed_authority)external Register_Authorities_Only{
         Citizen_Instance.Remove_Registering_Authority(removed_authority);
     }*/
     
     function Add_Banning_Authority(address new_authority)external Register_Authorities_Only{
         Citizen_Instance.Add_Banning_Authority(new_authority);
     }
     
     /*function Remove_Banning_Authority(address removed_authority)external Register_Authorities_Only{
         Citizen_Instance.Remove_Banning_Authority(removed_authority);
     }*/
    
    
    
    /*Register/Agora Handling*/
    function Create_Register(uint8 register_type, uint[7] calldata Uint256_Arg, uint16 Assembly_Max_Members, uint8[6] calldata Uint8_Arg, address Assembly_Associated_Delegation, address Ivote_address)
    external Register_Authorities_Only{ //returns(bool, bytes memory){
        
        
        address new_register_address;
        
        if(register_type == 0){ 
            new_register_address = address(this);
        }else if(register_type == 1){
            /*Register new_register = new Loi();
            new_register_address= address(new_register);
            new_register.Add_Authority(address(Agora_Instance));*/
            
            new_register_address = Constitution_Register.Create_Loi(address(Agora_Instance));
        }else if(register_type == 2){
            
        }else{
            //return (false, bytes("Not Register Type"));
            revert("Not Register Type");
        }
        
        if(Assembly_Associated_Delegation != address(0) && !Delegation_Address_List.contains(Assembly_Associated_Delegation)){
            //return (false, bytes("Delegation doesn't exist"));
            revert("Delegation doesn't exist");
        }
        
        Registers_Address_List.add(new_register_address);
     
        Agora_Instance.Create_Register_Referendum(new_register_address, register_type);
        _Set_Register_Param( new_register_address, Uint256_Arg, Assembly_Max_Members, Uint8_Arg, Assembly_Associated_Delegation, Ivote_address);
         
         
         //Registers[new_register_address].Register_Type = register_type;
         //Registers[new_register_address].Actual_Version = 1;
         emit Register_Parameters_Modified(new_register_address);
         
        //return (true, bytes(""));
        //return Registers[new_register_address]._Set_Register_Param(new_register_address, Uint256_Arg, Uint16_Arg, Uint8_Arg, OffChain_Vote_Delegation, Assembly_Associated_Delegation);
    }
    
    function Set_Register_Param(address register_address, uint[7] calldata Uint256_Arg, uint16 Assembly_Max_Members, uint8[6] calldata Uint8_Arg, address Assembly_Associated_Delegation, address Ivote_address) 
    external Register_Authorities_Only{ //returns(bool, bytes memory){
        //uint version = Registers[register_address].Actual_Version;
    
        require(Registers_Address_List.contains(register_address), "Register doesn't exist");
        
        /*if( Delegations[Assembly_Associated_Delegation].Num_Max_Members ==0 && Assembly_Associated_Delegation != address(0)){
            //return (false, bytes("Delegation doesn't exist"));
            revert("Delegation doesn't exist");
        }*/
        
      
        _Set_Register_Param(register_address, Uint256_Arg, Assembly_Max_Members, Uint8_Arg, Assembly_Associated_Delegation, Ivote_address);
         
        emit Register_Parameters_Modified(register_address);
        //return (success, data);
        //return Registers[register_address]._Set_Register_Param( Uint256_Arg, Assembly_Max_Members, Uint8_Arg, OffChain_Vote_Delegation, Assembly_Associated_Delegation);
       
    }
    
     function _Set_Register_Param(address register_address, uint[7] calldata Uint256_Arg, uint16 Assembly_Max_Members, uint8[6] calldata Uint8_Arg,  address Assembly_Associated_Delegation, address Ivote_address) 
     internal {//returns(bool, bytes memory){
        //uint version =register.Actual_Version;
        
        if(Uint256_Arg[0] ==0 || Uint256_Arg[1] ==0 || Uint256_Arg[3]==0 || Uint8_Arg[0] == 0 || Uint8_Arg[0] >100 || Uint8_Arg[1]>100 || Ivote_address==address(0)){
            //return (false, bytes("Bad arguments value"));
            revert("Bad arguments value");
        }
        
    
        //uint temp = uint(Uint8_Arg[3]).add(uint(Uint8_Arg[4]).add(uint(Uint8_Arg[5]).add(uint(Uint8_Arg[6]))));
        if(uint(Uint8_Arg[2]).add(uint(Uint8_Arg[3]).add(uint(Uint8_Arg[4]).add(uint(Uint8_Arg[5])))) != 100 || (Assembly_Max_Members ==0 && Uint8_Arg[4]>0) || Uint8_Arg[1]>100 || (Assembly_Associated_Delegation != address(0) && Uint8_Arg[1]==0)){
            //return (false, bytes("Reward inconsistency"));
            revert("Reward inconsistency");
        }
        
        
        Agora_Instance.Update_Register_Referendum_Parameters(register_address,Uint256_Arg, Assembly_Max_Members, Uint8_Arg, Assembly_Associated_Delegation, Ivote_address);
        //Registers[register_param].Set_Register(Uint256_Arg,  Uint16_Arg, Uint8_Arg,  OffChain_Vote_Delegation,  Assembly_Associated_Delegation);
       
    }
    
    
    
    
    
     /*Delegations Handling*/
     
   function Create_Delegation(address delegation_address, uint[6] calldata Uint256_Legislatifs_Arg, uint[5] calldata Uint256_Governance_Arg, 
         uint16 Num_Max_Members, uint8 Revert_Proposition_Petition_Rate, uint8 Revert_Penalty_Rate, 
         uint8 New_Election_Petition_Rate, address[] memory Initial_members, address Ivote_address_legislatif, address Ivote_address_governance)
         external Register_Authorities_Only {

            if(Uint256_Legislatifs_Arg[3]==0 || Uint256_Legislatifs_Arg[4]==0 || Revert_Proposition_Petition_Rate>100 || Revert_Penalty_Rate>100 || Ivote_address_legislatif==address(0)){
                 //return(false, bytes("Bad Argument Value"));
                 revert("Legislatif: Bad Argument Value");
             }
             
             if(Uint256_Governance_Arg[0]==0 || Uint256_Governance_Arg[1]==0 || Num_Max_Members==0 || New_Election_Petition_Rate ==0 || New_Election_Petition_Rate>100 || Initial_members.length <= Num_Max_Members || Ivote_address_governance==address(0)){
                 //return(false, bytes("Bad Argument Value"));
                 revert("Governance: Bad Argument Value");
             }
            
            
            if(delegation_address == address(0)){ //Create a new delegation
                 /*Delegation Delegation_Instance = new Delegation(Initial_members, address(Democoin));
                 delegation_address = address(Delegation_Instance);*/
                 for(uint i =0; i<Initial_members.length; i++){
                     require(Citizen_Instance.Contains(Initial_members[i]), "member is not citizen");
                 }
                 delegation_address = Constitution_Delegation.Create_Delegation( Initial_members, address(Democoin), address(Citizen_Instance), address(Agora_Instance));
            }else{
                require(!Delegation_Address_List.contains(delegation_address), "Delegation already registered");
                //return(false,bytes("Delegation already registered"));
            }
            
            

            Delegation(delegation_address).Update_Legislatif_Process(Uint256_Legislatifs_Arg[0], Uint256_Legislatifs_Arg[1], Uint256_Legislatifs_Arg[2], Uint256_Legislatifs_Arg[3], Uint256_Legislatifs_Arg[4], Uint256_Legislatifs_Arg[5], Revert_Proposition_Petition_Rate, Revert_Penalty_Rate, Ivote_address_legislatif);
            Delegation(delegation_address).Update_Internal_Governance(Uint256_Governance_Arg[0], Uint256_Governance_Arg[1], Uint256_Governance_Arg[2], Uint256_Governance_Arg[3], Num_Max_Members, New_Election_Petition_Rate, Ivote_address_governance);
            
            //Delegations[delegation_address]._Set_Delegation_Legislatif_Process(Uint256_Legislatifs_Arg[0], Uint256_Legislatifs_Arg[1], Uint256_Legislatifs_Arg[2], Uint256_Legislatifs_Arg[3], Uint256_Legislatifs_Arg[4], Uint256_Legislatifs_Arg[5], Revert_Proposition_Petition_Rate, Revert_Penalty_Rate);
            //Delegations[delegation_address]._Set_Delegation_Internal_Governance(Uint256_Governance_Arg[0], Uint256_Governance_Arg[1], Uint256_Governance_Arg[2], Num_Max_Members, New_Election_Petition_Rate);
            
            Delegation_Address_List.add(delegation_address);
            
            if(Uint256_Governance_Arg[4]>0){
                Democoin.Mint(delegation_address, Uint256_Governance_Arg[3]);
            }
         }
         
         /* 0x0000000000000000000000000000000000000000, [15,5,1, 1000, 2000, 500], [1000, 10000,3000, 40] 20, 30, 20, 50*/

         
    function Add_Delegation_Controled_Register(address delegation_address, address new_controled_register) external{
        require(Delegation_Address_List.contains(delegation_address), "Non Existing Delegation");
        require(Registers_Address_List.contains(new_controled_register), "Non Existing Register");
        Register(new_controled_register).Add_Authority(delegation_address);  //Add the delegation address to the authority list of registers whose address is in "add_controled_register"
        Delegation(delegation_address).Add_Controled_Register( new_controled_register);    
    
    }
    
    
    function Remove_Delegation_Controled_Register(address delegation_address, address removed_controled_register) external{
        require(Delegation_Address_List.contains(delegation_address), "Non Existing Delegation");
        require(Registers_Address_List.contains(removed_controled_register), "Non Existing Register");
        Delegation(delegation_address).Remove_Controled_Register( removed_controled_register);
        //The removal of the delegation address from the authority list of registers whose address is in "remove_controled_register" is left to the delegation.
    }
     
    
    function Set_Delegation_Legislatif_Process(address delegation_address, uint Member_Max_Token_Usage, uint Law_Initialisation_Price, uint FunctionCall_Price, uint Proposition_Duration,
         uint Vote_Duration, uint Law_Revertable_Period_Duration, uint8 Revert_Proposition_Petition_Rate, 
         uint8 Revert_Penalty_Rate, address Ivote_address) 
         external Register_Authorities_Only{ //returns(bool, bytes memory){
             
             require(Delegation_Address_List.contains(delegation_address), "Non Existing Delegation");
             
             if(Proposition_Duration==0 || Vote_Duration==0 || Revert_Proposition_Petition_Rate>100 || Revert_Penalty_Rate>100 ){
                 //return(false, bytes("Bad Argument Value"));
                 revert("Bad Argument Value");
             }
             
             Delegation(delegation_address).Update_Legislatif_Process(Member_Max_Token_Usage, Law_Initialisation_Price, FunctionCall_Price, Proposition_Duration, Vote_Duration, Law_Revertable_Period_Duration, Revert_Proposition_Petition_Rate, Revert_Penalty_Rate, Ivote_address);
             //Delegations[delegation_address]._Set_Delegation_Legislatif_Process(Member_Max_Token_Usage, Law_Initialisation_Price, FunctionCall_Price, Proposition_Duration, Vote_Duration, Law_Revertable_Period_Duration, Revert_Proposition_Petition_Rate, Revert_Penalty_Rate);
         }
         
         
         
    function Set_Delegation_Internal_Governance(address delegation_address, uint Election_Duration, uint Mandate_Duration, uint Immunity_Duration, uint Validation_Duration,
        uint16 Num_Max_Members, uint8 New_Election_Petition_Rate, uint Mint_Token, address Ivote_address) external Register_Authorities_Only{
            require(Delegation_Address_List.contains(delegation_address), "Non Existing Delegation");
            
            if(Election_Duration==0 || Mandate_Duration==0 || Num_Max_Members==0 || New_Election_Petition_Rate ==0 || New_Election_Petition_Rate>100 ){
                 revert("Bad Argument Value");
             }
            
            if(Mint_Token>0){
                 Democoin.Mint(delegation_address, Mint_Token);
             }
            
            Delegation(delegation_address).Update_Internal_Governance(Election_Duration, Validation_Duration, Mandate_Duration, Immunity_Duration, Num_Max_Members, New_Election_Petition_Rate, Ivote_address);
         }
         
         
         
        
        /*function _Set_Delegation_Legislatif_Process( uint Member_Max_Token_Usage, uint Law_Initialisation_Price, uint FunctionCall_Price, uint Proposition_Duration,
         uint Vote_Duration, uint Law_Revertable_Period_Duration, uint8 Revert_Proposition_Petition_Rate, uint8 Revert_Penalty_Rate) external{ //returns(bool, bytes memory){
             
             if(Proposition_Duration==0 || Vote_Duration==0 || Revert_Proposition_Petition_Rate>100 || Revert_Penalty_Rate>100 ){
                 //return(false, bytes("Bad Argument Value"));
                 revert("Bad Argument Value");
             }
             
             //if(Revert_Penalty_Rate>0 && Percentage(Revert_Penalty_Rate, FunctionCall_Price))
             
             delegation.Legislatif_Process_Version = delegation.Legislatif_Process_Version.add(1);
             
             delegation.Member_Max_Token_Usage = Member_Max_Token_Usage;
             delegation.Law_Initialisation_Price = Law_Initialisation_Price;
             delegation.FunctionCall_Price = FunctionCall_Price;
             delegation.Proposition_Duration = Proposition_Duration;
             delegation.Vote_Duration = Vote_Duration;
             delegation.Law_Revertable_Period_Duration = Law_Revertable_Period_Duration;
             
             delegation.Revert_Proposition_Petition_Rate = Revert_Proposition_Petition_Rate;
             delegation.Revert_Penalty_Rate = Revert_Penalty_Rate; 
            
            //return (true,bytes(""));
         }
         

          function _Set_Delegation_Internal_Governance( uint Election_Duration, uint Mandate_Duration, uint Immunity_Duration,
        uint16 Num_Max_Members, uint8 New_Election_Petition_Rate) external{ // returns(bool, bytes memory){
             
             if(Election_Duration==0 || Mandate_Duration==0 || Num_Max_Members==0 || New_Election_Petition_Rate ==0 || New_Election_Petition_Rate>100 ){
                 //return(false, bytes("Bad Argument Value"));
                 revert("Bad Argument Value");
             }
             
             delegation.Internal_Governance_Version = delegation.Internal_Governance_Version.add(1);
             
             delegation.Election_Duration = Election_Duration;
             delegation.Mandate_Duration = Mandate_Duration;
             delegation.Immunity_Duration = Immunity_Duration;
             delegation.Num_Max_Members = Num_Max_Members;
             delegation.New_Election_Petition_Rate = New_Election_Petition_Rate;
             
            
            //return (true,bytes(""));
         }*/
    
     
     
     
     /*GETTERS*/
     
     function Get_Register_List() external view returns(bytes32[] memory){
         return Registers_Address_List._inner._values;
     }
     
     /*function Get_Register_Parameter(address register) external view override returns(uint,uint){
         
         return (Registers[register].Actual_Version, Registers[register].Register_Type);
     }
     
     function Get_Register_Referendum_Parameters(address register) external view override returns(uint[7] memory Uint256_Arg, uint16 Assembly_Max_Members, uint8[7] memory Uint8_Arg, address OffChain_Vote_Delegation, address Assembly_Associated_Delegation){
             
             (Uint256_Arg, Assembly_Max_Members, Uint8_Arg, OffChain_Vote_Delegation, Assembly_Associated_Delegation)=Registers[register].Get_Register();
             
         }
         
         
    function Get_Delegation_Legislatif_Process_Versions(address delegation_address) external view override returns(uint){
        require(Delegations[delegation_address].Legislatif_Process_Version != 0, "Non existing Delegation");
        return(Delegations[delegation_address].Legislatif_Process_Version);
    }
    
    function Get_Delegation_Internal_Governance_Versions(address delegation_address) external view override returns(uint){
        require(Delegations[delegation_address].Legislatif_Process_Version != 0, "Non existing Delegation");
        return( Delegations[delegation_address].Internal_Governance_Version);
    }
    
    function Get_Delegation_Legislation_Process(address delegation_address) external view override returns(uint[6] memory Uint256_Arg, uint8 Revert_Proposition_Petition_Rate, 
         uint8 Revert_Penalty_Rate){
             require(Delegations[delegation_address].Legislatif_Process_Version != 0, "Non existing Delegation");
             return Delegations[delegation_address]._Get_Delegation_Legislatif_Process();
         }
         
    
    
    function Get_Delegation_Internal_Governance(address delegation_address) external view override returns(uint Election_Duration, uint Mandate_Duration, uint Immunity_Duration,
        uint16 Num_Max_Members, uint8 New_Election_Petition_Rate){
            require(Delegations[delegation_address].Legislatif_Process_Version != 0, "Non existing Delegation");
            return Delegations[delegation_address]._Get_Delegation_Internal_Governance();
        }
     */
     function Get_Delegation_List() external view returns(bytes32[] memory){
         return Delegation_Address_List._inner._values;
     }
     
    
     
     
    
 }
 
 
 /*
 
 [777,333,123,33,12,77,40]
 20
 [30,3,20,30,30,20,0]
 
 */
 
 
 
/* contract Agora is Institution{
    using EnumerableSet for EnumerableSet.AddressSet;
    enum Status{
        PETITIONS,
        VOTE,
        VOTE_CHECKING,
        EXECUTED,
        ABORTED
    }
    
    
    
    struct Register_Referendum{
        uint Last_Version;
        Institution_Type Type;
        bytes32[] Failed_Referendums;
        EnumerableSet.Bytes32Set Pending_Referendums;
        bytes32[] Achieved_Referendums;
    }

    
    
    struct Referendum{
        mapping(address=>bool) Petition;
        EnumerableSet.AddressSet Assembly_Volunteer;
        uint Petition_Counter;
        Status Referendum_Status;
    }
    

    Constitution Constitution_Instance;
    
    mapping(address=>Register_Referendum) Registers_Referendums;
    mapping(bytes32=>Referendum) Referendums;
    
    function Add_Law_Project(address register_address, bytes calldata Title, bytes calldata Description)external{
        Constitution_Instance.Get_Register(register_address);
        //Add_Law_Project(Title,  Description);
    }
    
    
    
    
    
    /*Overite functions*/
    /*function Before_Add_Law_Project(bytes calldata Title, bytes calldata Description) internal override returns(bytes32){
        
    }
    
    function Before_Add_Corpus_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) internal override{
        
    }
    
    function Before_Add_Item_Proposal(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) internal override{
        
    }*/
//}