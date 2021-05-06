import Majority_Judgment_Artifact from "./contracts/Majority_Judgment_Ballot.json";
import IVote from "./IVote";
import {Bytes32ToAddress, Remove_Numerical_keys, Remove_Item_Once} from "./Utils.js"

class Majority_Judgment_Ballot extends IVote{
	constructor(web3){
		super(web3);
		this.Pending_Ballots=new Map();
		this.Finished_Ballots = new Map();
		this.Account= null; //Account that use current Majority_Judgment_Ballot object.
	}

	/*Get ballot related informations from chain and create a custom ballot object that is quiet similar to the Ballot structure Majority_Judgment_Ballot contract.*/
	Get_Ballot= async(key)=>{
		var ballot = await this.Instance.methods.Ballots(key).call();
		var old_ballot = this.Pending_Ballots.get(key);

		ballot.Winning_Propositions = await this.Instance.methods.Get_Winning_Propositions(key).call();
		ballot.Propositions_Results = Array.from({length:ballot.Propositions_Number+1});
		for (var i =0 ; i <= ballot.Propositions_Number; i++) {
			ballot.Propositions_Results[i]= await this.Instance.methods.Get_Propositions_Result(key, i).call();
		}
		ballot.HasVoted = await this.Instance.methods.HasVoted(key, this.Account).call(); //If the current account has voted in the ballot
		var vote_info = await this.Instance.methods.HasValidated(key, this.Account).call();
		ballot.HasValidated = vote_info.HasValidated;//If the current account has validated his vote in the ballot
		ballot.Choices = vote_info.Choices;//Vote Choices of the current account.

		if(old_ballot!=undefined){
			ballot.Salt = old_ballot.Salt;
		}

		return ballot;
	}

	SetInstance= async(contract_address, Useful_Ballots_Keys, account)=>{ //We don't load all Ballots of the Contract instance but only those present in the list Useful_Ballots_Keys
		this.Instance = new this.web3.eth.Contract(
	      Majority_Judgment_Artifact.abi,
	      contract_address 
	    );
		console.log("Majority_Judgment_Ballot: SetInstance: Instance", this.Instance);
		this.Instance.events.Ballot_Created(this.Handle_Ballot_Created);
		this.Instance.events.Voted_Clear(this.Handle_Voted_Clear);
		this.Instance.events.Voted_Hashed(this.Handle_Voted_Hashed);
		this.Instance.events.Begin_Validation(this.Handle_Begin_Validation);
		this.Instance.events.Validated_Vote(this.Handle_Validated_Vote);
		this.Instance.events.Vote_Finished(this.Handle_Vote_Finished);

		await this.LoadState(Useful_Ballots_Keys, account);
	}

	LoadState= async (Useful_Ballots_Keys, account) => {
		this.Pending_Ballots.clear();
		this.Finished_Ballots.clear();
		this.Account = account;

		Useful_Ballots_Keys.forEach(async (key)=>{
			var ballot = await this.Get_Ballot(key);
			if(ballot.Status==0){
				console.error("Warning: Ballot "+key+" doesn't exist in contract "+this.Instance._address+". \n The process continue.");
			}else if(ballot.Status==3){
				this.Finished_Ballots.set(key, ballot);
			}else{
				this.Pending_Ballots.set(key, ballot);
			}
		})		
		
	    this.Event.emit("State_Loaded");
	}

	Handle_Ballot_Created= async (err,ev)=>{
	    if(err){
	    	alert("Majority_Judgment_Ballot: Handle_Ballot_Created event error. Check console for details");
	      	console.error(err);
	    }else{
	    	const key = ev.returnValues.key;
	    	var ballot = await this.Get_Ballot(key);
	    	this.Pending_Ballots.set(key,ballot);
	    	this.Event.emit("Ballot_Created", key);
        	this.Event.emit("State_Changed");
	    }
	}



	Handle_Voted_Clear= async (err,ev)=>{
	    if(err){
	    	alert("Majority_Judgment_Ballot: Handle_Voted_Clear event error. Check console for details");
	      	console.error(err);
	    }else{
	    	const key = ev.returnValues.key;
	    	if(this.Pending_Ballots.has(key)){
	    		var ballot = this.Pending_Ballots.get(key);
	    		ballot.Voter_Number++;
	    		this.Pending_Ballots.set(key,ballot);
	    		this.Event.emit("Voted_Clear", key, ev.returnValues.voter);
        		this.Event.emit("State_Changed");
	    	}
	    }
	}

	Handle_Voted_Hashed= async (err,ev)=>{
	    if(err){
	    	alert("Majority_Judgment_Ballot: Handle_Voted_Hashed event error. Check console for details");
	      	console.error(err);
	    }else{
	    	const key = ev.returnValues.key;
	    	if(this.Pending_Ballots.has(key)){
	    		this.Event.emit("Voted_Hashed", key, ev.returnValues.voter);
        		this.Event.emit("State_Changed");
	    	}
	    }
	}

	Handle_Begin_Validation= async (err,ev)=>{
	    if(err){
	    	alert("Majority_Judgment_Ballot: Handle_Begin_Validation event error. Check console for details");
	      	console.error(err);
	    }else{
	    	const key = ev.returnValues.key;
	    	if(this.Pending_Ballots.has(key)){
	    		var ballot = this.Pending_Ballots.get(key);
	    		ballot.Status=2;
	    		ballot.End_Vote_Timestamp= (await this.Instance.methods.Ballots(key).call()).End_Vote_Timestamp;
	    		this.Pending_Ballots.set(key,ballot);
	    		this.Event.emit("Begin_Validation", key);
        		this.Event.emit("State_Changed");
	    	}
	    }
	}


	Handle_Validated_Vote= async (err,ev)=>{
	    if(err){
	    	alert("Majority_Judgment_Ballot: Handle_Validated_Vote event error. Check console for details");
	      	console.error(err);
	    }else{
	    	const key = ev.returnValues.key;
	    	if(this.Pending_Ballots.has(key)){
	    		var ballot = this.Pending_Ballots.get(key);
	    		ballot.Voter_Number++;
	    		this.Pending_Ballots.set(key,ballot);
	    		this.Event.emit("Begin_Validation", key, ev.returnValues.voter);
        		this.Event.emit("State_Changed");
	    	}
	    }
	}


	Handle_Vote_Finished= async (err,ev)=>{
	    if(err){
	    	alert("Majority_Judgment_Ballot: Handle_Vote_Finished event error. Check console for details");
	      	console.error(err);
	    }else{
	    	const key = ev.returnValues.key;
	    	if(this.Pending_Ballots.has(key)){
	    		var ballot = this.Pending_Ballots.get(key);
	    		ballot.Status=3;
	    		ballot.End_Vote_Timestamp= (await this.Instance.methods.Ballots(key).call()).End_Vote_Timestamp;
	    		ballot.Winning_Propositions = [...(await this.Instance.methods.Get_Winning_Propositions(key).call())];
				
				for (var i =0 ; i <= ballot.Propositions_Number; i++) {
					ballot.Propositions_Results[i]= await this.Instance.methods.Get_Propositions_Result(key, i).call();
				}

				this.Pending_Ballots.set(key,ballot);

	    		this.Event.emit("Handle_Vote_Finished", key);
        		this.Event.emit("State_Changed");
	    	}
	    }
	}



	Create_Ballot= async( key, Voters_Register_Address, Check_Voter_Selector, Vote_Duration, Vote_Validation_Duration, Propositions_Number, Max_Winning_Propositions_Number, account)=>{
		try{
			await this.Instance.methods.Create_Ballot(key, Voters_Register_Address, Check_Voter_Selector, Vote_Duration, Vote_Validation_Duration, Propositions_Number, Max_Winning_Propositions_Number).send({from:account});
		}catch(err){
			alert("(Majority_Judgment_Ballot): Error in call to Create_Ballot function. Check console for details");
      		console.error(err);
		}
	}

	Vote= async(key, Choices, account)=>{
		try{
			var ballot = this.Pending_Ballots.get(key);
			if (ballot==undefined) {
				alert(this.Name+" (Majority_Judgment_Ballot): Error there isn't any any ballot with key: "+key);
			}else{
				if(ballot.Vote_Validation_Duration==0){
					await this.Instance.methods.Vote_Clear(key,Choices).send({from:account});
				}else{
					ballot.Salt = this.web3.utils.randomHex(32);
					var Hash = this.web3.utils.soliditySha3(this.web3.eth.abi.encodeParameters(["uint[]", "bytes32"], [Choices, ballot.Salt]));
					await this.Instance.methods.Vote_Hashed(key,Hash).send({from:account});
				}
				
				ballot.HasVoted=true;
				ballot.Choices=Choices;
				this.Pending_Ballots.set(ballot);
			}
			
		}catch(err){
			alert("Majority_Judgment_Ballot: Error in call to Vote function. Check console for details");
      		console.error(err);
		}
	}

	/*Vote_Hashed= async(key, Hash, account)=>{
		try{
			await this.Instance.methods.Vote_Clear(key,Hash).send({from:account});
			var ballot = this.Pending_Ballots.get(key);
			ballot.HasVoted=true;
			this.Pending_Ballots.set(ballot);
		}catch(err){
			alert("Majority_Judgment_Ballot: Error in call to Vote_Hashed function. Check console for details");
      		console.error(err);
		}
	}*/

	End_Vote= async(key, account)=>{
		try{
			await this.Instance.methods.End_Vote(key).send({from:account});
		}catch(err){
			alert("(Majority_Judgment_Ballot: Error in call to End_Vote function. Check console for details");
      		console.error(err);
		}
	}

	Valdiate_Vote= async(key, Choices, salt, account)=>{
		try{
			await this.Instance.methods.Valdiate_Vote(key, Choices, salt).send({from:account});
			var ballot = this.Pending_Ballots.get(key);
			ballot.HasValidated=true;
			ballot.Choices=Choices;
			this.Pending_Ballots.set(ballot);
		}catch(err){
			alert("Majority_Judgment_Ballot: Error in call to Valdiate_Vote function. Check console for details");
      		console.error(err);
		}
	}

	End_Validation_Vote= async(key, account)=>{
		try{
			await this.Instance.methods.End_Validation_Vote(key).send({from:account});
		}catch(err){
			alert("Majority_Judgment_Ballot: Error in call to Valdiate_Vote function. Check console for details");
      		console.error(err);
		}
	}

}

export default Majority_Judgment_Ballot;