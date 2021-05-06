import IVote_Artifact from "./contracts/IVote.json";


const EventEmitter = require('events');

class IVote{ //Abstract contract
	constructor(web3){
		this.web3 = web3;
		this.Event = new EventEmitter();
		this.Instance=null;

		if (this.constructor === IVote) {
      		throw new TypeError('Abstract class "IVote" cannot be instantiated directly');
    	}
	}

	Create_Ballot( key, Voters_Register_Address, Check_Voter_Selector, Vote_Duration, Vote_Validation_Duration, Propositions_Number, Max_Winning_Propositions_Number){
		throw new Error('You must implement this function');
	}

	Vote_Clear( key, Choices){
		throw new Error('You must implement this function');
	}

	Vote_Hashed(key, Choices){
		throw new Error('You must implement this function');
	}

	End_Vote(key){
		throw new Error('You must implement this function');
	}

	Valdiate_Vote(key, Choices, salt){
		throw new Error('You must implement this function');
	}

	End_Validation_Vote(key){
		throw new Error('You must implement this function');
	}

	
}

export default IVote;