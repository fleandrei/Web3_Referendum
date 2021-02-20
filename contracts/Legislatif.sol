pragma solidity ^0.8.0;


import "Register.sol";


abstract contract Legislatif_Claire is Register{
    
    
    
    struct Article_Claire{
        string Title;
        string Content;
        uint TimeStamp;
    }
    
    struct Article_Hashed{
        bytes32 Title;
        bytes32 Content;
        uint Timestamp;
    }
    
    struct Loi{
        string Title;
        string Description;
        bytes32[] List_Articles;
        uint Timestamp;
    }
    
    /*State*/
    mapping(bytes32=>Article_Claire) public Articles;
    mapping(string=>Loi) public Lois;
    string[] public List_Lois;
    
    
    
    
    
    
    
    
    
    /*GETTERS*/
    function Get_Number_of_Law() external view returns(uint){
        return List_Lois.length;
    }
    
    function Get_Law_List() external view returns(string[] memory){
        return List_Lois;
    }
    
    
}