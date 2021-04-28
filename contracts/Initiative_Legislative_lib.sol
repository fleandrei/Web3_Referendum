// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "contracts/Institution.sol";

/**
 * @dev This library is used by {Agora} and {Delegation} contracts for law project elaboration. It provides facilities for law project creation, propositions submission, Law execution... 
 * Every citizen can submit one or more proposal for the function call corpus of the law project. Proposals are stored in a Proposal Tree where each proposal can reuse function calls of its parent proposal.
 * When a citizen wants to submit a proposal via the Add_Proposal function, he has to pay tokens for each new function call but function calls that come from the parent proposal are free. Hence, citizens can spare tokens by reusing already proposed function call. 
 * This is an incentive for citizens to avoid duplicate or unnecessary function call. 
 * The tree structure increases the readability of the proposal corpus as similar proposal would have the same parents.
 * Once a citizen has submitted a proposal, he still has the possibility to insert new function call to it via the Add_Item function.
*/ 
library Initiative_Legislative_Lib{
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
        bytes Description;
        bytes[] All_Proposed_Function_Calls; // List of all function calls proposed in all Proposals_Tree's proposals.
        mapping(uint=>Corpus_Proposal) Proposals_Tree; // uint 0 is the root. Real Proposals begin at uint 1
        uint Proposal_Count;
        uint Winning_Proposal;
        Function_Call_Result[] Function_Call_Receipts;
    }
    
    
    event Law_Project_Created(bytes32 Key);
    event New_Proposal(bytes32 Law_Project, uint Index);
    
    
    /**
     * @notice Add a new law project
     * @param Title title of the new law project. Can be an hash.
     * @param Description Text explaining the spirit and generals goals of the law project. Can be an hash.
     * @dev It's advised to enter Title and Description parameters as hash.
    */
    function Add_Law_Project(Law_Project storage law_project, bytes calldata Title, bytes calldata Description)external {
        law_project.Title = Title;
        law_project.Description = Description;
        emit Law_Project_Created(keccak256(abi.encode(Title,Description)));
      
    }
    
    /**
     * @notice Add a new proposal to the Proposals tree of the current law project. This proposal is composed both by functions call (i.e. bytes corresponding to the "data" field in a low level call) coming from it's parent proposal
     * and by new functions call that are specific to the new created proposal.
     * 
     * @param Project_Law Key of the law project
     * @param Parent Parent proposal of the new proposal
     * @param Parent_Proposals_Reuse List of parent's function call that are going to be reused in the new proposal. It's an array containing the indexes of the Parent function calls. If an element of the array is null, it means that the corresponding spot will be occupied by a new function call.
     * @param New_Function_Call Array of bytes corresponding to new functions calls that are specific to the new proposal.
     * @param Description Text explaining the goals of the proposal. It can be used for example to justify the benefit of new added function call. If this parameter is null, it means that the description of this new proposal is the same as the description of the law project.
     * 
     * 
     * @dev In the Parent_Proposals_Reuse and New_Function_Call arrays elements are ordered in the order in which function call will be executed at the execution time. 
     * Indexes corresponding to "New_Function_Call" function call elements are merged with "Parent_Proposals_Reuse" in order to create a list of all the functions calls ("Function_Calls" field of "Corpus_Proposal" struct) of the new proposal. 
     * 
     * ex: Parent_Proposals_Reuse= [3,0,1,5,0];  New_Function_Call=[function_call1, function_call2, function_call3]  =>   [3, IndexOf(function_call1), 1,5,IndexOf(function_call2)];     function_call3 is ignored
     * note: Index values correspond to the indexes in the "All_Proposed_Function_Calls" array of the "Law_Project" struct. 
     * 
     * The function doesn't set "Author" field of Corpus_Proposal struct because of "stack too deep" error. Hence, this task have to be done by the caller function.
     */
    function Add_Corpus_Proposal(Law_Project storage Project_Law, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) external{
        require(Project_Law.Proposal_Count >= Parent, "Parent proposal doesn't exist");
        
        uint proposal_index = Project_Law.Proposal_Count.add(1);
        Project_Law.Proposal_Count = proposal_index;
        
        
        Project_Law.Proposals_Tree[Parent].Children.push(proposal_index);
        
        Project_Law.Proposals_Tree[proposal_index].Parent = Parent;
        Project_Law.Proposals_Tree[proposal_index].Description = Description;
        
        uint function_call_counter;
        uint new_function_call_counter;
        uint all_proposed_function_call_Next_Index = Project_Law.All_Proposed_Function_Calls.length;
        for(uint i=0; i<Parent_Proposals_Reuse.length; i++){
            if(Parent_Proposals_Reuse[i]>0){
                if(Parent_Proposals_Reuse[i] <= Project_Law.Proposals_Tree[Parent].Function_Call_Counter){
                    function_call_counter = function_call_counter.add(1);
                    Project_Law.Proposals_Tree[proposal_index].Function_Calls[function_call_counter] = Project_Law.Proposals_Tree[Parent].Function_Calls[Parent_Proposals_Reuse[i]];
                }else{
                    revert("No existing function_call");
                }
            }else{
                if(new_function_call_counter < New_Function_Call.length){
                    Project_Law.All_Proposed_Function_Calls.push(New_Function_Call[new_function_call_counter]);
                    function_call_counter = function_call_counter.add(1);
                    Project_Law.Proposals_Tree[proposal_index].Function_Calls[function_call_counter] =  all_proposed_function_call_Next_Index;
                    all_proposed_function_call_Next_Index = all_proposed_function_call_Next_Index.add(1);
                    new_function_call_counter = new_function_call_counter.add(1);
                }
                
            }
        }
        
        Project_Law.Proposals_Tree[proposal_index].Function_Call_Counter = function_call_counter;
    }
    
    
    /** 
     * @dev The function can be called to add function calls to a proposition that he has already created (He have to be the author of the proposition). 
     * @param Project_Law Id of the law project the caller wants to add a proposition to. The Id is obtained by hashing the Title with the Description of the law project.
     * @param Proposal Proposition Id to modify.
     * @param New_Items Array of new function calls to add to the Proposition.
     * @param Indexs array of Proposition's function call list indexs to inser new function call (contained in {New_Items}) to. {New_Items} and {Indexs} have the same length.
     * @param author Author of the proposition we want to add new functions calls to.
    */
    function Add_Item_Proposal(Law_Project storage Project_Law, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs, address author) external{
        require(Project_Law.Proposals_Tree[Proposal].Author == author, "You're Not author of proposal" );
        require(New_Items.length == Indexs.length, "Array different size");

        uint counter = Project_Law.Proposals_Tree[Proposal].Function_Call_Counter;
        uint index;
        
        uint insert;
        for(uint i =0; i<New_Items.length; i++){
            index = Indexs[i];
            require(index>0, "Add_item: index 0");
            require(index<= counter.add(1), "Add_item: index out of range");
            Project_Law.All_Proposed_Function_Calls.push(New_Items[i]);
            insert = Project_Law.All_Proposed_Function_Calls.length.sub(1);
            while(index <=  counter){
               ( Project_Law.Proposals_Tree[Proposal].Function_Calls[index], insert) = (insert, Project_Law.Proposals_Tree[Proposal].Function_Calls[index]);
               index = index.add(1);
            }
            counter = counter.add(1);
            Project_Law.Proposals_Tree[Proposal].Function_Calls[index] = insert;
        }
        
        Project_Law.Proposals_Tree[Proposal].Function_Call_Counter = counter;
    }
    


     /**
     * @dev This function execute all function calls of the winning proposal of law project.
     * @param Project_Law Id of the law project. 
     * @param num_function_call_ToExecute Number of function calls to execute.
     * @param register_address Address of the register contract whose register functions would be called by winning proposition's function calls.
     */
    function Execute_Winning_Proposal(Law_Project storage Project_Law, uint num_function_call_ToExecute, address register_address) external returns(bool finished){
        uint winning_proposal = Project_Law.Winning_Proposal;
        uint function_call_nbr = Project_Law.Proposals_Tree[winning_proposal].Function_Call_Counter;
        uint Receipt_Counter = Project_Law.Function_Call_Receipts.length;
        uint remaining_number = function_call_nbr.sub(Receipt_Counter);
        uint function_call_index;
       
        if(num_function_call_ToExecute >= remaining_number){
            num_function_call_ToExecute = remaining_number;
            finished = true;
        }
        
        for(uint i=Receipt_Counter; i<Receipt_Counter.add(num_function_call_ToExecute); i++){
            Project_Law.Function_Call_Receipts.push();
            function_call_index = Project_Law.Proposals_Tree[winning_proposal].Function_Calls[i+1];
            (Project_Law.Function_Call_Receipts[i].Success, Project_Law.Function_Call_Receipts[i].Receipt) = register_address.call(Project_Law.All_Proposed_Function_Calls[function_call_index]);
        }
        
    }
    
    
    /*GETTER*/
    
    /**
     * @dev Get global informations about a law project's proposal. It return the Proposal's description, the list of proposal children, the number of function calls, the parent proposal and author.
     * @param law_project Id of the law project. 
     * @param Id Id of the proposal.
     * @return description
     * @return children
     * @return function_call_counter
     * @return parent
     * @return author
     */
    function Get_Proposal_Infos(Law_Project storage law_project, uint Id) external view returns(bytes memory description, uint[] memory children, uint function_call_counter, uint parent, address author){
        return (law_project.Proposals_Tree[Id].Description, law_project.Proposals_Tree[Id].Children, law_project.Proposals_Tree[Id].Function_Call_Counter, law_project.Proposals_Tree[Id].Parent, law_project.Proposals_Tree[Id].Author);
    }
    
    /**
     * @dev Get the list of function calls of a Proposal.
     * @param law_project Id of the law project. 
     * @param Id Id of the proposal.
     * @return function_call
     */
    function Get_Proposal_FunctionCall_List(Law_Project storage law_project, uint Id) external view returns(bytes[] memory function_call){
        //uint length = List_Law_Project[law_project].Proposals_Tree[Id].Function_Calls.length;
        uint length = law_project.Proposals_Tree[Id].Function_Call_Counter;
        bytes[] memory Function_Calls =  new bytes[](length);
        uint function_call_id;
        for(uint i =1; i<=length; i++){
            function_call_id = law_project.Proposals_Tree[Id].Function_Calls[i];
            Function_Calls[i-1] = law_project.All_Proposed_Function_Calls[function_call_id];
        }
        return Function_Calls;
    }
    
      /**
     * @dev Get the list of all function calls that have been submitted in a law project (no matter in which proposal).
     * @param law_project Id of the law project. 
     * @return function_call
     */
    function Get_FunctionCall_List(Law_Project storage law_project)external view returns(bytes[] memory function_call){
        return law_project.All_Proposed_Function_Calls;
    }
    
      /**
     * @dev Get results of a law project. It returns the id of the winning proposal and an array of receipts returned by winning proposal's function calls.
     * @param law_project Id of the law project. 
     * @return winning_proposal
     * @return receipt
     */
    function Get_Law_Project_Results(Law_Project storage law_project) external view returns(uint winning_proposal, Function_Call_Result[] memory receipt){
        return (law_project.Winning_Proposal, law_project.Function_Call_Receipts);
    }
    
}