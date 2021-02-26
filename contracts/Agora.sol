pragma solidity ^0.8.0;

import "Initiative_Legislative.sol";

contract Agora is Initiative_Legislative{
    
    
    
    
    
    
    
    
    
    
    
    /*Overite functions*/
    function Before_Add_Law_Project(bytes calldata Title, bytes calldata Description) internal override returns(bytes32){
        
    }
    
    function Before_Add_Corpus_Proposal(bytes32 law_project, uint Parent, uint[] calldata Parent_Proposals_Reuse, bytes[] calldata New_Function_Call, bytes calldata Description) internal override{
        
    }
    
    function Before_Add_Item_Proposal(bytes32 law_project, uint Proposal, bytes[] calldata New_Items, uint[] calldata Indexs) internal override{
        
    }
}