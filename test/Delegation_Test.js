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
	let Members = Citizens.slice(Math.floor(Citizens.length*member_ratio/100));

	/*Contracts*/
	let Delegation_Utils_Library;
	let Initiative_Legislative_Lib_Library;
	let Ballot_Instance;
	let DemoCoin_Instance;
	let Citizen_Register_Instance;
	let Delegation_Instance;

	/*TEST PARAMETERS*/
	const Initital_Token_Ammount = 1000;
	const Law_Initialisation_Price_Ratio = 50; //Percentage of "Member_Max_Token_Usage" a law initialisation cost;
	const FunctionCall_Price_Ratio = 10; //Percentage of "Member_Max_Token_Usage" a functionCall creation cost;
	const Initial_Ammounts=10;
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

	/*Delegation Parameters*/
	let Vote_Duration;
	let Validation_Duration;
	let Mandate_Duration;
	let Immunity_Duration;
	let Num_Max_Members;
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
	

	beforeEach(async function () {
			DemoCoin_Instance = await DEMOCOIN.new("Token", "TOK",Citizens, new Array(Citizens.length).fill(Initial_Ammounts), {from: Constitution_Address});
			Citizen_Register_Instance = await CITIZEN_REGISTER.new(Citizens, DemoCoin_Instance.address, New_Citizen_Mint_Amount, {from: Constitution_Address});	
			await DemoCoin_Instance.Add_Minter(Citizen_Register_Instance.address);
			//Ballot_Instance = await MAJORITY_JUDGMENT.new();
			Delegation_Utils_Library = await DELEGATION_UTILS.new();
			Initiative_Legislative_Lib_Library = await INITIATIVE_LEGISLATIV_LIB.new();
			
			await DELEGATION.link("Delegation_Uils", Delegation_Utils_Library.address);
			await DELEGATION.link("Initiative_Legislative_Lib" , Initiative_Legislative_Lib_Library.address);
			//console.debug(DELEGATION);
			//await deloyer(Delegation_Utils_Library,[DELEGATION]);
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
				Num_Max_Members = Members.length;
				New_Election_Petition_Rate = chance.natural({min:1, max:5000});

				console.log("Vote_Duration",Vote_Duration,"Validation_Duration",Validation_Duration,"Mandate_Duration",Mandate_Duration,
					"\n Immunity_Duration", Immunity_Duration,"Num_Max_Members",Num_Max_Members,"New_Election_Petition_Rate",New_Election_Petition_Rate);
				
			});

			it("Random Citizen attempt to Update Internal Governance parameters", async function(){
				await expectRevert(Delegation_Instance.Update_Internal_Governance(Vote_Duration, Validation_Duration, Mandate_Duration,
					Immunity_Duration, Num_Max_Members, New_Election_Petition_Rate, Ballot_Instance.address, {from:Citizens[0]}), "Constitution Only");
			});


			it("Constitution_Address Update Internal Governance parameters", async function(){

				res = await Delegation_Instance.Update_Internal_Governance(Vote_Duration, Validation_Duration, Mandate_Duration,
					Immunity_Duration, Num_Max_Members, New_Election_Petition_Rate, Ballot_Instance.address, {from:Constitution_Address});
				var General_info = await Delegation_Instance.Get_Delegation_Infos();
				var mandate_version = await  Delegation_Instance.Mandates_Versions(1);

				expect(General_info.internal_governance_version).to.be.bignumber.equal(new BN(1));
				expect(mandate_version.Election_Duration).to.be.bignumber.equal(new BN(Vote_Duration));
				expect(mandate_version.Validation_Duration).to.be.bignumber.equal(new BN(Validation_Duration));
				expect(mandate_version.Mandate_Duration).to.be.bignumber.equal(new BN(Mandate_Duration));
				expect(mandate_version.Immunity_Duration).to.be.bignumber.equal(new BN(Immunity_Duration));
				expect(mandate_version.Num_Max_Members).to.be.bignumber.equal(new BN(Num_Max_Members));
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

				/*console.log("Member_Max_Token_Usage",Uint256_arg[0],"Law_Initialisation_Price",Uint256_arg[1],"FunctionCall_Price",Uint256_arg[2],
					"\n Proposition_Duration", Uint256_arg[3],"Vote_Duration",Uint256_arg[4],"Law_Censor_Period_Duration",Uint256_arg[5], 
					"\n Censor_Proposition_Petition_Rate", Censor_Proposition_Petition_Rate,"Censor_Penalty_Rate",Censor_Penalty_Rate);*/
				
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
				Num_Max_Members = Members.length;
				New_Election_Petition_Rate = chance.natural({min:1, max:5000});

				/*console.log("Vote_Duration",Vote_Duration,"Validation_Duration",Validation_Duration,"Mandate_Duration",Mandate_Duration,
					"\n Immunity_Duration", Immunity_Duration,"Num_Max_Members",Num_Max_Members,"New_Election_Petition_Rate",New_Election_Petition_Rate);*/
			});

		context("Election and before", ()=>{

			beforeEach(async function (){
				await Delegation_Instance.Update_Internal_Governance(Vote_Duration, Validation_Duration, Mandate_Duration,
						Immunity_Duration, Num_Max_Members, New_Election_Petition_Rate, Ballot_Instance.address, {from:Constitution_Address});
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
				/*console.log("Immunity_Duration",Immunity_Duration);
				var Delegation_Infos = await Delegation_Instance.Get_Delegation_Infos();
				var mandate = await Delegation_Instance.Get_Mandate(0);
				var Mandate_Parameter = await Delegation_Instance.Mandates_Versions(1);
				var blocknumber = (await web3.eth.getTransaction(res.tx)).blockNumber;
				var timestamp = (await web3.eth.getBlock(blocknumber)).timestamp;
				var diff = new BN(timestamp).sub(mandate.Inauguration_Timestamps);
				console.log("diff",diff);

				console.log("Delegation_Infos", Delegation_Infos);
				console.debug("Mandates_Parameter Immunity_Duration:", Mandate_Parameter.Immunity_Duration.toNumber());
				console.debug("Inauguration_Timestamps:", mandate.Inauguration_Timestamps.toNumber());
				console.debug("timestamp:",timestamp);
				console.debug("timestamp-Inauguration=",timestamp - mandate.Inauguration_Timestamps," \nbool:", (timestamp - mandate.Inauguration_Timestamps)> Immunity_Duration);
				*/
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

			it("Citizens attempts to setup a new election before Mandate duration is over and with not enough signatures", async function(){ 
				await expectRevert(Delegation_Instance.New_Election({from:Citizens[0]}), "New election impossible for now");
			});

			it.skip("Citizens setup a new election After Mandate duration is over", async function(){ 
				await time.increase(Mandate_Duration+1);
				res = await Delegation_Instance.New_Election({from:Citizens[0]});


			});

		});


	});
		


});