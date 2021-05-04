import React, { Component, useState, useEffect, useRef } from "react";
import {Constitution, Register, Delegation, Governance_Instance, DemoCoin} from "./WDD_API";

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
import Accordion from 'react-bootstrap/Accordion';

import 'bootstrap/dist/css/bootstrap.min.css';

import "./App.css";


function Propositions_Submission(props){
	 const Handle_New_Proposition = async (Title, Description)=>{
	 	try{
	 		await props.Governance_Instance.Add_Law_Project(Title, Description, props.account);
	 	}catch(error){
	 		alert(props.Register_Name+": Failed to add a new law proposition. Check console for details.",)
	 		console.error(error);
	 	}
	 }

	console.log("Propositions_Submission: props.Governance_Instance", props.Governance_Instance);
	console.log("Propositions_Submission: Array.from(props.Governance_Instance.Pending_Law):",Array.from(props.Governance_Instance.Pending_Law));
	return(
    <div className="App">
      
      <h3> {props.Title} </h3>
      <br/>
      <Tab.Container id="left-tabs-example" defaultActiveKey="first">
        <Row>
          <Col sm={3} className="border-right">
            <h4> {props.Left_Title}:</h4>
           
            <Nav variant="pills" className="flex-column">
              
              { Array.from(props.Governance_Instance.Law_Project_List).map((elem)=>{
                  return <Nav.Item key={elem[0]}>
                  <Nav.Link eventKey={elem[0]}>{elem[1].Title}</Nav.Link>
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
              Array.from(props.Governance_Instance.Pending_Law).map((elem)=>{
                return <Tab.Pane eventKey={elem[0]} key={elem[0]}>
                <h4>{elem[1].Title}</h4>



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
      <hr/>
      <br/>

      <New_Law_Proposition On_Submit={Handle_New_Proposition}/>

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