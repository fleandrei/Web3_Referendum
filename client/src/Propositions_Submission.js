import React, { Component, useState, useEffect, useRef } from "react";
import {Constitution, Register, Delegation, Governance_Instance, DemoCoin} from "./Web3_Direct_Democracy_API/App";

//import Constitution_Artifact from "./contracts/Constitution.json";


import {Create_Function_Call, Show_Function_Call } from "./Utils";


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
import Accordion from 'react-bootstrap/Accordion';

import 'bootstrap/dist/css/bootstrap.min.css';

import "./App.css";


function Propositions_Submission(props){
	const [Referendum_Key, Set_Referendum_Key] = useState(null);

	 const Handle_New_Proposition = async (Title, Description)=>{
	 	try{
	 		await props.Governance_Instance.Add_Law_Project(Title, Description, props.account);
	 	}catch(error){
	 		alert(props.Register_Name+": Failed to add a new law proposition. Check console for details.",)
	 		console.error(error);
	 	}
	 }

	 const Select_Referendum_Key=(event)=>{
	 	console.log("Select_Referendum_Key: event",event);
	 }
	 
	console.log("Propositions_Submission: props.Governance_Instance", props.Governance_Instance);
	console.log("Propositions_Submission: Array.from(props.Governance_Instance.Pending_Law):",Array.from(props.Governance_Instance.Pending_Law));
	return(
    <div className="App">
      
      <h3> {props.Title} </h3>
      <br/>
      <div style={{display: 'flex', justifyContent: 'center'}}>
      <Card className="d-flex" style={{ width: '90rem' }}>
        <Card.Header><strong>{props.Title}</strong></Card.Header>
          <Card.Body>
            
      <Tab.Container id="left-tabs-example" defaultActiveKey="first">
        <Row>
          <Col sm={3} className="border-right">
            <h4> {props.Left_Title}:</h4>
           
            <Nav variant="pills" className="flex-column">
              
              { Array.from(props.Governance_Instance.Law_Project_List).map((law_project)=>{
                  return <Nav.Item key={law_project[0]} >
                  <Nav.Link eventKey={law_project[0]}>{law_project[1].Title}</Nav.Link>
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
              Array.from(props.Governance_Instance.Law_Project_List).map((law_project)=>{
                return <Tab.Pane eventKey={law_project[0]} key={law_project[0]}>
                <h4>{law_project[1].Title}</h4>
                <br/>
                <h5>Description</h5>
                <Card>
				  <Card.Body>{law_project[1].Description}</Card.Body>
				</Card>
				<br/>
                
              
            	<h5>List Proposals</h5>
                <Accordion defaultActiveKey="0">
                	<Card>
						<Accordion.Toggle as={Card.Header} eventKey="0">
			           		Root proposal (Proposal 0)
				        </Accordion.Toggle>
				        <Accordion.Collapse eventKey="0">
				        <Card.Body>
				            
				        <Button variant="primary" >
					       	Add Proposal
					    </Button>

				           </Card.Body>
			            </Accordion.Collapse>
			        </Card>
                	{	
          				law_project[1].Proposals.map((proposal, idx)=>{
							return <Card>
							<Accordion.Toggle as={Card.Header} eventKey={(idx+1).toString()}>
			                Proposal{idx+1}
				            </Accordion.Toggle>
				            <Accordion.Collapse eventKey={(idx+1).toString()}>
				            <Card.Body>
				            {proposal}
				            </Card.Body>
			        	    </Accordion.Collapse>
			        	    </Card>
                		})
                	}
            	</Accordion>


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
      </div>


      <hr/>
      <br/>

      <New_Law_Proposition On_Submit={Handle_New_Proposition}/>

    </div>
    )
}

function Show_Proposal_Data(props){
	return(
		<div className="App">
			<h6>Description</h6>
            <Card>
			  <Card.Body>{props.Proposal.Description}</Card.Body>
			</Card>
		</div>

	)
}

function Add_Proposal_Form(props){
	const [validated, SetValidated] = useState(false);
	const [List_Function_Calls, SetFunctionCallsList]= useState([])
	const [show, setShow] = useState(false);

  	const handleClose = () => setShow(false);
  	const handleShow = () => setShow(true);

	const Handle_Submit= async (event)=>{
		const form = event.currentTarget;
    	event.preventDefault();
    	event.stopPropagation();
    	console.log("Add_Proposal_Form: form",form);

    	props.On_Submit(form[0].value, form[1].value);
    	SetValidated(true);
	}


	return(
		<div className="App">	  
			<Button variant="primary" onClick={handleShow}>
	        	Launch demo modal
	      	</Button>

	      	<Modal show={show} onHide={handleClose}>
	        <Modal.Header closeButton>
	          <Modal.Title>Submit a new Proposal</Modal.Title>
	        </Modal.Header>
	        <Modal.Body>Woohoo, you're reading this text in a modal!
	        	<Form noValidate validated={validated} onSubmit={Handle_Submit}>
			  
				<Form.Group controlId="Proposal_Description">
					<Form.Label>Proposal Description</Form.Label>
					<Form.Control as="textarea" placeholder="Description" rows={3} />
				</Form.Group>
				 <Button type="submit">Submit</Button>
				</Form>


				<Accordion defaultActiveKey="0">
					{
						List_Function_Calls.map((function_call,idx)=>{
							return <Accordion.Toggle as={Card.Header} eventKey=function_call>
					           		Root proposal (Proposal 0)
						        </Accordion.Toggle>
						        <Accordion.Collapse eventKey=function_call>
						        	<Show_Function_Call />
						        </Accordion.Collapse>
						})
					}

				</Accordion >

	        </Modal.Body>
	        <Modal.Footer>
	          <Button variant="secondary" onClick={handleClose}>
	            Close
	          </Button>
	          <Button variant="primary" onClick={handleClose}>
	            Save Changes
	          </Button>
	        </Modal.Footer>
	      	</Modal>

			 
		</div>
	)
}


	
function New_Law_Proposition(props){
	const [validated, SetValidated] = useState(false);

	const Handle_Submit = async (event)=>{
		const form = event.currentTarget;
    	event.preventDefault();
    	event.stopPropagation();
    	console.log("New_Proposition: form",form);

    	props.On_Submit(form[0].value, form[1].value);
    	SetValidated(true);
	}

	return(
    	<div style={{display: 'flex', justifyContent: 'center'}}>
	      <Card className="d-flex" style={{ width: '50rem' }}>
	        <Card.Header style={{backgroundColor:"blue", color:"white"}}><strong>Add New Proposition</strong></Card.Header>
	          <Card.Body>

	            <Form noValidate validated={validated} onSubmit={Handle_Submit}>
		          <Form.Group controlId="exampleForm.ControlTextarea1">
				    <Form.Label>Title</Form.Label>
				    <Form.Control size="lg" type="text" placeholder="Title" />
				  </Form.Group>
				  <Form.Group controlId="exampleForm.ControlTextarea1">
				    <Form.Label>Description</Form.Label>
				    <Form.Control as="textarea" placeholder="Description" rows={3} />
				  </Form.Group>



				  <Button type="submit">Submit</Button>
				</Form>
	            

	          </Card.Body>
	          
	      	</Card>
	      </div>
    )
}


export default Propositions_Submission;