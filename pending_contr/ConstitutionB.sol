pragma solidity ^0.8.0;

import "Register.sol";
import "Agora.sol";
import "Loi.sol";

 contract Constitution is Register{
     using EnumerableSet for EnumerableSet.AddressSet;
     using SafeMath for uint;
     using SafeMath for uint8;
     
     struct Referendum_Parameters{
          // index in Registers_Address_List array
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
         //bool Version_Finished;              //Whether the Register_Parameters is finishd or in consruction. If finished, it can't be modified anymore. To change the parameters, you have to add a new version 
         address OffChain_Vote_Delegation;   // Delegation in charge of filling in on chain the result of the off-chain vote
         address Assembly_Associated_Delegation;    // Delegation allowed to take part in the Agora Assembly in charge of voting for the good proposition
     }
     
     struct Register_Parameters{
         uint Index; // index in Registers_Address_List array
         uint8 Register_Type;
         mapping(uint=>Referendum_Parameters) Parameter_Versions;
         uint Actual_Version;
     }
     
     struct Delegation_Parameters{
         uint Index;
         uint Revert_Penalty_Limit;
         uint Member_Max_Token_Usage;
         uint Mandate_Duration;
         uint Immunity_Duration;
         uint16 Num_Max_Members;
         uint8 Revert_Proposition_Petition_Rate;
         uint8 New_Election_Petition_Rate;
         uint8 Revert_Penalty_Rate;
         EnumerableSet.AddressSet Associated_Institutions;
     }
     
     event Register_Parameters_Modified(address, uint);
     
     Agora Agora_Instance;
     
     address public Transitional_Government;
     
     mapping(address=>Register_Parameters)  Registers;
     address[] Registers_Address_List;
     
     mapping(address=>Delegation_Parameters) Delegations;
     address[] Delegation_Address_List;
     
     address public DemoCoin_Address;
     uint public New_Citizen_Mint_Amount;  //Each new citizen get "New_Citizen_Mint_Amount" token that are mint.
     uint8 public Account_Max_Token_Rate;  //Each account can't pocess more than "Account_Max_Token_Rate"% of the entire token supply.
     
     constructor(address transition_government){
         
         Type_Institution = Institution_Type.CONSTITUTION;
         
         Transitional_Government = transition_government;
         Register_Authorities.add(Transitional_Government);
     }
     
     
     function End_Transition_Government()external{
         require(msg.sender == Transitional_Government, "Transitional_Government only");
         Register_Authorities.remove(Transitional_Government);
     }
     
     
    
    function Create_Register(uint8 register_type, uint[7] calldata Uint256_Arg, uint16[2] calldata Uint16_Arg, uint8[8] calldata Uint8_Arg, address OffChain_Vote_Delegation, address Assembly_Associated_Delegation)
    external Register_Authorities_Only returns(bool, bytes memory){
        
        Register new_register;
        address new_register_address;
        
        if(register_type == 0){ 
            new_register_address = address(this);
        }else if(register_type ==1){
            new_register = new Loi(address(Agora_Instance));
            new_register_address= address(new_register);
        }else if(register_type == 2){
            
        }else{
            return (false, bytes("Not Register Type"));
        }
         
          
         Registers_Address_List.push(new_register_address);
         Registers[new_register_address].Index = Registers_Address_List.length.sub(1);
         Registers[new_register_address].Register_Type = register_type;
         
        return _Set_Register_Param(new_register_address, Uint256_Arg, Uint16_Arg, Uint8_Arg, OffChain_Vote_Delegation, Assembly_Associated_Delegation);
    }
    
    function Set_Register_Param(address register_param, uint[7] calldata Uint256_Arg, uint16[2] calldata Uint16_Arg, uint8[8] calldata Uint8_Arg, address OffChain_Vote_Delegation, address Assembly_Associated_Delegation) 
    external Register_Authorities_Only returns(bool, bytes memory){
        uint version = Registers[register_param].Actual_Version;
        if( Registers[register_param].Parameter_Versions[version].Petition_Duration == 0){
            return(false, bytes("Register doesn't exist"));
        }
        
        Registers[register_param].Actual_Version = version.add(1);
        
        return _Set_Register_Param(register_param, Uint256_Arg, Uint16_Arg, Uint8_Arg, OffChain_Vote_Delegation, Assembly_Associated_Delegation);
    }
    
    function _Set_Register_Param(address register_param, uint[7] calldata Uint256_Arg, uint16[2] calldata Uint16_Arg, uint8[8] calldata Uint8_Arg, address OffChain_Vote_Delegation, address Assembly_Associated_Delegation) internal returns(bool, bytes memory){
        uint version = Registers[register_param].Actual_Version;
        
        if(Uint256_Arg[0] ==0 || Uint256_Arg[1] ==0 || Uint256_Arg[3]==0 || Uint8_Arg[1] == 0 || Uint8_Arg[1] >100){
            return (false, bytes("Bad arguments value"));
        }
        
    
        uint temp = uint(Uint8_Arg[3]).add(uint(Uint8_Arg[4]).add(uint(Uint8_Arg[5]).add(uint(Uint8_Arg[6]))));
        if(temp != 100 || (OffChain_Vote_Delegation == address(0) && Uint8_Arg[6] >0) || (Uint16_Arg[0] ==0 && Uint8_Arg[5]>0) || Uint8_Arg[2]>100 || (Assembly_Associated_Delegation != address(0) && Uint8_Arg[2]==0)){
            return (false, bytes("Reward inconsistency"));
        }
        
        if( (!Delegations[OffChain_Vote_Delegation].Associated_Institutions.contains(address(Agora_Instance)) && OffChain_Vote_Delegation != address(0)) || (Delegations[Assembly_Associated_Delegation].Num_Max_Members ==0 && Assembly_Associated_Delegation != address(0)) ){
            return (false, bytes("Delegation doesn't exist"));
        }
        
        Registers[register_param].Parameter_Versions[version].Petition_Duration = Uint256_Arg[0];
        Registers[register_param].Parameter_Versions[version].Vote_Duration = Uint256_Arg[1];
        Registers[register_param].Parameter_Versions[version].Vote_Checking_Duration = Uint256_Arg[2];
        Registers[register_param].Parameter_Versions[version].Helper_Max_Duration = Uint256_Arg[3];
        Registers[register_param].Parameter_Versions[version].Law_Initialisation_Price = Uint256_Arg[4];
        Registers[register_param].Parameter_Versions[version].FunctionCall_Price = Uint256_Arg[5];
        Registers[register_param].Parameter_Versions[version].Helper_Amount_Escrow = Uint256_Arg[6];
        
        Registers[register_param].Parameter_Versions[version].Assembly_Max_Members = Uint16_Arg[0];
        Registers[register_param].Parameter_Versions[version].Description_Max_Size = Uint16_Arg[1];
        
        Registers[register_param].Parameter_Versions[version].FunctionCall_Max_Number = Uint8_Arg[0];
        Registers[register_param].Parameter_Versions[version].Required_Petition_Rate = Uint8_Arg[1];
        Registers[register_param].Parameter_Versions[version].Representatives_Rates = Uint8_Arg[2];
        Registers[register_param].Parameter_Versions[version].Voters_Reward_Rate = Uint8_Arg[3];
        Registers[register_param].Parameter_Versions[version].Helper_Reward_Rate = Uint8_Arg[4];
        Registers[register_param].Parameter_Versions[version].Assembly_Voluteer_Reward_Rate = Uint8_Arg[5];
        Registers[register_param].Parameter_Versions[version].OffChain_Delegation_Reward = Uint8_Arg[6];
        Registers[register_param].Parameter_Versions[version].Vote_Type = Uint8_Arg[7];
        
        Register_Parameters_Modified(register_param, version);
        
        return (true, bytes(""));
    }
     
     /*FUNCTIONCALL API functions*/
     
    /*function Add_Register(uint Petition_Duration, 
        uint Vote_Duration, uint Law_Initialisation_Price, uint FunctionCall_Price, 
        uint Voters_Reward_Rate, uint Helper_Reward, uint16 Assembly_Max_Members, 
        uint16 Description_Max_Size, uint8 FunctionCall_Max_Size, uint8 Required_Petition_Rate, 
        uint8 Representatives_Rates, uint8 Register_Type) external Register_Authorities_Only {
        }*/
        
        
        
    /* function Add_Register(uint[6] calldata Uint256_Arg, uint16[2] calldata Uint16_Arg, uint8[5] calldata Uint8_Arg) external Register_Authorities_Only {
         Register new_register;
         if(Uint8_Arg[3] ==0){
             new_register = new Loi(address(Agora_Instance));
         }
         
         address new_register_address = address(new_register);
         Registers_Address_List.push(new_register_address);
         Registers[new_register_address][0].Index = Registers_Address_List.length.sub(1);
        // _Set_Register_Param(new_register_address, Uint256_Arg, Uint16_Arg, Uint8_Arg);
         
     }
     */
     
    
    
    
   
   /* function Set_Petition(address register_address, uint Petition_Duration, uint8 Required_Petition_Rate)external Register_Authorities_Only returns(bool, bytes memory){
        bool test;
        uint version;
        (test,version) = Registers[register_address].length.trySub(1); //Check if register_address is registered in "Registers"
        if(!test){
            return (false, bytes("Register doesn't exist"));
        }
         
        if(Registers[register_address][version].Version_Finished){
            Registers[register_address].push();
            version.add(1);
        }
        
        if(Petition_Duration ==0 || Required_Petition_Rate == 0 || Required_Petition_Rate >100){
            return (false, bytes("Bad arguments"));
        }
        Registers[register_address][version].Petition_Duration = Petition_Duration;
        Registers[register_address][version].Required_Petition_Rate = Required_Petition_Rate;
        
        return (true, bytes(""));
    }
    
    function Set_Propositions(address register_address, uint Law_Initialisation_Price, uint FunctionCall_Price, uint16 Description_Max_Size, uint8 FunctionCall_Max_Number ) 
    external Register_Authorities_Only returns(bool, bytes memory){
        bool test;
        uint version;
        (test,version) = Registers[register_address].length.trySub(1);
        if(!test){
            return (false, bytes("Register doesn't exist"));
        }
        
        if(Registers[register_address][version].Version_Finished){
            Registers[register_address].push();
            version.add(1);
        }
        Registers[register_address][version].Law_Initialisation_Price = Law_Initialisation_Price;
        Registers[register_address][version].FunctionCall_Price = FunctionCall_Price;
        Registers[register_address][version].Description_Max_Size = Description_Max_Size;
        Registers[register_address][version].FunctionCall_Max_Number = FunctionCall_Max_Number;
        
        return (true, bytes(""));
    }
    
    function Set_Rewards(address register_address, uint8 Voters_Reward_Rate, uint8 Helper_Reward_Rate, uint8 Assembly_Voluteer_Reward_Rate, uint8 OffChain_Delegation_Reward)
    external Register_Authorities_Only returns(bool, bytes memory){
        bool test;
        uint version;
        (test,version) = Registers[register_address].length.trySub(1);
        if(!test){
            return (false, bytes("Register doesn't exist"));
        }
        
        if(Registers[register_address][version].Version_Finished){
            Registers[register_address].push();
            version.add(1);
        }
            
        if(Registers[register_address][version].OffChain_Vote_Delegation == address(0) && OffChain_Delegation_Reward !=0){
            return (false, bytes("No Offchain vote"));
        }
        if(Registers[register_address][version].Assembly_Max_Members ==0 && Assembly_Voluteer_Reward_Rate != 0){
            return(false, bytes("No Assembly"));
        }
        
        uint temp = uint(Voters_Reward_Rate).add(uint(Helper_Reward_Rate).add(uint(Assembly_Voluteer_Reward_Rate).add(uint(OffChain_Delegation_Reward))));
        if(temp != 100){
            return (false, bytes("Reward inconsistency"));
        }
        
        Registers[register_address][version].Voters_Reward_Rate = Voters_Reward_Rate;
        Registers[register_address][version].Helper_Reward_Rate = Helper_Reward_Rate;
        Registers[register_address][version].Assembly_Voluteer_Reward_Rate = Assembly_Voluteer_Reward_Rate;
        Registers[register_address][version].OffChain_Delegation_Reward = OffChain_Delegation_Reward;
        
        return(true, bytes(""));
    }
    
    function Set_Vote(address register_address, address OffChain_Vote_Delegation, uint Vote_Duration, uint Vote_Checking_Duration, uint8 Vote_Type) 
    external Register_Authorities_Only returns(bool, bytes memory){
        bool test;
        uint version;
        (test,version) = Registers[register_address].length.trySub(1);
        if(!test){
            return (false, bytes("Register doesn't exist"));
        }
        //uint version = Registers[register_address].length.sub(1); 
        if(Registers[register_address][version].Version_Finished){
            Registers[register_address].push();
            version.add(1);
        }
        
        if(!Delegations[OffChain_Vote_Delegation].Associated_Institutions.contains(address(Agora_Instance)) && OffChain_Vote_Delegation != address(0)){
            return (false, bytes("OffChain Delegation doesn't exist"));
        }
        
        if(Vote_Duration == 0){
            return (false, bytes("Vote duration null"));
        }
        
        Registers[register_address][version].OffChain_Vote_Delegation = OffChain_Vote_Delegation;
        Registers[register_address][version].Vote_Duration = Vote_Duration;
        Registers[register_address][version].Vote_Checking_Duration = Vote_Checking_Duration;
        Registers[register_address][version].Vote_Type = Vote_Type;

        return (true, bytes(""));
    }
    
    function Set_Helper(address register_address, uint Helper_Max_Duration, uint Helper_Amount_Escrow )external Register_Authorities_Only returns(bool, bytes memory){
        bool test;
        uint version;
        (test,version) = Registers[register_address].length.trySub(1);
        if(!test){
            return (false, bytes("Register doesn't exist"));
        }

        if(Registers[register_address][version].Version_Finished){
            Registers[register_address].push();
            version.add(1);
        } 
        
        if(Helper_Max_Duration == 0){
            return (false, bytes("Helper duration null"));
        }
        
        Registers[register_address][version].Helper_Max_Duration = Helper_Max_Duration;
        Registers[register_address][version].Helper_Amount_Escrow = Helper_Amount_Escrow;
        
        return (false, bytes(""));
        
    }
    
    function Set_Assembly(address register_address, uint16 Assembly_Max_Members, uint8 Representatives_Rates, address Assembly_Associated_Delegation)external Register_Authorities_Only returns(bool, bytes memory){
        bool test;
        uint version;
        (test,version) = Registers[register_address].length.trySub(1);
        if(!test){
            return (false, bytes("Register doesn't exist"));
        }

        if(Registers[register_address][version].Version_Finished){
            Registers[register_address].push();
            version.add(1);
        } 
        
        if(Assembly_Associated_Delegation != address(0) && Delegations[Assembly_Associated_Delegation].Num_Max_Members ==0 ){
            return (false, bytes("Delegation doesn't exist"));
        }
        
        if(Representatives_Rates>100 || (Assembly_Associated_Delegation != address(0) && Representatives_Rates==0)){
            return (false, bytes("Bad arguments"));
        }
        
        Registers[register_address][version].Assembly_Max_Members = Assembly_Max_Members;
        Registers[register_address][version].Representatives_Rates = Representatives_Rates;
        Registers[register_address][version].Assembly_Associated_Delegation = Assembly_Associated_Delegation;
        
        return (true, bytes(""));
    }
    
    function Finish_Version(address register_address) external Register_Authorities_Only returns(bool, bytes memory){
        bool test;
        uint version;
        (test,version) = Registers[register_address].length.trySub(1);
        if(!test){
            return (false, bytes("Register doesn't exist"));
        }

        if(Registers[register_address][version].Version_Finished){
            return (false, bytes("Version already finished"));
        } 
        
         Registers[register_address][version].Version_Finished = true;
         return (true, bytes(""));
    }
    
    */
    
    function Add_Delegation(uint Revert_Penalty_Limit, uint Mandate_Duration, uint Immunity_Duration,
         uint16 Num_Max_Members, uint8 Revert_Proposition_Petition_Rate, uint8 New_Vote_Petition_Rate,
         uint8 Revert_Penalty_Rate) external Register_Authorities_Only{
             
         }
        
     
     
     
     
     /*GETTERS*/
     
     function Get_Register_List() external view returns(address[] memory){
         return Registers_Address_List;
     }
     
     /*function Get_Register_Parameter(address register) external view returns(uint, uint){
         return (Registers[register].Register_Type, Registers[register].Actual_Version);
     }*/
     
     function Get_Register(address register, uint version) external view returns(uint, uint,Referendum_Parameters memory){
         return (Registers[register].Register_Type, Registers[register].Actual_Version, Registers[register].Parameter_Versions[version]) ;
     }
     
     function Get_Delegation_List() external view returns(address[] memory){
         return Delegation_Address_List;
     }
     
     /*function Get_Delegation_Parameter(address delegation) external view returns(Delegation_Parameters memory){
         return Delegations[delegation];
     }*/
     
     
    /*function Check_Reward_Consistency(uint8 Voter_reward, uint8 Actual_Reward, uint8 Updated_Reward) internal pure returns(bool){
         if(Updated_Reward >100)
         uint8 temp = Voter_reward + Actual_Reward 
     }*/
 }