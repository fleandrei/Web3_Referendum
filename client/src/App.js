import React, { Component } from "react";
import Constitution_Artifact from "./contracts/Constitution.json";
import getWeb3 from "./getWeb3";

import "./App.css";

const EventEmitter = require('events');

class Constitution{
  constructor(web3){
    this.web3=web3;
    this.Event = new EventEmitter();
    this.Instance=null;
    this.Name=null;
    this.Delegation_Address_List=[];
    web3.eth.net.getId().then(networkId=>{
      const deployedNetwork = Constitution_Artifact.networks[networkId];
      
      this.Instance = new web3.eth.Contract(
        Constitution_Artifact.abi,
        deployedNetwork && deployedNetwork.address,
      );     
    }).then(()=>this.LoadState());
  }


  SetInstance = async (contract_address)=>{
      
    this.Instance = new this.web3.eth.Contract(
      Constitution_Artifact.abi,
      contract_address //deployedNetwork && deployedNetwork.address,
    ); 
    await this.LoadState();
  }

  LoadState= async () => {
    this.Delegation_Address_List = [...(await this.Instance.methods.Get_Delegation_List().call())];
    console.log("Delegation_Address_List",this.Delegation_Address_List);
    this.Name = await this.Instance.methods.Name().call();
    console.log("Name:",this.Name);
    console.log("this",this);
  }





}

class App extends Component {
  state = {Constitution:null, web3: null, accounts: null };

  /*constructor(props){
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      const constitution= new Constitution(web3);
      // Get the contract instance.
     

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      //this.setState({Constitution:constitution, web3, accounts });

      this.state = {Constitution:constitution, storageValue: 0, web3: null, accounts: null, contract: null };
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  }*/

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
      await constitution.SetInstance(deployedNetwork.address);
      // Get the contract instance.
      
      //await constitution.LoadState()

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({Constitution:constitution, web3, accounts });
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

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    var constitution = this.state.Constitution;
    console.log("Constitution:",constitution);
    console.log("Constitution delegation List:",constitution.Delegation_Address_List);
    console.log("Constitution Name:",constitution.Name);
    return (
      <div className="App">
        <h1>Good to Go!</h1>
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
    );
  }
}

export default App;
