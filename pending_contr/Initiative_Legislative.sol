// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//pragma experimental ABIEncoderV2;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol";
import "Institution.sol";

abstract contract  Initiative_Legislative is Institution{
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using SafeMath for uint;
    
    struct Function_Call_Result{
        bool Success;
        bytes Receipt;
    }
    
    struct Corpus_Proposal{
        bytes Description;
        //uint[] Function_Calls;
        mapping(uint=>uint) Function_Calls; //Keys begins at 1. Values are the indexes of functions calls (i.e. bytes corresponding to the "data" field in the low level call) in the "All_Proposed_Function_Calls" array of the corresponding Law_Project struct
        uint Function_Call_Counter;
        uint[] Children;
        uint Parent;
        address Author;
    }
    
    struct Law_Project{
        bytes Title;
        //string Clear_Description;
        bytes Description;
        bytes[] All_Proposed_Function_Calls; // List of all function calls proposed in all Proposals_Tree's proposals.
        mapping(uint=>Corpus_Proposal) Proposals_Tree; // uint 0 is the root. Real Proposals begin at uint 1
        uint Proposal_Count;
        uint Winning_Proposal;
        Function_Call_Result[] Function_Call_Receipts;
        //address Institution_Target_Address;
    }
    
    event New_Law_Project(bytes32 Key);
    event New_Proposal(bytes32 Law_Project, uint Index);
    
    mapping(bytes32 => Law_Project) public List_Law_Project;
    /*bytes32[] public Failed_Law_Project;
    EnumerableSet.Bytes32Set Pending_Law_Project;
    bytes32[] public Achieved_Law_Project;
    */
    
    
    /**
     * @notice Add a new law project
     * @param Title title of the new law project
     * @param Description Text explaining the spirit and generals goals of the law project 
     * @param key key of the law project in the "List_Law_Project" mapping:  keccak256(abi.encode(Title, Description))
     * @dev It's advised to enter Title and Description parameters as hash.
    */
    function Add_Law_Project(bytes calldata Title, bytes calldata Description, bytes32 key)internal {
        
        //bytes32 key = Before_Add_Law_Project(Title, Description);//keccak256(abi.encode(Title,Description));
        //require(List_Law_Project[key].Proposal_Count == 0, "Already existing Law_Project");
        List_Law_Project[key].Title= Title;
        List_Law_Project[key].Description = Description;
        //List_Law_Project[key].Global_Function_Calls.push();
        //Pending_Law_Project.add(key);
        
        emit New_Law_Project(key);
    }
    
    //function Before_Add_Law_Project(bytes calldata Title, bytes calldata Description) internal virtual returns(bytes32);
    
    
    /**
     * @notice Add a new proposal to the Proposals tree of the current law project. This proposal is composed both by functions call (i.e. bytes corresponding to the "data" field in a low level call) coming from it's parent proposal
     * and by new functions call that are specific to the new created proposal.
     * 
     * @param law_project Key of the law project
     * @param Parent Parent proposal of the new proposal
     * @param Parent_Proposals_Reuse List of parent's function call that are going to be reused in the new proposal. It's an array containing the indexes of the Parent function calls. If an element of the array is null, it means that the corresponding spot will be occupied by a new function call.
     * @param New_Function_Call Array of bytes corresponding to new functions calls that are specific to the new proposal.
     * @param Description Text explaining the goals of the proposal. It can be used for example to justify the benefit of new added function call. If this parameter is null, it means that the description of this new proposal is the same as the description of the law project.
     * 
     * 
     * @dev In the Parent_Proposals_Reuse and New_Function_Call arrays elements are ordered in the oreder in which corresponding function call will be executed at the execution time. 
     * Indexes corresponding to "New_Function_Call" function call elements are merged with "Parent_Proposals_Reuse" in order to create a list of all the functions calls ("Function_Calls" field of "Corpus_Proposal" struct) of the new proposal. 
     * 
     * ex: Parent_Proposals_Reuse= [3,0,1,5,0];  New_Function_Call=[function_call1, function_call2, function_call3]  =>   [3, IndexOf(function_call1), 1,5,IndexOf(function_call2)];     function_call3 is ignored
     * note: Index values correspond to the indexes in the "All_Proposed_Function_Calls" array of the "Law_Project" struct. 
     * 
     * The function doesn't set "Author" field of Corpus_Proposal struct because of "stack too deep" error. Hence, this task have to be done by the caller function.
     */
    function Add_Corpus_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) internal{
        //Before_Add_Corpus_Proposal(law_project, Parent, Parent_Proposals_Reuse, New_Function_Call, Description);
        require(List_Law_Project[law_project].Proposal_Count >= Parent, "Parent proposal doesn't exist");
        
        uint proposal_index = List_Law_Project[law_project].Proposal_Count.add(1);
        List_Law_Project[law_project].Proposal_Count = proposal_index;
        
        
        List_Law_Project[law_project].Proposals_Tree[Parent].Children.push(proposal_index);
        
        List_Law_Project[law_project].Proposals_Tree[proposal_index].Parent = Parent;
        List_Law_Project[law_project].Proposals_Tree[proposal_index].Description = Description;
        
        //uint parent_proposals_peuse_length = Parent_Proposals_Reuse.length;
        //uint new_function_call_length = New_Function_Call.length;
        //mapping(uint=>uint) storage Parents_function_calls= List_Law_Project[law_project].Proposals_Tree[Parent].Function_Calls;
        uint function_call_counter;
        uint new_function_call_counter;
        uint all_proposed_function_call_Next_Index = List_Law_Project[law_project].All_Proposed_Function_Calls.length;
        //uint parent_proposal_reuse_index;
        for(uint i=0; i<Parent_Proposals_Reuse.length; i++){
            //parent_proposal_reuse_index = Parent_Proposals_Reuse[i];
            if(Parent_Proposals_Reuse[i]>0){
                if(Parent_Proposals_Reuse[i] <= List_Law_Project[law_project].Proposals_Tree[Parent].Function_Call_Counter){
                    //uint parent_proposal_id = Parents_function_calls[parent_proposal_reuse_counter];
                    //List_Law_Project[law_project].Proposals_Tree[proposal_index].Function_Calls.push(Parents_function_calls[parent_proposal_reuse_counter-1]);
                    function_call_counter = function_call_counter.add(1);
                    List_Law_Project[law_project].Proposals_Tree[proposal_index].Function_Calls[function_call_counter] = List_Law_Project[law_project].Proposals_Tree[Parent].Function_Calls[Parent_Proposals_Reuse[i]];
                }else{
                    revert("No existing function_call");
                }
            }else{
                if(new_function_call_counter < New_Function_Call.length){
                    List_Law_Project[law_project].All_Proposed_Function_Calls.push(New_Function_Call[new_function_call_counter]);
                    //all_proposed_function_call_length = List_Law_Project[law_project].All_Proposed_Function_Calls.length;
                    //List_Law_Project[law_project].Proposals_Tree[proposal_index].Function_Calls.push(all_proposed_function_call_length.sub(1));
                    function_call_counter = function_call_counter.add(1);
                    List_Law_Project[law_project].Proposals_Tree[proposal_index].Function_Calls[function_call_counter] =  all_proposed_function_call_Next_Index;
                    all_proposed_function_call_Next_Index = all_proposed_function_call_Next_Index.add(1);
                    new_function_call_counter = new_function_call_counter.add(1);
                }
                
            }
        }
        
        List_Law_Project[law_project].Proposals_Tree[proposal_index].Function_Call_Counter = function_call_counter;
        emit New_Proposal(law_project, proposal_index);
    }
    
    
    //function Before_Add_Corpus_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) internal virtual;
    
    function Add_Item_Proposal(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs, address author) internal{
        //require(List_Law_Project[law_project].Proposal_Count >= Proposal, "Proposal doesn't exist");
        require(List_Law_Project[law_project].Proposals_Tree[Proposal].Author == author, "You're Not author of proposal" );
        //Before_Add_Item_Proposal( law_project,  Proposal, New_Items, Indexs);
        
        uint counter = List_Law_Project[law_project].Proposals_Tree[Proposal].Function_Call_Counter;
        uint index;
        
        uint insert;
        for(uint i =0; i<New_Items.length; i++){
            index = Indexs[i];
            require(index<= counter.add(1), "Add_item: index out of range");
            List_Law_Project[law_project].All_Proposed_Function_Calls.push(New_Items[i]);
            insert = List_Law_Project[law_project].All_Proposed_Function_Calls.length.sub(1);
            while(index <=  counter){
               ( List_Law_Project[law_project].Proposals_Tree[Proposal].Function_Calls[index], insert) = (insert, List_Law_Project[law_project].Proposals_Tree[Proposal].Function_Calls[index]);
               index = index.add(1);
            }
            counter = counter.add(1);
            List_Law_Project[law_project].Proposals_Tree[Proposal].Function_Calls[index] = insert;
        }
    }
    
    //function Remove_Item_Proposal
    
    //function Before_Add_Item_Proposal(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) internal virtual;
    
    
    function Execute_Winning_Proposal(bytes32 law_project, uint num_function_call_ToExecute, address register_address) internal returns(bool finished){
        uint winning_proposal = List_Law_Project[law_project].Winning_Proposal;
        uint function_call_nbr = List_Law_Project[law_project].Proposals_Tree[winning_proposal].Function_Call_Counter;
        uint Receipt_Counter = List_Law_Project[law_project].Function_Call_Receipts.length;
        uint remaining_number = function_call_nbr.sub(Receipt_Counter);
        uint function_call_index;
       
        if(num_function_call_ToExecute >= remaining_number){
            num_function_call_ToExecute = remaining_number;
            finished = true;
        }
        
        for(uint i=Receipt_Counter; i<Receipt_Counter.add(num_function_call_ToExecute); i++){
            List_Law_Project[law_project].Function_Call_Receipts.push();
            function_call_index = List_Law_Project[law_project].Proposals_Tree[winning_proposal].Function_Calls[i+1];
            (List_Law_Project[law_project].Function_Call_Receipts[i].Success, List_Law_Project[law_project].Function_Call_Receipts[i].Receipt) = register_address.call(List_Law_Project[law_project].All_Proposed_Function_Calls[function_call_index]);
        }
        
    }
    
    /*Getters*/
    /*function Get_Pending_Law_Project() external view returns(bytes32[] memory){
        return Pending_Law_Project._inner._values;
    }
    */
    
    function Get_Proposal_Infos(bytes32 law_project, uint Id) external view returns(bytes memory, uint[] memory, uint, uint){
        return (List_Law_Project[law_project].Proposals_Tree[Id].Description, List_Law_Project[law_project].Proposals_Tree[Id].Children, List_Law_Project[law_project].Proposals_Tree[Id].Function_Call_Counter, List_Law_Project[law_project].Proposals_Tree[Id].Parent);
    }
    
    function Get_Proposal_FunctionCall_List(bytes32 law_project, uint Id) external view returns(bytes[] memory){
        //uint length = List_Law_Project[law_project].Proposals_Tree[Id].Function_Calls.length;
        uint length = List_Law_Project[law_project].Proposals_Tree[Id].Function_Call_Counter;
        bytes[] memory Function_Calls =  new bytes[](length);
        uint function_call_id;
        for(uint i =1; i<=length; i++){
            function_call_id = List_Law_Project[law_project].Proposals_Tree[Id].Function_Calls[i];
            Function_Calls[i-1] = List_Law_Project[law_project].All_Proposed_Function_Calls[function_call_id];
        }
        return Function_Calls;
    }
    
    function Get_FunctionCall_List(bytes32 law_project)external view returns(bytes[] memory){
        return List_Law_Project[law_project].All_Proposed_Function_Calls;
    }
    
    function Get_Law_Project_Results(bytes32 law_project) external view returns(uint, Function_Call_Result[] memory){
        return (List_Law_Project[law_project].Winning_Proposal, List_Law_Project[law_project].Function_Call_Receipts);
    }
    
    //0x0000000000000000000000000000000000000000000000000000000000000000
    //0x0000000000000000000000000000000000000000
}