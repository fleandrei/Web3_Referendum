// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "contracts/Register.sol";
//import "Register.sol";
/**
 * @notice Contract registering written laws. 
 * @dev Laws can be edited (add, remove) by address contained in {Register_Authorities} list (Defined in the "Register" inherited contract)
 * 
 * */
 contract Loi is Register{
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    
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
    
    /**
     * @dev Mapping of All registered in the contract (No matter which Law they belong to). The key is the keccak256 hash of it's Title and Content field. 
     * */
    mapping(bytes32=>Article) public Articles;
    
    /**
     * @dev Mapping of all Laws registered in the contract. The key is a bytes corresponding to the Title of the Law. The title can be clear or hashed. 
     * */
    mapping(bytes=>Law) Lois; // Title=>Law
    
    /**
     * @dev List of all laws of registered in the contract. 
     * */
    bytes[] List_Lois;
    
    
    /**
     * @dev Add the address of Agora Contract to {Register_Authorities}.
     * 
     * @param agora Address of Agora contract
     * */
    constructor(string memory Name, address agora) Register(Name){
        Type_Institution = Institution_Type.LOI;
        Register_Authorities.add(agora);
    }
    
    
    /*Register API functions. Callable by Register_Authorities contracts*/
    
    
    /**
     * @notice Add a new law to the register
     * 
     * @param Title title of the law. It's the ID of the law
     * @param Description Text explaining the aim of the law
     * 
     * @dev Parameters can be hashed! The new law is added to {Lois} mapping and to {List_Lois} array.
    */
    function AddLaw(bytes memory Title, bytes memory Description) external Register_Authorities_Only {
        require(Lois[Title].Timestamp == 0, "Loi: Title already existing");
      
        List_Lois.push(Title);
        Lois[Title].Index = List_Lois.length - 1;
        Lois[Title].Description = Description;
        Lois[Title].Timestamp = block.timestamp;
        emit Law_Created(Title);
        
    }
    
    /**
     * @notice Add a new article to an existing law
     * 
     * @param Law_Title Title of the law we want to add a new article. The corresponding law must exist.
     * @param Article_Title Title of the Article
     * @param Content Text content of the article
     * 
     * @dev The ID of an article is the keccak256 hash of it's title and it's content. So (Article_Title, Content) tutple is the ID of the article and have to be unique among all registered Articles.
     */
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
    
    
    /**
     * @notice Change the Description of an existing law
     * 
     * @param Law_Title Title of the Law 
     * @param new_Description New description of the law
     * 
     * @dev We can't change the "Title" field of the Law as it's his ID 
     */
    function Change_Law_Description(bytes memory Law_Title, bytes memory new_Description)external Register_Authorities_Only {
        
        require(Lois[Law_Title].Timestamp !=0, "Loi: Law doesn't exist");
        Lois[Law_Title].Description = new_Description;
        
        emit Description_Changed(Law_Title);
    }
    
    
    /**
     * @notice Remove an article from a law
     * 
     * @param Law_Title Title of the Law from which we want to remove an Article
     * @param article Hash ID of the article to remove
     * 
     * @dev The Article is deleted from {Articles} mapping and from corresponding Law {List_Articles} List field
     * 
     * */
    function Remove_Article(bytes memory Law_Title, bytes32 article) external Register_Authorities_Only {
    
        require(Lois[Law_Title].Timestamp >0 && Articles[article].Timestamp > 0, "Non existing article/law" );
        require(Lois[Law_Title].List_Articles.contains(article), "Article no exist in this law");
       
        delete Articles[article];
        Lois[Law_Title].List_Articles.remove(article);
        
        emit Article_Removed(Law_Title, article);
        
    }
    
    
    /**
     * @notice Remove a law
     * 
     * @param law Title of the Law we want to remove
     * 
     * @dev All Articles of the law are deleted from {Articles} mapping. The Law is deleted from {List_Lois} mapping and from {Lois} Array.
     * 
     * */
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
        emit Law_Removed(law);
    }
    
    /*function Check_Function_Call(bytes memory Data) public override view returns(bool){
        
    }*/
    
    
    
    /*GETTERS*/
    /*function Get_Number_of_Law() external view returns(uint){
        return List_Lois.length;
    }*/
    
    
    /**
     * @dev Return the list of all laws's titles registered in the contract
     * @return list_lois Array of of all registered laws's titles
     * */
    function Get_Law_List() external view returns(bytes[] memory list_lois){
        return List_Lois;
    }
    
    /**
     * @dev Return the list of all articles contained by a specific law
     * @param law Title of the law from which we want to get all Articles.
     * @return law_article_list Array of all articles ID of a law
     * */
    function Get_Law_Article_List(bytes calldata law )external view returns(bytes32[] memory law_article_list){
        return Lois[law].List_Articles._inner._values;
    }
    
    /**
     * @dev Return informations about a specific law.
     * @param law Title of the law from which we want to get Infos.
     * @return description {Description} field of the law
     * @return timestamp {Timestamp} field of the law
     * */
    function Get_Law_Info(bytes calldata law) external view returns(bytes memory description, uint timestamp){
        return (Lois[law].Description, Lois[law].Timestamp);
    }
    
    
    /*Utils Temporaire*/
    
    function Encode_Articles(bytes memory title, bytes memory content) external pure returns(bytes32){
        return keccak256(abi.encode(title, content));
    }
        
    //0x0000000000000000000000000000000000000000
    
    
}