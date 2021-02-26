pragma solidity ^0.8.0;
//pragma experimental ABIEncoderV2;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol";
import "Institution.sol";

abstract contract  Initiative_Legislative is Institution{
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using SafeMath for uint;
    
    struct Corpus_Proposal{
        bytes Description;
        //uint[] Function_Calls;
        mapping(uint=>uint) Function_Calls; //Begins at 1
        uint Function_Call_Counter;
        uint[] Children;
        uint Parent;
    }
    
    struct Law_Project{
        bytes Title;
        //string Clear_Description;
        bytes Description;
        bytes[] All_Proposed_Function_Calls; 
        mapping(uint=>Corpus_Proposal) Proposals_Tree; // uint 0 is the root. Real Proposals begin at uint 1
        uint Proposal_Count;
        uint Winning_Proposal;
    }
    
    event New_Law_Project(bytes32 Key);
    event New_Proposal(bytes32 Law_Project, uint Index);
    
    mapping(bytes32 => Law_Project) public List_Law_Project;
    bytes32[] public Failed_Law_Project;
    EnumerableSet.Bytes32Set Pending_Law_Project;
    bytes32[] public Achieved_Law_Project;
    
    
    
    /**
     * @notice Add a new law project
     * @param Description Text explaining the spirit and generals goals of the law project 
     * @dev It's advised to enter parameters as hash.
    */
    function Add_Law_Project(bytes calldata Title, bytes calldata Description)external{
        
        bytes32 key = Before_Add_Law_Project(Title, Description);//keccak256(abi.encode(Title,Description));
        require(List_Law_Project[key].Proposal_Count == 0, "Already existing Law_Project");
        List_Law_Project[key].Title= Title;
        List_Law_Project[key].Description = Description;
        //List_Law_Project[key].Global_Function_Calls.push();
        Pending_Law_Project.add(key);
        
        emit New_Law_Project(key);
    }
    
    function Before_Add_Law_Project(bytes calldata Title, bytes calldata Description) internal virtual returns(bytes32);
    
    function Add_Corpus_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) external{
        Before_Add_Corpus_Proposal(law_project, Parent, Parent_Proposals_Reuse, New_Function_Call, Description);
        
        List_Law_Project[law_project].Proposal_Count = List_Law_Project[law_project].Proposal_Count.add(1);
        uint proposal_index = List_Law_Project[law_project].Proposal_Count;
        
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
    
    
    function Before_Add_Corpus_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) internal virtual;
    
    function Add_Item_Proposal(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) external{
       
        Before_Add_Item_Proposal( law_project,  Proposal, New_Items, Indexs);
        
        uint counter = List_Law_Project[law_project].Proposals_Tree[Proposal].Function_Call_Counter;
        uint index;
        
        uint insert;
        for(uint i =0; i<New_Items.length; i++){
            index = Indexs[i];
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
    
    function Before_Add_Item_Proposal(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) internal virtual;
    
    
    /*Getters*/
    function Get_Pending_Law_Project() external view returns(bytes32[] memory){
        return Pending_Law_Project._inner._values;
    }
    
    
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
    
    //0x0000000000000000000000000000000000000000000000000000000000000000
}