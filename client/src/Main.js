import React, { Component, useState, useEffect, useRef } from "react";
import {Register, Constitution, Loi, Delegation, Governance_Instance, DemoCoin, Majority_Judgment_Ballot} from "./Web3_Direct_Democracy_API/App";
import Propositions_Submission from "./Propositions_Submission";
import {Create_Function_Call} from "./Utils";

import Constitution_Artifact from "./Web3_Direct_Democracy_API/contracts/Constitution.json";
import Majority_Judgment_Ballot_Artifact from "./Web3_Direct_Democracy_API/contracts/Majority_Judgment_Ballot.json";

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
                        props.Parameters.map((elem,idx, arr)=>{
                          if(arr.length == idx+1){
                            return <option key={idx+1} value={idx+1} default>Version {idx+1}</option>
                          }else{
                            return <option key={idx+1} value={idx+1}>Version {idx+1}</option>
                          }
                          
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





function Constitution_Data_Show(props){

  const Transitional_Governement_FunctionCall = async (function_selector, Param_value)=>{
    try{
      if(function_selector=="0x1529356f" || function_selector=="0x2cef26ca"){
        Param_value.push(props.IVote_address);
      }
      var Encoded_Function_Call = await props.Constitution.Encode_Register_Functions_BySelector(function_selector, Param_value);
      console.log("Create_Function_Call: Encoded_Function_Call:",Encoded_Function_Call);
      await props.web3.eth.sendTransaction({
        from:props.account,
        to:props.Constitution.Instance._address,
        data:Encoded_Function_Call.slice(2)
      })
      var Register_Address = props.Constitution.Register_Address;
    }catch(error){
      alert("Transitional_Government function call error:" + error.toString());
      console.error(error);
    }
  }

  var Constitution_Register_Functions = new Map();

  Array.from(props.Constitution.Register_Functions).forEach(elem=>{
    var Function = Object.assign({},elem[1]);
    Function.Param_Types= [...elem[1].Param_Types];
    Function.Param_Names= [...elem[1].Param_Names];
    if(elem[0]=="0x1529356f" || elem[0]=="0x2cef26ca"){
      Function.Param_Types.pop();
      Function.Param_Names.pop();
    }
    Constitution_Register_Functions.set(elem[0],Function);
  })


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
              <h5 className="p-3">{props.Constitution.Agora.Name}: </h5>
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
              <h5 className="p-3">{props.DemoCoin.Name}: </h5>
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
                (props.Constitution.Agora.Parameters.length != 0)&&
                <Nav.Item>
                  <Nav.Link eventKey={props.Constitution.Instance._address}>{props.Constitution.Name} (Constitution) </Nav.Link>
                </Nav.Item>
              } 
              { props.Lois.map((loi)=>{
                  return <Nav.Item key={loi.Instance._address}>
                  <Nav.Link eventKey={loi.Instance._address}>{loi.Name} (Loi) </Nav.Link>
                </Nav.Item>
                })
              }
              {props.API.map((api)=>{
                  return <Nav.Item>
                  <Nav.Link eventKey={api.Instance._address}>{api.Name} (API_Register) </Nav.Link>
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
              (props.Constitution.Agora.Parameters.length != 0)&&
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

                <Referendum_Parameter_Table Parameters={props.Constitution.Agora.Parameters} last_version={props.Constitution.Agora.Parameters.length}/>
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
              props.Lois.map((loi)=>{
                return <Tab.Pane key={loi.Instance._address} eventKey={loi.Instance._address}>
                  
                  <div className=" d-flex align-items-center justify-content-center ">
                  <h4 className="p-3"> {loi.Name}:  </h4>
                  <OverlayTrigger
                    key={loi.Instance._address}
                    placement={"top"}
                    overlay={
                    <Tooltip id={loi.Instance._address}>
                    <strong>Click to copy</strong>.
                    </Tooltip>
                     }
                  > 
                    <Button variant="secondary" onClick={()=>{navigator.clipboard.writeText(loi.Instance._address)}}>{loi.Instance._address.slice(0,8)+"..."+loi.Instance._address.slice(36)+" "}</Button>     
                  </OverlayTrigger>
                  </div>
                  <br/>
                  <h5>  Referendum Parameters </h5>

                  <Referendum_Parameter_Table Parameters={loi.Agora.Parameters} last_version={loi.Agora.Parameters.length}/>
                  <br/>
                  <br/>
                  <h5>  Register Authorities </h5>
                  <ListGroup>             
                  {
                    loi.Register_Authorities.map((elem)=>{
                    return <ListGroup.Item key={elem}>{elem}</ListGroup.Item>
                    })
                  }
                  </ListGroup>
              
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
            <Create_Function_Call Register_Functions={Constitution_Register_Functions} Handle_Function_Call={Transitional_Governement_FunctionCall} />
            
          </Card.Body>
          <Card.Footer className="text-muted">
            <Button variant="danger"  onClick={()=>{props.Constitution.Instance.methods.End_Transition_Government().send({from:props.account})}}>End Transitional Government </Button>
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
                      Lois={props.Lois}
                      API={props.API}
                      Delegations={props.Delegations}
                      Citizens_Register={props.Citizens_Register}
                      DemoCoin={props.DemoCoin}
                      IVote_address={props.Majority_Judgment_Ballot.Instance._address}
                      account={props.account}
                      web3={props.web3}/>;
        break;
      case Sub_Tab.PROPOSITIONS:
        return <Propositions_Submission Governance_Instance={Constitution.Agora}
                      Title="Referendum Propositions Submission"
                      Left_Title="Pending Referendum:"
                      account={props.account}
                      web3={props.web3}
                      />

      break;

      case Sub_Tab.VOTE:

      break;
    }
  }

  
  useEffect(() => {
    Constitution.Event.on("State_Changed", ()=>{ SetConstitution(Constitution)});
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
          <Nav.Item>
            <Nav.Link eventKey="Execute/Result">
              Execute
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="Execute/Result">
              Result
            </Nav.Link>
          </Nav.Item>
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
  state = { web3: null, accounts: null, Current_Institution_Tab:Institution_Type.LOI, Sub_Tab_Index:0, Ether_Balance:0, DemoCoin_Balance:0, Constitution:null, Lois:[], API:[], Delegations:[], Citizens_Register:null, Majority_Judgment_Ballot:null, DemoCoin:null };

  
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

    console.log("LoadProject: Constitution.Instance",Constitution.Instance);
    var Initial_Ballot_Keys=[];

    await Constitution.SetInstance(constitution_address);
    //Constitution.Event.on("Voting_Stage_Started",this.New_Ballot);
    //Initial_Ballot_Keys = Initial_Ballot_Keys.concat(await Constitution.Agora.Get_Pending_Ballot_Keys());
    console.log("LoadProject: after SetInstance Constitution.Instance",Constitution.Instance);

    var Democoin = new DemoCoin(this.state.web3);
    await Democoin.SetInstance(Constitution.DemoCoin_Address, accounts[0]);

    console.log("LoadProject: DemoCoin",DemoCoin);

    var Lois=[];
    console.log("LoadState: Loi_Register_List:",Constitution.Loi_Register_List);

    Constitution.Loi_Register_List.forEach(async (Loi_address, idx)=>{
      Lois.push(new Loi(this.state.web3));
      Lois[idx].Event.on("State_Changed", this.SetState_Lois);
      await Lois[idx].SetInstance(Loi_address, Constitution.Agora.Instance._address, Democoin.Instance._address);
      //Initial_Ballot_Keys = Initial_Ballot_Keys.concat(await Lois[idx].Agora.Get_Pending_Ballot_Keys());

    })


    var majority_judgment_ballot = new Majority_Judgment_Ballot(this.state.web3);
    const networkId = await this.state.web3.eth.net.getId();
    const deployedNetwork = Majority_Judgment_Ballot_Artifact.networks[networkId];
    await majority_judgment_ballot.SetInstance(deployedNetwork.address, Initial_Ballot_Keys, this.state.accounts[0])
    //await Constitution.Set_Citizen_Mint_Amount(40, accounts[0]);
    //var Agora_Instance = Constitution.Agora_Instance;

    this.setState({ Constitution: Constitution, Lois:Lois, DemoCoin:Democoin, Majority_Judgment_Ballot:majority_judgment_ballot});
  }

  /*New_Ballot = async(Law_Project_key, Ballot_Key)=>{

    
  }*/

  SetState_Constitution = async ()=>{
    var constitution = this.state.Constitution;
    console.log("SetState_Constitution: constitution",constitution);
    this.setState({Constitution:constitution});
    console.log("SetState_Constitution: this.state.Constitution", this.state.Constitution);
  }

  SetState_Lois= async()=>{
    var Lois = this.state.Lois;
    console.log("SetState_Loi: Lois:",Lois);
    this.setState({Lois:Lois});
  }

  Handle_New_Loi_Register = async (Loi_address)=>{
    var Lois=this.state.Lois;
    var loi= new Loi(this.state.web3);
    loi.Event.on("State_Changed", this.SetState_Lois);
    loi.SetInstance(Loi_address, this.state.Constitution.Agora.Instance._address, this.state.DemoCoin.Instance._address);
    Lois.push(loi);
    this.setState({Lois:Lois});
  }

  Handle_New_API_Register = async (Loi_address)=>{

  }

  render(){

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    var show=<div></div>;
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
                                 Lois={this.state.Lois}
                                 API={this.state.API}
                                 Delegations={this.state.Delegations}
                                 Citizens_Register={this.state.Citizens_Register}
                                 DemoCoin={this.state.DemoCoin}
                                 Majority_Judgment_Ballot={this.state.Majority_Judgment_Ballot}
                                 account={this.state.accounts[0]}
                                 web3={this.state.web3}
                                 /></div>
        break;


    }
    
    var constitution = this.state.Constitution;
    console.log("Main: Render: Constitution:",constitution);
    console.log("Main: Render: DemoCoin",this.state.DemoCoin);


    //this.LoadProject("0xb7D71D60d09BF8EA9673983542d59B1b477e84c5");
    if(this.state.Constitution.Instance==null || this.state.DemoCoin==null){
      show = <Set_Constitution LoadProject= {this.LoadProject}/>
      //this.LoadProject("0xb7D71D60d09BF8EA9673983542d59B1b477e84c5");
      console.log("after if state.Constitution.Instance==null")
    }else{
      console.log("\n\nDemoCoin:",this.state.DemoCoin);
      console.log("this.state.Constitution",this.state.Constitution);
      show = <div>

        {(this.state.Constitution.Is_Transitional_Government_Stage)&&<span style={{color:"red"}}>!!!In Transitional Government Stage!!!</span>}
        <div>
          <strong> Ether Balance: </strong>{this.state.Ether_Balance}, 
          <strong> DemoCoin Balance: </strong>{this.state.DemoCoin.Balance} 

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
            <Nav className="mr-auto" onSelect={(eventKey)=>( this.setState({Current_Institution_Tab:eventKey}))}>
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
              
              <Nav.Link href="#link">Citizens</Nav.Link>
            </Nav>

            <NavDropdown title="Delegations" id="basic-nav-dropdown">
                <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
              </NavDropdown>

            <Nav >
              
              
              <div>
              {' '}<Badge pill variant="primary">Citizen</Badge>{' '}
              {(this.state.Constitution.Transitional_Government == this.state.accounts[0])&&<Badge pill variant="danger">Transitional Government</Badge>}{' '}
              <Badge pill variant="warning">Delegation member</Badge>{' '}
              </div>
            </Nav>            
          </Navbar.Collapse>
        </Navbar>
        <hr></hr>
        {Institution_Tab}

        
        
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
    await props.LoadProject(constitution_address);
  }

  return(
    <div>
    <br/>
    <br/>
    <div className="App" style={{display: 'flex', justifyContent: 'center'}}>

      <Form inline>
              <Form.Label className="p-3">Enter Project's Constitution address: </Form.Label>
              <FormControl ref={target} type="text" placeholder="constitution address" className="mr-sm-2"/>
              <Button variant="outline-success" onClick={LoadProject}>Load Project</Button>
      </Form>

    </div>
    </div>
  )
}


export default Main;
