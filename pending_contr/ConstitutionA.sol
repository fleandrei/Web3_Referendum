pragma solidity ^0.8.0;

import "Register.sol";
import "Agora.sol";
import "Loi.sol";

 contract Constitution is Register{
     using EnumerableSet for EnumerableSet.AddressSet;
     using SafeMath for uint;
     struct Register_Referendum_Parameters{
         uint Index;
         uint Petition_Duration;
         uint Vote_Duration;
         uint Law_Initialisation_Price;
         uint FunctionCall_Price;
         uint Voters_Reward_Rate;
         uint Helper_Reward;
         uint16 Assembly_Max_Members;
         uint16 Description_Max_Size;
         uint8 FunctionCall_Max_Size;
         uint8 Required_Petition_Rate;
         uint8 Representatives_Rates;
         uint8 Register_Type;
         address OffChain_Vote_Delegation;
         address Associated_Delegation;
     }
     
     struct Delegation_Parameters{
         uint Index;
         uint Revert_Penalty_Limit;
         uint Mandate_Duration;
         uint Immunity_Duration;
         uint16 Num_Max_Members;
         uint8 Revert_Proposition_Petition_Rate;
         uint8 New_Vote_Petition_Rate;
         uint8 Revert_Penalty_Rate;
         address[] Associated_Institutions;
         
     }
     
    
     address public Transitional_Government;
     
     mapping(address=>Register_Referendum_Parameters) Registers;
     address[] Registers_Address_List;
     
     mapping(address=>Delegation_Parameters) Delegations;
     address[] Delegation_Address_List;
     
     Agora Agora_Instance;
     
     constructor(address transition_government){
         
         Type_Institution = Institution_Type.CONSTITUTION;
         
         Transitional_Government = transition_government;
         Register_Authorities.add(Transitional_Government);
         
         
     }
     
     function End_Transition_Government()external{
         require(msg.sender == Transitional_Government, "Transitional_Government only");
         Register_Authorities.remove(Transitional_Government);
     }
     
     
     
     function Check_Function_Call(bytes memory Data) public override view returns(bool){
         
     }
     
     
     /*FUNCTIONCALL API functions*/
     
    /*function Add_Register(uint Petition_Duration, 
        uint Vote_Duration, uint Law_Initialisation_Price, uint FunctionCall_Price, 
        uint Voters_Reward_Rate, uint Helper_Reward, uint16 Assembly_Max_Members, 
        uint16 Description_Max_Size, uint8 FunctionCall_Max_Size, uint8 Required_Petition_Rate, 
        uint8 Representatives_Rates, uint8 Register_Type) external Register_Authorities_Only {
        }*/
        
     function Add_Register(uint[6] calldata Uint256_Arg, uint16[2] calldata Uint16_Arg, uint8[4] calldata Uint8_Arg) external Register_Authorities_Only {
         Register new_register;
         if(Uint8_Arg[3] ==0){
             new_register = new Loi(address(Agora_Instance));
         }
         
         address new_register_address = address(new_register);
         Registers_Address_List.push(new_register_address);
         Registers[new_register_address].Index = Registers_Address_List.length.sub(1);
         _Set_Register_Param(new_register_address, Uint256_Arg, Uint16_Arg, Uint8_Arg);
         
     }
    
    function _Set_Register_Param(address register_param, uint[6] calldata Uint256_Arg, uint16[2] calldata Uint16_Arg, uint8[4] calldata Uint8_Arg) internal{
        Registers[register_param].Petition_Duration = Uint256_Arg[0];
        Registers[register_param].Vote_Duration = Uint256_Arg[1];
        Registers[register_param].Law_Initialisation_Price = Uint256_Arg[2];
        Registers[register_param].FunctionCall_Price = Uint256_Arg[3];
        Registers[register_param].Voters_Reward_Rate = Uint256_Arg[4];
        Registers[register_param].Helper_Reward = Uint256_Arg[5];
        
        Registers[register_param].Assembly_Max_Members = Uint16_Arg[0];
        Registers[register_param].Description_Max_Size = Uint16_Arg[1];
        
        Registers[register_param].FunctionCall_Max_Size = Uint8_Arg[0];
        Registers[register_param].Required_Petition_Rate = Uint8_Arg[1];
        Registers[register_param].Representatives_Rates = Uint8_Arg[2];
        Registers[register_param].Register_Type = Uint8_Arg[3];
    }
    
    function Add_Delegation(uint Revert_Penalty_Limit, uint Mandate_Duration, uint Immunity_Duration,
         uint16 Num_Max_Members, uint8 Revert_Proposition_Petition_Rate, uint8 New_Vote_Petition_Rate,
         uint8 Revert_Penalty_Rate) external{
             
         }
        
     
     
     
     
     /*GETTERS*/
     
     function Get_Register_List() external view returns(address[] memory){
         return Registers_Address_List;
     }
     
     function Get_Register_Parameter(address register) external view returns(Register_Referendum_Parameters memory){
         return Registers[register];
     }
     
     function Get_Delegation_List() external view returns(address[] memory){
         return Delegation_Address_List;
     }
     
     function Get_Delegation_Parameter(address delegation) external view returns(Delegation_Parameters memory){
         return Delegations[delegation];
     }
 }