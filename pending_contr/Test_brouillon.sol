pragma solidity ^0.8.0;
//pragma experimental ABIEncoderV2;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Address.sol";


contract Called_contract{
    
    event LogBytes(bytes data);
    
    
    uint Nbr;
    string public name="Name";
    
    constructor()  { }
    
    function getNbr() public view returns(uint){
        return Nbr;
    }
    
    function setNbr(uint _nbr)public {
        Nbr=_nbr;
    }
    
    function getbytes(bytes calldata data) external{
        emit LogBytes(data);
    }
    
    
}

/*contract Institution{
    
    event LogBytes(bytes data);
    
    
    uint Nbr;
    string public name="";
    
    constructor() public { }
    
    function getNbr() public view returns(uint){
        return Nbr;
    }
    
    function setNbr(uint _nbr)public {
        Nbr=_nbr;
    }
    
    function getbytes(bytes calldata data) external{
        emit LogBytes(data);
    }
    
    
}*/


contract API_Ruler{
    using Address for address;
    
    enum arg_type{_uint, _string, _bytes}


    event LogUint(uint log);
    event Func1_Called(uint256 age, string  nom);
    event Func2_Called(bytes arg1, bytes arg2);
    event Func3_Called(Contract_Function arg);
    
    struct Function_Argument{
        string name;
        string _type;
    }
    
    struct Contract_Function{
        string name;
        address contract_address;
        bytes4 selector;
        uint8 arg_num;
        Function_Argument[] arg_list;
    }
    
    struct Smart_Contract{
        string name;
        uint Timestamp;
        bytes32[] function_list;
    }
    
    modifier Authority_Only{
        require(msg.sender == Authority_Address, "Account not allowed");
        _;
    }
    
    Referendum referendum;
    
    address public Authority_Address;
    
    string public Name = "name";
    mapping(address=>Smart_Contract) public Constract_List;
    mapping(bytes32 => Contract_Function) public Functions;
    
    constructor(){
        
        referendum = new Referendum(address(this));
        
        Function_Argument[] memory ArgList = new Function_Argument[](2);
        ArgList[0] = Function_Argument("age","uint256");
        ArgList[1] = Function_Argument("nom","string");
        Contract_Function memory func1 = Contract_Function("Func1", address(this), Signature2Selector("Func1(uint256,string)"), 2, ArgList);
        Function_Argument[] memory ArgList2 = new Function_Argument[](2);
        ArgList2[0] = Function_Argument("arg1","bytes");
        ArgList2[1] = Function_Argument("arg2","bytes");
        Contract_Function memory func2 = Contract_Function("Func2", address(this), Signature2Selector("Func2(bytes,bytes)"), 2, ArgList2);
        
        Function_Argument[] memory ArgList3 = new Function_Argument[](1);
        ArgList3[0] = Function_Argument("arg","Contract_Function");
        Contract_Function memory func3 = Contract_Function("Func3", address(this), Signature2Selector("Func3(Contract_Function)"), 1, ArgList3);
        
        Add_SmartContract("smart contract this", address(this));
        
        AddContractFunction(func1);
        AddContractFunction(func2);
        AddContractFunction(func3);
    }
    
    
    /*Func3 : 0x010c2e7e000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000d9145cce52d386f254917e481eb44e9943f39138f439b7dc0000000000000000000
    0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000
    46e616d650000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000
    0000000000000000000000000040000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000036172670000000000000000000000000000000000000000000000000000000000000000000
    0000000000000000000000000000000000000000000000000000011436f6e74726163745f46756e6374696f6e000000000000000000000000000000*/
    
    /*Func3 parameter: ["name","0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8","0x010c2e7e",1,[["arg","uint"]]]*/
    
    /*Func1: 0x5a823dce0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000
    000000000000000000000000014100000000000000000000000000000000000000000000000000000000000000*/
    
    function GetName() external view returns(string memory){
        return Name;
    }
    
    function stringarray(string[] memory list)public pure returns(string[] memory){
        return list;
    }
    
    function setAuthority_Address(address authority)external {
        Authority_Address = authority;
    }
    
    function Func1(uint256 age, string memory nom) public Authority_Only returns(uint,string memory){
        emit Func1_Called(age,nom);
        return (age,nom);
    }
    
    function Func1_LowCall_Data(uint256 age, string memory nom)external pure returns(bytes memory){
        return abi.encodeWithSignature("Func1(uint256,string)",age,nom);
    }
    
    function Func2(bytes memory arg1, bytes memory arg2) public Authority_Only returns(bytes memory,bytes memory){
        emit Func2_Called(arg1,arg2);
        return (arg1,arg2);
    }
    
    function Func2_LowCall_Data(bytes memory arg1, bytes memory arg2)external pure returns(bytes memory){
        return abi.encodeWithSignature("Func2(bytes,bytes)",arg1,arg2);
    }
    
    function Func3(Contract_Function memory arg) public Authority_Only returns(Contract_Function memory){
        emit Func3_Called(arg);
        return (arg);
    }
    
    function Func3_LowCall_Data(Contract_Function memory arg)external pure returns(bytes memory){
        return abi.encodeWithSignature("Func3(Contract_Function)",arg);
    }
    
    function SubmitFunc1(uint age, string memory nom) public{
        
    }
    
    function Check_Function_Call(address addr, bytes memory Data) public view returns(bool){
        bytes4 selector = bytes4(toUint32(Data, 0));//Extract_bytes(Data, 0, 4);
        
     
            if(Functions[Function_HashId(addr, bytes4(selector))].selector != bytes4(0)){
                return true;
            }else{
                return false;
            }
     
    }
    
    function Call_API(address Contract, string memory signature, uint arg)public returns(bytes memory){
        bytes memory data= abi.encodeWithSignature(signature, arg);
        bytes memory receipt = Contract.functionCall(data,"Error call API");
        return (receipt);
    }
    
    
    function AddContractFunction(Contract_Function memory func) public {
       require(Constract_List[func.contract_address].Timestamp !=0, "Contract not registered");
       bytes32 key = Function_HashId(func.contract_address, func.selector);
       Functions[key].name = func.name;
       Functions[key].contract_address= func.contract_address;
       Functions[key].selector = func.selector;
       Functions[key].arg_num = func.arg_num;
       for(uint i=0; i<func.arg_num; i++){
           Functions[key].arg_list.push(func.arg_list[0]);
       }
       Constract_List[func.contract_address].function_list.push(key);
    }
   
    
    function Add_SmartContract(string memory name, address contract_address) public{
        Constract_List[contract_address].name= name;
        Constract_List[contract_address].Timestamp = block.timestamp;
    }
    
   
   /*function Parametre(bytes memory value, string memory name, string memory arg)public pure returns(Parameter memory){
       return Parameter(value,name,arg);
   }*/
   
   
   
   function Function_HashId(address contract_address, bytes4 selector)public pure returns(bytes32){
       return keccak256(abi.encode(contract_address, selector));
   }
   
   
   
   //GETTER
   
   function get_function_contract_selector(bytes32 funct) external view returns(bytes4){
       return Functions[funct].selector;
   }
   
   
   //UTILS
   
   function Extract_bytes(bytes memory source, uint from, uint length)public pure returns(bytes memory){
      require(source.length >= from+length, "Bytes Subsection out of bounds");
      bytes memory returnValue = new bytes(length);
      for (uint8 i = 0; i < length; i++) {
        returnValue[i] = source[i + from]; 
      }
      return returnValue;
   }
   
   //Vient de la librairy https://github.com/GNSPS/solidity-bytes-utils/blob/master/contracts/BytesLib.sol
   function toUint32(bytes memory _bytes, uint256 _start) internal pure returns (uint32) {
        require(_start + 4 >= _start, "toUint32_overflow");
        require(_bytes.length >= _start + 4, "toUint32_outOfBounds");
        uint32 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x4), _start))
        }

        return tempUint;
    }
   
   function Signature2Selector(string memory sign) public pure returns(bytes4){
       return bytes4(keccak256(abi.encodePacked(sign)));
   }
   
   function TestEncodeArgument() public pure returns(bytes memory, Function_Argument memory){
       //Function_Argument[] memory ArgList = new Function_Argument[](2);
       Function_Argument[2] memory ArgList1 = [Function_Argument("A","uint"), Function_Argument("Ba","string")];
       bytes memory data = abi.encode(ArgList1);
       Function_Argument[2] memory ArgList2 = abi.decode(data, (Function_Argument[2]));
       return (data, ArgList2[0]);
   }
   
   function callEncodeFunction() public  returns(bytes memory, Contract_Function memory, Contract_Function memory){
       Function_Argument[] memory ArgList = new Function_Argument[](2);
       ArgList[0] = Function_Argument("age","uint256");
       ArgList[1] = Function_Argument("nom","string");
       return TestEncodeFunction(ArgList);
   }
   
   function TestEncodeFunction(Function_Argument[] memory ArgList) public view returns(bytes memory, Contract_Function memory, Contract_Function memory){
       /*Function_Argument[] memory ArgList = new Function_Argument[](2);
       ArgList[0] = Function_Argument("age","uint256");
       ArgList[1] = Function_Argument("nom","string");*/
       uint8 len = uint8(ArgList.length);
       Contract_Function memory funct = Contract_Function("func",address(this), Signature2Selector("func(uint256,string)"), len, ArgList);
       bytes memory data = abi.encode(funct);
       Contract_Function memory funct2 = abi.decode(data, (Contract_Function));
       return (data, funct, funct2);
   }
   
    function Argument2Bytes(string memory name, string memory _type) public pure returns(bytes memory){
        return abi.encode(Function_Argument(name,_type));
    }
    
    function Bytes2Argument( bytes memory arg) public pure returns(Function_Argument memory){
        return abi.decode(arg,(Function_Argument));
    }
    
    
    
    function Uint82bytes(uint8 source) public pure returns(bytes memory){
        return abi.encodePacked(source);
    }
    
    function bytes2Uint8(bytes memory source) public pure returns(uint8){
        return abi.decode(source,(uint8));
    }
    
    // Make sure that string is not longer than 32 bytes or result will be cut
    function stringToBytes32(string memory source) public pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }
    
    // Make sure that string is not longer than 32 bytes or result will be cut
    function stringToBytes(string memory source) public pure returns (bytes memory result) {
        bytes memory tempEmptyStringTest = bytes(source);
        /*if (tempEmptyStringTest.length == 0) {
            return 0x00;
        }*/

        /*assembly {
            result := mload(add(source, 32))
        }*/
        result=tempEmptyStringTest;
    }
    
    function stringEncryption(string memory source) public pure returns (bytes memory result) {
        bytes memory tempEmptyStringTest = abi.encode(source);
        /*if (tempEmptyStringTest.length == 0) {
            return 0x00;
        }*/

        /*assembly {
            result := mload(add(source, 32))
        }*/
        result=tempEmptyStringTest;
    }
}





contract Referendum{
    
    struct Parameter{
        bytes value;
        string name;
        string _type;
    }
    
    struct Function_Call{
        bytes Data;
        address contract_address;
    }
    
    API_Ruler Administered_Institution;
    mapping(string=>Function_Call[]) public Project;
    
    constructor(address _institution) {
        Administered_Institution = API_Ruler(_institution);
    }
    
    function Call_AddProject(string memory name, address[] memory Addrs, bytes[] memory Datas)external returns(Function_Call[] memory){
        Function_Call[] memory Calls = new Function_Call[](Datas.length);
        for(uint i=0; i<Datas.length; i++){
            Calls[i] = Function_Call(Datas[i], Addrs[i]);
        }
        AddProject(name, Calls);
        return Calls;
    }
    
    function AddProject(string memory name, Function_Call[] memory calls) public {
        require(Project[name].length == 0,"already existing project");
        
        for(uint i =0; i<calls.length; i++ ){
            require(Administered_Institution.Check_Function_Call(calls[i].contract_address, calls[i].Data), "Non existing Function");
            Project[name].push(Function_Call(calls[i].Data, calls[i].contract_address));
            //Copy_Function_Call(Project[name][Project[name].length -1], calls[i]);
        }
    }
    
    
    function AddFunctionCall(string memory name, Function_Call memory func) external {
        //require(Project[name].length == 0,"already existing project");
        require(Administered_Institution.Check_Function_Call(func.contract_address, func.Data), "Non existing Function");
        Project[name].push(Function_Call(func.Data, func.contract_address));
       
    }
    
    /*function Copy_Function_Call(Function_Call storage dest, Function_Call memory src) internal{
        dest.name = src.name;
        dest.arg_num = src.arg_num;
        dest.selector = src.selector;
        dest.contract_address = src.contract_address;
        for(uint i=0; i<src.parameter_list.length;i++){
            dest.parameter_list.push(src.parameter_list[i]);
        }
        //dest.parameter_list = src.parameter_list;
    }*/
    
    function ExecuteProject(string memory name)external{
        require(Project[name].length != 0," project doesn't exist");
        bool success;
        for(uint i=0; i<Project[name].length; i++){
            (success,)=Project[name][i].contract_address.call(Project[name][i].Data);
            if(!success) revert("Functin call didn't worked");
        }
    }
    
    //GETTER
    
    function Get_API_Ruler_name()public view returns(string memory){
        return Administered_Institution.Name();
    }
    
    
    //UTILS
    function Function_HashId(address contract_address, bytes4 selector)public pure returns(bytes32){
       return keccak256(abi.encode(contract_address, selector));
   }
    
    function Parameter2Bytes(bytes memory value, string memory name, string memory arg) public pure returns(bytes memory){
        return abi.encode(Parameter(value,name,arg));
    }
    
    function Bytes2Parameter( bytes memory arg) public pure returns(Parameter memory){
        return abi.decode(arg,(Parameter));
    }
    
}