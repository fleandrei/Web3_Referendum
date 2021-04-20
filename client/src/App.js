import React, { Component, useState, useEffect, useRef } from "react";
import Constitution_Artifact from "./contracts/Constitution.json";
import API_Register_Artifact from "./contracts/API_Register.json";

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
    this.Register_Authorities=[];
    this.Mapping_Functions_Selector=new Map();
    this.Register_Functions=new Map();
  }

  Encode_Register_Functions=async(Function_Name, Param_Values)=>{
    var function_selector = this.Register_Functions_Selector.get(Function_Name);
    return function_selector+this.web3.eth.abi.encodeParameters(this.Register_Functions.get(function_selector).Param_Types, Param_Values).slice(2);
  }

  Decode_Register_Function = async(Function_Call)=>{
    var function_selector = Function_Call.slice(0,10);
    console.log("Decode: function_selector:",function_selector);
    var Values_Obj = this.web3.eth.abi.decodeParameters(this.Register_Functions.get(function_selector).Param_Types, function_selector.slice(10));
    console.log("Decode: param Values", Object.values(Values_Obj));
    return({Name:this.Register_Functions.get(function_selector).Name, Param_Types:this.Register_Functions.get(function_selector).Param_Types, Param_Values:Object.values(Values_Obj)})
  }

}


class Constitution extends Register{
  constructor(web3){
    super(web3);

    this.Constitution_Instance=null;
    this.Transitional_Government = null;
    this.Is_Transitional_Government = true;
    this.Agora_Address = null;
    this.Citizens_Register_Address =null;
    this.DemoCoin_Address = null;
    this.Delegation_Address_List=[];
    this.Loi_Register_Address_List=[];
    this.API_Register_Addres_List=[];

    /*Add Register functions*/
    this.Mapping_Functions_Selector.set("Add_Register_Authority","0xc9dd70b4");
    this.Register_Functions.set("0xc9dd70b4", {Name:"Add_Register_Authority",Param_Types:["address","address"]});

    this.Mapping_Functions_Selector.set("Remove_Register_Authority","0xcaf1f81f");
    this.Register_Functions.set("0xcaf1f81f", {Name:"Remove_Register_Authority",Param_Types:["address","address"]});

    this.Mapping_Functions_Selector.set("Set_Instances_Constitution","0x5a014a14");
    this.Register_Functions.set("0x5a014a14", {Name:"Set_Instances_Constitution",Param_Types:["address","address"]});

    this.Mapping_Functions_Selector.set("Set_Institution_Name","0xaeb53b64");
    this.Register_Functions.set("0xaeb53b64", {Name:"Set_Institution_Name",Param_Types:["address","string"]});

    this.Mapping_Functions_Selector.set("Set_Minnter","0xca1eb16a");
    this.Register_Functions.set("0xca1eb16a", {Name:"Set_Minnter",Param_Types:["address[]","address[]"]});

    this.Mapping_Functions_Selector.set("Set_Burner","0xd963545d");
    this.Register_Functions.set("0xd963545d", {Name:"Set_Burner",Param_Types:["address[]","address[]"]});

    this.Mapping_Functions_Selector.set("Set_Citizen_Mint_Amount","0x811a5c1f");
    this.Register_Functions.set("0x811a5c1f", {Name:"Set_Citizen_Mint_Amount",Param_Types:["uint256"]});

    this.Mapping_Functions_Selector.set("Citizen_Register_Remove_Authority","0x1b5cb360");
    this.Register_Functions.set("0x1b5cb360", {Name:"Citizen_Register_Remove_Authority",Param_Types:["address"]});

    this.Mapping_Functions_Selector.set("Add_Registering_Authority","0x05ff1b36");
    this.Register_Functions.set("0x05ff1b36", {Name:"Add_Registering_Authority",Param_Types:["address"]});

    this.Mapping_Functions_Selector.set("Add_Banning_Authority","0xfb252e2d");
    this.Register_Functions.set("0xfb252e2d", {Name:"Add_Banning_Authority",Param_Types:["address"]});

    this.Mapping_Functions_Selector.set("0x1529356f","Create_Register");
    this.Register_Functions.set("Create_Register",["string","uint8","uint256","uint256","uint256","uint256","uint256","uint16","address"]);

    this.Mapping_Functions_Selector.set("Create_Register","0x1529356f");
    this.Register_Functions.set("0x1529356f", {Name:"Create_Register",Param_Types:["string","uint8","uint256","uint256","uint256","uint256","uint256","uint16","address"]});

  }


  SetInstance = async (contract_address)=>{
    this.Constitution_Instance = new this.web3.eth.Contract(
      Constitution_Artifact.abi,
      contract_address //deployedNetwork && deployedNetwork.address,
    ); 
    this.Constitution_Instance.events.Transitional_Government_Finised(this.Handle_Transitional_Government_Finised);
    await this.LoadState();
  }

  LoadState= async () => {
    this.Loi_Register_Address_List =[];
    this.API_Register_Addres_List = [];

    this.Name = await this.Constitution_Instance.methods.Name().call();
    this.Register_Authorities = [...(await this.Constitution_Instance.methods.Get_Authorities().call()).map(Bytes32ToAddress)];
    this.Transitional_Government = await this.Constitution_Instance.methods.Transitional_Government().call();
    this.Agora_Address = await this.Constitution_Instance.methods.Agora_Instance().call();
    this.Citizens_Register_Address = await this.Constitution_Instance.methods.Citizen_Instance().call();;
    this.DemoCoin_Address = await this.Constitution_Instance.methods.Democoin_Instance().call();
    this.Delegation_Address_List = [...(await this.Constitution_Instance.methods.Get_Delegation_List().call())];
    
    console.log("this.Register_Authorities", this.Register_Authorities,",\n Transitional_Government",this.Transitional_Government);
    if(!this.Register_Authorities.includes(this.Transitional_Government.toLowerCase())){
      this.Is_Transitional_Government=false;
    }

    var register_address = await this.Constitution_Instance.methods.Get_Register_List().call();
    
    register_address.forEach(async (address,i,arr)=>{
      var API_Register_Instance = new this.web3.eth.Contract(
        API_Register_Artifact.abi,
        address,
      );
      var register_type = await API_Register_Instance.methods.Type_Institution().call();
      if(register_type===3){
        this.Loi_Register_Address_List.push(address);
      }else if(register_type===4){
        this.API_Register_Addres_List.push(address);
      }
    });
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
    this.Constitution_Instance.methods.Set_Citizen_Mint_Amount( amount).send({from:account}).catch(err=>{console.error(err)});
  }

}

const Institution_Type = {
    CONSTITUTION:"CONSTITUTION",
    LOI:"LOI",
    API:"API",
    DELEGATION:"DELEGATION",
    CITIZEN:"CITIZEN"
}

const Sub_Tab={
  DATA:"DATA",
  PROPOSITIONS:"PROPOSITIONS",
  VOTE:"VOTE",
  RESULTS:"RESULTS"
}


function Constitution_Show(props){
  const [Constitution, SetConstitution] = useState(null);
  const [Tab,SetTab]=useState(null);
  /*useEffect(()=>{
    SetConstitution(props.Constitution);
  })*/
  if(Tab!==props.Sub_Tab){
    SetTab(props.Sub_Tab);
  }
  if(Constitution!==props.Constitution){
    SetConstitution(props.Constitution);
  }

  console.log("Constitution_Show: Constitution",Constitution);
  

  return(
    <div className="App">
    <p>Your Truffle Box is installed and ready.</p>
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
      //await constitution.SetInstance(deployedNetwork.address);
      // Get the contract instance.
      
      //await constitution.LoadState()

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
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
        Institution_Tab= <div> <Constitution_Show Constitution={this.state.Constitution} /></div>
        break;
    }
    
    var constitution = this.state.Constitution;
    console.log("Constitution:",constitution);
    console.log("Constitution delegation List:",constitution.Delegation_Address_List);
    console.log("Constitution Name:",constitution.Name);
    
    if(this.state.Constitution.Constitution_Instance==null){
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
          <div>
          <OverlayTrigger
            key={"Account"}
            placement={"top"}
            overlay={
              <Tooltip id={'Account'}>
                <strong>{this.state.accounts[0]}</strong>.
              </Tooltip>
            }
          > 
            <Button variant="secondary" onClick={()=>{navigator.clipboard.writeText(this.state.accounts[0])}}>{this.state.accounts[0].slice(0,8)+"..."+this.state.accounts[0].slice(36)+" "}</Button>     
          </OverlayTrigger>
          
          </div>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto" onSelect={(eventKey)=>(console.log("Nav: eventKey",eventKey), this.setState({Current_Institution_Tab:eventKey}))}>
              <Nav.Link eventKey="CONSTITUTION" >Constitution</Nav.Link>
              
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

        {Institution_Tab}

        <div>
           <hr></hr>
           <br></br>
        <h3 className="text-center">Enregistrement des élécteurs</h3>
        <br></br>
       </div>
       <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong>Liste des comptes autorisés</strong></Card.Header>
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
