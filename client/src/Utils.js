import React, { Component, useState, useEffect, useRef } from "react";
//import {Constitution, Register, Delegation, Governance_Instance, DemoCoin} from "./WDD_API";

import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

import 'bootstrap/dist/css/bootstrap.min.css';

import "./App.css";


function Create_Function_Call(props){
  //const [Register, SetRegister] = useState(null);
  const [Current_Function_Selector, SetCurrentFunction] = useState("");
  const [validated, SetValidated] = useState(false);

  const Handle_Function_Change = async (event)=>{
    SetCurrentFunction(event.target.value)
    if(validated)SetValidated(false);
  }

  const Handle_Submit = async(event)=>{
    try{
      const form = event.currentTarget;
      event.preventDefault();
      event.stopPropagation();
      if (form.checkValidity() === false) {
        event.preventDefault();
        event.stopPropagation();
      }
      var function_selector = form[0].value;
      if(function_selector==""){ alert("You should choose a register function")}
      var Function = props.Register_Functions.get(function_selector);
      var Param_num = Function.Param_Types.length;
      var Param_value = Array.from({length:Param_num});
      for (var i =1; i <=Param_num; i++) {
        Param_value[i-1]=form[i].value;
      }
      console.log("Create_Function_Call: Param_Values",Param_value);

      
      SetValidated(true);
      console.log("\n\n\n Create_Function_Call: form:",form, "form.0.value",form[0].value);
      props.Handle_Function_Call(function_selector, Param_value);
    }catch(err){
      alert("Create_Function_Call.Handle_Submit error: Function call submission failed. Check console for details");
      console.error(err);
    }
  }

  /*if(Register!==props.Register){
    SetRegister(props.Register);
  }*/

  if(props.Register_Functions==null){return <div> </div>}

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
            Array.from(props.Register_Functions).map((elem,idx)=>{
              return <option key={elem[0]} value={elem[0]}>{elem[1].Name}</option>
            })
          }
      </Form.Control>
        <br/>
        <br/>

        {
          (Current_Function_Selector!="")&&
          props.Register_Functions.get(Current_Function_Selector).Param_Names.map((elem,idx)=>{
            return <Form.Group as={Row} controlId={elem} key={elem+Current_Function_Selector}>
            <Form.Label column sm={5}>
              {elem}
            </Form.Label>
            <Col sm={7}>
              <Form.Control type="text" placeholder={props.Register_Functions.get(Current_Function_Selector).Param_Types[idx]} required/>
            </Col>
            </Form.Group>
          })
        }

        <Button type="submit">Submit</Button>

      </Form>
    </div>
  )
}



function Show_Function_Call(props){
	var Decoded_Function = props.Decode_Function(props.Function_Call);
	return(
	<div className="App">
		<h5>{Decoded_Function.Name}</h5>

		{
			Decoded_Function.Param_Names.map((names,idx)=>{
            return <Form.Group as={Row} controlId={names} key={names}>
            <Form.Label column sm={5}>
              {names}
            </Form.Label>
            <Col sm={7}>
              <Form.Control type="text" placeholder={Decoded_Function.Param_Values[idx]} disabled/>
            </Col>
            </Form.Group>
          })
		}
	</div>
	)
}

export {Create_Function_Call, Show_Function_Call };