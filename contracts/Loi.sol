pragma solidity ^0.8.0;

import "contracts/Register.sol";
//import "Register.sol";


 contract Loi is Register{
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using SafeMath for uint;
    
    /*struct Clear_Article{
        string Title;
        string Content;
        uint Timestamp;
    }*/
    
    struct Article{
        bytes Title;
        bytes Content;
        uint Timestamp;
    }
    
    struct Law{
        uint Index;
        bytes Title;
        bytes Description;
        EnumerableSet.Bytes32Set List_Articles;
        uint Timestamp;
    }
    
    event Law_Created(bytes title);
    event Article_Created(bytes law_title, bytes32 key);
    event Article_Removed(bytes law_title, bytes32 key);
    event Description_Changed(bytes title);
    event Law_Removed(bytes title);
    
    /*State*/
    //mapping(bytes32=>Clear_Article) public Claire_Articles;
    mapping(bytes32=>Article) public Articles;
    mapping(bytes=>Law) Lois; // Title=>Law
    bytes[] List_Lois;
    
    
    
    constructor(address agora){
        Type_Institution = Institution_Type.LOI;
        Register_Authorities.add(agora);
    }
    
    
    /*Register API functions. Callable by other contracts*/
    function AddLaw(bytes memory Title, bytes memory Description) external Register_Authorities_Only {
        require(Lois[Title].Timestamp == 0, "Loi: Title already existing");
      
        List_Lois.push(Title);
        Lois[Title].Index = List_Lois.length.sub(1);
        Lois[Title].Description = Description;
        Lois[Title].Timestamp = block.timestamp;
        emit Law_Created(Title);
        
    }
    
    function AddArticle(bytes memory Law_Title, bytes memory Article_Title, bytes memory Content ) external Register_Authorities_Only {
        require(Lois[Law_Title].Timestamp != 0, "Loi: Non existing law");
       
        bytes32 key = keccak256(abi.encode(Article_Title, Content));
        require(Articles[key].Timestamp ==0, "Loi: Already existing article");
        
        Articles[key].Title = Article_Title;
        Articles[key].Content = Content;
        Articles[key].Timestamp = block.timestamp;
        Lois[Law_Title].List_Articles.add(key);
        
        emit Article_Created(Law_Title, key);
        
    }
    
    
    
    function Change_Law_Description(bytes memory law, bytes memory new_Description)external Register_Authorities_Only {
        
        require(Lois[law].Timestamp ==0, "Loi: Law doesn't exist");
        Lois[law].Description = new_Description;
        
    }
    
    
    function Remove_Article(bytes memory Law_Title, bytes32 article) external Register_Authorities_Only {
    
        require(Lois[Law_Title].Timestamp ==0 || Articles[article].Timestamp == 0, "Loi: Non existing article" );
        require(!Lois[Law_Title].List_Articles.contains(article), "Article no exist in this law");
       
        delete Articles[article];
        Lois[Law_Title].List_Articles.remove(article);
        
        emit Article_Removed(Law_Title, article);
        
    }
    
    
    
    function Remove_Law(bytes memory law) external Register_Authorities_Only {
       
        require(Lois[law].Timestamp !=0, "Law doesn't exist");
        uint law_num = List_Lois.length;
        bytes memory Last_Value = List_Lois[law_num-1];
        List_Lois[Lois[law].Index] = Last_Value;
        List_Lois.pop();
        
        uint article_num = Lois[law].List_Articles._inner._values.length;
        for(uint i=0; i<article_num;i++){
            delete Articles[Lois[law].List_Articles._inner._values[i]];
        }
        
        delete Lois[law];
    }
    
    /*function Check_Function_Call(bytes memory Data) public override view returns(bool){
        
    }*/
    
    
    
    /*GETTERS*/
    /*function Get_Number_of_Law() external view returns(uint){
        return List_Lois.length;
    }*/
    
    function Get_Law_List() external view returns(bytes[] memory){
        return List_Lois;
    }
    
    
    function Get_Law_Article_List(bytes calldata law )external view returns(bytes32[] memory){
        return Lois[law].List_Articles._inner._values;
    }
    
    function Get_Law_Info(bytes calldata law) external view returns(bytes memory, uint){
        return (Lois[law].Description, Lois[law].Timestamp);
    }
    
    
    /*Utils Temporaire*/
    
    function Encode_Articles(bytes memory title, bytes memory content) external pure returns(bytes32){
        return keccak256(abi.encode(title, content));
    }
        
    //0x0000000000000000000000000000000000000000
    
    
}