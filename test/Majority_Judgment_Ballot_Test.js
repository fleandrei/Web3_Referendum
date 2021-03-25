//Test: majority_Judgment_Ballot.sol 
const { BN, ether, expectEvent, expectRevert, constants, time } = require('@openzeppelin/test-helpers'); // BN: Big Number
const { expect } = require('chai');
const MAJORITY_JUDGMENT = artifacts.require('Majority_Judgment_Ballot');
const Voter_Registe_Mock = artifacts.require('Voter_Register_Mock');
const chance = require("chance").Chance();


function Bytes32ToAddress(str){
	return str.slice(0,2) + str.slice(26);
}

contract('TEST: Majority_Judgment_Ballot.sol', function(accounts){

	const Nbr_Account = accounts.length;
	const Citizens = accounts.slice(0,Nbr_Account-1);

	const External_Account = accounts[Nbr_Account-1];

	let Ballot_Instance;
	let Voter_Register_Mock_Instance;

	const Contains_Selector = "0x57f98d32";
	const Prop_Max_Number=7;
	const vote_duration_min = time.duration.minutes(5).toNumber();
	const vote_duration_max = time.duration.days(3).toNumber();
	const vote_validation_duration_min = time.duration.minutes(5).toNumber();
	const vote_validation_duration_max = time.duration.days(1).toNumber();

	let key

	function Check_Ballot_Param(ballot, vote_duration, vote_validation_duration, proposition_number, Max_Winning_Propositions_Number, status, creation_timestamp){
			expect(ballot.Voters_Register_Address).is.equal(Voter_Register_Mock_Instance.address);
			expect(ballot.Check_Voter_Selector).is.equal(Contains_Selector);
			expect(ballot.Vote_Duration).to.be.bignumber.equal(new BN(vote_duration));
			expect(ballot.Vote_Validation_Duration).to.be.bignumber.equal(new BN(vote_validation_duration));
			expect(ballot.Propositions_Number).to.be.bignumber.equal(new BN(proposition_number));
			expect(ballot.Max_Winning_Propositions_Number).to.be.bignumber.equal(new BN(Max_Winning_Propositions_Number));
			expect(ballot.Status).to.be.bignumber.equal(new BN(status));
			expect(ballot.Creation_Timestamp).to.be.bignumber.equal(new BN(creation_timestamp));
	}

	function Hashed_Votes_Creation(num_proposition, num_voter){
		let res= Array.from({length:num_voter});

		res.forEach((elem,i,arr)=>{
			arr[i]={};
			var choice= Array.from({length:num_proposition+1}, x=>chance.natural({min:0, max:4}));
			salt = web3.utils.randomHex(32);
			hash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["uint[]", "bytes32"],[choice, salt]));

			arr[i].Choice = choice;
			arr[i].Salt = salt;
			arr[i].Hash = hash;
		});

		return res;
	}

	function Cleared_Votes_Creation(num_proposition, num_voter){
		let res= Array.from({length:Citizens.length});

		res.forEach((elem,i,arr)=>{
			arr[i]= Array.from({length:num_proposition+1}, x=>chance.natural({min:0, max:4}));
		});

		return res;
	}

	function Compute_Result(assessments){
		let proposition_number = assessments[0].length;
		let num_voter = assessments.length;
		let half_num_voter = Math.floor(num_voter/2)+num_voter%2;
		let Results= Array.from({length:proposition_number});
		for(let i=0; i<proposition_number; i++){
			Results[i]= {}
			Results[i].Cumulated_Score = Array.from({length:5}).fill(0);

			for(let j=0;j<num_voter;j++){
				for(let k=assessments[j][i];k<5;k++){
					Results[i].Cumulated_Score[k]++;
				}
			}
			var assess=0
			while(Results[i].Cumulated_Score[assess]<half_num_voter){
				assess++
			}
			Results[i].median=assess;
		}
		return Results;
	}

	function Compute_Winning_Proposals(Results, Num_Win_Prop){
		var proposition_number = Results.length;
		var Winning_Prop= Array.from({length:Num_Win_Prop});
		var Ordered_Propositions = Array.from(Array(proposition_number).keys());
		Ordered_Propositions.sort(function(prop1,prop2){
			if(Results[prop1].median == Results[prop2].median){
				var median = Results[prop1].median;
				if(median == 0){
					return Results[prop2].Cumulated_Score[0] - Results[prop1].Cumulated_Score[0];
				}else{
					return Results[prop2].Cumulated_Score[median-1] - Results[prop1].Cumulated_Score[median-1] 
				}

			}else{
				return Results[prop1].median - Results[prop2].median;
			}
		});

		if (Ordered_Propositions[0] == 0) {
			return [0];
		}

		var i =0;
		var win_index = 0;
		while(win_index<Num_Win_Prop){
			if(Ordered_Propositions[i]!=0){
				Winning_Prop[win_index] = Ordered_Propositions[i];
				win_index++
			}
			i++;
		}

		return Winning_Prop;
	}

	describe("Create Ballot", ()=>{
		
		beforeEach(async function () {

			Ballot_Instance = await MAJORITY_JUDGMENT.new({from: External_Account});
			Voter_Register_Mock_Instance = await Voter_Registe_Mock.new(Citizens, {from: External_Account});

			key = web3.utils.randomHex(32);

		});

		

		it("Attempt to Create New Ballot with Voter_Register_Address is address zero ", async function(){
			var vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			var vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			var proposition_number = chance.natural({min:2, max:Prop_Max_Number});
			var Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			
			await expectRevert(Ballot_Instance.Create_Ballot(key, constants.ZERO_ADDRESS, Contains_Selector, vote_duration, vote_validation_duration, proposition_number, Max_Winning_Propositions_Number, {from:External_Account}), "Bad Argument Values");
		});

		it("Attempt to Create New Ballot with check_voter_selector is bytes4(0) ", async function(){
			var vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			var vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			var proposition_number = chance.natural({min:2, max:Prop_Max_Number});
			var Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});

			await expectRevert(Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, "0x00000000", vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number), "Bad Argument Values");
		});

		it("Attempt to Create New Ballot with vote_duration is zero", async function(){
			var vote_duration = 0;
			var vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			var proposition_number = chance.natural({min:2, max:Prop_Max_Number});
			var Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			
			await expectRevert(Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number), "Bad Argument Values");
		});

		it("Attempt to Create New Ballot with proposition_number is zero", async function(){
			var vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			var vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			var proposition_number = 0;
			var Max_Winning_Propositions_Number = chance.natural({min:1, max:Prop_Max_Number});
			
			/*await expectRevert(Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number), "SafeMath: subtraction overflow");*/

			await expectRevert(Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number), "Argument Inconsistency");
		});

		it("Attempt to Create New Ballot with proposition_number is smaller or equal than Max_Winning_Propositions_Number", async function(){
			var vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			var vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			var proposition_number = chance.natural({min:2, max:Prop_Max_Number});
			var Max_Winning_Propositions_Number = chance.natural({min:proposition_number, max:proposition_number+Prop_Max_Number});
			
			await expectRevert(Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number), "Argument Inconsistency");
		});

		it("Attempt to Create New Ballot with proposition_number is 1 and Max_Winning_Propositions_Number is greater", async function(){
			var vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			var vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			var proposition_number = 1;
			var Max_Winning_Propositions_Number = chance.natural({min:2, max:Prop_Max_Number});
			
			await expectRevert(Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number), "Argument Inconsistency");
		});

		it("Attempt to Create New Ballot with Max_Winning_Propositions_Number is zero", async function(){
			var vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			var vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			var proposition_number = chance.natural({min:1, max:Prop_Max_Number});
			var Max_Winning_Propositions_Number = 0;
			
			await expectRevert(Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number), "Bad Argument Values");
		});


		it("Creation of New Ballot with proposition_number >=2", async function(){
			var vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			var vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			var proposition_number = chance.natural({min:2, max:Prop_Max_Number});
			var Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			
			res = await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			var ballot = await Ballot_Instance.Ballots(key);

			var blocknumber = (await web3.eth.getTransaction(res.tx)).blockNumber;
			var timestamp = (await web3.eth.getBlock(blocknumber)).timestamp;

			Check_Ballot_Param(ballot, vote_duration, vote_validation_duration, proposition_number, Max_Winning_Propositions_Number,1, timestamp);
			
			await expectEvent(res, "Ballot_Created", {key:key}, "Ballot_Created event incorrect");
		});

		it("Creation of New Ballot with proposition_number =1", async function(){
			var vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			var vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			var proposition_number = 1;
			var Max_Winning_Propositions_Number = 1;
			
			res = await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			var ballot = await Ballot_Instance.Ballots(key);

			var blocknumber = (await web3.eth.getTransaction(res.tx)).blockNumber;
			var timestamp = (await web3.eth.getBlock(blocknumber)).timestamp;

			Check_Ballot_Param(ballot, vote_duration, vote_validation_duration, proposition_number, Max_Winning_Propositions_Number,1, timestamp);
			
			await expectEvent(res, "Ballot_Created", {key:key}, "Ballot_Created event incorrect");
		});

		it("Attempt to create the same Ballot (the same key) twice", async function(){
			var vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			var vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			var proposition_number = chance.natural({min:2, max:Prop_Max_Number});
			var Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			
			res = await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);
			
			await expectRevert(Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number), "Already Existing Ballot");
		});
	});



	describe("Vote Clear", ()=>{
		
		let vote_duration;
		let vote_validation_duration;
		let proposition_number;
		let Max_Winning_Propositions_Number;

		let Choices;

		beforeEach(async function () {

			Ballot_Instance = await MAJORITY_JUDGMENT.new({from: External_Account});
			Voter_Register_Mock_Instance = await Voter_Registe_Mock.new(Citizens, {from: External_Account});

			key = web3.utils.randomHex(32);
			vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			vote_validation_duration = 0;
			proposition_number = chance.natural({min:1, max:Prop_Max_Number});
			if(proposition_number==1){
				Max_Winning_Propositions_Number=1;
			}else{
				Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			}

			Choices = Array.from({length:proposition_number+1}, x=>chance.natural({min:0, max:4}));
		});


		it("External_Account Attempt to vote clear", async function(){
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);
			var ballot = await Ballot_Instance.Ballots(key);
			await expectRevert(Ballot_Instance.Vote_Clear(key, Choices, {from:External_Account}), "Address Not Allowed");
		});

		it("Citizen_Account Attempt to vote clear for non existing Ballot", async function(){
			await expectRevert(Ballot_Instance.Vote_Clear(key, Choices), "Not at voting stage");
		});

		it("Citizen_Account Attempt to vote clear while Ballot require voting hashed (vote_validation_duration>0)", async function(){
			vote_validation_duration=chance.natural({min:1, max:time.duration.days(1)});
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);
			await expectRevert(Ballot_Instance.Vote_Clear(key, Choices), "Should Use Vote_Hashed");
		});

		it("Attempt to submit a Choices array of wrong size ", async function(){
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			Choices = Array.from({length:chance.natural({min:1, max: proposition_number})}, x=>chance.natural({min:0, max:4}));
			await expectRevert(Ballot_Instance.Vote_Clear(key, Choices), "Choices argument wrong size");
		});

		it("Citizen_Account vote clear", async function(){
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			var ballot_before = await Ballot_Instance.Ballots(key);
			expect(await Ballot_Instance.HasVoted(key, Citizens[0])).to.equal(false);
			expect(ballot_before.Voter_Number).to.be.bignumber.equal(new BN(0));

			res = await Ballot_Instance.Vote_Clear(key, Choices);

			var ballot_after = await Ballot_Instance.Ballots(key);
			theoric_results = Compute_Result([Choices]);

			theoric_results.forEach(async (elem, i, arr)=>{
				var obtained_res = await Ballot_Instance.Get_Propositions_Result(key,i);
				expect(JSON.stringify(obtained_res.Cumulated_Score) == JSON.stringify(elem.Cumulated_Score.map(x=>{return x.toString()}))).to.equal(true);
			});

			expect(await Ballot_Instance.HasVoted(key, Citizens[0])).to.equal(true);
			expect(ballot_after.Voter_Number).to.be.bignumber.equal(ballot_before.Voter_Number.addn(1));
			await expectEvent(res, "Voted_Clear", {key:key, voter:Citizens[0]}, "Voted_Clear event incorrect");
		});

		it("Citizen_Account attempt to vote clear twice", async function(){
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			await Ballot_Instance.Vote_Clear(key, Choices);

			Choices.forEach((elem,index,arr)=>{arr[index]=chance.natural({min:0, max:4})});

			await expectRevert(Ballot_Instance.Vote_Clear(key, Choices), "Already Voted");			
		});

	});


	describe("Vote Hashed", ()=>{
		
		let vote_duration;
		let vote_validation_duration;
		let proposition_number;
		let Max_Winning_Propositions_Number;

		let Choices;
		let salt;

		beforeEach(async function () {

			Ballot_Instance = await MAJORITY_JUDGMENT.new({from: External_Account});
			Voter_Register_Mock_Instance = await Voter_Registe_Mock.new(Citizens, {from: External_Account});

			key = web3.utils.randomHex(32);
			vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			proposition_number = chance.natural({min:1, max:Prop_Max_Number});
			if(proposition_number==1){
				Max_Winning_Propositions_Number=1;
			}else{
				Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			}
			
			Choices = Array.from({length:proposition_number+1}, x=>chance.natural({min:0, max:4}));
			Salt = web3.utils.randomHex(32);
			Hash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["uint[]", "bytes32"],[Choices, Salt]));

		});

		it("External_Account Attempt to vote hashed", async function(){
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);
			var ballot = await Ballot_Instance.Ballots(key);
			await expectRevert(Ballot_Instance.Vote_Hashed(key, Hash, {from:External_Account}), "Address Not Allowed");
		});

		it("Citizen_Account Attempt to vote hashed for non existing Ballot", async function(){
			await expectRevert(Ballot_Instance.Vote_Hashed(key, Hash), "Not at voting stage");
		});

		it("Citizen_Account Attempt to vote hashed while Ballot require voting clear (vote_validation_duration=0)", async function(){
			vote_validation_duration=0;
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);
			await expectRevert(Ballot_Instance.Vote_Hashed(key, Hash), "Should Use Vote_Clear");
		});

		it("Citizen_Account vote Hashed", async function(){
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			//var ballot_before = await Ballot_Instance.Ballots(key);
			expect(await Ballot_Instance.HasVoted(key, Citizens[0])).to.equal(false);
			//expect(ballot_before.Voter_Number).to.be.bignumber.equal(new BN(0));

			res = await Ballot_Instance.Vote_Hashed(key, Hash);

			var ballot = await Ballot_Instance.Ballots(key);
			var validation_data = await Ballot_Instance.HasValidated(key, Citizens[0]);


			expect(await Ballot_Instance.HasVoted(key, Citizens[0])).to.equal(true);
			expect(ballot.Voter_Number).to.be.bignumber.equal(new BN(0));
			expect(validation_data.Validated).to.equal(false);
			expect(validation_data.Choice).to.equal(Hash);
			await expectEvent(res, "Voted_Hashed", {key:key, voter:Citizens[0]}, "Voted_Hashed event incorrect");
		});


		it("Citizen_Account attempt to vote hashed twice", async function(){
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			await Ballot_Instance.Vote_Hashed(key, Hash);
			await expectRevert(Ballot_Instance.Vote_Hashed(key, web3.utils.randomHex(32)), "Already Voted");			
		});
	});


	describe("End Voting stage for ballot requiring hashed votes (vote_validation_duration>0)", ()=>{
		
		let vote_duration;
		let vote_validation_duration;
		let proposition_number;
		let Max_Winning_Propositions_Number;

		let Citizens_Votes;

		beforeEach(async function () {

			Ballot_Instance = await MAJORITY_JUDGMENT.new({from: External_Account});
			Voter_Register_Mock_Instance = await Voter_Registe_Mock.new(Citizens, {from: External_Account});

			key = web3.utils.randomHex(32);
			vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			proposition_number = chance.natural({min:1, max:Prop_Max_Number});
			if(proposition_number==1){
				Max_Winning_Propositions_Number=1;
			}else{
				Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			}
		
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			Citizens_Votes = Hashed_Votes_Creation(proposition_number, Citizens.length);

			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Vote_Hashed(key, elem.Hash, {from:Citizens[i]});
			});

		});

		it("Attempt to end Voting stage for non existing Ballot", async function(){
			await expectRevert(Ballot_Instance.End_Vote(web3.utils.randomHex(32)), "Not at voting stage");
		});

		it("Attempt to end Voting stage before the vote_duration is passed", async function(){
			await expectRevert(Ballot_Instance.End_Vote(key), "Voting stage not finished");
		});

		it("End Voting stage and begin the Validation stage", async function(){
			await time.increase(vote_duration+1);

			res = await Ballot_Instance.End_Vote(key);

			var blocknumber = (await web3.eth.getTransaction(res.tx)).blockNumber;
			var timestamp = (await web3.eth.getBlock(blocknumber)).timestamp;
			timestamp=new BN(timestamp);

			var ballot = await Ballot_Instance.Ballots(key);

			expect(ballot.Status).to.be.bignumber.equal(new BN(2));
			expect(ballot.End_Vote_Timestamp).to.be.bignumber.equal(timestamp);

			await expectEvent(res, "Begin_Validation", {key:key}, "Begin_Validation event incorrect");
		});

	});

	describe("Validation Stage", ()=>{
		
		let vote_duration;
		let vote_validation_duration;
		let proposition_number;
		let Max_Winning_Propositions_Number;

		let Choices;
		let salt;

		beforeEach(async function () {

			Ballot_Instance = await MAJORITY_JUDGMENT.new({from: External_Account});
			Voter_Register_Mock_Instance = await Voter_Registe_Mock.new(Citizens, {from: External_Account});

			key = web3.utils.randomHex(32);
			vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			proposition_number = chance.natural({min:1, max:Prop_Max_Number});
			if(proposition_number==1){
				Max_Winning_Propositions_Number=1;
			}else{
				Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			}

			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			Choices = Array.from({length:proposition_number+1}, x=>chance.natural({min:0, max:4}));
			Salt = web3.utils.randomHex(32);
			Hash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["uint[]", "bytes32"],[Choices, Salt]));

			await Ballot_Instance.Vote_Hashed(key, Hash);
			
		});

		it("Attempt to Validate while we are not at Validation stage ", async function(){
			await expectRevert(Ballot_Instance.Valdiate_Vote(key, Choices, Salt), "Not at vote validation stage");
		});

		it("Attempt to Validate a Choices array of wrong size ", async function(){
			Choices = Array.from({length:chance.natural({min:1, max: proposition_number})}, x=>chance.natural({min:0, max:4}));
			Salt = web3.utils.randomHex(32);
			Hash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["uint[]", "bytes32"],[Choices, Salt]));

			await Ballot_Instance.Vote_Hashed(key, Hash, {from:Citizens[1]});
			await time.increase(vote_duration+1);
			await Ballot_Instance.End_Vote(key);

			await expectRevert(Ballot_Instance.Valdiate_Vote(key, Choices, Salt, {from:Citizens[1]}), "Choices argument wrong size");
		});

		it("Account who didn't vote Attempt to Validate", async function(){
			await time.increase(vote_duration+1);
			await Ballot_Instance.End_Vote(key);
			await expectRevert(Ballot_Instance.Valdiate_Vote(key, Choices, Salt, {from:External_Account}), "Hashes don't match");
		});

		it("Attempt to Validate non matching hashes", async function(){
			await time.increase(vote_duration+1);
			await Ballot_Instance.End_Vote(key);
			await expectRevert(Ballot_Instance.Valdiate_Vote(key, Choices, web3.utils.randomHex(32)), "Hashes don't match");
		});

		it("Citizen Validate his vote", async function(){
			await time.increase(vote_duration+1);
			await Ballot_Instance.End_Vote(key);
			res = await Ballot_Instance.Valdiate_Vote(key, Choices, Salt);

			var ballot = await Ballot_Instance.Ballots(key);

			theoric_results = Compute_Result([Choices]);

			theoric_results.forEach(async (elem, i, arr)=>{
				var obtained_res = await Ballot_Instance.Get_Propositions_Result(key,i);
				expect(JSON.stringify(obtained_res.Cumulated_Score) == JSON.stringify(elem.Cumulated_Score.map(x=>{return x.toString()}))).to.equal(true);
				
			});

			expect(ballot.Voter_Number).to.be.bignumber.equal(new BN(1));
			expect((await Ballot_Instance.HasValidated(key, Citizens[0]))[0]).to.equal(true);
			await expectEvent(res, "Validated_Vote", {key:key, voter: Citizens[0]}, "Validated_Vote event incorrect");
		});

		it("Citizens attempt to validate twice", async function(){
			await time.increase(vote_duration+1);
			await Ballot_Instance.End_Vote(key);
			res = await Ballot_Instance.Valdiate_Vote(key, Choices, Salt);

			await expectRevert(Ballot_Instance.Valdiate_Vote(key, Choices, Salt), "Vote Already Validated");
		})
		
	});

	describe("END BALLOT: Test function: End_Vote function for ballot requiring clear votes (vote_validation_duration=0), End_Validation_Vote and _Talling_Votes (internal)", ()=>{
		
		let vote_duration;
		let vote_validation_duration;
		let proposition_number;
		let Max_Winning_Propositions_Number;

		let Citizens_Votes;

		beforeEach(async function () {

			Ballot_Instance = await MAJORITY_JUDGMENT.new({from: External_Account});
			Voter_Register_Mock_Instance = await Voter_Registe_Mock.new(Citizens, {from: External_Account});

			key = web3.utils.randomHex(32);
			vote_duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
			
		});

		it("Tailling vote (via End_Vote function) proposition_number =1", async function(){
			vote_validation_duration = 0;
			proposition_number=1;
			Max_Winning_Propositions_Number=1;
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			Citizens_Votes = Cleared_Votes_Creation(proposition_number, Citizens.length); //Array of Citizens's Choices array
			console.log("Citizens_Votes:", Citizens_Votes);

			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Vote_Clear(key, elem, {from:Citizens[i]});
			});
			var expected_Results = Compute_Result(Citizens_Votes);
			console.debug("expected_Results:",expected_Results);
			await time.increase(vote_duration+1);
			var Expected_Winning_Proposals = Compute_Winning_Proposals(expected_Results, Max_Winning_Propositions_Number);
			console.log("Expected_Winning_Proposals:",Expected_Winning_Proposals);


			res = await Ballot_Instance.End_Vote(key);

			var Obtained_Winning_Prop = await Ballot_Instance.Get_Winning_Propositions(key);
			console.log("Obtained Winning_Prop:", Obtained_Winning_Prop.map(x=>x.toNumber()));

			expect(JSON.stringify(Obtained_Winning_Prop.map(x=>x.toNumber())) == JSON.stringify(Expected_Winning_Proposals)).to.equal(true);
		}); 

		it("Tailling vote (via End_Vote function) proposition_number=N (>1), Max_Winning_Propositions_Number=1", async function(){
			vote_validation_duration = 0;
			proposition_number = chance.natural({min:2, max:Prop_Max_Number});
			Max_Winning_Propositions_Number = 1;
			
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			Citizens_Votes = Cleared_Votes_Creation(proposition_number, Citizens.length); //Array of Citizens's Choices array
			console.log("Citizens_Votes:", Citizens_Votes);

			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Vote_Clear(key, elem, {from:Citizens[i]});
			});
			var expected_Results = Compute_Result(Citizens_Votes);
			console.debug("expected_Results:",expected_Results);
			await time.increase(vote_duration+1);
			var Expected_Winning_Proposals = Compute_Winning_Proposals(expected_Results, Max_Winning_Propositions_Number);
			console.log("Expected_Winning_Proposals:",Expected_Winning_Proposals);


			res = await Ballot_Instance.End_Vote(key);

			var Obtained_Winning_Prop = await Ballot_Instance.Get_Winning_Propositions(key);
			console.log("Obtained Winning_Prop:", Obtained_Winning_Prop.map(x=>x.toNumber()));

			expect(JSON.stringify(Obtained_Winning_Prop.map(x=>x.toNumber())) == JSON.stringify(Expected_Winning_Proposals)).to.equal(true);
		});

		it("Tailling vote (via End_Vote function) proposition_number=N (>1), Max_Winning_Propositions_Number= M (>=1, <N)", async function(){
			vote_validation_duration = 0;
			proposition_number = chance.natural({min:2, max:Prop_Max_Number});
			Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			Citizens_Votes = Cleared_Votes_Creation(proposition_number, Citizens.length); //Array of Citizens's Choices array
			console.log("Citizens_Votes:", Citizens_Votes);

			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Vote_Clear(key, elem, {from:Citizens[i]});
			});
			console.log("Max_Winning_Propositions_Number",Max_Winning_Propositions_Number);
			var expected_Results = Compute_Result(Citizens_Votes);
			console.debug("expected_Results:",expected_Results);
			
			var Expected_Winning_Proposals = Compute_Winning_Proposals(expected_Results, Max_Winning_Propositions_Number);
			console.log("Expected_Winning_Proposals:",Expected_Winning_Proposals);

			await time.increase(vote_duration+1);

			res = await Ballot_Instance.End_Vote(key);
			

			var Obtained_Winning_Prop = await Ballot_Instance.Get_Winning_Propositions(key);
			console.log("Obtained Winning_Prop:", Obtained_Winning_Prop.map(x=>x.toNumber()));

			expect(JSON.stringify(Obtained_Winning_Prop.map(x=>x.toNumber())) == JSON.stringify(Expected_Winning_Proposals)).to.equal(true);
		});

		it("Tailling vote (via End_Vote function) But nobody has voted", async function(){
			vote_validation_duration = 0;
			proposition_number = chance.natural({min:2, max:Prop_Max_Number});
			Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);
			
			await time.increase(vote_duration+1);

			res = await Ballot_Instance.End_Vote(key);
			

			var Obtained_Winning_Prop = await Ballot_Instance.Get_Winning_Propositions(key);

			expect(JSON.stringify(Obtained_Winning_Prop.map(x=>x.toNumber())) == JSON.stringify([0])).to.equal(true);
		});

		it("Citizen call function End_Vote for ballot requiring clear votes (vote_validation_duration=0)", async function(){
			vote_validation_duration = 0;
			proposition_number = chance.natural({min:1, max:Prop_Max_Number});
			
			if(proposition_number==1){
				Max_Winning_Propositions_Number=1;
			}else{
				Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			}
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			Citizens_Votes = Cleared_Votes_Creation(proposition_number, Citizens.length); //Array of Citizens's Choices array

			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Vote_Clear(key, elem, {from:Citizens[i]});
			});
			
			await time.increase(vote_duration+1);

			res = await Ballot_Instance.End_Vote(key);
			ballot= await Ballot_Instance.Ballots(key);

			expect(ballot.Status).to.be.bignumber.equal(new BN(3));
			await expectEvent(res, "Vote_Finished", {key:key}, "Vote_Finished event incorrect");
		});


		it("Citizen attempt to call function End_Validation_Vote but we are not at Vote Validation Stage", async function(){
			vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			proposition_number = chance.natural({min:1, max:Prop_Max_Number});
			if(proposition_number==1){
				Max_Winning_Propositions_Number=1;
			}else{
				Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			}
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			Citizens_Votes = Hashed_Votes_Creation(proposition_number, Citizens.length); //Array of Citizens's Choices array

			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Vote_Hashed(key, elem.Hash, {from:Citizens[i]});
			});
			
			await expectRevert(Ballot_Instance.End_Validation_Vote(key), "Not at vote counting stage");
	
		});

		it("Citizen attempt to call function End_Validation_Vote but Vote Validation Stage isn't finished yet", async function(){
			vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			proposition_number = chance.natural({min:1, max:Prop_Max_Number});
			if(proposition_number==1){
				Max_Winning_Propositions_Number=1;
			}else{
				Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			}
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			Citizens_Votes = Hashed_Votes_Creation(proposition_number, Citizens.length); //Array of Citizens's Choices array

			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Vote_Hashed(key, elem.Hash, {from:Citizens[i]});
			});

			await time.increase(vote_duration+1);
			await Ballot_Instance.End_Vote(key);
			
			await expectRevert(Ballot_Instance.End_Validation_Vote(key), "Not at vote counting stage");
	
		});

		it("Citizen call function End_Validation_Vote", async function(){
			vote_validation_duration = chance.natural({min:vote_validation_duration_min, max:vote_validation_duration_max});
			proposition_number = chance.natural({min:1, max:Prop_Max_Number});
			if(proposition_number==1){
				Max_Winning_Propositions_Number=1;
			}else{
				Max_Winning_Propositions_Number = chance.natural({min:1, max:proposition_number-1});
			}
			await Ballot_Instance.Create_Ballot(key, Voter_Register_Mock_Instance.address, Contains_Selector, vote_duration, vote_validation_duration, 
				proposition_number, Max_Winning_Propositions_Number);

			Citizens_Votes = Hashed_Votes_Creation(proposition_number, Citizens.length); //Array of Citizens's Choices array

			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Vote_Hashed(key, elem.Hash, {from:Citizens[i]});
			});
			
			await time.increase(vote_duration+1);

			res = await Ballot_Instance.End_Vote(key);

			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Valdiate_Vote(key, elem.Choice, elem.Salt, {from:Citizens[i]});
			});

			await time.increase(vote_validation_duration+1);

			res=await Ballot_Instance.End_Validation_Vote(key);

			ballot= await Ballot_Instance.Ballots(key);

			expect(ballot.Status).to.be.bignumber.equal(new BN(3));
			await expectEvent(res, "Vote_Finished", {key:key}, "Vote_Finished event incorrect");
		});
	});
});