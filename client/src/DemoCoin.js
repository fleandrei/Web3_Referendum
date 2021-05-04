import DemoCoin_Artifact from "./contracts/DemoCoin.json";
import {Bytes32ToAddress, Remove_Numerical_keys, Remove_Item_Once} from "./Utils.js"

const EventEmitter = require('events');


class DemoCoin{
	constructor(web3){
		this.web3 =web3;
		this.Event = new EventEmitter();
	    this.Name=null;
	    this.Symbole=null;
	    this.Instance=null;
	    this.Minter_List=[];
	    this.Burner_List=[];
	    this.Total_Supply=0;
	    this.Balance=0;
	    this.Current_Account=0;
	}

	SetInstance= async(contract_address, current_account)=>{
		this.Instance = new this.web3.eth.Contract(
	      DemoCoin_Artifact.abi,
	      contract_address 
	    );
		
		this.Instance.events.Minter_Added(this.Handle_Minter_Added);
		this.Instance.events.Minter_Removed(this.Handle_Minter_Removed);
		this.Instance.events.Burner_Added(this.Handle_Burner_Added);
		this.Instance.events.Burner_Removed(this.Handle_Burner_Removed);
		this.Instance.events.Transfer(this.Handle_Transfer);

		await this.LoadState(current_account);
	}

	LoadState= async (current_account) => {
		this.Minter_List=[];
	    this.Burner_List=[];

		this.Name = await this.Instance.methods.name().call();
		this.Symbole = await this.Instance.methods.symbol().call();
		this.Total_Supply = await this.Instance.methods.totalSupply().call();

		this.Minter_List= (await this.Instance.methods.Get_Mint_Authorities().call()).map(Bytes32ToAddress);
	    this.Burner_List= (await this.Instance.methods.Get_Burn_Authorities().call()).map(Bytes32ToAddress);

	    this.Current_Account = current_account;
	    this.Balance = await this.Instance.methods.balanceOf(current_account).call();
	    this.Event.emit("State_Loaded");
	}

	Handle_Minter_Added= async(err,ev)=>{
		if(err){
			alert(this.Name+" (DemoCoin) : Minter_Added event error. Check console for details");
      		console.error(err);
		}else{
			this.Minter.push(ev.returnValues.minter);
			this.Event.emit("State_Changed");
      		this.Event.emit("Minter_Added", ev.returnValues.minter);
		}
	}

	Handle_Minter_Removed= async(err,ev)=>{
		if(err){
			alert(this.Name+" (DemoCoin) : Minter_Removed event error. Check console for details");
      		console.error(err);
		}else{
			this.Minter= Remove_Item_Once(this.Minter, ev.returnValues.minter);
			this.Event.emit("State_Changed");
      		this.Event.emit("Minter_Removed", ev.returnValues.minter);
		}
	}

	Handle_Burner_Added= async(err,ev)=>{
		if(err){
			alert(this.Name+" (DemoCoin) : Burner_Added event error. Check console for details");
      		console.error(err);
		}else{
			this.Burner.push(ev.returnValues.burner);
			this.Event.emit("State_Changed");
      		this.Event.emit("Burner_Added", ev.returnValues.burner);
		}
	}

	Handle_Burner_Removed= async(err,ev)=>{
		if(err){
			alert(this.Name+" (DemoCoin) : Burner_Removed event error. Check console for details");
      		console.error(err);
		}else{
			this.Burner= Remove_Item_Once(this.Burner, ev.returnValues.burner);
			this.Event.emit("State_Changed");
      		this.Event.emit("Burner_Removed", ev.returnValues.burner);
		}
	}

	Handle_Transfer= async(err,ev)=>{
		if(err){
			alert(this.Name+" (DemoCoin) : Transfer event error. Check console for details");
      		console.error(err);
		}else{
			if(ev.returnValues.from==this.Current_Account){
				this.Balance -= ev.returnValues.value;
				this.Event.emit("State_Changed");
				this.Event.emit("Transfer", ev.returnValues.from, ev.returnValues.to, ev.returnValues.value);
			}else if(ev.returnValues.to==this.Current_Account){
				this.Balance += ev.returnValues.value;
				this.Event.emit("State_Changed");
				this.Event.emit("Transfer", ev.returnValues.from, ev.returnValues.to, ev.returnValues.value);
			}
		}
	}


}

export default DemoCoin;