import Constitution_Artifact from "./contracts/Constitution.json";
import API_Register_Artifact from "./contracts/API_Register.json";
import Agora_Artifact from "./contracts/Agora.json";
import Delegation_Artifact from "./contracts/Delegation.json";
import DemoCoin_Artifact from "./contracts/DemoCoin.json";
import LOI_Artifact from "./contracts/Loi.json";
import Citizens_Artifact from "./contracts/Citizens_Register.json";
//import LOI_Artifact from "./contracts/Loi.json";

import DemoCoin from "./DemoCoin";
import Majority_Judgment_Ballot from "./Majority_Judgment_Ballot";
import {Bytes32ToAddress, Remove_Numerical_keys} from "./Utils";

const EventEmitter = require('events');



class Register {
  constructor(web3){
    this.web3=web3;
    this.Event = new EventEmitter();
    this.Name=null;
    this.Instance=null;
    this.Agora=new Agora_Specific_Register(web3, this.Event);
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
    if(err){
      alert(this.Name+" (Register): Handle_Name_Changed event error. Check console for details");
      console.error(err);
    }else{
      var name = await this.Instance.methods.Name().call();
      console.log("\nName:",name,"\n Typeof Name:",typeof name);
      this.Name = name;
      this.Event.emit("State_Changed");
      this.Event.emit("Name_Changed");
    }
  }

  Handle_Constitution_Changed = async(err,event)=>{
    if(err){
      alert(this.Name+" (Register): Handle_Constitution_Changed event error. Check console for details");
      console.error(err);
    }else{
      this.Event.emit("State_Changed");
      this.Event.emit("Constitution_Changed");
    }
  }

  Handle_Authority_Added = async(err,event)=>{
    if(err){
      alert(this.Name+" (Register): Handle_Authority_Added event error. Check console for details");
      console.error(err);
    }else{
      this.Register_Authorities.push(event.returnValues.authority);
      this.Event.emit("Authority_Added");
      this.Event.emit("State_Changed");
    }
  }

  Handle_Authority_Removed = async(err,event)=>{
    if(err){
      alert(this.Name+" (Register): Handle_Authority_Removed event error. Check console for details");
      console.error(err);
    }else{
      this.Register_Authorities= this.Register_Authorities.filter(item=>{ return item !== event.returnValues.authority});
      this.Event.emit("Authority_Removed");
      this.Event.emit("State_Changed");
    }
  }

}

class Citizens_Register extends Register{
  constructor(web3){
    super(web3);
    this.Citizens=new Map();
    this.Temporary_Banned_Citizens=new Map();
    this.Blacklist=[];
    this.Citizens_Registering_Authorities=[];
    this.Citizens_Banning_Authorities=[];
    this.New_Citizen_Mint_Amount=0;
  }

  SetInstance = async (contract_address, Agora_Address, DemoCoin_Address)=>{
    this.Instance = new this.web3.eth.Contract(
      Citizens_Artifact.abi,
      contract_address //deployedNetwork && deployedNetwork.address,
    ); 

    await this.Set_Register_Events();
    this.Instance.events.New_Citizen(this.Handle_New_Citizen);
    this.Instance.events.Citizen_Data_Set(this.Handle_Citizen_Data_Set);
    this.Instance.events.Citizen_Banned(this.Handle_Citizen_Banned);
    this.Instance.events.Citizen_Permanently_Banned(this.Handle_Citizen_Permanently_Banned);
    this.Instance.events.Citizen_Ban_Over(this.Handle_Citizen_Ban_Over);
    this.Instance.events.new_citizen_mint_amount_Set(this.Handle_new_citizen_mint_amount_Set);
    this.Instance.events.Registering_Authority_Added(this.Handle_Registering_Authority_Added);
    this.Instance.events.Banning_Authority_Added(this.Handle_Banning_Authority_Added);
    this.Instance.events.Registering_Authority_Removed(this.Handle_Citizen_Permanently_Banned);
    this.Instance.events.Banning_Authority_Removed(this.Handle_Citizen_Ban_Over);
    

    await this.Agora.SetInstance(Agora_Address, this.Instance._address, DemoCoin_Address);
    await this.LoadState();
  }

  LoadState= async () => {
    this.Name = await this.Instance.methods.Name().call();
    this.Register_Authorities = [...(await this.Instance.methods.Get_Authorities().call()).map(Bytes32ToAddress)];
    this.New_Citizen_Mint_Amount = await this.Instance.methods.New_Citizen_Mint_Amount().call();
    
    
    this.Citizens_Registering_Authorities=this.Instance.methods.Get_Registering_Authorities().call();
    this.Citizens_Banning_Authorities=this.Instance.methods.Get_Banning_Authorities().call();
    this.Blacklist = await this.Instance.methods.Get_Permanently_Banned_Citizens().call();
    this.Citizens.clear();
    this.Temporary_Banned_Citizens.clear();

    const Citizens_List = (await this.Instance.methods.Get_Citizens_List().call()).map(Bytes32ToAddress);

    Citizens_List.forEach(async (citizen_address)=>{
      var citizen = await this.Instance.methods.Citizens(citizen_address).call();
      if(citizen.Active){
        this.Citizens.set(citizen_address, citizen);
      }else{
        this.Temporary_Banned_Citizens.set(citizen_address, citizen);
      }
    });

    this.Event.emit("State_Loaded");
  }

  Handle_New_Citizen = async(err, ev)=>{
    if(err){
      alert(this.Name+" (Citizens_Register) : New_Citizen event error. Check console for details");
      console.error(err);
    }else{
      var citizen_address = ev.returnValues.citizen_address;
      var citizen = await this.Instance.methods.Citizens(citizen_address).call();
      
      this.Citizens.set(citizen_address, citizen);
      this.Event.emit("State_Changed");
      this.Event.emit("New_Citizen", citizen_address);
    }
  }

  Handle_Citizen_Data_Set = async(err, ev)=>{
    if(err){
      alert(this.Name+" (Citizens_Register) : Citizen_Data_Set event error. Check console for details");
      console.error(err);
    }else{
      var citizen_address = ev.returnValues.citizen_address;
      var citizen = await this.Instance.methods.Citizens(citizen_address).call();
      if(this.Citizens.has(citizen_address)){
        this.Citizens.set(citizen_address, citizen);
      }else{
        this.Temporary_Banned_Citizens.set(citizen_address,citizen);
      }
      
      this.Event.emit("State_Changed");
      this.Event.emit("Citizen_Data_Set", citizen_address);
    }
  }

  Handle_Citizen_Banned = async(err, ev)=>{
    if(err){
      alert(this.Name+" (Citizens_Register) : Citizen_Banned event error. Check console for details");
      console.error(err);
    }else{
      var citizen_address = ev.returnValues.citizen_address;
      var citizen = await this.Instance.methods.Citizens(citizen_address).call();
      
      
      this.Citizens.delete(citizen_address);
      this.Temporary_Banned_Citizens.set(citizen_address, citizen);
      this.Event.emit("State_Changed");
      this.Event.emit("Citizen_Banned", citizen_address);
    }
  }

  Handle_Citizen_Permanently_Banned= async(err, ev)=>{
    if(err){
      alert(this.Name+" (Citizens_Register) : Citizen_Permanently_Banned event error. Check console for details");
      console.error(err);
    }else{
      var citizen_address = ev.returnValues.citizen_address;
      
      if(!this.Citizens.delete(citizen_address)){
        this.Temporary_Banned_Citizens.delete(citizen_address);
      }
      
      this.Blacklist.push(citizen_address);
      this.Event.emit("State_Changed");
      this.Event.emit("Citizen_Permanently_Banned", citizen_address);
    }
  }

  Handle_Citizen_Ban_Over= async(err,ev)=>{
    if(err){
      alert(this.Name+" (Citizens_Register) : Citizen_Ban_Over event error. Check console for details");
      console.error(err);
    }else{
      var citizen_address = ev.returnValues.citizen_address;
      var citizen= this.Temporary_Banned_Citizens.get(citizen_address);
      citizen.Active=true;
      citizen.End_Ban_Timestamp=0;
      this.Temporary_Banned_Citizens.delete(citizen_address);
      this.Citizens.set(citizen_address, citizen);
      
      this.Event.emit("State_Changed");
      this.Event.emit("Citizen_Ban_Over", citizen_address);
    }
  }

  Handle_new_citizen_mint_amount_Set=async(err,ev)=>{
    if(err){
      alert(this.Name+" (Citizens_Register) : new_citizen_mint_amount_Set event error. Check console for details");
      console.error(err);
    }else{
      this.New_Citizen_Mint_Amount = ev.returnValues.new_citizen_mint_amount;
    
      this.Event.emit("State_Changed");
      this.Event.emit("new_citizen_mint_amount_Set", ev.returnValues.new_citizen_mint_amount);
    }
  }


  Handle_Registering_Authority_Added= async(err,ev)=>{
    if(err){
      alert(this.Name+" (Citizens_Register) : Registering_Authority_Added event error. Check console for details");
      console.error(err);
    }else{
      this.Citizens_Registering_Authorities.push(ev.returnValues.authority);
    
      this.Event.emit("State_Changed");
      this.Event.emit("Registering_Authority_Added", ev.returnValues.authority);
    }
  }

  Handle_Banning_Authority_Added= async(err,ev)=>{
    if(err){
      alert(this.Name+" (Citizens_Register) : Banning_Authority_Added event error. Check console for details");
      console.error(err);
    }else{
      this.Citizens_Banning_Authorities.push(ev.returnValues.authority);
    
      this.Event.emit("State_Changed");
      this.Event.emit("Banning_Authority_Added", ev.returnValues.authority);
    }
  }

  Handle_Registering_Authority_Removed= async(err,ev)=>{
    if(err){
      alert(this.Name+" (Citizens_Register) : Registering_Authority_Removed event error. Check console for details");
      console.error(err);
    }else{
      this.Citizens_Registering_Authorities = this.Citizens_Registering_Authorities.filter(item=>{return item!==ev.returnValues.authority});
    
      this.Event.emit("State_Changed");
      this.Event.emit("Registering_Authority_Removed", ev.returnValues.authority);
    }
  }

  Handle_Banning_Authority_Removed= async(err,ev)=>{
    if(err){
      alert(this.Name+" (Citizens_Register) : Banning_Authority_Removed event error. Check console for details");
      console.error(err);
    }else{
      this.Citizens_Banning_Authorities = this.Citizens_Banning_Authorities.filter(item=>{return item!==ev.returnValues.authority});
    
      this.Event.emit("State_Changed");
      this.Event.emit("Banning_Authority_Removed", ev.returnValues.authority);
    }
  }

}



class Loi extends Register{
  constructor(web3){
    super(web3);
    this.Lois=new Map();

  }

  SetInstance = async (contract_address, Agora_Address, DemoCoin_Address)=>{
    this.Instance = new this.web3.eth.Contract(
      LOI_Artifact.abi,
      contract_address //deployedNetwork && deployedNetwork.address,
    ); 

    await this.Set_Register_Events();
    this.Instance.events.Law_Created(this.Handle_Law_Created);
    this.Instance.events.Article_Created(this.Handle_Article_Created);
    this.Instance.events.Description_Changed(this.Handle_Description_Changed);
    this.Instance.events.Article_Removed(this.Handle_Article_Removed);
    this.Instance.events.Law_Removed(this.Handle_Law_Removed);
    

    await this.Agora.SetInstance(Agora_Address, this.Instance._address, DemoCoin_Address);
    await this.LoadState();
  }

  LoadState= async () => {

    this.Name = await this.Instance.methods.Name().call();
    this.Register_Authorities = [...(await this.Instance.methods.Get_Authorities().call()).map(Bytes32ToAddress)];
    this.Lois.clear();

    var law_list = await this.Instance.methods.Get_Law_List().call();
    law_list.forEach(async (law_title)=>{
      var law = {};
      var law_info = await this.Instance.methods.Get_Law_Info(law_title).call();
      var article_list = await this.Instance.methods.Get_Law_Article_List(law_title).call();
      law.Description=law_info.description;
      law.Timestamp=law_info.timestamp;
      law.Articles= new Map();

      article_list.forEach(async (Id)=>{
        var article = await this.Instance.methods.Articles(Id).call();
        law.Articles.set(Id,article);
      });

      this.Lois.set(law_title,law);
    });


    this.Event.emit("State_Loaded");
  }

  Handle_Law_Created = async(err,ev)=>{
    if(err){
      alert(this.Name+" (Loi): Law_Created event error. Check console for details");
      console.error(err);
    }else{
      var law = {};
      var law_info = await this.Instance.methods.Get_Law_Info(ev.returnValues.title).call();
      var article_list = await this.Instance.methods.Get_Law_Article_List(ev.returnValues.title).call();
      law.Description=law_info.description;
      law.Timestamp=law_info.timestamp;
      law.Articles= new Map();

      article_list.forEach(async (Id)=>{
        var article = await this.Instance.methods.Articles(Id).call();
        law.Articles.set(Id,article);
      });

      this.Lois.set(ev.returnValues.title,law); 
      this.Event.emit("State_Changed");
      this.Event.emit("Law_Created", ev.returnValues.title);
    }
  }

  Handle_Article_Created = async(err,ev)=>{
    if(err){
      alert(this.Name+" (Loi) : Article_Created event error. Check console for details");
      console.error(err);
    }else{
      var law = this.Lois.get(ev.returnValues.law_title);
      var article = await this.Instance.methods.Articles(ev.returnValues.key).call();
      law.Articles.set(article)

      this.Lois.set(ev.returnValues.law_title, law); 
      this.Event.emit("State_Changed");
      this.Event.emit("Article_Created", ev.returnValues.law_title, ev.returnValues.key );
    }
  }

  Handle_Article_Removed = async(err,ev)=>{
    if(err){
      alert(this.Name+" (Loi) : Article_Removed event error. Check console for details");
      console.error(err);
    }else{
      var law = this.Lois.get(ev.returnValues.law_title);
      law.Articles.delete(ev.returnValues.key);

      this.Lois.set(ev.returnValues.law_title, law); 
      this.Event.emit("State_Changed");
      this.Event.emit("Article_Removed", ev.returnValues.law_title, ev.returnValues.key);
    }
  }

  Handle_Description_Changed = async(err,ev)=>{
    if(err){
      alert(this.Name+" (Loi) : Description_Changed event error. Check console for details");
      console.error(err);
    }else{
      var law = this.Lois.get(ev.returnValues.title);
      var law_info = await this.Instance.methods.Get_Law_Info(ev.returnValues.title).call();
      law.Description = law_info.description;

      this.Lois.set(ev.returnValues.title, law); 
      this.Event.emit("State_Changed");
      this.Event.emit("Description_Changed", ev.returnValues.title);
    }
  }

  Handle_Law_Removed = async(err,ev)=>{
    if(err){
      alert(this.Name+" (Loi) : Law_Removed event error. Check console for details");
      console.error(err);
    }else{
      this.Lois.delete(ev.returnValues.title);

      this.Event.emit("State_Changed");
      this.Event.emit("Law_Removed", ev.returnValues.title);
    }
  }


}



class Governance_Instance{
  constructor(web3,Event){
    this.web3=web3;
    this.Event = Event;
    this.Name=null;
    this.Instance=null;
    this.Law_Project_List=new Map();
    this.Pending_Law=new Map();
    this.Aborted_Law=new Map();
    this.Executed_Law=new Map();
    this.Parameters=null;
  }

  Get_Proposal= async(key, Id)=>{
    var proposal_info= await this.Instance.methods.Get_Proposal(key, Id).call();
    console.log("Governance Instance: Get_Proposal: proposal_info:",proposal_info);
    var proposal={}
    proposal.Description= this.web3.utils.hexToUtf8(proposal_info.description);
    proposal.Parent= proposal_info.parent;
    proposal.Author= proposal_info.author;
    proposal.Function_Calls = proposal_info.function_calls;
    proposal.Children = proposal_info.childrens;
    return proposal;
  }

  Get_Pending_Ballot_Keys=async()=>{

  }

  Get_Law_Project=async(key)=>{
    var law_project = await this.Instance.methods.List_Law_Project(key).call();
    law_project.Title = this.web3.utils.hexToUtf8(law_project.Title);
    law_project.Description = this.web3.utils.hexToUtf8(law_project.Description);
    console.log("Governance_Instance: Get_Law_Project: law_project",law_project);

    const proposition_number = law_project.Proposal_Count;
    law_project.Proposals=Array.from({length:proposition_number});

    for (var i = 1; i <= proposition_number; i++) {
      
      law_project.Proposals[i-1]=await this.Get_Proposal(key,i);
    }

    var Result = await this.Instance.methods.Get_Law_Results(key).call();
    law_project.Winning_Proposal = Result.winning_proposal;
    law_project.Function_Call_Receipts = Result.receipt;

    return law_project;
  }

  
}

class Delegation extends Governance_Instance{
  constructor(web3, Event){
    super(web3, Event);
    
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
    
   
    this.Event.emit("State_Loaded");
  }

}



class Agora_Specific_Register extends Governance_Instance {
  constructor(web3, Event){
    super(web3, Event);
    this.Register_Address=null;
    this.DemoCoin_Instance=null;
    this.Last_Version=0;
  }

  Get_Referendum=async(key)=>{
    var referendum = await this.Instance.methods.Referendums(key).call();
    console.log("Get_Referendum: referendum",referendum)
    //sign_event= await this.Instance.getPastEvents("");
    if(referendum.Start_Vote_Timestamps!=0){
      referendum.Ballot_Key=  this.web3.utils.soliditySha3(key, referendum.Start_Vote_Timestamps);
    }
    var Old_Referendum = this.Pending_Law.get(key);
    if(Old_Referendum==undefined){
      referendum.Has_Signed = false;
      referendum.Has_Retrived_Reward = false;
    }else{
      referendum.Has_Signed = Old_Referendum.Has_Signed;
      referendum.Has_Retrived_Reward = Old_Referendum.Has_Retrived_Reward;
    }
    
    
    //referendum.Key=key;
    return referendum;
  }

  Get_Pending_Ballot_Keys=async(IVote_address)=>{ //Renvoie l'ensemble des clés des sessions de vote actuellement en cours et que l'on doit trouver dans le contrat IVote d'adresse IVote_address
    var ballot_keys=[];
    Array.from(this.Pending_Law).forEach((elem)=>{
      if(elem[1].Ballot_Key!=undefined){
        var version = elem[1].Version;
        if(this.Parameters[version-1].Ivote_address==IVote_address){
          ballot_keys.push(elem[1].Ballot_Key);
        }
      }
    });
    return ballot_keys
  }

  SetInstance = async (contract_address, register_address, DemoCoin_Address)=>{
    this.Register_Address = register_address;

    this.Instance = new this.web3.eth.Contract(
      Agora_Artifact.abi,
      contract_address //deployedNetwork && deployedNetwork.address,
    ); 

    this.Instance.events.Referendum_Parameters_Updated(this.Handle_Referendum_Parameters_Updated);
    this.Instance.events.New_Referendum(this.Handle_New_Referendum);
    this.Instance.events.New_Proposal(this.Handle_New_Proposal);
    this.Instance.events.Proposal_Modified(this.Handle_Proposal_Modified);
    this.Instance.events.Voting_Stage_Started(this.Handle_Voting_Stage_Started);
    this.Instance.events.Projet_Signed(this.Handle_Projet_Signed);
    this.Instance.events.Projet_Rejected(this.Handle_Projet_Rejected);
    this.Instance.events.Project_Adopted(this.Handle_Project_Adopted);
    this.Instance.events.Function_Call_Executed(this.Handle_Function_Call_Executed);
    this.Instance.events.Project_Executed(this.Handle_Project_Executed);

    this.DemoCoin_Instance = new this.web3.eth.Contract(
        DemoCoin_Artifact.abi,
        DemoCoin_Address
    );
    
    await this.LoadState();
  }

  LoadState= async () => {
    var register_param = await this.Instance.methods.Get_Referendum_Register(this.Register_Address).call();
    this.Last_Version = register_param.last_version;
    var List_Referendum_key= register_param.list_referendums;

    this.Pending_Law.clear();
    this.Aborted_Law.clear();
    this.Executed_Law.clear();
    this.Law_Project_List.clear();
    this.Parameters = Array.from({length:this.Last_Version});

    for (var i = 1; i <=this.Last_Version; i++) {
      var Parameters = await this.Instance.methods.Get_Referendum_Register_Parameters(this.Register_Address, i).call();
      this.Parameters[i-1] = Remove_Numerical_keys(Parameters);//.slice(Parameters.length/2);
    }


    List_Referendum_key.forEach(async(key, idx)=>{
      var referendum = await this.Get_Referendum(key);
      var law_project = await this.Get_Law_Project(key);
      if(referendum.Referendum_Status==3){
        this.Executed_Law.set(key,referendum);
      }else if(referendum.Referendum_Status==4){
        this.Aborted_Law.set(key,referendum);
      }else{
        this.Pending_Law.set(key,referendum);
      }

      this.Law_Project_List.set(key,law_project);
    });

    this.Name = await this.Instance.methods.Name().call();
   
    this.Event.emit("State_Loaded");
  }

  Handle_Referendum_Parameters_Updated = async(err,ev)=>{
    if(err){
      alert(this.Name+" (Agora): Handle_Referendum_Parameters_Updated event error. Check console for details");
      console.error(err);
    }else{
      if(ev.returnValues.register_address==this.Register_Address){
        const new_parameters = await this.Instance.methods.Get_Referendum_Register_Parameters(this.Register_Address, ev.returnValues.new_version).call();
        console.log("Handle_Referendum_Parameters_Updated: Register_Address",this.Register_Address);
        this.Parameters.push(Remove_Numerical_keys(new_parameters));
        this.Event.emit("Referendum_Parameters_Updated", ev.returnValues.new_version);
        this.Event.emit("State_Changed");
      }
    }
  }
  
  Handle_New_Referendum= async(err,ev)=>{
    if(err){
      alert(this.Name+" (Agora): Handle_New_Referendum event error. Check console for details");
      console.error(err);
    }else{
      if(ev.returnValues.register_address==this.Register_Address){
        const key = ev.returnValues.key;
        var referendum = await this.Get_Referendum(key);
        var law_project = await this.Get_Law_Project(key);
        this.Pending_Law.set(key, referendum);
        this.Law_Project_List.set(key, law_project);
        this.Event.emit("New_Referendum", key);
        this.Event.emit("State_Changed");
      } 
    }
  }

  Handle_New_Proposal= async(err,ev)=>{
    if(err){
      alert(this.Name+" (Agora): Handle_New_Proposal event error. Check console for details");
      console.error(err);
    }else{
      if(ev.returnValues.register_address==this.Register_Address){
        const key = ev.returnValues.key;

        var law_project =this.List_Law_Project.get(key);
        var proposal = await this.Get_Proposal(key, ev.returnValues.proposal_index);
        law_project.Proposals.push(proposal);


        var referendum = this.Pending_Law.get(key);
        //referendum.Petition_Counter++;
        const version = referendum.Version;       
        referendum.Token_Amount_Consummed += this.Parameters[version-1].FunctionCall_Price * proposal.Function_Calls.length;

        this.Pending_Law.set(key, referendum);
        this.List_Law_Project.set(key, law_project);
        this.Event.emit("New_Proposal", key, ev.returnValues.proposal_index);
        this.Event.emit("State_Changed");
      } 
    }
  }

  Handle_Proposal_Modified= async(err,ev)=>{
    if(err){
      alert(this.Name+" (Agora): Handle_Proposal_Modified event error. Check console for details");
      console.error(err);
    }else{
      if(ev.returnValues.register_address==this.Register_Address){
        const key = ev.returnValues.key;

        var law_project =this.List_Law_Project.get(key);
        const init_proposal = law_project.Proposals[ev.returnValues.proposal_index-1];
        const init_function_call_counter = init_proposal.Function_Calls.length;
        var proposal = await this.Get_Proposal(key, ev.returnValues.proposal_index);
        law_project.Proposals[ev.returnValues.proposal_index] = proposal;

        var referendum = this.Pending_Law.get(key);
        const version = referendum.Version;       
        referendum.Token_Amount_Consummed += this.Parameters[version-1].FunctionCall_Price * (proposal.Function_Calls.length - init_function_call_counter);
 
        this.Pending_Law.set(key, referendum);
        this.List_Law_Project.set(key, law_project);
        this.Event.emit("Proposal_Modified", key, ev.returnValues.proposal_index);
        this.Event.emit("State_Changed");
      } 
    }
  }

  Handle_Voting_Stage_Started= async(err,ev)=>{
    if(err){
      alert(this.Name+" (Agora): Handle_Voting_Stage_Started event error. Check console for details");
      console.error(err);
    }else{
      if(ev.returnValues.register_address==this.Register_Address){
        const key = ev.returnValues.key;
        const Id = ev.returnValues.proposal_index;
    
        var referendum = this.Pending_Law.get(key);
        referendum.Referendum_Status = 1;
        referendum.Start_Vote_Timestamps = (await this.Instance.methods.Referendums(key).call()).Start_Vote_Timestamps; 
        referendum.Ballot_Key = ev.returnValues.ballot_key;
        this.Pending_Law.set(key,referendum);         
        this.Event.emit("Voting_Stage_Started", key, ev.returnValues.ballot_key);
        this.Event.emit("State_Changed");
      } 
    }
  }

  Handle_Projet_Signed = async(err,ev)=>{
    if(err){
      alert(this.Name+" (Agora): Handle_Projet_Signed event error. Check console for details");
      console.error(err);
    }else{
      if(ev.returnValues.register_address==this.Register_Address){
        const key = ev.returnValues.key;
    
        var referendum = this.Pending_Law.get(key);
        referendum.Petition_Counter++;
        
        this.Pending_Law.set(key,referendum);         
        this.Event.emit("Voting_Projet_Signed", key);
        this.Event.emit("State_Changed");
      } 
    }
  }

  Handle_Projet_Rejected = async(err,ev)=>{
    if(err){
      alert(this.Name+" (Agora): Handle_Projet_Rejected event error. Check console for details");
      console.error(err);
    }else{
      if(ev.returnValues.register_address==this.Register_Address){
        const key = ev.returnValues.key;
    
        var referendum = this.Pending_Law.get(key);
        referendum.Referendum_Status=4;
        this.Aborted_Law.set(key,referendum);
        this.Pending_Law.delete(key);         
        this.Event.emit("Projet_Rejected", key);
        this.Event.emit("State_Changed");
      } 
    }
  }

  Handle_Project_Adopted= async(err,ev)=>{
    if(err){
      alert(this.Name+" (Agora): Handle_Project_Adopted event error. Check console for details");
      console.error(err);
    }else{
      if(ev.returnValues.register_address==this.Register_Address){
        const key = ev.returnValues.key;
    
        var referendum = this.Pending_Law.get(key);
        referendum.Referendum_Status=2;

        var law_project = this.List_Law_Project(key);
        law_project.Winning_Proposal= (await this.Instance.methods.Get_Law_Results(key).call()).Winning_Proposal;
        
        this.Pending_Law.set(key,referendum);
        this.List_Law_Project.set(key, law_project);     
        this.Event.emit("Project_Adopted", key);
        this.Event.emit("State_Changed");
      } 
    }
  }

  Handle_Function_Call_Executed = async(err,ev)=>{
    if(err){
      alert(this.Name+" (Agora): Handle_Function_Call_Executed event error. Check console for details");
      console.error(err);
    }else{
      if(ev.returnValues.register_address==this.Register_Address){
        const key = ev.returnValues.key;
        const Nbr_Function_Call = ev.returnValues.Function_Call_Nbr;        

        var law_project = this.List_Law_Project(key);
        law_project.Function_Call_Receipts= (await this.Instance.methods.Get_Law_Results(key).call()).receipt;
        
        this.List_Law_Project.set(key, law_project);     
        this.Event.emit("Function_Call_Executed", key);
        this.Event.emit("State_Changed");
      } 
    }
  }

  Handle_Project_Executed = async(err,ev)=>{
    if(err){
      alert(this.Name+" (Agora): Handle_Project_Executed event error. Check console for details");
      console.error(err);
    }else{
      if(ev.returnValues.register_address==this.Register_Address){
        const key = ev.returnValues.key;

        var referendum = this.Pending_Law(key);
        referendum.Referendum_Status = 3;
        referendum.Voter_Reward = (await this.Instance.methods.Referendums(key).call()).Voter_Reward;

        var law_project = this.List_Law_Project(key);
        law_project.Function_Call_Receipts= (await this.Instance.methods.Get_Law_Results(key).call()).receipt;
        
        this.List_Law_Project.set(key, law_project);     
        this.Event.emit("Project_Executed", key);
        this.Event.emit("State_Changed");
      } 
    }
  }


  Add_Law_Project = async (Title, Description, account)=>{
    var hexTitle = this.web3.utils.utf8ToHex(Title);
    var hexDescription = this.web3.utils.utf8ToHex(Description);
    const key = this.web3.utils.soliditySha3(this.web3.eth.abi.encodeParameters(["bytes", "bytes"], [hexTitle, hexDescription]));
    console.log("Add_Law_Project: this.Last_Version:",this.Last_Version,", this.Last_Version - 1= ",this.Last_Version -1);
    await this.DemoCoin_Instance.methods.approve(this.Instance._address, this.Parameters[this.Last_Version - 1].Law_Initialisation_Price).send({from:account});
    await this.Instance.methods.Add_Law_Project(this.Register_Address, hexTitle, hexDescription).send({from:account});
    this.Has_Signed=true;
  }

  Add_Proposal = async (referendum_key, Parent, Parent_Proposals_Reuse, New_Function_Call, Description, account)=>{
    //var hexTitle this.web3.utils.utf8ToHex(Title)
    const referendum = this.Pending_Law.get(referendum_key);
    await this.DemoCoin_Instance.methods.approve(this.Instance._address, this.Parameters[referendum.Version].FunctionCall_Price*New_Function_Call.length).send({from:account});
    await this.Instance.methods.Add_Proposal(this.Register_Address, referendum_key, Parent, Parent_Proposals_Reuse, New_Function_Call, Description).send({from:account});
    this.Has_Signed=true;
  }

  Add_Item= async( referendum_key, Proposal, New_Items, Indexs, account)=>{
    const referendum = this.Pending_Law.get(referendum_key);
    await this.DemoCoin_Instance.methods.approve(this.Instance._address, this.Parameters[referendum.Version].FunctionCall_Price*New_Items.length).send({from:account});
    await this.Instance.methods.Add_Item(this.Register_Address, referendum_key, Proposal, New_Items, Indexs).send({from:account});
    this.Has_Signed=true;
  }

  Sign_Petition= async(referendum_key, account)=>{
    await this.Instance.methods.Sign_Petition(this.Register_Address, referendum_key).send({from:account});
    this.Has_Signed=true;
  }

  End_Proposition_Stage= async(referendum_key,account)=>{
    await this.Instance.methods.End_Proposition_Stage(this.Register_Address, referendum_key).send({from:account});
  }

  End_Vote= async(referendum_key, account)=>{
    await this.Instance.methods.End_Vote(this.Register_Address, referendum_key).send({from:account});
  }

  Execute_Law= async(referendum_key, num_function_call_ToExecute, account)=>{
    await this.Instance.methods.Execute_Law(this.Register_Address, referendum_key, num_function_call_ToExecute).send({from:account});
  }

  Get_Voter_Reward= async(referendum_key, account)=>{
    await this.Instance.methods.Get_Voter_Reward(this.Register_Address, referendum_key).send({from:account});
    this.Has_Retrived_Reward=true;
  }
}



class Constitution extends Register{
  constructor(web3){
    super(web3);
    
    this.Transitional_Government = null;
    this.Is_Transitional_Government_Stage = true;
    this.Agora_Address = null;
    this.Citizens_Register_Address =null;
    this.DemoCoin_Address = null;
   
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
    this.Delegation_List = [];

    this.Name = await this.Instance.methods.Name().call();
    this.Register_Authorities = [...(await this.Instance.methods.Get_Authorities().call()).map(Bytes32ToAddress)];
    this.Transitional_Government = await this.Instance.methods.Transitional_Government().call();
    var Agora_Address = await this.Instance.methods.Agora_Instance().call();
    this.Citizens_Register_Address = await this.Instance.methods.Citizen_Instance().call();;
    this.DemoCoin_Address = await this.Instance.methods.Democoin_Instance().call();

    await this.Agora.SetInstance(Agora_Address, this.Instance._address, this.DemoCoin_Address);
    if(!this.Register_Authorities.includes(this.Transitional_Government.toLowerCase())){
      this.Is_Transitional_Government_Stage=false;
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


    /*console.log("Name:",this.Name);
    console.log("this",this);
    console.log("Delegation_Address_List",this.Delegation_Address_List);
    console.log("Agora_Instance:", this.Agora_Address, ", Citizen_Instance", 
      this.Citizens_Register_Address, ", Democoin_Instance", this.DemoCoin_Address);
    */
    this.Event.emit("State_Loaded");
  }

  Handle_Transitional_Government_Finised = async(err,ev) =>{
    if(err){
      alert(this.Name+" (Constitution): Handle_Transitional_Government_Finised event error. Check console for details");
      console.error(err);
    }else{
      this.Is_Transitional_Government_Stage = false;
      this.Event.emit("State_Changed");
      this.Event.emit("Transitional_Government_Finised");
    }
  };

  Handle_Register_Created = async(err,ev)=>{
    if(err){
      alert(this.Name+" (Constitution): Handle_Register_Created event error. Check console for details");
      console.error(err);
    }else{
      console.log("Handle_Register_Created: this.Agora.Instance",this.Agora.Instance);
      console.log("Handle_Register_Created: event:",ev);
      var register_type = (await this.Agora.Instance.methods.Get_Referendum_Register(ev.returnValues.register).call()).institution_type
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
      alert(this.Name+" (Constitution): Handle_Delegation_Created event error. Check console for details");
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



export {Constitution, Register, Agora_Specific_Register, Governance_Instance, DemoCoin, Loi, Majority_Judgment_Ballot};
