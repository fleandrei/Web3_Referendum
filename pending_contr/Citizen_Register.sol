// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "Register.sol";

contract Citizens_Register is Register{
     using EnumerableSet for EnumerableSet.AddressSet;
     using SafeMath for uint;
     
     struct Citizen{
         bool Active;
         uint Registration_Timestamps;
         uint End_Ban_Timestamp;
         bytes Data;
     }
     
     event New_Citizen(address citizen_address);
     event Citizen_Data_Set(address citizen_address);
     event Citizen_Banned(address citizen_address);
     event Citizen_Permanently_Banned(address citizen_address);
     event Citizen_Ban_Over(address citizen_address);
     
     mapping(address=>Citizen) public Citizens;
     EnumerableSet.AddressSet Citizens_List;
     address[] Permanently_Banned_Citizens;
     
     
     EnumerableSet.AddressSet Citizens_Registering_Authorities;
     EnumerableSet.AddressSet Citizens_Banning_Authorities;
     
    
     constructor(address[] memory Initial_Citizens){
         Type_Institution = Institution_Type.CITIZENS_REGISTRATION;
         Constitution_Address = msg.sender;
         
         uint citizens_number = Initial_Citizens.length;
         
         for(uint i =0; i<citizens_number; i++){
             Citizens[Initial_Citizens[i]].Active = true;
             Citizens_List.add(Initial_Citizens[i]);
         }
     }
     
     
     
     function Register_Citizen(address new_citizen) external{
         require(Citizens_Registering_Authorities.contains(msg.sender), "Registering Authority Only");
         require(Citizens[new_citizen].Registration_Timestamps ==0, "Already Registered/Ban Citizen");
         Citizens[new_citizen].Active = true;
         Citizens[new_citizen].Registration_Timestamps = block.timestamp;
         Citizens_List.add(new_citizen);
         
         emit New_Citizen(new_citizen);
     }
     
     /*function Register_Citizen(address new_citizen, bytes calldata data)external{
         require(msg.sender ==  Citizens_Registering_Authority, "Registering Authority Only");
         require(!Citizens_List.contains(new_citizen), "Already Registered Citizen");
         Citizens[new_citizen].Active = true;
         Citizens[new_citizen].Data = data;
         Citizens_List.add(new_citizen);
     }*/
     
     function Set_Citizen_Data(address citizen, bytes calldata data)external{
         require(Citizens_Registering_Authorities.contains(msg.sender), "Registering Authority Only");
         require(!Citizens_List.contains(citizen), "Already Registered Citizen");
         Citizens[citizen].Data = data;
         
         Citizen_Data_Set(citizen);
     }
     
     function Ban_Citizen(address citizen, uint duration)external{
         require(Citizens_Banning_Authorities.contains(msg.sender), "Banning Authority Only");
         require(Citizens_List.contains(citizen), "Not Registered Citizen");
         Citizens[citizen].Active=false;
         if(duration>0){
             Citizens[citizen].End_Ban_Timestamp = duration.add(block.timestamp);
         }
         
         emit Citizen_Banned(citizen);
     }
     
     function Permanently_Ban_Citizen(address citizen)external{
         require(Citizens_Banning_Authorities.contains(msg.sender), "Banning Authority Only");
         require(Citizens_List.contains(citizen), "Not Registered Citizen");
         Citizens[citizen].Active=false;
         Citizens[citizen].End_Ban_Timestamp=0;
         Citizens_List.remove(citizen);
         Permanently_Banned_Citizens.push(citizen);
         
         emit Citizen_Permanently_Banned(citizen);
     }
     
     function Grace_Citizen(address citizen)external{
         require(Citizens_Banning_Authorities.contains(msg.sender), "Banning Authority Only");
         require(Citizens_List.contains(citizen), "Not Registered Citizen");
         
         Citizens[citizen].Active=true;
         Citizens[citizen].End_Ban_Timestamp=0;
         
         emit Citizen_Ban_Over(citizen);
     }
     
     function Citizen_Finish_Ban()external{
         uint end_ban_timestamp = Citizens[msg.sender].End_Ban_Timestamp;
         require(end_ban_timestamp>0 && end_ban_timestamp <= block.timestamp, "Ban not over");
         Citizens[msg.sender].Active = true;
         Citizens[msg.sender].End_Ban_Timestamp=0;
         
         emit Citizen_Ban_Over(msg.sender);
     }
     
     
     
     /*Constitution Only functions*/
     function Add_Registering_Authority(address new_authority)external Constitution_Only{
         require(!Citizens_Registering_Authorities.contains(new_authority), "Already Existing Authority");
         Citizens_Registering_Authorities.add(new_authority);
     }
     
     function Remove_Registering_Authority(address removed_authority)external Constitution_Only{
         require(Citizens_Registering_Authorities.contains(removed_authority), "Not Existing Authority");
         Citizens_Registering_Authorities.remove(removed_authority);
     }
     
     function Add_Banning_Authority(address new_authority)external Constitution_Only{
         require(!Citizens_Banning_Authorities.contains(new_authority), "Already Existing Authority");
         Citizens_Banning_Authorities.add(new_authority);
     }
     
     function Remove_Banning_Authority(address removed_authority)external Constitution_Only{
         require(Citizens_Banning_Authorities.contains(removed_authority), "Not Existing Authority");
         Citizens_Banning_Authorities.remove(removed_authority);
     }
    
    
    /*GETTER*/
    
    function Contains(address citizen)external view returns(bool){
         return Citizens[citizen].Active;
     }
     
    function Get_Citizens_List() external view returns(bytes32[] memory){
        return Citizens_List._inner._values;
    }
    
    function Get_Permanently_Banned_Citizens() external view returns(address[] memory){
        return Permanently_Banned_Citizens;
    }
    
    function Get_Registering_Authorities() external view returns(bytes32[] memory){
        return Citizens_Registering_Authorities._inner._values;
    }
    
    function Get_Banning_Authorities() external view returns(bytes32[] memory){
        return Citizens_Banning_Authorities._inner._values;
    }
     
}