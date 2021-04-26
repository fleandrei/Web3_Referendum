import Constitution_Artifact from "./contracts/Constitution.json";
import API_Register_Artifact from "./contracts/API_Register.json";
import Agora_Artifact from "./contracts/Agora.json";
import Delegation_Artifact from "./contracts/Delegation.json";

//import LOI_Artifact from "./contracts/Loi.json";

const EventEmitter = require('events');
function Bytes32ToAddress(str){
  return str.slice(0,2) + str.slice(26);
}  

function Remove_Numerical_keys(obj){
  var obj_len= obj.length;
  for(var i=0; i<obj_len; i++){
    console.log("obj[",i,"]= ",obj[i]);
    delete obj[i];
  }
  return obj;
}

class Register {
  constructor(web3){
    this.web3=web3;
    this.Event = new EventEmitter();
    this.Name=null;
    this.Instance=null;
    this.Register_Authorities=[];
    this.Mapping_Functions_Selector=new Map();
    this.Register_Functions=new Map();
  }

  Encode_Register_Functions_ByName=async(Function_Name, Param_Values)=>{
    var function_selector = this.Register_Functions_Selector.get(Function_Name);
    return function_selector+this.web3.eth.abi.encodeParameters(this.Register_Functions.get(function_selector).Param_Types, Param_Values).slice(2);
  }

  Encode_Register_Functions_BySelector=async(Function_Selector, Param_Values)=>{
    return Function_Selector+this.web3.eth.abi.encodeParameters(this.Register_Functions.get(Function_Selector).Param_Types, Param_Values).slice(2);
  }

  Decode_Register_Function = async(Function_Call)=>{
    var function_selector = Function_Call.slice(0,10);
    console.log("Decode: function_selector:",function_selector);
    var Values_Obj = this.web3.eth.abi.decodeParameters(this.Register_Functions.get(function_selector).Param_Types, function_selector.slice(10));
    console.log("Decode: param Values", Object.values(Values_Obj));
    return({Name:this.Register_Functions.get(function_selector).Name, Param_Types:this.Register_Functions.get(function_selector).Param_Types, Param_Values:Object.values(Values_Obj)})
  }

  Set_Register_Events = async()=> {
    console.log("Set_Register_Events: this.Instance:",this.Instance)
    await this.Instance.events.Constitution_Changed(this.Handle_Constitution_Changed);
    await this.Instance.events.Name_Changed(this.Handle_Name_Changed);
    await this.Instance.events.Authority_Added(this.Handle_Authority_Added);
    await this.Instance.events.Authority_Removed(this.Handle_Authority_Removed);
  }

  Handle_Name_Changed= async(err,event)=>{
    var name = await this.Instance.methods.Name().call();
    console.log("\nName:",name,"\n Typeof Name:",typeof name);
     this.Name = name;
    this.Event.emit("State_Changed");
    this.Event.emit("Name_Changed");
  }

  Handle_Constitution_Changed = async(err,event)=>{
    this.Event.emit("State_Changed");
    this.Event.emit("Constitution_Changed");
  }

  Handle_Authority_Added = async(err,event)=>{
    this.Register_Authorities.push(event.returnValues.authority);
    this.Event.emit("Authority_Added");
    this.Event.emit("State_Changed");
  }

  Handle_Authority_Removed = async(err,event)=>{
    this.Register_Authorities= this.Register_Authorities.filter(item=>{ return item !== event.returnValues.authority});
    this.Event.emit("Authority_Removed");
    this.Event.emit("State_Changed");
  }

}

class Governance_Instance{
  constructor(web3){
    this.web3=web3;
    this.Event = new EventEmitter();
    this.Name=null;
    this.Instance=null;
    this.Law_Project_List=new Map();
  }

  //Add_Law_Project = async ()=>{
  
}

class Delegation extends Governance_Instance{
  constructor(web3){
    super(web3);
    this.Pending_Law=new Map();
    this.Aborted_Law=new Map();
    this.Executed_Law=new Map();
    this.Law_process_Parameters=null;
    this.Internal_Governance=null;
  }


  SetInstance = async (contract_address)=>{
    this.Instance = new this.web3.eth.Contract(
      Delegation_Artifact.abi,
      contract_address //deployedNetwork && deployedNetwork.address,
    ); 
    
    await this.LoadState();
  }

  LoadState= async () => {

    this.Name = await this.Instance.methods.Name().call();
    
    console.log("Name:",this.Name);
    console.log("this",this);

    this.Event.emit("State_Loaded");
  }

}



class Agora_Specific_Register extends Governance_Instance {
  constructor(web3){
    super(web3);
    this.Register_Address=null;
    this.Pending_Referendums=new Map();
    this.Aborted_Referendums=new Map();
    this.Executed_Referendums=new Map();
    this.Referendum_Parameters=null;

  }


  SetInstance = async (contract_address, register_address)=>{
    this.Register_Address = register_address;
    this.Instance = new this.web3.eth.Contract(
      Agora_Artifact.abi,
      contract_address //deployedNetwork && deployedNetwork.address,
    ); 
    
    await this.LoadState();
  }

  LoadState= async () => {
    var register_param = await this.Instance.methods.Get_Referendum_Register(this.Register_Address).call();
    var Last_Param_Version = register_param.last_version;
    var List_Referendum_key= register_param.list_referendums;

    this.Referendum_Parameters = Array.from({length:Last_Param_Version});

    for (var i = 1; i <=Last_Param_Version; i++) {
      var Parameters = await this.Instance.methods.Get_Referendum_Register_Parameters(this.Register_Address, i).call();
      this.Referendum_Parameters[i-1] = Remove_Numerical_keys(Parameters);//.slice(Parameters.length/2);
      console.log("Parameters: ",this.Referendum_Parameters[i-1], "\nTypeof Parameters", typeof Parameters);  
    }

    this.Pending_Referendums.clear();
    this.Aborted_Referendums.clear();
    this.Executed_Referendums.clear();
    this.Law_Project_List.clear();

    List_Referendum_key.forEach((key, idx)=>{
      var referendum = this.Instance.methods.Referendums(key).call();
      var law_project = this.Instance.methods.Law_Project_List(key).call();
      console.log("Agora Loadstate: referendum",referendum,"\n law_project:",law_project);
      if(referendum.Referendum_Status==3){
        this.Executed_Referendums.set(key,referendum);
      }else if(referendum.Referendum_Status==4){
        this.Aborted_Referendums.set(key,referendum);
      }else{
        this.Pending_Referendums.set(key,referendum);
      }

      this.Law_Project_List.set(key,law_project);
    });

    this.Name = await this.Instance.methods.Name().call();
    console.log("Name:",this.Name);
    console.log("this",this);

    this.Event.emit("State_Loaded");
  }

}

class Constitution extends Register{
  constructor(web3){
    super(web3);

    //this.Instance=null;
    this.Transitional_Government = null;
    this.Is_Transitional_Government = true;
    this.Agora_Address = null;
    this.Agora= new Agora_Specific_Register(web3);
    this.Citizens_Register_Address =null;
    this.DemoCoin_Address = null;
    /*this.Delegation_List= new Map();
    this.Loi_Register_List=new Map();
    this.API_Register_List= new Map();*/
    this.Delegation_List= [];
    this.Loi_Register_List= [];
    this.API_Register_List= [];
    //this.Constitution_Parameters=null;

    /*Add Register functions*///0x4b5c2734
    this.Mapping_Functions_Selector.set("Add_Register_Authority","0x4b5c2734");
    this.Register_Functions.set("0x4b5c2734", {Name:"Add_Register_Authority",Param_Types:["address","address"], Param_Names:["register","authority"]});

    this.Mapping_Functions_Selector.set("Remove_Register_Authority","0xcaf1f81f");
    this.Register_Functions.set("0xcaf1f81f", {Name:"Remove_Register_Authority",Param_Types:["address","address"], Param_Names:["register","authority"]});

    this.Mapping_Functions_Selector.set("Set_Instances_Constitution","0x5a014a14");
    this.Register_Functions.set("0x5a014a14", {Name:"Set_Instances_Constitution",Param_Types:["address","address"], Param_Names:["instance_address","new_address"]});

    this.Mapping_Functions_Selector.set("Set_Institution_Name","0xaeb53b64");
    this.Register_Functions.set("0xaeb53b64", {Name:"Set_Institution_Name",Param_Types:["address","string"], Param_Names:["instance_address","name"]});

    this.Mapping_Functions_Selector.set("Set_Minnter","0xca1eb16a");
    this.Register_Functions.set("0xca1eb16a", {Name:"Set_Minnter",Param_Types:["address[]","address[]"], Param_Names:["Add_Minter","Remove_Minter"]});

    this.Mapping_Functions_Selector.set("Set_Burner","0xd963545d");
    this.Register_Functions.set("0xd963545d", {Name:"Set_Burner",Param_Types:["address[]","address[]"], Param_Names:["Add_Burner","Remove_Burner"]});

    this.Mapping_Functions_Selector.set("Set_Citizen_Mint_Amount","0x811a5c1f");
    this.Register_Functions.set("0x811a5c1f", {Name:"Set_Citizen_Mint_Amount",Param_Types:["uint256"], Param_Names:["amount"]});

    this.Mapping_Functions_Selector.set("Citizen_Register_Remove_Authority","0x1b5cb360");
    this.Register_Functions.set("0x1b5cb360", {Name:"Citizen_Register_Remove_Authority",Param_Types:["address"], Param_Names:["removed_authority"]});

    this.Mapping_Functions_Selector.set("Add_Registering_Authority","0x05ff1b36");
    this.Register_Functions.set("0x05ff1b36", {Name:"Add_Registering_Authority",Param_Types:["address"], Param_Names:["new_authority"]});

    this.Mapping_Functions_Selector.set("Add_Banning_Authority","0xfb252e2d");
    this.Register_Functions.set("0xfb252e2d", {Name:"Add_Banning_Authority",Param_Types:["address"], Param_Names:["new_authority"]});

    this.Mapping_Functions_Selector.set("Create_Register","0x1529356f");
    this.Register_Functions.set("0x1529356f", {Name:"Create_Register",Param_Types:["string","uint8","uint256","uint256","uint256","uint256","uint256","uint16","address"], Param_Names:["Name",
     "register_type", "Petition_Duration", "Vote_Duration", "Vote_Checking_Duration", "Law_Initialisation_Price", "FunctionCall_Price", "Required_Petition_Rate", "Ivote_address"]});

    this.Mapping_Functions_Selector.set("Set_Register_Param","0x2cef26ca");
    this.Register_Functions.set("0x2cef26ca", {Name:"Set_Register_Param",Param_Types:["address", "uint256", "uint256", "uint256", "uint256", "uint256", "uint16", "address"], Param_Names:[
     "register_address", "Petition_Duration", "Vote_Duration", "Vote_Checking_Duration", "Law_Initialisation_Price", "FunctionCall_Price", "Required_Petition_Rate", "Ivote_address"]});
  }


  SetInstance = async (contract_address)=>{
    this.Instance = new this.web3.eth.Contract(
      Constitution_Artifact.abi,
      contract_address //deployedNetwork && deployedNetwork.address,
    ); 
    
    await this.Set_Register_Events();
    this.Instance.events.Transitional_Government_Finised(this.Handle_Transitional_Government_Finised);
    this.Instance.events.Register_Created(this.Handle_Register_Created);
    this.Instance.events.Delegation_Created(this.Handle_Delegation_Created);
    await this.LoadState();
  }

  LoadState= async () => {
    /*this.Loi_Register_List.clear();
    this.API_Register_List.clear();*/
    this.Loi_Register_List = [];
    this.API_Register_List = [];

    this.Name = await this.Instance.methods.Name().call();
    this.Register_Authorities = [...(await this.Instance.methods.Get_Authorities().call()).map(Bytes32ToAddress)];
    this.Transitional_Government = await this.Instance.methods.Transitional_Government().call();
    var Agora_Address = await this.Instance.methods.Agora_Instance().call();
    this.Citizens_Register_Address = await this.Instance.methods.Citizen_Instance().call();;
    this.DemoCoin_Address = await this.Instance.methods.Democoin_Instance().call();
    
    
    await this.Agora.SetInstance(Agora_Address, this.Instance._address);
    console.log("this.Register_Authorities", this.Register_Authorities,",\n Transitional_Government",this.Transitional_Government);
    if(!this.Register_Authorities.includes(this.Transitional_Government.toLowerCase())){
      this.Is_Transitional_Government=false;
    }

    /*Register initialisation*/
    var register_address_list = await this.Instance.methods.Get_Register_List().call();
    register_address_list=register_address_list.map(Bytes32ToAddress);

    register_address_list.forEach(async (address,i,arr)=>{
      var API_Register_Instance = new this.web3.eth.Contract(
        API_Register_Artifact.abi,
        address,
      );

      var register_type = await API_Register_Instance.methods.Type_Institution().call();
      console.log("register_type",register_type);
      if(register_type==3){
        this.Loi_Register_List.push(address);
      }else if(register_type==4){
        this.API_Register_List.set(address);
      }
    });

    /*register_address_list.forEach(async (address,i,arr)=>{
      var API_Register_Instance = new this.web3.eth.Contract(
        API_Register_Artifact.abi,
        address,
      );

      var last_version= (await this.Agora.Instance.methods.Get_Referendum_Register(address).call()).last_version;
      var Parameters = Array.from({length:last_version})
      for (var i = 1; i <=last_version; i++) {

        Parameters[i-1]= await this.Agora.Instance.methods.Get_Referendum_Register_Parameters(address, i).call()
      }
      //Parameters=Parameters.map( (elem,idx)=> {return (await this.Agora.Instance.methods.Get_Referendum_Register_Parameters(address, idx+1).call()}));
      var Authorities = await API_Register_Instance.methods.Get_Authorities().call();
      
      var register_object= {Parameters:Parameters, Authorities:Authorities}

      var register_type = await API_Register_Instance.methods.Type_Institution().call();
      console.log("register_type",register_type);
      if(register_type==3){
        this.Loi_Register_List.set(address, register_object);
      }else if(register_type==4){
        this.API_Register_List.set(address, register_object);
      }else if(register_type==0){
        this.Constitution_Parameters = Parameters;
      }
    });*/

    


    /*Delegation Initialisation*/
    var delegation_address_list = await this.Instance.methods.Get_Delegation_List().call();


    console.log("Name:",this.Name);
    console.log("this",this);
    console.log("Delegation_Address_List",this.Delegation_Address_List);
    console.log("Agora_Instance:", this.Agora_Address, ", Citizen_Instance", 
      this.Citizens_Register_Address, ", Democoin_Instance", this.DemoCoin_Address);

    this.Event.emit("State_Loaded");
  }

  Handle_Transitional_Government_Finised = async(err,ev) =>{
    this.Is_Transitional_Government = false;
    this.Event.emit("State_Changed");
    this.Event.emit("Transitional_Government_Finised");
  };

  Handle_Register_Created = async(err,ev)=>{
    if(err){
      console.error(err);
    }else{
      var register_type = (await this.Agora.Instance.Get_Referendum_Register(ev.returnValues.register).call()).institution_type
      if(register_type==3){
        this.Loi_Register_List.push(ev.returnValues.register);
        this.Event.emit("New_Loi_Register", ev.returnValues.register);
      }else if(register_type==4){
        this.API_Register_List.push(ev.returnValues.register);
        this.Event.emit("New_API_Register", ev.returnValues.register);
      }

      this.Event.emit("State_Changed");
    }
  };

  Handle_Delegation_Created = async(err,ev)=>{
    if(err){
      console.error(err);
    }else{
      var register_type = (await this.Agora.Instance.Get_Referendum_Register(ev.returnValues.register).call()).institution_type
      this.Delegation_Address_List.push(ev.returnValues.delegation);
      this.Event.emit("New_Delegation", ev.returnValues.delegation);
      this.Event.emit("State_Changed");
    }
  };

  Set_Citizen_Mint_Amount = async( amount, account)=>{
    this.Instance.methods.Set_Citizen_Mint_Amount( amount).send({from:account}).catch(err=>{console.error(err)});
  }

}



export {Constitution, Register, Agora_Specific_Register, Governance_Instance};
