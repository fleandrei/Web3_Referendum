//Test: Delegation.sol 
const { BN, ether, expectEvent, expectRevert, constants, time } = require('@openzeppelin/test-helpers'); // BN: Big Number
const { expect } = require('chai');
const DELEGATION_UTILS = artifacts.require('Delegation_Uils');
const INITIATIVE_LEGISLATIV_LIB = artifacts.require('Initiative_Legislative_Lib');
const DELEGATION = artifacts.require('Delegation');
const MAJORITY_JUDGMENT = artifacts.require('Majority_Judgment_Ballot');
const DEMOCOIN = artifacts.require('DemoCoin');
const CITIZEN_REGISTER = artifacts.require('Citizens_Register');
const LOI = artifacts.require('Loi')
const Voter_Registe_Mock = artifacts.require('Voter_Register_Mock');
const chance = require("chance").Chance();


function Bytes32ToAddress(str){
	return str.slice(0,2) + str.slice(26);
}

contract('TEST: Delegation.sol', function(accounts){
	/*Accounts*/
	const Nbr_Account = accounts.length;
	const Constitution_Address = accounts[0];
	const Agora_Address = accounts[1];
	const External_Account = accounts[2];

	const Citizens = accounts.slice(3);
	let member_ratio = 30
	let first_member_indice = Math.floor(Citizens.length*(100-member_ratio)/100);
	let Members = Citizens.slice(first_member_indice);

	/*Contracts*/
	let Delegation_Utils_Library;
	let Initiative_Legislative_Lib_Library;
	let Ballot_Instance;
	let DemoCoin_Instance;
	let Citizen_Register_Instance;
	let Delegation_Instance;

	/*TEST PARAMETERS*/
	const Citizen_Initial_Ammounts=100;
	const Delegation_Token_Amount = 1000;
	const Initital_Token_Ammount = Citizen_Initial_Ammounts*Citizens.length + Delegation_Token_Amount;
	const Law_Initialisation_Price_Ratio = 50; //Percentage of "Member_Max_Token_Usage" a law initialisation cost;
	const FunctionCall_Price_Ratio = 5; //Percentage of "Member_Max_Token_Usage" a functionCall creation cost;
	
	const New_Citizen_Mint_Amount=5;
	const Prop_Max_Number=7;
	

	const Contains_Selector = "0x57f98d32";

	const vote_duration_min = time.duration.minutes(5).toNumber();
	const vote_duration_max = time.duration.days(3).toNumber();
	const validation_duration_min = time.duration.minutes(5).toNumber();
	const validation_duration_max = time.duration.days(1).toNumber();
	const mandate_duration_min = time.duration.days(3).toNumber();
	const mandate_duration_max = time.duration.days(10).toNumber();
	const Immunity_duration_rate = 30;

	const Proposition_Duration_min = time.duration.minutes(5).toNumber();
	const Proposition_Duration_max = time.duration.days(10).toNumber();
	const Law_Censor_Period_Duration_min = time.duration.days(1).toNumber();
	const Law_Censor_Period_Duration_max = time.duration.days(5).toNumber();
	const Censor_Proposition_Petition_Rate_max = 5000;
	const Censor_Penalty_Rate_max = 3000;
	const Title_Size_max = 20;
	const Description_Size_max= 50;
	const functionCall_max =10;
	const newItem_max = 5;


	/*Delegation Parameters*/
	let Vote_Duration;
	let Validation_Duration;
	let Mandate_Duration;
	let Immunity_Duration;
	let Next_Mandate_Max_Members;
	let New_Election_Petition_Rate;


	let Member_Max_Token_Usage;
	let Law_Initialisation_Price;
	let FunctionCall_Price;
	let Proposition_Duration;
	let Legislatif_Vote_Duration;
	let Law_Censor_Period_Duration;
	let Censor_Proposition_Petition_Rate;
	let Censor_Penalty_Rate;
	let Uint256_arg = Array.from({length:6});
	

	let Ivote_address;

	class Citizen_Register{
		
		constructor(address, web3){
			this.Address = address;
			this.web3 = web3;
		}

		Get_Register_Citizen_FunctionCall(citizen_address){
			return "0x05766567"+this.web3.eth.abi.encodeParameter("address", citizen_address).slice(2);
		}

	}

	class Loi{
		constructor(address, web3){
			this.Address = address;
			this.web3 = web3;
		}

		Get_AddLaw_FunctionCall(Title, Description){
			//return "0xfcd17346"+this.web3.eth.abi.encodeParameters(["bytes","bytes"], [Title, Description]).slice(2);
			return "0x5836bbe6"+this.web3.eth.abi.encodeParameters(["bytes","bytes"], [Title, Description]).slice(2);
		}
	}

	
	function Cleared_Votes_Creation(num_proposition, num_voter){
		let res= Array.from({length:num_voter});

		res.forEach((elem,i,arr)=>{
			arr[i]= Array.from({length:num_proposition+1}, x=>chance.natural({min:0, max:4}));
		});

		return res;
	}

	beforeEach(async function () {
			DemoCoin_Instance = await DEMOCOIN.new("Token", "TOK",Citizens, new Array(Citizens.length).fill(Citizen_Initial_Ammounts), {from: Constitution_Address});
			Citizen_Register_Instance = await CITIZEN_REGISTER.new(Citizens, DemoCoin_Instance.address, New_Citizen_Mint_Amount, {from: Constitution_Address});	
			await DemoCoin_Instance.Add_Minter(Citizen_Register_Instance.address);
			//Ballot_Instance = await MAJORITY_JUDGMENT.new();
			Delegation_Utils_Library = await DELEGATION_UTILS.new();
			Initiative_Legislative_Lib_Library = await INITIATIVE_LEGISLATIV_LIB.new();
			
			await DELEGATION.link("Delegation_Uils", Delegation_Utils_Library.address);
			await DELEGATION.link("Initiative_Legislative_Lib" , Initiative_Legislative_Lib_Library.address);
			
			Delegation_Instance = await DELEGATION.new(Members, DemoCoin_Instance.address, Citizen_Register_Instance.address, Agora_Address, {from: Constitution_Address});
			key = web3.utils.randomHex(32);

		});

	describe("Delegation Creation", ()=>{

		it("Check globals Delegation parameters", async function(){ 
			expect(await Delegation_Instance.Constitution_Address()).to.equal(Constitution_Address);
			expect(await Delegation_Instance.Type_Institution()).to.be.bignumber.equal(new BN(5));
			var General_info = await Delegation_Instance.Get_Delegation_Infos();
			var BN_0 = new BN(0);
			expect(General_info.legislatif_process_version).to.be.bignumber.equal(BN_0);
			expect(General_info.internal_governance_version).to.be.bignumber.equal(BN_0);
			expect(General_info.actual_mandate).to.be.bignumber.equal(new BN(0));
			expect(General_info.potentialy_lost_amount).to.be.bignumber.equal(BN_0);
			expect(General_info.in_election_stage).to.equal(false);
		});

		it("Check First Mandate Parameters", async function(){ 
			var mandate = await Delegation_Instance.Get_Mandate(0);
						
			expect(mandate.version).to.be.bignumber.equal(new BN(1));
			expect(JSON.stringify(mandate.Members.map(Bytes32ToAddress))).to.equal(JSON.stringify(Members.map(elem=>elem.toLowerCase())));
			expect(mandate.Candidats.length).to.equal(0);
			/*expect(General_info.internal_governance_version).to.be.bignumber.equal(BN_0);
			expect(General_info.actual_mandate).to.be.bignumber.equal(new BN(1));
			expect(General_info.potentialy_lost_amount).to.be.bignumber.equal(BN_0);
			expect(General_info.in_election_stage).to.equal(false);*/
		});

	});
		

	describe("Delegation initialisation. Parameters settings by Constitution_Address", ()=>{
		context("Set Internal Governance Parameters",()=>{
			beforeEach(async function (){
				Ballot_Instance = await MAJORITY_JUDGMENT.new();

				Vote_Duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
				Validation_Duration = chance.natural({min:validation_duration_min, max:validation_duration_max});
				Mandate_Duration = chance.natural({min:mandate_duration_min, max:mandate_duration_max});
				Immunity_Duration = Math.floor(Immunity_duration_rate*Mandate_Duration/100);
				Next_Mandate_Max_Members = Members.length;
				New_Election_Petition_Rate = chance.natural({min:1, max:5000});
				
			});

			it("Random Citizen attempt to Update Internal Governance parameters", async function(){
				await expectRevert(Delegation_Instance.Update_Internal_Governance(Vote_Duration, Validation_Duration, Mandate_Duration,
					Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Ballot_Instance.address, {from:Citizens[0]}), "Constitution Only");
			});


			it("Constitution_Address Update Internal Governance parameters", async function(){

				res = await Delegation_Instance.Update_Internal_Governance(Vote_Duration, Validation_Duration, Mandate_Duration,
					Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Ballot_Instance.address, {from:Constitution_Address});
				var General_info = await Delegation_Instance.Get_Delegation_Infos();
				var mandate_version = await  Delegation_Instance.Mandates_Versions(1);

				expect(General_info.internal_governance_version).to.be.bignumber.equal(new BN(1));
				expect(mandate_version.Election_Duration).to.be.bignumber.equal(new BN(Vote_Duration));
				expect(mandate_version.Validation_Duration).to.be.bignumber.equal(new BN(Validation_Duration));
				expect(mandate_version.Mandate_Duration).to.be.bignumber.equal(new BN(Mandate_Duration));
				expect(mandate_version.Immunity_Duration).to.be.bignumber.equal(new BN(Immunity_Duration));
				expect(mandate_version.Next_Mandate_Max_Members).to.be.bignumber.equal(new BN(Next_Mandate_Max_Members));
				expect(mandate_version.New_Election_Petition_Rate).to.be.bignumber.equal(new BN(New_Election_Petition_Rate));
				expect(mandate_version.Ivote_address).to.equal(Ballot_Instance.address);

				await expectEvent(res, "Governance_Parameters_Updated", {}, "Governance_Parameters_Updated event incorrect");
			});

		});

		context("Set Legislatif Process Parameters",()=>{
			beforeEach(async function (){
				Ballot_Instance = await MAJORITY_JUDGMENT.new();

				Uint256_arg[0] = Math.floor(Initital_Token_Ammount/Members.length); //Member_Max_Token_Usage
				Uint256_arg[1] = Math.floor(Uint256_arg[0]*Law_Initialisation_Price_Ratio/100); //Law_Initialisation_Price
				Uint256_arg[2] = Math.floor(Uint256_arg[0]*FunctionCall_Price_Ratio/100); //FunctionCall_Price
				Uint256_arg[3] = chance.natural({min:Proposition_Duration_min, max:Proposition_Duration_max}); //Proposition_Duration
				Uint256_arg[4] = chance.natural({min:vote_duration_min, max:vote_duration_max}); //Vote_Duration
				Uint256_arg[5] = chance.natural({min:Law_Censor_Period_Duration_min, max:Law_Censor_Period_Duration_min}); //Law_Censor_Period_Duration

				Censor_Proposition_Petition_Rate= chance.natural({min:1, max:Censor_Proposition_Petition_Rate_max});
				Censor_Penalty_Rate = chance.natural({min:1, max:Censor_Penalty_Rate_max}); 			
			});

			it("Random Citizen attempt to Update Legislatif Process parameters", async function(){
				await expectRevert(Delegation_Instance.Update_Legislatif_Process(Uint256_arg, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
					Ballot_Instance.address, {from:Citizens[0]}), "Constitution Only");
			});


			it("Constitution_Address Update Legislatif Process parameters", async function(){

				res = await Delegation_Instance.Update_Legislatif_Process(Uint256_arg, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
					Ballot_Instance.address, {from:Constitution_Address});
				
				var law_parameters_version = await  Delegation_Instance.Law_Parameters_Versions(1);
				var General_info = await Delegation_Instance.Get_Delegation_Infos();
			
				expect(General_info.legislatif_process_version).to.be.bignumber.equal(new BN(1));
				expect(law_parameters_version.Member_Max_Token_Usage).to.be.bignumber.equal(new BN(Uint256_arg[0]));
				expect(law_parameters_version.Law_Initialisation_Price).to.be.bignumber.equal(new BN(Uint256_arg[1]));
				expect(law_parameters_version.FunctionCall_Price).to.be.bignumber.equal(new BN(Uint256_arg[2]));
				expect(law_parameters_version.Proposition_Duration).to.be.bignumber.equal(new BN(Uint256_arg[3]));
				expect(law_parameters_version.Vote_Duration).to.be.bignumber.equal(new BN(Uint256_arg[4]));
				expect(law_parameters_version.Law_Censor_Period_Duration).to.be.bignumber.equal(new BN(Uint256_arg[5]));
				expect(law_parameters_version.Censor_Proposition_Petition_Rate).to.be.bignumber.equal(new BN(Censor_Proposition_Petition_Rate));
				expect(law_parameters_version.Censor_Penalty_Rate).to.be.bignumber.equal(new BN(Censor_Penalty_Rate));
				expect(law_parameters_version.Ivote_address).to.equal(Ballot_Instance.address);

				await expectEvent(res, "Legislatif_Parameters_Updated", {}, "Legislatif_Parameters_Updated event incorrect");
			});

		});
		

		context("Edit Controled Register",()=>{
			

			it("Random Citizen attempt to add a controled register to the Delegation", async function(){
				await expectRevert(Delegation_Instance.Add_Controled_Register(Citizen_Register_Instance.address, {from:Citizens[0]}), "Constitution Only");
			});

			it("Constitution_Address add a controled register to the Delegation", async function(){
				res = await Delegation_Instance.Add_Controled_Register(Citizen_Register_Instance.address, {from:Constitution_Address});

				var controled_register = await  Delegation_Instance.Controled_Registers(Citizen_Register_Instance.address);
				var List_controled_register = (await Delegation_Instance.Get_List_Law_Register())[1];
				var register_authorities = await Citizen_Register_Instance.Get_Authorities();

				expect(controled_register.Active).to.equal(true);
				expect(List_controled_register.map(Bytes32ToAddress).includes(Citizen_Register_Instance.address.toLowerCase())).to.equal(true);

				await expectEvent(res, "Controled_Register_Added", {register:Citizen_Register_Instance.address}, "Controled_Register_Added event incorrect");
			});

			it("Random Citizen attempt to remove a controled register from the Delegation", async function(){
				await Delegation_Instance.Add_Controled_Register(Citizen_Register_Instance.address, {from:Constitution_Address});
				await expectRevert(Delegation_Instance.Remove_Controled_Register(Citizen_Register_Instance.address, {from:Citizens[0]}), "Constitution Only");
			});

			it("Constitution_Address attempt to remove a non existing controled register from the Delegation", async function(){
				await expectRevert(Delegation_Instance.Remove_Controled_Register(Citizen_Register_Instance.address, {from:Constitution_Address}), "Register Not Controled");
			});

			it("Constitution_Address removes \"Citizen_Register_Instance\"controled_register from the Delegation", async function(){

				await Delegation_Instance.Add_Controled_Register(Citizen_Register_Instance.address, {from:Constitution_Address});
				await Citizen_Register_Instance.Add_Registering_Authority(Delegation_Instance.address, {from:Constitution_Address});
				var controled_register = await  Delegation_Instance.Controled_Registers(Citizen_Register_Instance.address);

				res = await Delegation_Instance.Remove_Controled_Register(Citizen_Register_Instance.address, {from:Constitution_Address});
				
				var controled_register = await  Delegation_Instance.Controled_Registers(Citizen_Register_Instance.address);
				var List_controled_register = (await Delegation_Instance.Get_List_Law_Register())[1];
				var register_authorities = await Citizen_Register_Instance.Get_Registering_Authorities();

				expect(controled_register.Active).to.equal(false);
				expect(List_controled_register.map(Bytes32ToAddress).includes(Citizen_Register_Instance.address.toLowerCase())).to.equal(false);
				await expectEvent(res, "Controled_Register_Removed", {register:Citizen_Register_Instance.address}, "Controled_Register_Removed event incorrect");
			
				expect(register_authorities.map(Bytes32ToAddress).includes(Delegation_Instance.address.toLowerCase())).to.equal(false);
			});

			it("Constitution_Address removes \"Loi_instance\"controled_register from the Delegation", async function(){
				var Loi_instance = await LOI.new(Agora_Address, {from: Constitution_Address});
				await Delegation_Instance.Add_Controled_Register(Loi_instance.address, {from:Constitution_Address});
				await Loi_instance.Add_Authority(Delegation_Instance.address, {from:Constitution_Address});

				res= await Delegation_Instance.Remove_Controled_Register(Loi_instance.address, {from:Constitution_Address});
				
				var controled_register = await  Delegation_Instance.Controled_Registers(Loi_instance.address);
				var List_controled_register = (await Delegation_Instance.Get_List_Law_Register())[1];
				var register_authorities = await Loi_instance.Get_Authorities();

				expect(controled_register.Active).to.equal(false);
				expect(List_controled_register.map(Bytes32ToAddress).includes(Loi_instance.address.toLowerCase())).to.equal(false);
				await expectEvent(res, "Controled_Register_Removed", {register:Loi_instance.address}, "Controled_Register_Removed event incorrect");
			
				expect(register_authorities.map(Bytes32ToAddress).includes(Delegation_Instance.address.toLowerCase())).to.equal(false);
			});

		});
		
	});

	
	describe("Delegation: Internal Governance Tests", ()=>{

		beforeEach(async function (){
				Ballot_Instance = await MAJORITY_JUDGMENT.new();

				Vote_Duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
				Validation_Duration = chance.natural({min:validation_duration_min, max:validation_duration_max});
				Mandate_Duration = chance.natural({min:mandate_duration_min, max:mandate_duration_max});
				Immunity_Duration = Math.floor(Immunity_duration_rate*Mandate_Duration/100);
				Next_Mandate_Max_Members = Members.length;
				New_Election_Petition_Rate = chance.natural({min:10000/Citizens.length, max:5000}); //We assure that the ratio will correspond at least at 1 citizen

			});

		context("Election launching and before", ()=>{

			beforeEach(async function (){
				await Delegation_Instance.Update_Internal_Governance(Vote_Duration, Validation_Duration, Mandate_Duration,
						Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Ballot_Instance.address, {from:Constitution_Address});
			});

			it("External_Account attempt to candidate to Delegation Elections", async function(){ 
				await expectRevert(Delegation_Instance.Candidate_Election({from:External_Account}), "Citizen Only");
			});

			it("Citizen candidates to Election", async function(){ 
				res = await Delegation_Instance.Candidate_Election({from:Citizens[0]});

				var mandate_info = await Delegation_Instance.Get_Mandate(0);
							
				expect(mandate_info.Candidats.map(Bytes32ToAddress).includes(Citizens[0].toLowerCase())).to.equal(true);
				await expectEvent(res, "New_Candidat", {Candidat:Citizens[0]}, "New_Candidat event incorrect");
			});

			it("Citizen candidates twice to Election", async function(){ 
				res = await Delegation_Instance.Candidate_Election({from:Citizens[0]});
				await expectRevert(Delegation_Instance.Candidate_Election({from:Citizens[0]}), "Already Candidate");
			});

			//Remove candidature
			it("Citizen attempts to remove not existing candidature", async function(){ 
				await expectRevert(Delegation_Instance.Remove_Candidature({from:Citizens[0]}), "Not Candidate");
			});

			it("Candidat removes his candidature", async function(){ 
				await Delegation_Instance.Candidate_Election({from:Citizens[0]});
				res = await Delegation_Instance.Remove_Candidature({from:Citizens[0]});

				var mandate_info = await Delegation_Instance.Get_Mandate(1);

				expect(mandate_info.Candidats.map(Bytes32ToAddress).includes(Citizens[0].toLowerCase())).to.equal(false);
				await expectEvent(res, "Remove_Candidat", {Candidat:Citizens[0]}, "Remove_Candidat event incorrect");
			});

			//Sign Petition for new election
			it("External_Account attempts to sign petition for new election", async function(){ 
				await expectRevert(Delegation_Instance.Sign_New_Election_Petition({from:External_Account}), "Citizen Only");
			});

			it("Citizen attempts to sign petition for new election before Immuity period is finished", async function(){ 
				
				await expectRevert(Delegation_Instance.Sign_New_Election_Petition({from:Citizens[0]}), "Immunity Period");
			});

			it("Citizen sign petition for new election", async function(){ 
				await time.increase(Immunity_Duration+1);
				res = await Delegation_Instance.Sign_New_Election_Petition({from:Citizens[0]});

				var mandate = await Delegation_Instance.Get_Mandate(0);

				expect(mandate.New_Election_Petition_Number).to.be.bignumber.equal(new BN(1));
				await expectEvent(res, "Sign", {}, "Sign event incorrect");

			});

			it("Citizen sign petition twice", async function(){ 
				await time.increase(Immunity_Duration+1);
				await Delegation_Instance.Sign_New_Election_Petition({from:Citizens[0]});
				await expectRevert(Delegation_Instance.Sign_New_Election_Petition({from:Citizens[0]}), "Already signed petition");
			});

			//Election
			it("External_Account attempts to setup a new election", async function(){ 
				await expectRevert(Delegation_Instance.New_Election({from:External_Account}), "Citizen Only");
			});

			it("Citizens attempts to setup a new election but there is no candidates", async function(){ 
				await expectRevert(Delegation_Instance.New_Election({from:Citizens[0]}), "No Candidats");
			});

			it("Citizens attempts to setup a new election before Mandate duration is over and with not enough signatures", async function(){ 
				await Delegation_Instance.Candidate_Election({from:Citizens[0]});
				var mandate= await Delegation_Instance.Get_Mandate(0);
				var parameter = await Delegation_Instance.Mandates_Versions(1);
				var Delegation_info = await Delegation_Instance.Get_Delegation_Infos();
				await expectRevert(Delegation_Instance.New_Election({from:Citizens[0]}), "New election impossible for now");
			});

			it("Citizens setup a new election After Mandate duration is over. LESS Candidates than Member place. A new Mandate is setup ", async function(){ 
				await Delegation_Instance.Candidate_Election({from:Citizens[0]});

				await time.increase(Mandate_Duration+1);
				res = await Delegation_Instance.New_Election({from:Citizens[0]});

				var mandate= await Delegation_Instance.Get_Mandate(0);
				var parameter = await Delegation_Instance.Mandates_Versions(1);
				var Delegation_info = await Delegation_Instance.Get_Delegation_Infos();
				
				var last_mandate = await Delegation_Instance.Get_Mandate(0);
				var new_mandate = await Delegation_Instance.Get_Mandate(1);
				var Delegation_info = await Delegation_Instance.Get_Delegation_Infos();

				expect(JSON.stringify(last_mandate.Candidats.map(Bytes32ToAddress))).to.equal(JSON.stringify(new_mandate.Members.map(Bytes32ToAddress)));
				expect(new_mandate.version).to.be.bignumber.equal(new BN(1));
				expect(new_mandate.New_Election_Petition_Number).to.be.bignumber.equal(new BN(0));
				expect(new_mandate.Candidats.length).to.equal(0);
				expect(Delegation_info.in_election_stage).to.equal(false);
				await expectEvent(res, "New_Mandate", {}, "New_Mandate event incorrect");
				
				await expectRevert(Delegation_Instance.New_Election({from:Citizens[0]}), "No Candidats");

				await Delegation_Instance.Candidate_Election({from:Citizens[0]});
				
				await expectRevert(Delegation_Instance.New_Election({from:Citizens[0]}), "New election impossible for now");
			});

			it("Citizens setup a new election After Mandate duration is over. MORE Candidates than Member place ", async function(){ 
				
				for(var i=0; i<Next_Mandate_Max_Members+1;i++){
					await Delegation_Instance.Candidate_Election({from:Citizens[i]});
				}

				await time.increase(Mandate_Duration+1);
				res = await Delegation_Instance.New_Election({from:Citizens[0]});

				var blocknumber = (await web3.eth.getTransaction(res.tx)).blockNumber;
				var timestamp = (await web3.eth.getBlock(blocknumber)).timestamp;
				//var key= web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["address", "uint256"],[Delegation_Instance.address, timestamp]));
				var key = web3.utils.soliditySha3(Delegation_Instance.address, timestamp);

				var last_mandate = await Delegation_Instance.Get_Mandate(0);				

				var ballot = await Ballot_Instance.Ballots(key);
				var Delegation_info = await Delegation_Instance.Get_Delegation_Infos();

				//await expectEvent(res, "Ballot_Created", {key:key}, "Ballot_Created event incorrect");
				/*await expectEvent(res, "LogAddress", {addr:Delegation_Instance.address}, "LogAddress event incorrect");
				await expectEvent(res, "LogBytes32", {Hash:key}, "LogBytes32 event incorrect");	*/
				
				/*var last_mandate = await Delegation_Instance.Get_Mandate(0);
				var new_mandate = await Delegation_Instance.Get_Mandate(1);
				var Delegation_info = await Delegation_Instance.Get_Delegation_Infos();*/

				expect(ballot.Voters_Register_Address).to.equal(Citizen_Register_Instance.address);
				expect(ballot.Check_Voter_Selector).to.equal(Contains_Selector);
				expect(ballot.Status).to.be.bignumber.equal(new BN(1));
				expect(ballot.Vote_Duration).to.be.bignumber.equal(new BN(Vote_Duration));
				expect(ballot.Vote_Validation_Duration).to.be.bignumber.equal(new BN(Validation_Duration));
				expect(ballot.Propositions_Number).to.be.bignumber.equal(new BN(Next_Mandate_Max_Members+1));
				expect(ballot.Max_Winning_Propositions_Number).to.be.bignumber.equal(new BN(Next_Mandate_Max_Members));

				expect(Delegation_info.in_election_stage).to.equal(true);
				
				await expectEvent(res, "New_election", {Vote_key:key}, "New_election event incorrect");
			});

			it("Citizens setup a new election before Mandate duration is over thanks to Petition. MORE Candidates than Member place.", async function(){ 
				
				for(var i=0; i<Next_Mandate_Max_Members+1;i++){
					await Delegation_Instance.Candidate_Election({from:Citizens[i]});
				}

				var petition_min = Math.floor(New_Election_Petition_Rate*Citizens.length/10000);

				await time.increase(Immunity_Duration+1);
				for(i=0; i<petition_min; i++){
					await Delegation_Instance.Sign_New_Election_Petition({from:Citizens[i]});
				}

				res = await Delegation_Instance.New_Election({from:Citizens[0]});

				var blocknumber = (await web3.eth.getTransaction(res.tx)).blockNumber;
				var timestamp = (await web3.eth.getBlock(blocknumber)).timestamp;
				//var key= web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["address", "uint256"],[Delegation_Instance.address, timestamp]));
				var key = web3.utils.soliditySha3(Delegation_Instance.address, timestamp);

				var ballot = await Ballot_Instance.Ballots(key);
				var Delegation_info = await Delegation_Instance.Get_Delegation_Infos();

				expect(ballot.Voters_Register_Address).to.equal(Citizen_Register_Instance.address);
				expect(ballot.Check_Voter_Selector).to.equal(Contains_Selector);
				expect(ballot.Status).to.be.bignumber.equal(new BN(1));
				expect(ballot.Vote_Duration).to.be.bignumber.equal(new BN(Vote_Duration));
				expect(ballot.Vote_Validation_Duration).to.be.bignumber.equal(new BN(Validation_Duration));
				expect(ballot.Propositions_Number).to.be.bignumber.equal(new BN(Next_Mandate_Max_Members+1));
				expect(ballot.Max_Winning_Propositions_Number).to.be.bignumber.equal(new BN(Next_Mandate_Max_Members));

				expect(Delegation_info.in_election_stage).to.equal(true);
				
				await expectEvent(res, "New_election", {Vote_key:key}, "New_election event incorrect");
			});

			it("Citizen attempts end election but none was lauched", async function(){ 
				await expectRevert(Delegation_Instance.End_Election({from:Citizens[0]}), "Not in Election time");
			});

		});
		
		context("During Election and end Election", ()=>{
			let ballot_key;
			let old_mandate;
			beforeEach(async function (){
				await Delegation_Instance.Update_Internal_Governance(Vote_Duration, 0, Mandate_Duration,
						Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Ballot_Instance.address, {from:Constitution_Address});

				for(var i=0; i<Next_Mandate_Max_Members+1;i++){
					await Delegation_Instance.Candidate_Election({from:Citizens[i]});
				}

				await time.increase(Mandate_Duration+1);
				res = await Delegation_Instance.New_Election({from:Citizens[0]});
				
				old_mandate = await Delegation_Instance.Get_Mandate(0);
				ballot_key = web3.utils.soliditySha3(Delegation_Instance.address, old_mandate.Election_Timestamps);

			});

			it("Citizen attempts to Launch a new election during election time", async function(){ 
				await expectRevert(Delegation_Instance.New_Election({from:Citizens[0]}), "An Election is Pending");
			});

			it("Citizen attempts to candidate during Election time", async function(){ 
				await expectRevert(Delegation_Instance.Candidate_Election({from:Citizens[Next_Mandate_Max_Members+2]}), "Election Time");
			});

			it("Candidate attempts to remove his candidature during Election time", async function(){ 
				await expectRevert(Delegation_Instance.Remove_Candidature({from:Citizens[0]}), "Election Time");
			});
			
			it("Citizen (or External_Account) attempts end election before Vote_Duration period is over", async function(){ 
				
				await expectRevert(Delegation_Instance.End_Election({from:Citizens[0]}), "Ballot still Pending");
			});

			it("Citizen end election and a new mandate is setup. Default proposition isn't chosed", async function(){
				var Citizens_Votes = Cleared_Votes_Creation(Next_Mandate_Max_Members+1, Citizens.length);

				Citizens_Votes.forEach(async (elem,i,arr)=>{
					elem[0] = 4;
					await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
				});

				await time.increase(Vote_Duration+1);
				await Ballot_Instance.End_Vote(ballot_key);
				
				res = await Delegation_Instance.End_Election({from:Citizens[0]});
				
				var new_mandate=await Delegation_Instance.Get_Mandate(1);
				var parameter = await Delegation_Instance.Mandates_Versions(1);
				var Delegation_info = await Delegation_Instance.Get_Delegation_Infos();

				var Winning_proposals = await Ballot_Instance.Get_Winning_Propositions(ballot_key);
				
				for (var i = 0; i < Next_Mandate_Max_Members; i++) {
					expect(Bytes32ToAddress(new_mandate.Members[i])).to.equal(Bytes32ToAddress(old_mandate.Candidats[Winning_proposals[i]-1]));
				}
				
				expect(new_mandate.version).to.be.bignumber.equal(new BN(1));
				expect(new_mandate.New_Election_Petition_Number).to.be.bignumber.equal(new BN(0));
				expect(new_mandate.Candidats.length).to.equal(0);
				expect(Delegation_info.in_election_stage).to.equal(false);
				await expectEvent(res, "New_Mandate", {}, "New_Mandate event incorrect");
			});

			it("Citizen end election and a new mandate is setup. The default proposition is chosed", async function(){
				var Citizens_Votes = Cleared_Votes_Creation(Next_Mandate_Max_Members+1, Citizens.length);

				Citizens_Votes.forEach(async (elem,i,arr)=>{
					elem[0] = 0;
					await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
				});

				//var expected_Results = Compute_Result(Citizens_Votes);
				await time.increase(Vote_Duration+1);
				await Ballot_Instance.End_Vote(ballot_key);
				res = await Delegation_Instance.End_Election({from:Citizens[0]});

				var old_mandate= await Delegation_Instance.Get_Mandate(0);
				var new_mandate=await Delegation_Instance.Get_Mandate(1);
				var parameter = await Delegation_Instance.Mandates_Versions(1);
				var Delegation_info = await Delegation_Instance.Get_Delegation_Infos();

				var Winning_proposals = await Ballot_Instance.Get_Winning_Propositions(ballot_key);

				expect(JSON.stringify(old_mandate.Members.map(Bytes32ToAddress))).to.equal(JSON.stringify(new_mandate.Members.map(Bytes32ToAddress)));

				expect(new_mandate.version).to.be.bignumber.equal(new BN(1));
				expect(new_mandate.New_Election_Petition_Number).to.be.bignumber.equal(new BN(0));
				expect(new_mandate.Candidats.length).to.equal(0);
				expect(Delegation_info.in_election_stage).to.equal(false);
				await expectEvent(res, "New_Mandate", {}, "New_Mandate event incorrect");
			});

			it("Change Delegation parameters during Election stage", async function(){
				var Citizens_Votes = Cleared_Votes_Creation(Next_Mandate_Max_Members+1, Citizens.length);
				var cesure_indice = chance.natural({min:0, max:Citizens_Votes.length});

				for(var i=0; i<cesure_indice; i++){
					await Ballot_Instance.Vote_Clear(ballot_key, Citizens_Votes[i], {from:Citizens[i]});
				}


				New_Ballot_Instance = await MAJORITY_JUDGMENT.new();
				New_Vote_Duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
				New_Validation_Duration = chance.natural({min:validation_duration_min, max:validation_duration_max});
				New_Mandate_Duration = chance.natural({min:mandate_duration_min, max:mandate_duration_max});
				New_Immunity_Duration = Math.floor(Immunity_duration_rate*Mandate_Duration/100);
				New_Next_Mandate_Max_Members = Members.length;
				New_New_Election_Petition_Rate = chance.natural({min:10000/Citizens.length, max:5000});

				await Delegation_Instance.Update_Internal_Governance(New_Vote_Duration, New_Validation_Duration, New_Mandate_Duration,
						New_Immunity_Duration, New_Next_Mandate_Max_Members, New_New_Election_Petition_Rate, New_Ballot_Instance.address, {from:Constitution_Address});



				for(var i=cesure_indice; i<Citizens_Votes.length; i++){
					await Ballot_Instance.Vote_Clear(ballot_key, Citizens_Votes[i], {from:Citizens[i]});
				}

				//var expected_Results = Compute_Result(Citizens_Votes);
				await time.increase(Vote_Duration+1);
				await Ballot_Instance.End_Vote(ballot_key);
				res = await Delegation_Instance.End_Election({from:Citizens[0]});

				var old_mandate= await Delegation_Instance.Get_Mandate(0);
				var new_mandate=await Delegation_Instance.Get_Mandate(1);
				var parameter = await Delegation_Instance.Mandates_Versions(1);
				var Delegation_info = await Delegation_Instance.Get_Delegation_Infos();

				var Winning_proposals = await Ballot_Instance.Get_Winning_Propositions(ballot_key);

				if(Winning_proposals[0]==0){
					expect(JSON.stringify(old_mandate.Members.map(Bytes32ToAddress))).to.equal(JSON.stringify(new_mandate.Members.map(Bytes32ToAddress)));
				}else{
					for (var i = 0; i < Next_Mandate_Max_Members; i++) {
						expect(Bytes32ToAddress(new_mandate.Members[i])).to.equal(Bytes32ToAddress(old_mandate.Candidats[Winning_proposals[i]-1]));
					}
				}

				
				expect(old_mandate.version).to.be.bignumber.equal(new BN(1));
				expect(new_mandate.version).to.be.bignumber.equal(new BN(2));
				expect(new_mandate.New_Election_Petition_Number).to.be.bignumber.equal(new BN(0));
				expect(new_mandate.Candidats.length).to.equal(0);
				expect(Delegation_info.in_election_stage).to.equal(false);
				await expectEvent(res, "New_Mandate", {}, "New_Mandate event incorrect");
			});

		});

	});


	describe("Delegation: Legislatif process Tests", ()=>{
		let Title;
		let Description;
		let law_key;

		function Create_Proposal_Data(nbr_new_functioncall, nbr_reuse_functioncall, parent_functioncall_counter, Loi, web3){
			if(nbr_reuse_functioncall>parent_functioncall_counter){
				throw "error argument";
			}

			var parent_functioncall = Array.from(Array(parent_functioncall_counter).keys()).slice(1);
			parent_functioncall.push(parent_functioncall_counter);
			parent_functioncall.sort( () => 0.5 - Math.random() );
			var Reuse_functioncall = parent_functioncall.slice(0,nbr_reuse_functioncall-1);
			var New_functioncall=Array.from({length:nbr_new_functioncall});

			var inser_index;

			for(var i=0; i<nbr_new_functioncall;i++){
				New_functioncall[i] = Loi.Get_AddLaw_FunctionCall(web3.utils.randomHex(Title_Size_max), web3.utils.randomHex(Description_Size_max));
				inser_index = chance.natural({min:0, max: Reuse_functioncall.length});

				Reuse_functioncall.splice(inser_index,0,0);
			}

			return {Reuse:Reuse_functioncall, Functioncalls:New_functioncall};
		}

		function Get_FunctionCalls_from_arrays(Reuse,parent_functioncall, New_functioncall, Loi, web3){
			var Result=Array.from({length:Reuse.length}).fill(0);
			var new_functioncall_counter=0;
			for(var i=0; i<Reuse.length;i++){
				if(Reuse[i]==0){
					Result[i] = New_functioncall[new_functioncall_counter];
					new_functioncall_counter++;
				}else{
					Result[i] = parent_functioncall[Reuse[i]-1];
				}
			}

			return Result;
		}

		function Generate_AddItem(Item_num, functioncall_counter, Loi, web3){
			var Index=Array.from({length:Item_num}).fill(0);
			var new_item = Array.from({length:Item_num}).fill(0);

			for(var i=0; i<Item_num;i++){
				Index[i] = chance.natural({min:1, max: functioncall_counter});
				new_item[i] = Loi.Get_AddLaw_FunctionCall(web3.utils.randomHex(Title_Size_max), web3.utils.randomHex(Description_Size_max));
			}

			return {Indexs:Index, Items:new_item};
		}

		function Add_Item( Original_functioncalls, Items, Indexs){
			New_functioncalls = [...Original_functioncalls];

			for(var i=0; i<Items.length; i++){
				New_functioncalls.splice(Indexs[i]-1,0,Items[i]);
			}

			return New_functioncalls;
		}

		beforeEach(async function (){
			Ballot_Instance = await MAJORITY_JUDGMENT.new();

			Uint256_arg[0] = Math.floor(Delegation_Token_Amount/Members.length); //Member_Max_Token_Usage
			Uint256_arg[1] = Math.floor(Uint256_arg[0]*Law_Initialisation_Price_Ratio/100); //Law_Initialisation_Price
			Uint256_arg[2] = Math.floor(Uint256_arg[0]*FunctionCall_Price_Ratio/100); //FunctionCall_Price
			Uint256_arg[3] = chance.natural({min:Proposition_Duration_min, max:Proposition_Duration_max}); //Proposition_Duration
			Uint256_arg[4] = chance.natural({min:vote_duration_min, max:vote_duration_max}); //Vote_Duration
			Uint256_arg[5] = chance.natural({min:Law_Censor_Period_Duration_min, max:Law_Censor_Period_Duration_min}); //Law_Censor_Period_Duration

			Censor_Proposition_Petition_Rate= chance.natural({min:Math.floor(10000*2/Citizens.length), max:Censor_Proposition_Petition_Rate_max});
			Censor_Penalty_Rate = chance.natural({min:Math.floor(10000/Uint256_arg[2]), max:Censor_Penalty_Rate_max});

			Title = web3.utils.randomHex(Title_Size_max);
			Description = web3.utils.randomHex(Description_Size_max); 
			law_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Description]));
		});


		context("Add New Delegation law", ()=>{
			
			
			beforeEach(async function (){
				res = await Delegation_Instance.Update_Legislatif_Process(Uint256_arg, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
					Ballot_Instance.address, {from:Constitution_Address}); 

			});

			it("Non member account attempts to create a delegation law project", async function(){
				await Delegation_Instance.Add_Controled_Register(Citizen_Register_Instance.address);
				await expectRevert(Delegation_Instance.Add_Law_Project(Citizen_Register_Instance.address, Title, Description,{from:Citizens[0]}), "Delegation Only");
			});

			it("Member account attempts to create a delegation law project for a Register that isn't under current Delegation control", async function(){
				await expectRevert(Delegation_Instance.Add_Law_Project(Citizen_Register_Instance.address, Title, Description,{from:Members[0]}), "Register Not Controled");
			});

			it("Member account attempts to create a delegation law project but the Delegation hasn't enough colateral to afford potential censor penalty fee", async function(){
				await Delegation_Instance.Add_Controled_Register(Citizen_Register_Instance.address);
				await expectRevert(Delegation_Instance.Add_Law_Project(Citizen_Register_Instance.address, Title, Description,{from:Members[0]}), "No enough colaterals funds");
			});

			it("Member account creates a delegation law project for a Citizens_Register", async function(){
				await DemoCoin_Instance.Mint(Delegation_Instance.address, Delegation_Token_Amount, {from:Constitution_Address});
				await Delegation_Instance.Add_Controled_Register(Citizen_Register_Instance.address);
				res = await Delegation_Instance.Add_Law_Project(Citizen_Register_Instance.address, Title, Description,{from:Members[0]});

				var delegation_law = await Delegation_Instance.Delegation_Law_Projects(law_key);
				var law_project = await Delegation_Instance.List_Law_Project(law_key);
				var blocknumber = (await web3.eth.getTransaction(res.tx)).blockNumber;
				var timestamp = (await web3.eth.getBlock(blocknumber)).timestamp;
				var List_Law_Project = await Delegation_Instance.Get_List_Law_Register();
				var BN_0 = new BN(0);

				expect(delegation_law.Institution_Address).to.equal(Citizen_Register_Instance.address);
				expect(delegation_law.Law_Project_Status).to.be.bignumber.equal(BN_0);
				expect(delegation_law.Version).to.be.bignumber.equal(new BN(1));
				expect(delegation_law.Creation_Timestamp).to.be.bignumber.equal(new BN(timestamp));
				expect(delegation_law.Start_Vote_Timestamps).to.be.bignumber.equal(BN_0);
				expect(delegation_law.Start_Censor_Law_Period_Timestamps).to.be.bignumber.equal(BN_0);
				expect(delegation_law.Law_Total_Potentialy_Lost).to.be.bignumber.equal(new BN(Math.floor(Uint256_arg[1]*Censor_Penalty_Rate/10000)));
				expect(delegation_law.Censor_Law_Petition_Counter).to.be.bignumber.equal(BN_0);

				expect((await Delegation_Instance.Get_Delegation_Infos()).potentialy_lost_amount).to.be.bignumber.equal(new BN(Math.floor(Uint256_arg[1]*Censor_Penalty_Rate/10000)));
				expect((await Delegation_Instance.Get_Member_Amount_Consumed(law_key, Members[0]))).to.be.bignumber.equal(new BN(Uint256_arg[1]));	
				expect(List_Law_Project.Law_Project_List.includes(law_key)).to.equal(true);

				expect(law_project.Title).to.equal(Title);
				expect(law_project.Description).to.equal(Description);
				expect(law_project.Proposal_Count).to.be.bignumber.equal(BN_0);
				expect(law_project.Winning_Proposal).to.be.bignumber.equal(BN_0);

				await expectEvent(res, "New_Law", {key:law_key}, "New_Law event incorrect");
			});

			it("Member account attempts to create the same delegation law project twice", async function(){
				await DemoCoin_Instance.Mint(Delegation_Instance.address, Delegation_Token_Amount, {from:Constitution_Address});
				await Delegation_Instance.Add_Controled_Register(Citizen_Register_Instance.address);
				res = await Delegation_Instance.Add_Law_Project(Citizen_Register_Instance.address, Title, Description,{from:Members[0]});
				await expectRevert(Delegation_Instance.Add_Law_Project(Citizen_Register_Instance.address, Title, Description,{from:Members[0]}), "Law project already created");
			});

		});


		context("Add New Proposal", ()=>{

			beforeEach(async function (){
				Loi_instance = await LOI.new(Agora_Address, {from: Constitution_Address});
				await Loi_instance.Add_Authority(Delegation_Instance.address,{from: Constitution_Address});
				Title = web3.utils.randomHex(Title_Size_max);
				Law_Description = web3.utils.randomHex(Description_Size_max);
				proposal_Description = web3.utils.randomHex(Description_Size_max);
				law_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Law_Description]));

				await DemoCoin_Instance.Mint(Delegation_Instance.address, Delegation_Token_Amount, {from:Constitution_Address});

				await Delegation_Instance.Update_Legislatif_Process(Uint256_arg, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
					Ballot_Instance.address, {from:Constitution_Address});

				//citizen = new Citizen_Register(Citizen_Register_Instance.address, web3);
				loi = new Loi(Loi_instance.address, web3);
			});

			it("External_Account account attempts to add a proposal to an existing delegation law project", async function(){
				await Delegation_Instance.Add_Controled_Register(Loi_instance.address);
				await Delegation_Instance.Add_Law_Project(Loi_instance.address, Title, Law_Description,{from:Members[0]});

				
				var functionCall = loi.Get_AddLaw_FunctionCall(web3.utils.randomHex(Title_Size_max), web3.utils.randomHex(Description_Size_max));
				
				await expectRevert(Delegation_Instance.Add_Proposal(law_key, 0, [], [functionCall], proposal_Description, {from:External_Account}), "Delegation Only");
			});

			it("Delegation member account attempts to add a proposal to a not existing Law project", async function(){
				await Delegation_Instance.Add_Controled_Register(Loi_instance.address);
				await Delegation_Instance.Add_Law_Project(Loi_instance.address, Title, Law_Description,{from:Members[0]});

				
				var functionCall = loi.Get_AddLaw_FunctionCall(web3.utils.randomHex(Title_Size_max), web3.utils.randomHex(Description_Size_max));
				
				await expectRevert(Delegation_Instance.Add_Proposal(web3.utils.randomHex(32), 0, [], [functionCall], proposal_Description, {from:Members[0]}), "No existing Law Project");
			});

			it("Delegation member account attempts to add a proposal But he exceeds the member's token consumption limit", async function(){
				await Delegation_Instance.Add_Controled_Register(Loi_instance.address);
				Uint256_arg[0]=Uint256_arg[1];
				await Delegation_Instance.Update_Legislatif_Process(Uint256_arg, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
					Ballot_Instance.address, {from:Constitution_Address});
				await Delegation_Instance.Add_Law_Project(Loi_instance.address, Title, Law_Description,{from:Members[0]});

				var Parameter1 = await Delegation_Instance.Law_Parameters_Versions(1);
				var Parameter2 = await Delegation_Instance.Law_Parameters_Versions(2);
				var member_conso = await Delegation_Instance.Get_Member_Amount_Consumed(law_key, Members[0]);
				
				var functionCall = loi.Get_AddLaw_FunctionCall(web3.utils.randomHex(Title_Size_max), web3.utils.randomHex(Description_Size_max));
				
				await expectRevert(Delegation_Instance.Add_Proposal(law_key, 0, [], [functionCall], proposal_Description, {from:Members[0]}), "Member consumption exceeded");
			});

			it("Delegation member account attempts to add a proposal with a not existing parent", async function(){
				await Delegation_Instance.Add_Controled_Register(Loi_instance.address);
				await Delegation_Instance.Add_Law_Project(Loi_instance.address, Title, Law_Description,{from:Members[0]});

				
				var functionCall = loi.Get_AddLaw_FunctionCall(web3.utils.randomHex(Title_Size_max), web3.utils.randomHex(Description_Size_max));				
				await expectRevert(Delegation_Instance.Add_Proposal(law_key, 1, [], [functionCall], proposal_Description, {from:Members[0]}), "Parent proposal doesn't exist");
			});

			it("Delegation member account attempts to add a proposal with a not existing parent's functionCalls ", async function(){
				await Delegation_Instance.Add_Controled_Register(Loi_instance.address);
				await Delegation_Instance.Add_Law_Project(Loi_instance.address, Title, Law_Description,{from:Members[0]});

				
				var functionCall = loi.Get_AddLaw_FunctionCall(web3.utils.randomHex(Title_Size_max), web3.utils.randomHex(Description_Size_max));
				
				await expectRevert(Delegation_Instance.Add_Proposal(law_key, 0, [1], [functionCall], proposal_Description, {from:Members[0]}), "No existing function_call");
			});

			it("Delegation member account add the first proposal of the law project", async function(){
				await Delegation_Instance.Add_Controled_Register(Loi_instance.address);
				await Delegation_Instance.Add_Law_Project(Loi_instance.address, Title, Law_Description,{from:Members[0]});

				var functioncall_num= chance.natural({min:1,max:functionCall_max});
				var FunctionCall_List=[];
				for (var i = 0 ; i <functioncall_num; i++) {
					FunctionCall_List.push(loi.Get_AddLaw_FunctionCall(web3.utils.randomHex(Title_Size_max), web3.utils.randomHex(Description_Size_max)));
				}
				
				//var functionCall = loi.Get_AddLaw_FunctionCall(web3.utils.randomHex(Title_Size_max), web3.utils.randomHex(Description_Size_max));
				
				res = await Delegation_Instance.Add_Proposal(law_key, 0, Array(functioncall_num).fill(0), FunctionCall_List, proposal_Description, {from:Members[1]});
				var proposal_arrays = Create_Proposal_Data(2,3,3,loi,web3)

				var Proposal = await Delegation_Instance.Get_Proposal(law_key, 1);

				expect(Proposal.description).to.equal(proposal_Description);
				expect(Proposal.childrens.length).to.equal(0);
				expect(JSON.stringify(Proposal.function_calls)).to.equal(JSON.stringify(FunctionCall_List));
				expect(Proposal.func_call_counter).to.be.bignumber.equal(new BN(functioncall_num));
				expect(Proposal.parent).to.be.bignumber.equal(new BN(0));
				expect(Proposal.author).to.equal(Members[1]);

				expect((await Delegation_Instance.Get_Delegation_Infos()).potentialy_lost_amount).to.be.bignumber.equal(new BN(Math.floor(Uint256_arg[1]*Censor_Penalty_Rate/10000)+ Math.floor(Uint256_arg[2]*functioncall_num*Censor_Penalty_Rate/10000)));
				expect((await Delegation_Instance.Get_Member_Amount_Consumed(law_key, Members[1]))).to.be.bignumber.equal(new BN(Uint256_arg[2]*functioncall_num));	

				await expectEvent(res, "New_Proposal", {key:law_key, proposal_index:new BN(1)}, "New_Proposal event incorrect");
			});

			it("Delegation member account add 2 proposals as children of proposal 1.", async function(){
				await Delegation_Instance.Add_Controled_Register(Loi_instance.address);
				await Delegation_Instance.Add_Law_Project(Loi_instance.address, Title, Law_Description,{from:Members[0]});

				var functioncall_num1= chance.natural({min:1,max:functionCall_max});
				var FunctionCall_List=[];
				for (var i = 0 ; i <functioncall_num1; i++) {
					FunctionCall_List.push(loi.Get_AddLaw_FunctionCall(web3.utils.randomHex(Title_Size_max), web3.utils.randomHex(Description_Size_max)));
				}
				
				res1 = await Delegation_Instance.Add_Proposal(law_key, 0, Array(functioncall_num1).fill(0), FunctionCall_List, proposal_Description, {from:Members[1]});
				var Proposal1 = await Delegation_Instance.Get_Proposal(law_key, 1);


				//Ajout élément 2
				functioncall_num2 = chance.natural({min:0,max:functionCall_max});
				reuse_num2 = chance.natural({min:0,max:Proposal1.func_call_counter});
				var proposal_arrays2 = Create_Proposal_Data(functioncall_num2,reuse_num2, Proposal1.func_call_counter.toNumber(), loi,web3);

				res2 = await Delegation_Instance.Add_Proposal(law_key, 1, proposal_arrays2.Reuse, proposal_arrays2.Functioncalls, proposal_Description, {from:Members[2]});
				var Proposal2 = await Delegation_Instance.Get_Proposal(law_key, 2);
				

				//Ajout élément 3
				functioncall_num3 = chance.natural({min:0,max:functionCall_max});
				reuse_num3 = chance.natural({min:0,max:Proposal1.func_call_counter});
				var proposal_arrays3 = Create_Proposal_Data(functioncall_num3,reuse_num3,Proposal1.func_call_counter.toNumber() ,loi,web3);

				res3 = await Delegation_Instance.Add_Proposal(law_key, 1, proposal_arrays3.Reuse, proposal_arrays3.Functioncalls, proposal_Description, {from:Members[2]});
				var Proposal3 = await Delegation_Instance.Get_Proposal(law_key, 3);
				

				var Proposal1 = await Delegation_Instance.Get_Proposal(law_key, 1);

				var Proposal2_expected_functioncalls = Get_FunctionCalls_from_arrays(proposal_arrays2.Reuse, Proposal1.function_calls, proposal_arrays2.Functioncalls);
				var Proposal3_expected_functioncalls = Get_FunctionCalls_from_arrays(proposal_arrays3.Reuse, Proposal1.function_calls, proposal_arrays3.Functioncalls);
				expect(JSON.stringify(Proposal1.childrens.map(x=>{return parseInt(x.toNumber())}))).to.equal(JSON.stringify([2,3]));
				
				expect(Proposal2.description).to.equal(proposal_Description);
				expect(Proposal2.childrens.length).to.equal(0);
				expect(JSON.stringify(Proposal2.function_calls)).to.equal(JSON.stringify(Proposal2_expected_functioncalls));
				expect(Proposal2.func_call_counter).to.be.bignumber.equal(new BN(proposal_arrays2.Reuse.length));
				expect(Proposal2.parent).to.be.bignumber.equal(new BN(1));
				expect(Proposal2.author).to.equal(Members[2]);

				expect(Proposal3.description).to.equal(proposal_Description);
				expect(Proposal3.childrens.length).to.equal(0);
				expect(JSON.stringify(Proposal3.function_calls)).to.equal(JSON.stringify(Proposal3_expected_functioncalls));
				expect(Proposal3.func_call_counter).to.be.bignumber.equal(new BN(proposal_arrays3.Reuse.length));
				expect(Proposal3.parent).to.be.bignumber.equal(new BN(1));
				expect(Proposal3.author).to.equal(Members[2]);

				expect((await Delegation_Instance.Get_Delegation_Infos()).potentialy_lost_amount).to.be.bignumber.equal(new BN(Math.floor(Uint256_arg[1]*Censor_Penalty_Rate/10000)+ Math.floor(Uint256_arg[2]*functioncall_num1*Censor_Penalty_Rate/10000) + Math.floor(Uint256_arg[2]*functioncall_num2*Censor_Penalty_Rate/10000)+ Math.floor(Uint256_arg[2]*functioncall_num3*Censor_Penalty_Rate/10000)));
				expect((await Delegation_Instance.Get_Member_Amount_Consumed(law_key, Members[0]))).to.be.bignumber.equal(new BN(Uint256_arg[1]));	
				expect((await Delegation_Instance.Get_Member_Amount_Consumed(law_key, Members[1]))).to.be.bignumber.equal(new BN(Uint256_arg[2]*functioncall_num1));	
				expect((await Delegation_Instance.Get_Member_Amount_Consumed(law_key, Members[2]))).to.be.bignumber.equal(new BN(Uint256_arg[2]*(functioncall_num2+functioncall_num3)));	


				await expectEvent(res2, "New_Proposal", {key:law_key, proposal_index:new BN(2)}, "New_Proposal event incorrect");
				await expectEvent(res3, "New_Proposal", {key:law_key, proposal_index:new BN(3)}, "New_Proposal event incorrect");
			});

		
		});


		context("Add items to existing proposal Proposal", ()=>{
			var functioncall_num;
			var proposal_arrays;
			beforeEach(async function (){
				Loi_instance = await LOI.new(Agora_Address, {from: Constitution_Address});
				await Loi_instance.Add_Authority(Delegation_Instance.address,{from: Constitution_Address});

				Title = web3.utils.randomHex(Title_Size_max);
				Law_Description = web3.utils.randomHex(Description_Size_max);
				proposal_Description = web3.utils.randomHex(Description_Size_max);
				law_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Law_Description]));

				loi = new Loi(Loi_instance.address, web3);
				await DemoCoin_Instance.Mint(Delegation_Instance.address, Delegation_Token_Amount, {from:Constitution_Address});

				await Delegation_Instance.Update_Legislatif_Process(Uint256_arg, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
					Ballot_Instance.address, {from:Constitution_Address});

				await Delegation_Instance.Add_Controled_Register(Loi_instance.address);
				await Delegation_Instance.Add_Law_Project(Loi_instance.address, Title, Law_Description,{from:Members[0]});

				functioncall_num= chance.natural({min:1,max:functionCall_max});
				proposal_arrays = Create_Proposal_Data(functioncall_num,0, 0,loi, web3);

				await Delegation_Instance.Add_Proposal(law_key, 0, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Members[1]});				

			});

			it("External_Account account attempts to add items to a proposal of an existing delegation law project", async function(){
				
				var new_item_num = chance.natural({min:1,max:newItem_max});
				var Proposal = await Delegation_Instance.Get_Proposal(law_key,1);
				var Item_arrays = Generate_AddItem(new_item_num, Proposal.func_call_counter, loi, web3)
				await expectRevert(Delegation_Instance.Add_Item(law_key, 1, Item_arrays.Items, Item_arrays.Indexs, {from:External_Account}), "Delegation Only");
			});

			it("Delegation member account attempts to add items to a proposal of an not existing delegation law project", async function(){
				var random_key = web3.utils.randomHex(32);
				var new_item_num = chance.natural({min:1,max:newItem_max});
				var Proposal = await Delegation_Instance.Get_Proposal(law_key, 1);
				var Item_arrays = Generate_AddItem(new_item_num, Proposal.func_call_counter, loi, web3);
				
				await expectRevert(Delegation_Instance.Add_Item(random_key, 1, Item_arrays.Items, Item_arrays.Indexs, {from:Members[1]}), "No existing Law Project");
			});

			it("Delegation member account attempts to add items to a not existing proposal", async function(){
				
				var new_item_num = chance.natural({min:1,max:newItem_max});
				var Proposal = await Delegation_Instance.Get_Proposal(law_key, 1);
				var Item_arrays = Generate_AddItem(new_item_num, Proposal.func_call_counter, loi, web3)

				await expectRevert(Delegation_Instance.Add_Item(law_key, 0, Item_arrays.Items, Item_arrays.Indexs, {from:Members[1]}), "You're Not author of proposal");
			});

			it("Delegation member account attempts to add items but Index and Items arrays are not of same size", async function(){
				
				var new_item_num = chance.natural({min:1,max:newItem_max});
				var Proposal = await Delegation_Instance.Get_Proposal(law_key, 1);
				var Item_arrays = Generate_AddItem(new_item_num, Proposal.func_call_counter, loi, web3)
				Item_arrays.Items.pop();
				await expectRevert(Delegation_Instance.Add_Item(law_key, 1, Item_arrays.Items, Item_arrays.Indexs, {from:Members[1]}), "Array different size");
			});

			it("Delegation member account attempts to add items to proposal but he isn't the author", async function(){
				
				var new_item_num = chance.natural({min:1,max:newItem_max});
				var Proposal = await Delegation_Instance.Get_Proposal(law_key, 1);
				var Item_arrays = Generate_AddItem(new_item_num, Proposal.func_call_counter, loi, web3)
				await expectRevert(Delegation_Instance.Add_Item(law_key, 1, Item_arrays.Items, Item_arrays.Indexs, {from:Members[2]}), "You're Not author of proposal");
			});

			it("Delegation member account add items to proposal", async function(){
				
				var new_item_num = chance.natural({min:1,max:newItem_max});
				var Proposal = await Delegation_Instance.Get_Proposal(law_key, 1);
				var Item_arrays = Generate_AddItem(new_item_num, Proposal.func_call_counter, loi, web3);
				var expected_FunctionCalls = Add_Item([...Proposal.function_calls], Item_arrays.Items, Item_arrays.Indexs);
				res = await Delegation_Instance.Add_Item(law_key, 1, Item_arrays.Items, Item_arrays.Indexs, {from:Members[1]});

				Proposal = await Delegation_Instance.Get_Proposal(law_key, 1);

				expect(JSON.stringify(Proposal.function_calls)).to.equal(JSON.stringify(expected_FunctionCalls));

				expect((await Delegation_Instance.Get_Delegation_Infos()).potentialy_lost_amount).to.be.bignumber.equal(new BN(Math.floor(Uint256_arg[1]*Censor_Penalty_Rate/10000)+ Math.floor(Uint256_arg[2]*functioncall_num*Censor_Penalty_Rate/10000) + Math.floor(Uint256_arg[2]*Item_arrays.Items.length*Censor_Penalty_Rate/10000)));
				expect((await Delegation_Instance.Get_Member_Amount_Consumed(law_key, Members[1]))).to.be.bignumber.equal(new BN(Uint256_arg[2]*functioncall_num + Uint256_arg[2]*Item_arrays.Items.length));	

				await expectEvent(res, "Proposal_Modified", {key:law_key, proposal_index:new BN(1)}, "Proposal_Modified event incorrect");
			});
		});

		context("Vote Stage", ()=>{
			var functioncall_num;
			var proposal_arrays;
			var Proposal1, Proposal2, Proposal3;

			beforeEach(async function (){
				Loi_instance = await LOI.new(Agora_Address, {from: Constitution_Address});
				await Loi_instance.Add_Authority(Delegation_Instance.address,{from: Constitution_Address});

				Title = web3.utils.randomHex(Title_Size_max);
				Law_Description = web3.utils.randomHex(Description_Size_max);
				proposal_Description = web3.utils.randomHex(Description_Size_max);
				law_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Law_Description]));

				loi = new Loi(Loi_instance.address, web3);
				await DemoCoin_Instance.Mint(Delegation_Instance.address, Delegation_Token_Amount, {from:Constitution_Address});

				await Delegation_Instance.Update_Legislatif_Process(Uint256_arg, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
					Ballot_Instance.address, {from:Constitution_Address});

				await Delegation_Instance.Add_Controled_Register(Loi_instance.address);
				await Delegation_Instance.Add_Law_Project(Loi_instance.address, Title, Law_Description,{from:Members[0]});

				functioncall_num= chance.natural({min:1,max:functionCall_max});
				proposal_arrays = Create_Proposal_Data(functioncall_num,0, 0,loi, web3);

				await Delegation_Instance.Add_Proposal(law_key, 0, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Members[1]});				
				Proposal1 = await Delegation_Instance.Get_Proposal(law_key, 1);

				//Ajout élément 2
				functioncall_num2 = chance.natural({min:0,max:functionCall_max});
				reuse_num2 = chance.natural({min:0,max:Proposal1.func_call_counter});
				var proposal_arrays2 = Create_Proposal_Data(functioncall_num2,reuse_num2, Proposal1.func_call_counter.toNumber(), loi,web3);

				res2 = await Delegation_Instance.Add_Proposal(law_key, 1, proposal_arrays2.Reuse, proposal_arrays2.Functioncalls, proposal_Description, {from:Members[2]});
				Proposal2 = await Delegation_Instance.Get_Proposal(law_key, 2);
				

				//Ajout élément 3
				functioncall_num3 = chance.natural({min:0,max:functionCall_max});
				reuse_num3 = chance.natural({min:0,max:Proposal1.func_call_counter});
				var proposal_arrays3 = Create_Proposal_Data(functioncall_num3,reuse_num3,Proposal1.func_call_counter.toNumber() ,loi,web3);

				res3 = await Delegation_Instance.Add_Proposal(law_key, 1, proposal_arrays3.Reuse, proposal_arrays3.Functioncalls, proposal_Description, {from:Members[2]});
				Proposal3 = await Delegation_Instance.Get_Proposal(law_key, 3);
				
			});


			it("External_Account account attempts start voting stage", async function(){
				await expectRevert(Delegation_Instance.Start_Vote(law_key, {from:External_Account}), "Delegation Only");
			});

			it("Member account attempts start voting stage for not existing delegation law", async function(){
				await expectRevert(Delegation_Instance.Start_Vote(web3.utils.randomHex(32), {from:Members[0]}), "No existing Law Project");
			});

			it("Member account attempts start voting stage before proposition stage is finished", async function(){
				await expectRevert(Delegation_Instance.Start_Vote(law_key, {from:Members[0]}), "PROPOSITION stage not finished");
			});

			it("Member account start voting stage", async function(){
				await time.increase(Uint256_arg[3]+1);
				res = await Delegation_Instance.Start_Vote(law_key, {from:Members[0]});

				var delegation_law=await Delegation_Instance.Delegation_Law_Projects(law_key);
				var ballot = await Ballot_Instance.Ballots(law_key);
				var law_projet = await Delegation_Instance.List_Law_Project(law_key);

				expect(delegation_law.Law_Project_Status).to.be.bignumber.equal(new BN(1));

				expect(ballot.Voters_Register_Address).to.equal(Delegation_Instance.address);
				expect(ballot.Check_Voter_Selector).to.equal(Contains_Selector);
				expect(ballot.Status).to.be.bignumber.equal(new BN(1));
				expect(ballot.Vote_Duration).to.be.bignumber.equal(new BN(Uint256_arg[4]));
				expect(ballot.Vote_Validation_Duration).to.be.bignumber.equal(new BN(0));
				expect(ballot.Propositions_Number).to.be.bignumber.equal(new BN(law_projet.Proposal_Count));
				expect(ballot.Max_Winning_Propositions_Number).to.be.bignumber.equal(new BN(1));

				await expectEvent(res, "Voting_Stage_Started", {key:law_key}, "Voting_Stage_Started event incorrect");
			});


			it("External_Account account attempts to achieve voting stage", async function(){
				await time.increase(Uint256_arg[3]+1);
				await Delegation_Instance.Start_Vote(law_key, {from:Members[0]});

				var Citizens_Votes = Cleared_Votes_Creation(3, Members.length);

				Citizens_Votes.forEach(async (elem,i,arr)=>{
					await Ballot_Instance.Vote_Clear(law_key, elem, {from:Members[i]});
				});

				await time.increase(Uint256_arg[4]+1);
				await Ballot_Instance.End_Vote(law_key);
				
				await expectRevert(Delegation_Instance.Achiev_Vote(law_key, {from:External_Account}), "Delegation Only");

			});

			it("Delegation member account attempts to achieve voting stage before the end", async function(){
				await time.increase(Uint256_arg[3]+1);
				await Delegation_Instance.Start_Vote(law_key, {from:Members[0]})
				
				var Citizens_Votes = Cleared_Votes_Creation(3, Members.length);
				Citizens_Votes.forEach(async (elem,i,arr)=>{
					await Ballot_Instance.Vote_Clear(law_key, elem, {from:Members[i]});
				});

				await expectRevert(Delegation_Instance.Achiev_Vote(law_key, {from:Members[0]}), "Id exceed Winning length");

			});

			it("Delegation member account achieves voting stage. Default proposition isn't chosen.", async function(){
				await time.increase(Uint256_arg[3]+1);
				await Delegation_Instance.Start_Vote(law_key, {from:Members[0]})
				
				var Citizens_Votes = Cleared_Votes_Creation(3, Members.length);
				Citizens_Votes.forEach(async (elem,i,arr)=>{
					elem[0]=4
					await Ballot_Instance.Vote_Clear(law_key, elem, {from:Members[i]});
				});

				await time.increase(Uint256_arg[4]+1);
				await Ballot_Instance.End_Vote(law_key);
				
				res=await Delegation_Instance.Achiev_Vote(law_key, {from:Members[0]});

				var law_projet = await Delegation_Instance.List_Law_Project(law_key);
				var delegation_law = await Delegation_Instance.Delegation_Law_Projects(law_key);
				var Winning_proposals = await Ballot_Instance.Get_Winning_Proposition_byId(law_key,0);

				expect(delegation_law.Law_Project_Status).to.be.bignumber.equal(new BN(2));
				expect(law_projet.Winning_Proposal).to.be.bignumber.equal(new BN(Winning_proposals));
				await expectEvent(res, "Voting_Stage_Achieved", {key:law_key}, "Voting_Stage_Achieved event incorrect");
			});

			it("Delegation member account achieves voting stage. Default proposition is chosen.", async function(){
				await time.increase(Uint256_arg[3]+1);
				await Delegation_Instance.Start_Vote(law_key, {from:Members[0]})
				
				var Citizens_Votes = Cleared_Votes_Creation(3, Members.length);
				Citizens_Votes.forEach(async (elem,i,arr)=>{
					elem[0]=0
					await Ballot_Instance.Vote_Clear(law_key, elem, {from:Members[i]});
				});

				await time.increase(Uint256_arg[4]+1);
				await Ballot_Instance.End_Vote(law_key);
				
				res=await Delegation_Instance.Achiev_Vote(law_key, {from:Members[0]});

				var law_projet = await Delegation_Instance.List_Law_Project(law_key);
				var delegation_law = await Delegation_Instance.Delegation_Law_Projects(law_key);

				expect(delegation_law.Law_Project_Status).to.be.bignumber.equal(new BN(5));
				expect(law_projet.Winning_Proposal).to.be.bignumber.equal(new BN(0));
				await expectEvent(res, "Law_Aborted", {key:law_key}, "Law_Aborted event incorrect");
			});

			it("Citizen account attempts to censor law but we are not at Censoring stage", async function(){
				await expectRevert(Delegation_Instance.Censor_Law(law_key, {from:Citizens[0]}), "Law Not at CENSOR LAW status");
			});

			it("Delegation member attempts to Adopt law but we are not at Censor stage", async function(){
				await expectRevert(Delegation_Instance.Adopt_Law(law_key, {from:Members[0]}),"Law Not at CENSOR LAW status");
			});

		});



		context("Law Censoring Stage", ()=>{
			var functioncall_num;
			var proposal_arrays;
			var Proposal1, Proposal2, Proposal3;

			beforeEach(async function (){
				Loi_instance = await LOI.new(Agora_Address, {from: Constitution_Address});
				await Loi_instance.Add_Authority(Delegation_Instance.address,{from: Constitution_Address});

				Title = web3.utils.randomHex(Title_Size_max);
				Law_Description = web3.utils.randomHex(Description_Size_max);
				proposal_Description = web3.utils.randomHex(Description_Size_max);
				law_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Law_Description]));

				loi = new Loi(Loi_instance.address, web3);
				await DemoCoin_Instance.Mint(Delegation_Instance.address, Delegation_Token_Amount, {from:Constitution_Address});

				await Delegation_Instance.Update_Legislatif_Process(Uint256_arg, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
					Ballot_Instance.address, {from:Constitution_Address});

				await Delegation_Instance.Add_Controled_Register(Loi_instance.address);
				await Delegation_Instance.Add_Law_Project(Loi_instance.address, Title, Law_Description,{from:Members[0]});

				functioncall_num= chance.natural({min:1,max:functionCall_max});
				proposal_arrays = Create_Proposal_Data(functioncall_num,0, 0,loi, web3);

				await Delegation_Instance.Add_Proposal(law_key, 0, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Members[1]});				
				Proposal1 = await Delegation_Instance.Get_Proposal(law_key, 1);

				//Ajout élément 2
				functioncall_num2 = chance.natural({min:0,max:functionCall_max});
				reuse_num2 = chance.natural({min:0,max:Proposal1.func_call_counter});
				var proposal_arrays2 = Create_Proposal_Data(functioncall_num2,reuse_num2, Proposal1.func_call_counter.toNumber(), loi,web3);

				res2 = await Delegation_Instance.Add_Proposal(law_key, 1, proposal_arrays2.Reuse, proposal_arrays2.Functioncalls, proposal_Description, {from:Members[2]});
				Proposal2 = await Delegation_Instance.Get_Proposal(law_key, 2);
				
			
				//Ajout élément 3
				functioncall_num3 = chance.natural({min:0,max:functionCall_max});
				reuse_num3 = chance.natural({min:0,max:Proposal1.func_call_counter});
				var proposal_arrays3 = Create_Proposal_Data(functioncall_num3,reuse_num3,Proposal1.func_call_counter.toNumber() ,loi,web3);

				res3 = await Delegation_Instance.Add_Proposal(law_key, 1, proposal_arrays3.Reuse, proposal_arrays3.Functioncalls, proposal_Description, {from:Members[2]});
				Proposal3 = await Delegation_Instance.Get_Proposal(law_key, 3);
				
				await time.increase(Uint256_arg[3]+1);
				await Delegation_Instance.Start_Vote(law_key, {from:Members[0]})
				
				var Citizens_Votes = Cleared_Votes_Creation(3, Members.length);
				Citizens_Votes.forEach(async (elem,i,arr)=>{
					elem[0]=4;
					await Ballot_Instance.Vote_Clear(law_key, elem, {from:Members[i]});
				});

				await time.increase(Uint256_arg[4]+1);
				await Ballot_Instance.End_Vote(law_key);
				
				await Delegation_Instance.Achiev_Vote(law_key, {from:Members[0]});

			});



			it("Delegation Members account attempts to add proposal but we are not at Proposition stage", async function(){
				await expectRevert(Delegation_Instance.Add_Proposal(law_key, 1, proposal_arrays.Reuse, proposal_arrays.Functioncalls, Description, {from:Members[0]}), "Not at PROPOSITION status");
			});

			it("Delegation Members account attempts to add items to proposal but we are not at Proposition stage", async function(){
				var Item_arrays = Generate_AddItem(3, Proposal1.func_call_counter, loi, web3);
				await expectRevert(Delegation_Instance.Add_Item(law_key, 1, Item_arrays.Items, Item_arrays.Indexs, {from:Members[0]}), "Law Not at PROPOSITION status");
			});

			it("Delegation Members account attempts to start vote stage but we are not at Proposition stage", async function(){
				await expectRevert(Delegation_Instance.Start_Vote(law_key, {from:Members[0]}), "Law Not at PROPOSITION status");
			});

			it("Citizen account sign to censor law", async function(){
				res = await Delegation_Instance.Censor_Law(law_key, {from:Citizens[0]});

				var delegation_law = await Delegation_Instance.Delegation_Law_Projects(law_key);

				expect(delegation_law.Censor_Law_Petition_Counter).to.be.bignumber.equal(new BN(1));
			});

			it("citizen account attempts sign to censor law twice", async function(){
				res = await Delegation_Instance.Censor_Law(law_key, {from:Citizens[0]});
				await expectRevert(Delegation_Instance.Censor_Law(law_key, {from:Citizens[0]}), "Already Signed");				
			});

			it("Citizen account sign to censor law", async function(){
				var min_censor_signatures = Math.floor(Censor_Proposition_Petition_Rate*Citizens.length/10000);
				var delegation_law_before= await Delegation_Instance.Delegation_Law_Projects(law_key);
				for(var i=0;i<min_censor_signatures-1;i++){
					await Delegation_Instance.Censor_Law(law_key, {from:Citizens[i]});
				}


				res_remove = await Delegation_Instance.Remove_Controled_Register(Loi_instance.address, {from:Constitution_Address});
				res=await Delegation_Instance.Censor_Law(law_key, {from:Citizens[min_censor_signatures-1]});

				var delegation_law_after = await Delegation_Instance.Delegation_Law_Projects(law_key);
				var delegation_info = await Delegation_Instance.Get_Delegation_Infos();
				var register = await Delegation_Instance.Controled_Registers(Loi_instance.address);

				expect((await Loi_instance.Get_Authorities()).map(Bytes32ToAddress).includes(Delegation_Instance.address)).to.equal(false);

				expect(register.Law_Project_Counter).to.be.bignumber.equal(new BN(0));
				expect(delegation_law_after.Law_Project_Status).to.be.bignumber.equal(new BN(5));
				expect(delegation_law_after.Censor_Law_Petition_Counter).to.be.bignumber.equal(new BN(min_censor_signatures));
				expect(delegation_info.potentialy_lost_amount).to.be.bignumber.equal(new BN(0));
				
				expect(await DemoCoin_Instance.balanceOf(Delegation_Instance.address)).to.be.bignumber.equal(new BN(Delegation_Token_Amount - delegation_law_before.Law_Total_Potentialy_Lost.toNumber()));
				expect(await DemoCoin_Instance.balanceOf(Agora_Address)).to.be.bignumber.equal(delegation_law_before.Law_Total_Potentialy_Lost);
				await expectEvent(res, "Law_Aborted", {key:law_key}, "Law_Aborted event incorrect");
			});

			it("External_Account attempts to Adopt law", async function(){
				await time.increase(Uint256_arg[5]+1);
				await expectRevert(Delegation_Instance.Adopt_Law(law_key, {from:External_Account}),"Delegation Only");
			});

			it("Delegation member attempts to Adopt law but Censor stage is not over yet", async function(){
				await expectRevert(Delegation_Instance.Adopt_Law(law_key, {from:Members[0]}),"CENSOR LAW PERIOD not over");
			});

			it("Delegation member Adopts law", async function(){
				await time.increase(Uint256_arg[5]+1);
				res=await Delegation_Instance.Adopt_Law(law_key, {from:Members[0]});

				var delegation_law=await Delegation_Instance.Delegation_Law_Projects(law_key);

				expect(delegation_law.Law_Project_Status).to.be.bignumber.equal(new BN(3));
				await expectEvent(res, "Law_Adopted", {key:law_key}, "Law_Adopted event incorrect");
			});

			it("Delegation Member attempts to execute law but it isn't adopted", async function(){
				await expectRevert(Delegation_Instance.Execute_Law(law_key, 1,{from:Members[0]}),"Law Not ADOPTED");
			});

		});


		context("Executing law", ()=>{
			var functioncall_num;
			var proposal_arrays;
			var Proposal1, Proposal2, Proposal3;
			var Winning_Proposal;

			beforeEach(async function (){
				Loi_instance = await LOI.new(Agora_Address, {from: Constitution_Address});
				await Loi_instance.Add_Authority(Delegation_Instance.address,{from: Constitution_Address});

				Title = web3.utils.randomHex(Title_Size_max);
				Law_Description = web3.utils.randomHex(Description_Size_max);
				proposal_Description = web3.utils.randomHex(Description_Size_max);
				law_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Law_Description]));

				loi = new Loi(Loi_instance.address, web3);
				await DemoCoin_Instance.Mint(Delegation_Instance.address, Delegation_Token_Amount, {from:Constitution_Address});

				await Delegation_Instance.Update_Legislatif_Process(Uint256_arg, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
					Ballot_Instance.address, {from:Constitution_Address});

				await Delegation_Instance.Add_Controled_Register(Loi_instance.address);
				await Delegation_Instance.Add_Law_Project(Loi_instance.address, Title, Law_Description,{from:Members[0]});

				functioncall_num= chance.natural({min:2,max:functionCall_max});
				proposal_arrays = Create_Proposal_Data(functioncall_num,0, 0,loi, web3);

				await Delegation_Instance.Add_Proposal(law_key, 0, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Members[1]});				
				Proposal1 = await Delegation_Instance.Get_Proposal(law_key, 1);

				//Ajout élément 2
				functioncall_num2 = chance.natural({min:1,max:functionCall_max});
				reuse_num2 = chance.natural({min:1,max:Proposal1.func_call_counter});
				var proposal_arrays2 = Create_Proposal_Data(functioncall_num2,reuse_num2, Proposal1.func_call_counter.toNumber(), loi,web3);

				res2 = await Delegation_Instance.Add_Proposal(law_key, 1, proposal_arrays2.Reuse, proposal_arrays2.Functioncalls, proposal_Description, {from:Members[2]});
				Proposal2 = await Delegation_Instance.Get_Proposal(law_key, 2);
				

				//Ajout élément 3
				functioncall_num3 = chance.natural({min:1,max:functionCall_max});
				reuse_num3 = chance.natural({min:1,max:Proposal1.func_call_counter});
				var proposal_arrays3 = Create_Proposal_Data(functioncall_num3,reuse_num3,Proposal1.func_call_counter.toNumber() ,loi,web3);

				res3 = await Delegation_Instance.Add_Proposal(law_key, 1, proposal_arrays3.Reuse, proposal_arrays3.Functioncalls, proposal_Description, {from:Members[2]});
				Proposal3 = await Delegation_Instance.Get_Proposal(law_key, 3);
				
				await time.increase(Uint256_arg[3]+1);
				await Delegation_Instance.Start_Vote(law_key, {from:Members[0]})
				
				var Citizens_Votes = Cleared_Votes_Creation(3, Members.length);
				Citizens_Votes.forEach(async (elem,i,arr)=>{
					elem[0]=4;
					await Ballot_Instance.Vote_Clear(law_key, elem, {from:Members[i]});
				});

				await time.increase(Uint256_arg[4]+1);
				await Ballot_Instance.End_Vote(law_key);
				
				await Delegation_Instance.Achiev_Vote(law_key, {from:Members[0]});

				await time.increase(Uint256_arg[5]+1);
				await Delegation_Instance.Adopt_Law(law_key, {from:Members[0]});

				Winning_Proposal = (await Delegation_Instance.List_Law_Project(law_key)).Winning_Proposal;
			});

			it("External_Account attempts to execute law", async function(){
				await expectRevert(Delegation_Instance.Execute_Law(law_key, 1,{from:External_Account}),"Delegation Only");
			});

			it("The law is executed in two times by two different delegation members", async function(){
				var Proposal_to_execute = await Delegation_Instance.Get_Proposal(law_key, Winning_Proposal);
				var Functioncalls_nbr = Proposal_to_execute.func_call_counter;
				var num_function_call_ToExecute = chance.natural({min:1, max:Functioncalls_nbr-1})

				res1=await Delegation_Instance.Execute_Law(law_key, num_function_call_ToExecute,{from:Members[0]});
				var result1= await Delegation_Instance.Get_Law_Results(law_key);

				expect(result1.Receipts.length).to.equal(num_function_call_ToExecute);

				res2=await Delegation_Instance.Execute_Law(law_key, Functioncalls_nbr-num_function_call_ToExecute,{from:Members[1]});
				var result2= await Delegation_Instance.Get_Law_Results(law_key);

				var delegation_law= await Delegation_Instance.Delegation_Law_Projects(law_key);
				var List_Lois = await Loi_instance.Get_Law_List();
				var delegation_info = await Delegation_Instance.Get_Delegation_Infos();

				
				for(var i=0; i<Functioncalls_nbr; i++){
					var parameters = Proposal_to_execute.function_calls[i].slice(0,2).concat(Proposal_to_execute.function_calls[i].slice(10));//We remove function selector
					var expected_law_title = web3.eth.abi.decodeParameters(["bytes", "bytes"], parameters);
					expect(List_Lois[i]).to.equal(expected_law_title[0]);
				}

				expect(result2.Receipts.length).to.equal(Functioncalls_nbr.toNumber());
				expect(delegation_info.potentialy_lost_amount).to.be.bignumber.equal(new BN(0));
				expect(delegation_law.Law_Project_Status).to.be.bignumber.equal(new BN(4));
				await expectEvent(res2, "Law_executed", {key:law_key}, "Law_executed event incorrect");
			});


		});

	});
		

});