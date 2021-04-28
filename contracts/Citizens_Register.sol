// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//import "Register.sol";
import "contracts/Register.sol";



/** 
 * @dev This contract inherit from abstract contract "Register". It register the whitelist of accounts allowed to take art in democratic activities of the DAO. This list of citizens is edited by two authorities:
 *  - Citizens_Registering_Authorities: List of address allowed to add citizens. We can have severals address but usually one single Delegation contract address is enough.
 *  - Citizens_Banning_Authorities: List of address allowed to remove citizens.  We can have severals address but usually one single Delegation contract address is enough.
 * 
 * The contract should be given authority to mint token on DemoCoin token
*/

contract Citizens_Register is Register{
     using EnumerableSet for EnumerableSet.AddressSet;

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
     event new_citizen_mint_amount_Set(uint new_citizen_mint_amount);
     event Registering_Authority_Added(address authority);
     event Banning_Authority_Added(address authority);
     event Registering_Authority_Removed(address authority);
     event Banning_Authority_Removed(address authority);
     
     ///@dev function selector of {Contains} function. It's the selector other contracts have to use if they want to check if an address is citizen of the DAO
     bytes4 constant public Contains_Function_Selector = 0x57f98d32;
     
     ///@dev Mapping of all citizens of the DAO
     mapping(address=>Citizen) public Citizens;
     ///@dev list of all citizens of the DAO
     EnumerableSet.AddressSet Citizens_List;
     ///@dev List of accounts that have been Permanently banned and can not be added anymore (blacklist)
     address[] Permanently_Banned_Citizens;
     
     DemoCoin Democoin;
     
    
     EnumerableSet.AddressSet Citizens_Registering_Authorities;
     EnumerableSet.AddressSet Citizens_Banning_Authorities;
     
     ///@dev Amount of token to transfer to a new registered citizen.
     uint public New_Citizen_Mint_Amount; //Each new citizen get "New_Citizen_Mint_Amount" token that are mint.
    
    /** 
     * @param Name name of the Institution
     * @param Initial_Citizens List of initial citizens 
     * @param token_address Address of DemoCoin token that will be used to transfert initial token amount to new registered citizens 
     * @param new_citizen_mint_amount Amount of token to mint for new registered accounts
    */
     constructor(string memory Name, address[] memory Initial_Citizens, address token_address, uint new_citizen_mint_amount) Register(Name){
         Type_Institution = Institution_Type.CITIZENS_REGISTRATION;
         Constitution_Address = msg.sender;
         
         Democoin = DemoCoin(token_address);
         
         uint citizens_number = Initial_Citizens.length;
         
         for(uint i =0; i<citizens_number; i++){
             Citizens[Initial_Citizens[i]].Active = true;
             Citizens[Initial_Citizens[i]].Registration_Timestamps = block.timestamp;
             Citizens_List.add(Initial_Citizens[i]);
             
         }
         
         New_Citizen_Mint_Amount = new_citizen_mint_amount;
     }
     
     
     
     
     /*REGISTER FUNCTIONS*/
     
     /**
      * @dev Add a new citizen to the whitelist of account allowed to take part in democratic activities of the DAO. Only accounts contained in {Citizens_Registering_Authorities} can call this function.
      * @param new_citizen Account to be registered as citizen.
      * */
     function Register_Citizen(address new_citizen) external{
         require(Citizens_Registering_Authorities.contains(msg.sender), "Registering Authority Only");
         require(Citizens[new_citizen].Registration_Timestamps ==0, "Already Registered/Ban Citizen");
         Citizens[new_citizen].Active = true;
         Citizens[new_citizen].Registration_Timestamps = block.timestamp;
         Citizens_List.add(new_citizen);
         
         Democoin.Mint(new_citizen, New_Citizen_Mint_Amount);
         
         emit New_Citizen(new_citizen);
     }
     
   
     
     /**
      * @dev Modify the Data field of a Citizen. Only callable by Registering authorities
      * @param citizen Citizen account to be modified
      * @param data New Data field
      * */
     function Set_Citizen_Data(address citizen, bytes calldata data)external{
         require(Citizens_Registering_Authorities.contains(msg.sender), "Registering Authority Only");
         require(Citizens_List.contains(citizen), "Not Registered Citizen");
         Citizens[citizen].Data = data;
         
         Citizen_Data_Set(citizen);
     }
     
      /**
      * @dev Ban a citizen for a limited or unlimited amount of time. Only callable by Banning Auhorities
      * @param citizen Citizen account to be banned
      * @param duration Duration of the bannishment. If it's null, the citizen is banned for an unlimited amount of time.
      * */
     function Ban_Citizen(address citizen, uint duration)external{
         require(Citizens_Banning_Authorities.contains(msg.sender), "Banning Authority Only");
         require(Citizens_List.contains(citizen), "Not Registered Citizen");
         Citizens[citizen].Active=false;
         if(duration>0){
             Citizens[citizen].End_Ban_Timestamp = duration+block.timestamp;
         }
         
         emit Citizen_Banned(citizen);
     }
     
      /**
      * @dev Ban a citizen forever. The citizen is blacklisted.
      * @param citizen Citizen account to be blacklisted
      * */
     function Permanently_Ban_Citizen(address citizen)external{
         require(Citizens_Banning_Authorities.contains(msg.sender), "Banning Authority Only");
         require(Citizens_List.contains(citizen), "Not Registered Citizen");
         Citizens[citizen].Active=false;
         Citizens[citizen].End_Ban_Timestamp=0;
         Citizens_List.remove(citizen);
         Permanently_Banned_Citizens.push(citizen);
         
         emit Citizen_Permanently_Banned(citizen);
     }
     
       /**
      * @dev Grant pardon to a banned citizen. If the citizen has been banned for an unlimited amount of time, this function is the only way to let him come back. This function is only callable by Banning Authorities.
      * @param citizen Citizen account to be granted pardon
      * */
     function Grace_Citizen(address citizen)external{
         require(Citizens_Banning_Authorities.contains(msg.sender), "Banning Authority Only");
         require(Citizens_List.contains(citizen), "Not Registered Citizen");
         
         Citizens[citizen].Active=true;
         Citizens[citizen].End_Ban_Timestamp=0;
         
         emit Citizen_Ban_Over(citizen);
     }
     
      /**
      * @dev Function callable by a banned citizen to end his bannishment when the sentence is finished (if his sentence is limited in time)
      * */
     function Citizen_Finish_Ban()external{
         uint end_ban_timestamp = Citizens[msg.sender].End_Ban_Timestamp;
         require(end_ban_timestamp>0 && end_ban_timestamp <= block.timestamp, "Ban not over (or not banned)");
         Citizens[msg.sender].Active = true;
         Citizens[msg.sender].End_Ban_Timestamp=0;
         
         emit Citizen_Ban_Over(msg.sender);
     }
     
     
     
     
     
     /*CONSTITUTION ONLY FUNCTIONS*/
     
     /**
      * @dev Setter for {New_Citizen_Mint_Amount} state variable
      * @param amount New value of New_Citizen_Mint_Amount
      * */
     function Set_Citizen_Mint_Amount(uint amount)external Constitution_Only{
         New_Citizen_Mint_Amount = amount;
         emit new_citizen_mint_amount_Set(amount);
     }
     
     /**
      * @dev Add a Registering Authority address.
      * @param new_authority New register authority address.
      * */
     function Add_Registering_Authority(address new_authority)external Constitution_Only{
         require(!Citizens_Registering_Authorities.contains(new_authority), "Already Existing Authority");
         Citizens_Registering_Authorities.add(new_authority);
         emit Registering_Authority_Added(new_authority);
     }
     
     /**
      * @dev Add a Banning Authority address.
      * @param new_authority New banning authority address.
      * */
     function Add_Banning_Authority(address new_authority)external Constitution_Only{
         require(!Citizens_Banning_Authorities.contains(new_authority), "Already Existing Authority");
         Citizens_Banning_Authorities.add(new_authority);
         emit Banning_Authority_Added(new_authority);
     }
     
    /**
      * @dev Remove an address from {Citizens_Registering_Authorities} and/or {Citizens_Banning_Authorities}
      * @param removed_authority Address to remove from Authorities lists.
      * */
    function Remove_Authority(address removed_authority) override external{
         require(msg.sender == removed_authority || msg.sender == Constitution_Address, "Not Allowed Removing Authorities");
         if(Citizens_Registering_Authorities.contains(removed_authority)){
             Citizens_Registering_Authorities.remove(removed_authority);
             emit Registering_Authority_Removed(removed_authority);
         }else if(Citizens_Banning_Authorities.contains(removed_authority)){
             Citizens_Banning_Authorities.remove(removed_authority);
             emit Banning_Authority_Removed(removed_authority);
         }else{
            revert("Not existing authority");
         }
     }
    
    /*GETTER*/
    
    /**
      * @dev Check whether an account is citizen of the current Web3 Direct Democracy project.
      * @param citizen Account to check.
      * @return is_citizen 
      * 
      * 
      * */
    function Contains(address citizen)external view returns(bool is_citizen){
         return Citizens[citizen].Active;
     }
     
    /**
      * @dev Get the number of citizens in the DAO
      * @return citizen_number 
      * */ 
    function Get_Citizen_Number()external view returns(uint citizen_number){
        return Citizens_List.length();
    }
    
    /**
      * @dev Get the list of citizens
      * @return citizen_list 
      * */ 
    function Get_Citizens_List() external view returns(bytes32[] memory citizen_list){
        return Citizens_List._inner._values;
    }
    
    /**
      * @dev Get the list of blacklisted citizens (permanently banned citizens)
      * @return blacklist 
      * */
    function Get_Permanently_Banned_Citizens() external view returns(address[] memory blacklist){
        return Permanently_Banned_Citizens;
    }
    
    /**
      * @dev Get the list of Registering authorities
      * @return registering_authorities 
      * */
    function Get_Registering_Authorities() external view returns(bytes32[] memory registering_authorities){
        return Citizens_Registering_Authorities._inner._values;
    }
    
    /**
      * @dev Get the list of banning authorities
      * @return banning_authorities 
      * */
    function Get_Banning_Authorities() external view returns(bytes32[] memory banning_authorities){
        return Citizens_Banning_Authorities._inner._values;
    }
     
}