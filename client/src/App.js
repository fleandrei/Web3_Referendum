import React, { Component, useState, useEffect, useRef } from "react";
import Constitution_Artifact from "./contracts/Constitution.json";
import API_Register_Artifact from "./contracts/API_Register.json";
import Agora_Artifact from "./contracts/Agora.json";
import Delegation_Artifact from "./contracts/Delegation.json";


import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
//import Sonnet from 'react-bootstrap/Sonnet';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import 'bootstrap/dist/css/bootstrap.min.css';
//import LOI_Artifact from "./contracts/Loi.json";

import getWeb3 from "./getWeb3";

import "./App.css";


const EventEmitter = require('events');
  

function Bytes32ToAddress(str){
  return str.slice(0,2) + str.slice(26);
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
    await this.Instance.events.Name_Changed(this.Handle_Name_Changed);
    await this.Instance.events.Constitution_Changed(this.Handle_Constitution_Changed);
    await this.Instance.events.Authority_Added(this.Handle_Authority_Added);
    await this.Instance.events.Authority_Removed(this.Handle_Authority_Removed);
  }

  Handle_Name_Changed= async(err,event)=>{
    this.Name = await this.Instance.methods.Name();
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
    this.Event.emit("Constitution_Changed");
  }

  Handle_Authority_Removed = async(err,event)=>{
    this.Register_Authorities= this.Register_Authorities.filter(item=>{ return item !== event.returnValues.authority});
    this.Event.emit("Authority_Removed");
    this.Event.emit("Constitution_Changed");
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
      this.Referendum_Parameters[i-1] = await this.Instance.methods.Get_Referendum_Register_Parameters(this.Register_Address, i).call();
      console.log("Parameters: ",this.Referendum_Parameters[i-1]);  
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
    this.Delegation_List= new Map();
    this.Loi_Register_List=new Map();
    this.API_Register_List= new Map();

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

    this.Mapping_Functions_Selector.set("Set_Register_Param","0x662913cd");
    this.Register_Functions.set("0x662913cd", {Name:"Set_Register_Param",Param_Types:["address", "uint", "uint", "uint", "uint", "uint", "uint16", "address"], Param_Names:[
     "register_address", "Petition_Duration", "Vote_Duration", "Vote_Checking_Duration", "Law_Initialisation_Price", "FunctionCall_Price", "Required_Petition_Rate", "Ivote_address"]});
  }


  SetInstance = async (contract_address)=>{
    this.Instance = new this.web3.eth.Contract(
      Constitution_Artifact.abi,
      contract_address //deployedNetwork && deployedNetwork.address,
    ); 
    
    this.Set_Register_Events();
    this.Instance.events.Transitional_Government_Finised(this.Handle_Transitional_Government_Finised);
    await this.LoadState();
  }

  LoadState= async () => {
    this.Loi_Register_List.clear();
    this.API_Register_List.clear();

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

      var last_version= (await this.Agora.Instance.methods.Get_Referendum_Register(address).call())
      var Parameters = Array.from({length:last_version})
      Parameters=Parameters.map(async (elem,idx)=> {return await this.Agora.Instance.methods.Get_Referendum_Register_Parameters(address, idx+1).call()});

      var register_type = await API_Register_Instance.methods.Type_Institution().call();
      if(register_type===3){
        this.Loi_Register_Address_List.set(address, Parameters);
      }else if(register_type===4){
        this.API_Register_Addres_List.push(address, Parameters);
      }
    });

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

  Set_Citizen_Mint_Amount = async( amount, account)=>{
    this.Instance.methods.Set_Citizen_Mint_Amount( amount).send({from:account}).catch(err=>{console.error(err)});
  }

}

const Institution_Type = {
    CONSTITUTION:"CONSTITUTION",
    LOI:"LOI",
    API:"API",
    DELEGATION:"DELEGATION",
    CITIZEN:"CITIZEN"
}


function Create_Function_Call(props){
  const [Register, SetRegister] = useState(null);
  const [Current_Function_Selector, SetCurrentFunction] = useState("");
  const [validated, SetValidated] = useState(false);

  const Handle_Function_Change = async (event)=>{
    SetCurrentFunction(event.target.value)
    if(validated)SetValidated(false);
  }

  const Handle_Submit = async(event)=>{
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }
    var function_selector = form[0].value;
    if(function_selector==""){ alert("You should choose a register function")}
    var Function = Register.Register_Functions.get(function_selector);
    var Param_num = Function.Param_Types.length;
    var Param_value = Array.from({length:Param_num});
    console.log("Param_num:",Param_num);
    for (var i =1; i <=Param_num; i++) {
      console.log("form[",i,"].value=",form[i].value);
      Param_value[i-1]=form[i].value;
    }
    console.log("Create_Function_Call: Param_Values",Param_value);

    var Encoded_Function_Call = await Register.Encode_Register_Functions_BySelector(function_selector, Param_value);
    console.log("Create_Function_Call: Encoded_Function_Call:",Encoded_Function_Call);
    SetValidated(true);
    console.log("\n\n\n Create_Function_Call: form:",form, "form.0.value",form[0].value);
    props.Handle_Function_Call(Register.Instance._address, Encoded_Function_Call);
  }

  if(Register!==props.Register){
    SetRegister(props.Register);
  }

  console.log("Create_Function_Call:", Current_Function_Selector);
  if(Register==null){return <div> </div>}

  return(
    <div className="App">
      <Form noValidate validated={validated} onSubmit={Handle_Submit}>
        <Form.Label className="my-1 mr-2" htmlFor="inlineFormCustomSelectPref">
          Register Function
        </Form.Label>
        <Form.Control
          as="select"
          className="my-1 mr-sm-2"
          id="inlineFormCustomSelectPref"
          custom
          onChange={Handle_Function_Change}
        >
          <option value="">Choose register function...</option>
          {
            Array.from(Register.Register_Functions).map((elem,idx)=>{
              return <option key={elem[0]} value={elem[0]}>{elem[1].Name}</option>
            })
          }
      </Form.Control>
        <br/>
        <br/>

        {
          (Current_Function_Selector!="")&&
          Register.Register_Functions.get(Current_Function_Selector).Param_Names.map((elem,idx)=>{
            return <Form.Group as={Row} controlId={elem} key={elem+Current_Function_Selector}>
            <Form.Label column sm={5}>
              {elem}
            </Form.Label>
            <Col sm={7}>
              <Form.Control type="text" placeholder={Register.Register_Functions.get(Current_Function_Selector).Param_Types[idx]} required/>
            </Col>
            </Form.Group>
          })
        }

        <Button type="submit">Submit</Button>

      </Form>
    </div>
  )
}


function Constitution_Data_Show(props){
  const [Constitution, SetConstitution] = useState(null);

  const Transitional_Governement_FunctionCall = async (register_address, function_call)=>{
    try{
    console.log("Transitional_Governement_FunctionCall: function_call", function_call);
    await props.web3.eth.sendTransaction({
      from:props.account,
      to:Constitution.Instance._address,
      data:function_call.slice(2)
    })
    var Register_Address = Constitution.Register_Address;
    console.log("Constitution Register_Address after function call:",Register_Address);
  }catch(error){
    alert("Transitional_Government function call error:" + error.toString());
    console.error(error);
  }
  }

  if(Constitution!==props.Constitution){
    SetConstitution(props.Constitution);
  }

  console.log("Constitution_Data_Show: Constitution",Constitution);
  if(Constitution==null){return <div> </div>}

  return(
    <div className="App">
      
      <h3> Data </h3>

      <div style={{display: 'flex', justifyContent: 'center'}}>
        <Card className="d-flex" style={{ width: '70rem' }}>
         <Card.Header><strong>Instances Address</strong></Card.Header>
          <Card.Body>
            
            <div className="row">
            <div className="col d-flex align-items-center ">
              <h5 className="p-3">{Constitution.Name}: </h5>
              <OverlayTrigger
                key={"Citizens_Address"}
                placement={"top"}
                overlay={
                <Tooltip id={'Citizens_Address'}>
                <strong>Click to copy</strong>.
                </Tooltip>
                 }
              > 
                <Button variant="secondary" onClick={()=>{navigator.clipboard.writeText(Constitution.Citizens_Register_Address)}}>{Constitution.Citizens_Register_Address.slice(0,8)+"..."+Constitution.Citizens_Register_Address.slice(36)+" "}</Button>     
              </OverlayTrigger>
              </div>
            <div className="col d-flex align-items-center  ">
              <h5 className="p-3">{Constitution.Name}: </h5>
              <OverlayTrigger
                key={"Agora_Address"}
                placement={"top"}
                overlay={
                <Tooltip id={'Agora_Address'}>
                <strong>Click to copy</strong>.
                </Tooltip>
                 }
              > 
                <Button variant="secondary" onClick={()=>{navigator.clipboard.writeText(Constitution.Agora.Instance._address)}}>{Constitution.Agora.Instance._address.slice(0,8)+"..."+Constitution.Agora.Instance._address.slice(36)+" "}</Button>     
              </OverlayTrigger>
            </div>
            <div className="col d-flex align-items-center  ">
              <h5 className="p-3">{Constitution.Name}: </h5>
              <OverlayTrigger
                key={"DemoCoin_Address"}
                placement={"top"}
                overlay={
                <Tooltip id={'DemoCoin_Address'}>
                <strong>Click to copy</strong>.
                </Tooltip>
                 }
              > 
                <Button variant="secondary" onClick={()=>{navigator.clipboard.writeText(Constitution.DemoCoin_Address)}}>{Constitution.DemoCoin_Address.slice(0,8)+"..."+Constitution.DemoCoin_Address.slice(36)+" "}</Button>     
              </OverlayTrigger>
            </div>
            </div>
          </Card.Body>
          </Card>
      </div>

      <br></br>

      
      <Tab.Container id="left-tabs-example" defaultActiveKey="first">
        <Row>
          <Col sm={3}>
            <Nav variant="pills" className="flex-column">
              <Nav.Item>
                <Nav.Link eventKey="first">Tab 1</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="second">Tab 2</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          <Col sm={9}>
            <Tab.Content>
              <Tab.Pane eventKey="first">
                
              </Tab.Pane>
              <Tab.Pane eventKey="second">
                
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>



      <br/>
      <br/>
      <div style={{display: 'flex', justifyContent: 'center'}}>
      <Card className="d-flex" style={{ width: '50rem' }}>
        <Card.Header><strong>Transitional_Government</strong></Card.Header>
          <Card.Body>
            <Create_Function_Call Register={Constitution} Handle_Function_Call={Transitional_Governement_FunctionCall} />
            
          </Card.Body>
      </Card>
      </div>
    </div>
  )
}




function Constitution_Show(props){
  const [Constitution, SetConstitution] = useState(null);
  const [Tab,SetTab]=useState(null);
  /*useEffect(()=>{
    SetConstitution(props.Constitution);
  })*/

  const Sub_Tab={
    DATA:"DATA",
    PROPOSITIONS:"PROPOSITIONS",
    VOTE:"VOTE",
    RESULTS:"RESULTS"
  }
  var Constitution_Tab;

  const Handle_Tab_Select= async (tab)=>{
    switch(tab){
      case Sub_Tab.DATA:
        SetTab(<Constitution_Data_Show Constitution={Constitution} 
                      account={props.account}
                      web3={props.web3}/>);
        break;
      case Sub_Tab.PROPOSITIONS:

        break;
    }
    
  }

  
  if(Constitution!==props.Constitution){
    SetConstitution(props.Constitution);
  }

  console.log("Constitution_Show: Constitution",Constitution);
  console.log("Constitution_Show: Tab",Tab);
  if(Constitution==null){return <div> </div>}

  return(
    <div className="App">
      <div className="row  align-items-center">
        <div className="col d-flex mr-auto">
        <Nav variant="pills" activeKey="1" onSelect={Handle_Tab_Select}>
          <Nav.Item>
            <Nav.Link eventKey="DATA" >
             Data
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="PROPOSITIONS" title="Item">
              Pending Propositions
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="VOTE">
              Vote
            </Nav.Link>
          </Nav.Item>
          <NavDropdown title="Dropdown" id="nav-dropdown">
            <NavDropdown.Item eventKey="4.1">Action</NavDropdown.Item>
            <NavDropdown.Item eventKey="4.2">Another action</NavDropdown.Item>
            <NavDropdown.Item eventKey="4.3">Something else here</NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item eventKey="4.4">Separated link</NavDropdown.Item>
          </NavDropdown>
        </Nav>
        </div>
      
        <div className="col d-flex align-items-center justify-content-end ">
          <h5 className="p-3">{Constitution.Name}: </h5>
          <OverlayTrigger
            key={"Constitution_Address"}
            placement={"top"}
            overlay={
            <Tooltip id={'Constitution_Address'}>
            <strong>Click to copy</strong>.
            </Tooltip>
             }
          > 
            <Button variant="secondary" onClick={()=>{navigator.clipboard.writeText(Constitution.Instance._address)}}>{Constitution.Instance._address.slice(0,8)+"..."+Constitution.Instance._address.slice(36)+" "}</Button>     
          </OverlayTrigger>
        </div>
      </div>

      {Tab}

     
    </div>
    )
}

  
class Main extends Component {
  state = { web3: null, accounts: null, Current_Institution_Tab:Institution_Type.LOI, Sub_Tab_Index:0, Ether_Balance:0, DemoCoin_Balance:0, Constitution:null, Loi:[], API:[], Delegations:[], Citizen:null, Democoin_Instance:null };

  
  /*static getDerivedStateFromProps = async (props, state)=>{
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      const constitution= await new Constitution(web3);
      // Get the contract instance.
      

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      //this.setState({Constitution:constitution, web3, accounts });
      console.log("web3:",web3);
      return {Constitution:constitution, web3:web3, accounts:accounts};
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  }*/


  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Constitution_Artifact.networks[networkId];

      const constitution= new Constitution(web3);
      await constitution.Event.on("State_Changed", ()=>{console.log("State changed"); this.setState({Constitution})});
      //await constitution.Event.on("Constitution_Changed", ()=>{console.log("Constitution changed"); this.setState({Constitution})});
      

      this.setState({Constitution:constitution, web3:web3, accounts:accounts });

      //this.setState({Constitution:constitution, web3, accounts });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runExample = async () => {
    const { accounts, contract } = this.state;

    // Stores a given value, 5 by default.
    await contract.methods.set(5,"0x0033").send({ from: accounts[0] });

    // Get the value from the contract to prove it worked.
    const response = await contract.methods.get().call();
    console.log("reponse",response);
    // Update state with the result.
    this.setState({ storageValue: response.uint_data });
  };


  LoadProject = async (constitution_address)=>{
    const { accounts, Constitution } = this.state;

    await Constitution.SetInstance(constitution_address);

    console.log("Constitution Register_List",await Constitution.Instance.methods.Get_Register_List());
    //await Constitution.Set_Citizen_Mint_Amount(40, accounts[0]);
    //var Agora_Instance = Constitution.Agora_Instance;

    this.setState({ Constitution: Constitution});
  }

  render() {

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    var show;
    var Institution_Tab;
    this.state.web3.eth.getBalance(this.state.accounts[0]).then((balance)=>{
      if(balance!=this.state.Ether_Balance){
        this.setState({Ether_Balance:balance})
      }
    }
    );

    switch (this.state.Current_Institution_Tab){
      case Institution_Type.CONSTITUTION:
        Institution_Tab= <div> <Constitution_Show Constitution={this.state.Constitution}
                                 account={this.state.accounts[0]}
                                 web3={this.state.web3}
                                 /></div>
        break;
    }
    
    var constitution = this.state.Constitution;
    console.log("Constitution:",constitution);
    console.log("Constitution delegation List:",constitution.Delegation_Address_List);
    
    if(this.state.Constitution.Instance==null){
      //show = <Set_Constitution LoadProject= {this.LoadProject}/>
      this.LoadProject("0xb7D71D60d09BF8EA9673983542d59B1b477e84c5");
    }else{
      show = <div>

        <div>
          <strong> Ether Balance: </strong>{this.state.Ether_Balance}, 
          <strong> DemoCoin Balance: </strong>{this.state.Ether_Balance} 

        </div>

        <Navbar bg="light" expand="lg">
        <Navbar.Brand href="#home">
        <Row className="align-items-center">
          <Col xs={5} style={{fontSize:15}}>Current Account:</Col>
          <Col className="border-right">
          <OverlayTrigger
            key={"Account"}
            placement={"top"}
            overlay={
              <Tooltip id={'Account'}>
                <strong>Click to copy</strong>.
              </Tooltip>
            }
          > 
            <Button variant="secondary" onClick={()=>{navigator.clipboard.writeText(this.state.accounts[0])}}>{this.state.accounts[0].slice(0,8)+"..."+this.state.accounts[0].slice(36)+" "}</Button>     
          </OverlayTrigger>
          
          </Col>
          </Row>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto" onSelect={(eventKey)=>(console.log("Nav: eventKey",eventKey), this.setState({Current_Institution_Tab:eventKey}))}>
              <Nav.Link eventKey="CONSTITUTION" onClick={()=>{this.setState({Current_Institution_Tab:Institution_Type.CONSTITUTION})}} >Constitution</Nav.Link>
              
              <NavDropdown title="Loi" id="basic-nav-dropdown">
                <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
              </NavDropdown>
              <NavDropdown title="API" id="basic-nav-dropdown">
                <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
              </NavDropdown>
              <NavDropdown title="Delegations" id="basic-nav-dropdown">
                <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
              </NavDropdown>
              <Nav.Link href="#link">Citizens</Nav.Link>
            </Nav>

            <Nav >
              <NavDropdown title="Mandates" id="basic-nav-dropdown">
                {

                }
              </NavDropdown>
              <div>
              {' '}<Badge pill variant="primary">Citizen</Badge>{' '}
              <Badge pill variant="danger">Transitional Government</Badge>{' '}
              <Badge pill variant="warning">Delegation member</Badge>{' '}
              </div>
            </Nav>            
          </Navbar.Collapse>
        </Navbar>
        <hr></hr>
        {Institution_Tab}

        <div>
           <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong>Instances Address</strong></Card.Header>
            <Card.Body>
            <div >
              <ListGroup variant="flush"   >
                <ListGroup.Item>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>@</th>
                      </tr>
                    </thead>
                    <tbody>
                      
                    </tbody>
                  </Table>
                </ListGroup.Item>
              </ListGroup>
              </div>
            </Card.Body>
          </Card>
        </div>
           <br></br>
        <h3 className="text-center">Enregistrement des élécteurs</h3>
        <br></br>
       </div>
       
        <br/>

        <p>Your Truffle Box is installed and ready.</p>
        <h2>Smart Contract Example</h2>
        <p>
          If your contracts compiled and migrated successfully, below will show
          a stored value of 5 (by default).
        </p>
        <p>
          Try changing the value stored on <strong>line 40</strong> of App.js.
        </p>
        <div>The stored value is: {constitution.Name}</div>
        
      </div>

    }

    return (
      <div className="App">
        <h1>Web3 Direct Democracy!</h1>
        {show}
      </div>
    );
  }
}




function Set_Constitution(props){
  const target = useRef(null);

  const LoadProject = async ()=>{
    var constitution_address = target.current.value;
    console.log("this.constitution_address", constitution_address);
    await props.LoadProject(constitution_address);
  }

  return(
    <div className="App">
      
      <Form inline>
              <Form.Label>Enter Project's Constitution address</Form.Label>
              <FormControl ref={target} type="text" placeholder="constitution address" className="mr-sm-2"/>
              <Button variant="outline-success" onClick={LoadProject}>Load Project</Button>
      </Form>

    </div>
  )
}


export default Main;
