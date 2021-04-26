import React, { Component, useState, useEffect, useRef } from "react";
import {Constitution, Register, Delegation, Governance_Instance} from "./WDD_API";

import Constitution_Artifact from "./contracts/Constitution.json";

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

function Remove_Numerical_keys(obj){
  var obj_len= obj.length;
  for(var i=0; i<obj_len; i++){
    delete obj[i];
  }
  return obj;
}


const Institution_Type = {
    CONSTITUTION:"CONSTITUTION",
    LOI:"LOI",
    API:"API",
    DELEGATION:"DELEGATION",
    CITIZEN:"CITIZEN"
}

function Referendum_Parameter_Table(props){
  const [Version, SetVersion] = useState(props.last_version); // Can't be 0

  const Handle_New_Version= async(event)=>{
    SetVersion(event.target.value);
    
  }
  console.log("props.Parameters", props.Parameters);

  return(
      <div>
                  <Form noValidate inline >
                    <Form.Label className="my-1 mr-2" htmlFor="Param_Version">
                      Parameter Version
                    </Form.Label>
                    <Form.Control
                      as="select"
                      className="my-1 mr-sm-2"
                      id="Param_Version"
                      value={Version}
                      custom
                      onChange={Handle_New_Version}
                    >
                      {
                        props.Parameters.map((elem,idx)=>{
                          return <option key={idx+1} value={idx+1}>Version {idx+1}</option>
                        })
                      }
                  </Form.Control>
                  </Form>
        <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    Object.keys(props.Parameters[Version-1]).map((elem,idx)=>{
                      return <tr key={elem}>
                    <td>{elem}</td>
                    <td >{Object.values(props.Parameters[Version-1])[idx]}</td>
                  </tr>
                    })
                  }
                  
                </tbody>
              </Table>
      </div>
  )
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

  const Transitional_Governement_FunctionCall = async (register_address, function_call)=>{
    try{
    console.log("Transitional_Governement_FunctionCall: function_call", function_call);
    await props.web3.eth.sendTransaction({
      from:props.account,
      to:props.Constitution.Instance._address,
      data:function_call.slice(2)
    })
    var Register_Address = props.Constitution.Register_Address;
    console.log("props.Constitution Register_Address after function call:",Register_Address);
  }catch(error){
    alert("Transitional_Government function call error:" + error.toString());
    console.error(error);
  }
  }



  console.log("Constitution_Data_Show: Constitution",props.Constitution);
  if(props.Constitution==null){return <div> </div>}

  return(
    <div className="App">
      
      <h3> Data </h3>

      <div style={{display: 'flex', justifyContent: 'center'}}>
        <Card className="d-flex" style={{ width: '70rem' }}>
         <Card.Header><strong>Instances Address</strong></Card.Header>
          <Card.Body>
            
            <div className="row">
            <div className="col d-flex align-items-center ">
              <h5 className="p-3">{props.Constitution.Name}: </h5>
              <OverlayTrigger
                key={"Citizens_Address"}
                placement={"top"}
                overlay={
                <Tooltip id={'Citizens_Address'}>
                <strong>Click to copy</strong>.
                </Tooltip>
                 }
              > 
                <Button variant="secondary" onClick={()=>{navigator.clipboard.writeText(props.Constitution.Citizens_Register_Address)}}>{props.Constitution.Citizens_Register_Address.slice(0,8)+"..."+props.Constitution.Citizens_Register_Address.slice(36)+" "}</Button>     
              </OverlayTrigger>
              </div>
            <div className="col d-flex align-items-center  ">
              <h5 className="p-3">{props.Constitution.Name}: </h5>
              <OverlayTrigger
                key={"Agora_Address"}
                placement={"top"}
                overlay={
                <Tooltip id={'Agora_Address'}>
                <strong>Click to copy</strong>.
                </Tooltip>
                 }
              > 
                <Button variant="secondary" onClick={()=>{navigator.clipboard.writeText(props.Constitution.Agora.Instance._address)}}>{props.Constitution.Agora.Instance._address.slice(0,8)+"..."+props.Constitution.Agora.Instance._address.slice(36)+" "}</Button>     
              </OverlayTrigger>
            </div>
            <div className="col d-flex align-items-center  ">
              <h5 className="p-3">{props.Constitution.Name}: </h5>
              <OverlayTrigger
                key={"DemoCoin_Address"}
                placement={"top"}
                overlay={
                <Tooltip id={'DemoCoin_Address'}>
                <strong>Click to copy</strong>.
                </Tooltip>
                 }
              > 
                <Button variant="secondary" onClick={()=>{navigator.clipboard.writeText(props.Constitution.DemoCoin_Address)}}>{props.Constitution.DemoCoin_Address.slice(0,8)+"..."+props.Constitution.DemoCoin_Address.slice(36)+" "}</Button>     
              </OverlayTrigger>
            </div>
            </div>
          </Card.Body>
          </Card>
      </div>

      <br></br>

      
        <Card className="d-flex" >
        <Card.Header><strong>Instances Address</strong></Card.Header>
        <Card.Body>
      <Tab.Container id="left-tabs-example" defaultActiveKey="first">
        <Row>
          <Col sm={3} className="border-right">
            <h4> Institutions:</h4>
           
            <Nav variant="pills" className="flex-column">
              {
                (props.Constitution.Agora.Referendum_Parameters.length != 0)&&
                <Nav.Item>
                  <Nav.Link eventKey={props.Constitution.Instance._address}>{props.Constitution.Name} (Constitution) </Nav.Link>
                </Nav.Item>
              } 
              { props.Loi.map((loi)=>{
                  return <Nav.Item>
                  <Nav.Link eventKey={loi.Instance._address}>{loi.Name}+" (Loi)" </Nav.Link>
                </Nav.Item>
                })
              }
              {props.API.map((api)=>{
                  return <Nav.Item>
                  <Nav.Link eventKey={api.Instance._address}>{api.Name}+" (API_Register)" </Nav.Link>
                </Nav.Item>
                })
              }
              
              {props.Delegations.map((delegation)=>{
                  return <Nav.Item>
                  <Nav.Link eventKey={delegation.Instance._address}>{delegation.Name}+" (Delegation)" </Nav.Link>
                </Nav.Item>
                })
              }
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
            {
              (props.Constitution.Agora.Referendum_Parameters.length != 0)&&
              <Tab.Pane eventKey={props.Constitution.Instance._address}>
                <div className=" d-flex align-items-center justify-content-center ">
                <h4 className="p-3"> {props.Constitution.Name}:  </h4>
                <OverlayTrigger
                  key="Constitution_Address"
                  placement={"top"}
                  overlay={
                  <Tooltip id={'Constitution_Address'}>
                  <strong>Click to copy</strong>.
                  </Tooltip>
                   }
                > 
                  <Button variant="secondary" onClick={()=>{navigator.clipboard.writeText(props.Constitution.Instance._address)}}>{props.Constitution.Instance._address.slice(0,8)+"..."+props.Constitution.Instance._address.slice(36)+" "}</Button>     
                </OverlayTrigger>
                </div>
                <br/>
                <h5>  Referendum Parameters </h5>

                <Referendum_Parameter_Table Parameters={props.Constitution.Agora.Referendum_Parameters} last_version={props.Constitution.Agora.Referendum_Parameters.length}/>
                <br/>
                <br/>
                <h5>  Register Authorities </h5>
                <ListGroup>             
                {
                  props.Constitution.Register_Authorities.map((elem)=>{
                  return <ListGroup.Item key={elem}>{elem}</ListGroup.Item>
                  })
                }
                </ListGroup>
              </Tab.Pane>
            } 
            {
              props.Loi.map((loi)=>{
                return <Tab.Pane eventKey={loi.Instance._address}>
                loi
              </Tab.Pane>
              })
            } 
            {
              props.API.map((api)=>{
                return <Tab.Pane eventKey={api.Instance._address}>
                api
              </Tab.Pane>
              })
            } 
            {
              props.Delegations.map((delegation)=>{
                return <Tab.Pane eventKey={delegation.Instance._address}>
                delegation
              </Tab.Pane>
              })
            } 

              <Tab.Pane eventKey="first">
                
              </Tab.Pane>
              <Tab.Pane eventKey="second">
                
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
      </Card.Body>
      </Card>

      <br/>
      <br/>
      <div style={{display: 'flex', justifyContent: 'center'}}>
      <Card className="d-flex" style={{ width: '50rem' }}>
        <Card.Header style={{color:"red"}}><strong>Transitional_Government</strong></Card.Header>
          <Card.Body>
            <Create_Function_Call Register={props.Constitution} Handle_Function_Call={Transitional_Governement_FunctionCall} />
            
          </Card.Body>
          <Card.Footer className="text-muted">
            <Button variant="danger"  onClick={()=>{props.Constitution.Instance.End_Transition_Government().send({from:props.account})}}>End Transitional Government </Button>
          </Card.Footer>
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

  const Content_From_Tab=(tab)=>{
    switch(tab){
      case Sub_Tab.DATA:
        return <Constitution_Data_Show Constitution={Constitution} 
                      Loi={props.Loi}
                      API={props.API}
                      Delegations={props.Delegations}
                      account={props.account}
                      web3={props.web3}/>;
        break;
      case Sub_Tab.PROPOSITIONS:

      break;
    }
  }

  
  useEffect(() => {
    Constitution.Event.on("State_Changed", ()=>{console.log("Constitution_Show: State_Changed: Constitution",Constitution); SetConstitution(Constitution)});
  }, [Constitution]);

  if(Constitution==null){
    SetConstitution(props.Constitution);
  }

  console.log("Constitution_Show: Constitution",Constitution);
  console.log("Constitution_Show: Tab",Tab);
  if(Constitution==null){return <div> </div>}

  return(
    <div className="App">
      <div className="row  align-items-center">
        <div className="col d-flex mr-auto">
        <Nav variant="pills" activeKey="1" onSelect={SetTab}>
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

      {Content_From_Tab(Tab)}

     
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
      await constitution.Event.on("State_Changed", this.SetState_Constitution);
      await constitution.Event.on("New_Loi_Register", this.Handle_New_Loi_Register);
      await constitution.Event.on("New_API_Register", this.Handle_New_API_Register);

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

  SetState_Constitution = async ()=>{
    var constitution = this.state.Constitution;
    console.log("SetState_Constitution: constitution",constitution);
    this.setState({Constitution:constitution});
    console.log("SetState_Constitution: this.state.Constitution", this.state.Constitution);
  }

  Handle_New_Loi_Register = async (Loi_address)=>{

  }

  Handle_New_API_Register = async (Loi_address)=>{

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
                                 Loi={this.state.Loi}
                                 API={this.state.API}
                                 Delegations={this.state.Delegations}
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
