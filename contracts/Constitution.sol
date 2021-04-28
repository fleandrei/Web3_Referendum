// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*import "Register.sol";
import "Agora.sol";
import "Loi.sol";
import "API_Register.sol";
import "Delegation.sol";
import "IDelegation.sol";
import "Citizens_Register.sol";
import "IVote.sol";
*/

import "contracts/Register.sol";
import "contracts/Agora.sol";
import "contracts/Loi.sol";
import "contracts/API_Register.sol";
import "contracts/Delegation.sol";
import "contracts/Citizens_Register.sol";
import "contracts/IVote.sol";

/**
 * @notice {Constitution_Register} library is used to reduce the size of Constitution contract in order to avoid to exceed contract limit size. It contains heavy functions and data structures.
 */
library Constitution_Register{

     /**
        * @dev Deploy a {Loi} contract and returns it's address.
        * @param Loi_Name Name of the Loi contract
        * @param agora Addres of the Project's {Agora} contract
    */
    function Create_Loi(string memory Loi_Name, address agora)external returns(address){
         Loi loi = new Loi(Loi_Name, agora);
         //loi.Add_Authority(authority);
         return address(loi);
     }
     
     /**
        * @dev Deploy a {API_Register} contract and returns it's address.
        * @param Name Name of the API_Register contract
        * @param agora Addres of the Project's {Agora} contract
    */
     function Create_API(string memory Name, address agora) external returns(address){
         return address(new API_Register(Name, agora));
     }
    
}

/**
 * @notice {Constitution_Delegation} library is used to reduce the size of Constitution contract in order to avoid to exceed contract limit size. It contains heavy functions and data structures.
 */
library Constitution_Delegation{
    
     /**
        * @dev Deploy a {Delegation} contract and returns it's address.
        * @param Delegation_Name Name of the Delegation contract
        * @param Initial_members List of initial memebers of the delegation
        * @param Token_Address Address of the Project's {DemoCoin} contract
        * @param citizen_address Addres of the Project's {Citizens_Register} contract
        * @param agora_address Addres of the Project's {Agora} contract
    */
    function Create_Delegation(string memory Delegation_Name, address[] calldata Initial_members, address Token_Address, address citizen_address, address agora_address)external returns(address){
         Delegation delegation = new Delegation(Delegation_Name, Initial_members, Token_Address, citizen_address, agora_address);
         return address(delegation);
    }
    
    
}







/**
 * @notice Constitution register contract is used to edit parameters of a Web3 Direct Democracy project. 
 * It contains address of all deployed contracts used in a project. Particularly, it contains a list of address of all register contracts that are used in the project, and another list for all Delegations. 
 * Hence, Constitution is the central contract in a project. To launch a Web3 Direct Democracy project, we have to launch the Constitution contract. 
 * From Constitution deployed contract, we can have access to all the project. There is a single Constitution contract in a project.
 * With Constitution register contract, we can add new register and delegations to the project, we can modify their democratic process parameters, change other register’s _Register_Authorities_ array…
 * Constitution contract goal is to customize the project to specific use cases and to keep it updatable. 
 * 
 * Once a Web3 Direct Democracy project has just been deployed, it hasn’t any register or delegation. Citizens_Register and DemoCoin contracts haven’t any authority in their _Register_Authorities_ list. 
 * Thus, at the beginning of a Web3 Direct Democracy project, we need an initialisation stage. 
 * In this initialisation stage, there is a _Transitional_Government_ account that has authority on the constitution and can quickly perform necessary operations without passing by any democratic process :
 */
contract Constitution is Register{
     using EnumerableSet for EnumerableSet.AddressSet;
    
     
    // event Register_Parameters_Modified(address);
     event Register_Created(address register);
     event Delegation_Created(address delegation);
     event Transitional_Government_Finised();
     
    
     Agora public Agora_Instance;
     Citizens_Register public Citizen_Instance;
     DemoCoin public Democoin_Instance;
     //IVote public majority_judgment_ballot;
     //address public Citizens_Address;
     

     address public Transitional_Government;
     
     //mapping(address=>Constitution_Register.Register_Parameters)  Registers;
     EnumerableSet.AddressSet Registers_Address_List;
     
     //mapping(address=>Constitution_Delegation.Delegation_Parameters) Delegations;
     EnumerableSet.AddressSet Delegation_Address_List;
        
     
     
     /**
      * @param Constitution_Name Name of the Constitution contract
      * @param DemoCoin_Address Address of the {DemoCoin} contract of the project
      * @param Citizen_Address Address of the {Citizens_Register} contract of the project
      * @param Agora_Address Address of the {Agora} contract of the project
      * @param transition_government Address of the Transitional_Government.
      */ 
      constructor(string memory Constitution_Name, address DemoCoin_Address, address Citizen_Address, address Agora_Address, address transition_government) Register(Constitution_Name){   
        require(transition_government !=address(0));
         
         Constitution_Address = address(this);
         //Type_Institution = Institution_Type.CONSTITUTION;
         /*Democoin = new DemoCoin(Token_Name, Token_Symbole, initial_citizens, initial_citizens_token_amount);
         Citizen_Instance = new Citizens_Register(Citizen_Name, initial_citizens, address(Democoin), new_citizen_mint_amount);
         Agora_Instance = new Agora(Agora_Name, address(Democoin), address(Citizen_Instance));*/
         
         Democoin_Instance = DemoCoin(DemoCoin_Address);
         Citizen_Instance = Citizens_Register(Citizen_Address);
         Agora_Instance = Agora(Agora_Address);
         
         //majority_judgment_ballot = new majority_judgment_ballot();
         //Citizens_Address = Constitution_Register.Create_Citizens(initial_citizens);
         
         Transitional_Government = transition_government;
         Register_Authorities.add(Transitional_Government);
         Register_Authorities.add(Agora_Address);
         
     }
     
     /**
      * @dev Function called by the {Transitional_Government} account to end the Transitional Government stage. This step is mandatory to start using a Web3 Direct Democracy in a safe way.
     */ 
     function End_Transition_Government()external{
         require(msg.sender == Transitional_Government, "Transitional_Government only");
         Register_Authorities.remove(Transitional_Government);
         emit Transitional_Government_Finised();
     }
     
      /**
      * @dev Add a new address to a Register contract's (contract that inherit from a {Register} abstract contract) {Register_Authorities} list.
      * @param register Address of the register contract
      * @param authority Address to add to the {Register_Authorities} list.
     */ 
     function Add_Register_Authority(address register, address authority) external Register_Authorities_Only{
         require(Registers_Address_List.contains(register), "Unknown Register");
         Register res = Register(register);
         res.Add_Authority(authority);
     }
     
      /**
      * @dev Removes a, address from a Register contract's {Register_Authorities} list.
      * @param register Address of the register contract
      * @param authority Address to remove from the {Register_Authorities} list.
     */ 
     function Remove_Register_Authority(address register, address authority) external Register_Authorities_Only{
         require(Registers_Address_List.contains(register), "Unknown Register");
         Register res = Register(register);
         res.Remove_Authority(authority);
     }

      /**
      * @dev Change the Constitution address of an Institution contract belonging to current project. After this call, this Institution will not recognize this Constitution anymore.
      * @param institution_address Address of the Institution contract
      * @param new_address New Constitution address of the {institution_address} Institution 
     */ 
     function Set_Instances_Constitution(address institution_address, address new_address)external Register_Authorities_Only{
         require(Registers_Address_List.contains(institution_address) || Delegation_Address_List.contains(institution_address) || institution_address== address(Citizen_Instance), "instance address unknown"); // There is no interest to modify Agora's constitution.
         require(new_address!=address(0),"address 0");
         Institution Insti = Institution(institution_address);
         Institution_Type type_insti = Insti.Type_Institution();
         require(type_insti != Institution_Type.CONSTITUTION);
         Insti.Set_Constitution(new_address);
     }

     /**
      * @dev Change the Name of an Institution contract.
      * @param institution_address Address of the Institution contract
      * @param name New name of the {institution_address} Institution.
     */ 
     function Set_Institution_Name(address institution_address, string calldata name)external Register_Authorities_Only{
         require(Registers_Address_List.contains(institution_address) || Delegation_Address_List.contains(institution_address) || institution_address== address(Citizen_Instance) || institution_address== address(Agora_Instance), "instance address unknown");
         Institution Insti = Institution(institution_address);
         Insti.Set_Name(name);
     }
     
     
    /*FUNCTIONCALL API functions*/
    
    
    /*DemoCoin functions*/
    
    /**
      * @dev Change address that are allowed to mint DemoCoin Token (Minter authorities). They are contained in the {Mint_Authorities} list of {DemoCoin} contract.
      * @param Add_Minter List of new Minter address
      * @param Remove_Minter List of Minter address to remove from {Mint_Authorities}
     */ 
    function Set_Minnter(address[] calldata Add_Minter, address[] calldata Remove_Minter)external Register_Authorities_Only{
        uint add_len=Add_Minter.length;
        uint remove_len = Remove_Minter.length;
        for(uint i =0; i<add_len;i++){
            Democoin_Instance.Add_Minter(Add_Minter[i]);
        }
        for(uint j=0; j<remove_len; j++){
            Democoin_Instance.Remove_Minter(Remove_Minter[j]);
        }
    }
    
    /**
      * @dev Change address that are allowed to burn DemoCoin Token (Burner authorities). They are contained in the {Burn_Authorities} list of {DemoCoin} contract.
      * @param Add_Burner List of new Burner address
      * @param Remove_Burner List of Burner address to remove from {Burn_Authorities}
     */ 
    function Set_Burner(address[] calldata Add_Burner, address[] calldata Remove_Burner)external Register_Authorities_Only{
        uint add_len=Add_Burner.length;
        uint remove_len = Remove_Burner.length;
        for(uint i =0; i<add_len;i++){
            Democoin_Instance.Add_Burner(Add_Burner[i]);
        }
        for(uint j=0; j<remove_len; j++){
            Democoin_Instance.Remove_Burner(Remove_Burner[j]);
        }
    }
    
    
    /*Citizens_Register  Handling*/
    
      /**
      * @dev Change the amount of DemoCoin token to mint for new registered citizens.
      * @param amount Amount of token to mint.
     */
    function Set_Citizen_Mint_Amount(uint amount) external Register_Authorities_Only{
        Citizen_Instance.Set_Citizen_Mint_Amount(amount);
    }
    
     /**
      * @dev Removes address from {Citizens_Registering_Authorities} (address allowed to register new citizens) and/or from {Citizens_Banning_Authorities} (address allowed to ban citizens)
      * @param removed_authority Address to removes {Citizens_Register} contract authorities lists.
     */
    function Citizen_Register_Remove_Authority(address removed_authority) external Register_Authorities_Only{
        Citizen_Instance.Remove_Authority(removed_authority);
    }
    
    /**
      * @dev Allows an address to register new citizens. The address is added to {Citizens_Registering_Authorities} list
      * @param new_authority Address to add to {Citizens_Registering_Authorities} list
     */
    function Add_Registering_Authority(address new_authority)external Register_Authorities_Only{
        Citizen_Instance.Add_Registering_Authority(new_authority);
     }
     
     /**
      * @dev Allows an address to register ban citizens. The address is added to {Citizens_Banning_Authorities} list
      * @param new_authority Address to add to {Citizens_Banning_Authorities} list
     */
     function Add_Banning_Authority(address new_authority)external Register_Authorities_Only{
         Citizen_Instance.Add_Banning_Authority(new_authority);
     }
     

    
    /*Register/Agora Handling*/

    /**
      * @dev Add/create a new Register Contract to the Web3 Direct Democracy project. It's address is added to {Registers_Address_List}
      * @param Name Name of the new Register contract
      * @param register_type Type of the Register Contract (see {Institution_Type} enum of {Institution} abstract contract).
      * @param Petition_Duration Duration of the proposition/petition stage
      * @param Vote_Duration Duration of the voting stage
      * @param Vote_Checking_Duration Duration of the validation stage
      * @param Law_Initialisation_Price Amount of DemoCoin token to pay to submit a new Referendum proposition.
      * @param FunctionCall_Price Amount of DemoCoin token to pay for each new function call of a function call corpus proposal submission.
      * @param Required_Petition_Rate The minimum ratio of citizens signatures required to submit the referendum proposition as a referendum to all citizens.
      * @param Ivote_address Address of the IVote contract used in the voting and validation stage
     */
    function Create_Register(string memory Name, uint8 register_type, uint Petition_Duration, uint Vote_Duration, uint Vote_Checking_Duration, uint Law_Initialisation_Price, uint FunctionCall_Price, uint16 Required_Petition_Rate, address Ivote_address)
    external Register_Authorities_Only{ //returns(bool, bytes memory){
        
        
        address new_register_address;
        
        if(register_type == 0){ 
            new_register_address = address(this);
        }else if(register_type == 3){
            new_register_address = Constitution_Register.Create_Loi(Name, address(Agora_Instance));
        }else if(register_type == 4){
            new_register_address = Constitution_Register.Create_API(Name, address(Agora_Instance));
        }else{
            revert("Not Register Type");
        }
        
        require(!Registers_Address_List.contains(new_register_address), "Register Already Existing");
        
        
        Registers_Address_List.add(new_register_address);
     
        Agora_Instance.Create_Register_Referendum(new_register_address, register_type);
        _Set_Register_Param(new_register_address, Petition_Duration, Vote_Duration, Vote_Checking_Duration, Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ivote_address);
         
         
         emit Register_Created(new_register_address);
       
    }
    

    /**
      * @dev Change parameters of a Register Contract of the project.
      * @param register_address Address of the Register contract
      * @param Petition_Duration Duration of the proposition/petition stage
      * @param Vote_Duration Duration of the voting stage
      * @param Vote_Checking_Duration Duration of the validation stage
      * @param Law_Initialisation_Price Amount of DemoCoin token to pay to submit a new Referendum proposition.
      * @param FunctionCall_Price Amount of DemoCoin token to pay for each new function call of a function call corpus proposal submission.
      * @param Required_Petition_Rate The minimum ratio of citizens signatures required to submit the referendum proposition as a referendum to all citizens.
      * @param Ivote_address Address of the IVote contract used in the voting and validation stage
     */
    function Set_Register_Param(address register_address, uint Petition_Duration, uint Vote_Duration, uint Vote_Checking_Duration, uint Law_Initialisation_Price, uint FunctionCall_Price, uint16 Required_Petition_Rate, address Ivote_address) 
    external Register_Authorities_Only{ //returns(bool, bytes memory){

        require(Registers_Address_List.contains(register_address), "Register doesn't exist");
       
        _Set_Register_Param(register_address, Petition_Duration, Vote_Duration, Vote_Checking_Duration, Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ivote_address);
       
    }
    
     function _Set_Register_Param(address register_address, uint Petition_Duration, uint Vote_Duration, uint Vote_Checking_Duration, uint Law_Initialisation_Price, uint FunctionCall_Price, uint16 Required_Petition_Rate, address Ivote_address) 
     internal {
        
        if(Petition_Duration ==0 || Vote_Duration ==0 || Required_Petition_Rate == 0 || Required_Petition_Rate >10000 || Ivote_address==address(0)){
            revert("Bad arguments value");
        }
        
       Agora_Instance.Update_Register_Referendum_Parameters(register_address, Petition_Duration, Vote_Duration, Vote_Checking_Duration, Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ivote_address);
    }
    
    
    
    
    
     /*Delegations Handling*/
     
    /**
      * @dev Add/Deploy a new Delegation contract to the project. It's address is added to {Delegation_Address_List}
      * @param Name Name of the Delegation contract
      * @param delegation_address Address of an already deployed Delegation contract to add to the Project. If the delegation_address argument is address(0) then the function deploy a new Delegation contract.
      * @param Uint256_Legislatifs_Arg Array of uitn256 parameters related to Delegation's legislatif process. We use an array in order to reduce stack size (to avoid the "stack too deep" error). Array elements represent following parameters:
      *          - Member_Max_Token_Usage: The maximum amount of token a member is allowed to use for a law project elaboration
      *          - Law_Initialisation_Price: The price in token for creating a law project
      *          - FunctionCall_Price: The price in token for one FunctionCall.
      *          - Proposition_Duration: The duration of the stage in which members are allowed to submit propositions
      *          - Vote_Duration: The duration of the stage in which members are allowed to vote for the proposition they want
      *          - Law_Censor_Period_Duration: The duration of the stage in which all citizens are allowed to sign a etition against the law project proposed by the Delegation
      * 
      * @param Uint256_Governance_Arg Array of uitn256 parameters related to Delegation's Internal governance. We use an array in order to reduce stack size (to avoid the "stack too deep" error). Array elements represent following parameters:
      *          - Election_Duration: Duration of the stage in which citizens are allowed to vote for Candidats they prefer
      *          - Validation_Duration: Duration of the stage in which citizens can validate their hased vote by revealing their choice and the salt that has been used for hasing 
      *          - Mandate_Duration: Duration of a delegation mandate
      *          - Immunity_Duration: Amount of time after the beginning of a new mandate during which delegation's members can't be revoked
      *          - Mint_Token: Amount of token to mint for the Delegation
      * @param Num_Max_Members Maximum number of members in the delegation.
      * @param Revert_Proposition_Petition_Rate The minimum ratio of citizens required to cancel a law project
      * @param Revert_Penalty_Rate Ratio of total amount of token belonged by the delegation that will be lost if a law project is rejected by citizens
      * @param New_Election_Petition_Rate The minimum ratio of citizens required to revoke the current delegation's members and start a new election
      * @param Initial_members: Initials members of the delegation
      * @param Ivote_address_legislatif Address of the IVote contract that will be used during Legislatif process
      * @param Ivote_address_governance Address of the IVote contract that will be used during election stage
      */
   function Create_Delegation(string memory Name, address delegation_address, uint[6] calldata Uint256_Legislatifs_Arg, uint[5] calldata Uint256_Governance_Arg, 
         uint16 Num_Max_Members, uint16 Revert_Proposition_Petition_Rate, uint16 Revert_Penalty_Rate, 
         uint16 New_Election_Petition_Rate, address[] memory Initial_members, address Ivote_address_legislatif, address Ivote_address_governance)
         external Register_Authorities_Only {

            if(Uint256_Legislatifs_Arg[3]==0 || Uint256_Legislatifs_Arg[4]==0 || Revert_Proposition_Petition_Rate>10000 || Revert_Penalty_Rate>10000 || Ivote_address_legislatif==address(0)){
                 revert("Legislatif: Bad Argument Value");
             }
             
             if(Uint256_Governance_Arg[0]==0 || Uint256_Governance_Arg[2]==0 || Num_Max_Members==0 || New_Election_Petition_Rate ==0 || New_Election_Petition_Rate>10000 || Initial_members.length > Num_Max_Members || Ivote_address_governance==address(0)){
                 revert("Governance: Bad Argument Value");
             }
            
            
            if(delegation_address == address(0)){ //Create a new delegation
                 
                 for(uint i =0; i<Initial_members.length; i++){
                     require(Citizen_Instance.Contains(Initial_members[i]), "Member is not citizen");
                 }
                 delegation_address = Constitution_Delegation.Create_Delegation(Name, Initial_members, address(Democoin_Instance), address(Citizen_Instance), address(Agora_Instance));
            }else{
                require(!Delegation_Address_List.contains(delegation_address), "Delegation already registered");
            }
            
            
            Delegation_Address_List.add(delegation_address);
            
            emit Delegation_Created(delegation_address);
            
            if(Uint256_Governance_Arg[4]>0){
                Democoin_Instance.Mint(delegation_address, Uint256_Governance_Arg[4]);
            }
            
            IDelegation(delegation_address).Update_Legislatif_Process(Uint256_Legislatifs_Arg, Revert_Proposition_Petition_Rate, Revert_Penalty_Rate, Ivote_address_legislatif);
            IDelegation(delegation_address).Update_Internal_Governance(Uint256_Governance_Arg[0], Uint256_Governance_Arg[1], Uint256_Governance_Arg[2], Uint256_Governance_Arg[3], Num_Max_Members, New_Election_Petition_Rate, Ivote_address_governance);
         }
         

    /**
     * @dev Put a Register contract under the control of a Delegation. The Register contract address is added to {Controled_Registers} list of the Delegation. 
     * It means that the Delegation recognize the Register contract as a controled one. But to allow the Delegation to call Register functions of the Register contract, you also have to to add the Delegation' address to the {Register_Authorities} list of the register contract via the {Add_Register_Authority} function.
     * @param delegation_address Address of the Delegation
     * @param new_controled_register Address of the Register contract.
    */  
    function Add_Delegation_Controled_Register(address delegation_address, address new_controled_register) external Register_Authorities_Only{
        require(Delegation_Address_List.contains(delegation_address), "Non Existing Delegation");
        require(Registers_Address_List.contains(new_controled_register), "Non Existing Register");
        IDelegation(delegation_address).Add_Controled_Register( new_controled_register);    
    
    }
    
     /**
     * @dev Removes a Register contract from the control of a Delegation. The Register contract address is removed from the {Controled_Registers} list of the Delegation. 
     * It means that the Delegation doesn't recognize anymore the Register contract as a controled one. But to fully cut bonds between the Delegation and the Register contract, you also have to to remove the Delegation' address from the {Register_Authorities} list of the register contract via the {Remove_Register_Authority} function.
     * @param delegation_address Address of the Delegation
     * @param removed_controled_register Address of the Register contract.
    */ 
    function Remove_Delegation_Controled_Register(address delegation_address, address removed_controled_register) external Register_Authorities_Only{
        require(Delegation_Address_List.contains(delegation_address), "Non Existing Delegation");
        require(Registers_Address_List.contains(removed_controled_register), "Non Existing Register");
        IDelegation(delegation_address).Remove_Controled_Register( removed_controled_register);
    }
     
    
    /**
      * @dev Modify parameters related to the Legislatif process of a Delegation.
      * @param delegation_address Address of the Delegation contract
      * @param delegation_address Address of an already deployed Delegation contract to add to the Project. If the delegation_address argument is address(0) then the function deploy a new Delegation contract.
      * @param Uint256_Legislatifs_Arg Array of uitn256 parameters related to Delegation's legislatif process. We use an array in order to reduce stack size (to avoid the "stack too deep" error). Array elements represent following parameters:
      *          - Member_Max_Token_Usage: The maximum amount of token a member is allowed to use for a law project elaboration
      *          - Law_Initialisation_Price: The price in token for creating a law project
      *          - FunctionCall_Price: The price in token for one FunctionCall.
      *          - Proposition_Duration: The duration of the stage in which members are allowed to submit propositions
      *          - Vote_Duration: The duration of the stage in which members are allowed to vote for the proposition they want
      *          - Law_Censor_Period_Duration: The duration of the stage in which all citizens are allowed to sign a etition against the law project proposed by the Delegation
      * 
      * @param Revert_Proposition_Petition_Rate The minimum ratio of citizens required to cancel a law project
      * @param Revert_Penalty_Rate Ratio of total amount of token belonged by the delegation that will be lost if a law project is rejected by citizens
      * @param Ivote_address Address of the IVote contract that will be used during Legislatif process
      */
    function Set_Delegation_Legislatif_Process(address delegation_address, uint[6] calldata Uint256_Legislatifs_Arg, uint16 Revert_Proposition_Petition_Rate, 
         uint16 Revert_Penalty_Rate, address Ivote_address) 
         external Register_Authorities_Only{ //returns(bool, bytes memory){
             
             require(Delegation_Address_List.contains(delegation_address), "Non Existing Delegation");
             
             if(Uint256_Legislatifs_Arg[3]==0 || Uint256_Legislatifs_Arg[4]==0 || Revert_Proposition_Petition_Rate>10000 || Revert_Penalty_Rate>10000 || Ivote_address==address(0) ){
                revert("Legislatif: Bad Argument Value");
             }
             
             
             IDelegation(delegation_address).Update_Legislatif_Process(Uint256_Legislatifs_Arg, Revert_Proposition_Petition_Rate, Revert_Penalty_Rate, Ivote_address);
         }
         
         
     /**
      * @dev Modify parameters related to the Legislatif process of a Delegation.
      * @param delegation_address Address of the Delegation contract
      * @param Election_Duration: Duration of the stage in which citizens are allowed to vote for Candidats they prefer
      * @param Validation_Duration: Duration of the stage in which citizens can validate their hased vote by revealing their choice and the salt that has been used for hasing 
      * @param Mandate_Duration: Duration of a delegation mandate
      * @param Immunity_Duration: Amount of time after the beginning of a new mandate during which delegation's members can't be revoked
      * @param Num_Max_Members: Maximum number of members in the delegation.
      * @param New_Election_Petition_Rate: The minimum ratio of citizens required to revoke the current delegation's members and start a new election
      * @param Mint_Token Amount of token to mint for the Delegation: Initials members of the delegation
      * @param Ivote_address Address of the IVote contract that will be used during election stage
      */    
    function Set_Delegation_Internal_Governance(address delegation_address, uint Election_Duration,  uint Validation_Duration, uint Mandate_Duration, uint Immunity_Duration,
        uint16 Num_Max_Members, uint16 New_Election_Petition_Rate, uint Mint_Token, address Ivote_address) external Register_Authorities_Only{
            require(Delegation_Address_List.contains(delegation_address), "Non Existing Delegation");
            
            if(Election_Duration==0 || Mandate_Duration==0 || Num_Max_Members==0 || New_Election_Petition_Rate ==0 || New_Election_Petition_Rate>10000 || Ivote_address==address(0)){
                 revert("Governance: Bad Argument Value");
             }
            
            if(Mint_Token>0){
                 Democoin_Instance.Mint(delegation_address, Mint_Token);
             }
            
            IDelegation(delegation_address).Update_Internal_Governance(Election_Duration, Validation_Duration, Mandate_Duration, Immunity_Duration, Num_Max_Members, New_Election_Petition_Rate, Ivote_address);
         }
    
     
     
     
     /*GETTERS*/
     /**
      * @dev Get the list of all address of Register contracts registered in the Constitution
      * @return register_list Array of Register contract address 
     */ 
     function Get_Register_List() external view returns(bytes32[] memory register_list){
         return Registers_Address_List._inner._values;
     }
     
     
     /**
      * @dev Get the list of all address of Delegation contracts registered in the Constitution
      * @return delegation_list Array of Delegation contract address 
     */ 
     function Get_Delegation_List() external view returns(bytes32[] memory delegation_list){
         return Delegation_Address_List._inner._values;
     }
     
    
 }
 
 