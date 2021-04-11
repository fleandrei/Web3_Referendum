//Test: Delegation.sol 
const { BN, ether, expectEvent, expectRevert, constants, time} = require('@openzeppelin/test-helpers'); // BN: Big Number
const sha3 = require('js-sha3').keccak_256
const { expect } = require('chai');
const DELEGATION_UTILS = artifacts.require('Delegation_Uils');
const INITIATIVE_LEGISLATIV_LIB = artifacts.require('Initiative_Legislative_Lib');
const CONSTITUTION_REGISTER_LIB = artifacts.require('Constitution_Register');
const CONSTITUTION_DELEGATION_LIB = artifacts.require('Constitution_Delegation');
const DELEGATION = artifacts.require('Delegation');
const AGORA = artifacts.require('Agora');
const MAJORITY_JUDGMENT = artifacts.require('Majority_Judgment_Ballot');
const DEMOCOIN = artifacts.require('DemoCoin');
const CITIZEN_REGISTER = artifacts.require('Citizens_Register');
const LOI = artifacts.require('Loi');
const CONSTITUTION = artifacts.require("Constitution");
const chance = require("chance").Chance();


function Bytes32ToAddress(str){
	return str.slice(0,2) + str.slice(26);
}

contract('TEST: Constitution.sol', function(accounts){
	/*Accounts*/
	const Nbr_Account = accounts.length;
	
	const External_Account = accounts[0];
	const Transition_Government_Account = accounts[1]

	const Citizens = accounts.slice(1);
	let delegation_member_ratio = 10;
	let first_member_indice = Math.floor(Citizens.length*(100-delegation_member_ratio)/100);
	let Members = Citizens.slice(first_member_indice);

	/*Contracts*/
	let Delegation_Utils_Library;
	let Initiative_Legislative_Lib_Library;
	let Constitution_Register_Library;
	let Constitution_Delegation_Library;
	let Ballot_Instance;
	let DemoCoin_Instance;
	let Citizen_Register_Instance;
	let Delegation_Instance;
	let Agora_Instance;
	let Loi_Instance;
	let API_Instance;
	let Constitution_Instance;

	/*TEST PARAMETERS*/
	const Constitution_Name = "Constitution";
	const Citizen_Register_Name = "Citoyens";
	const Loi_Name = "Loi";
	const API_Name = "API";
	const Agora_Name = "Agora";
	const Delegation_Name = "Delegation";
	const Token_Name = "DemoCoin";
	const Token_Symbol = "DEMO";
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
	const petition_duration_min = time.duration.minutes(5).toNumber();
	const petition_duration_max = time.duration.days(10).toNumber();
	const petition_rate_max = 5000;
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
	const Delegation_Mint_max =10;

	/*Delegation Variables*/
	
	let Mandate_Duration;
	let Immunity_Duration;
	let Next_Mandate_Max_Members;
	let New_Election_Petition_Rate;
	let Uint256_Governance_arg = Array.from({length:5});

	let Member_Max_Token_Usage;
	let Proposition_Duration;
	let Legislatif_Vote_Duration;
	let Law_Censor_Period_Duration;
	let Censor_Proposition_Petition_Rate;
	let Censor_Penalty_Rate;
	let Uint256_Legislatif_arg = Array.from({length:6});


	/*Agora variables*/
	let Petition_Duration;
	let Required_Petition_Rate;
	
	/*Common variables*/
	let Vote_Duration;
	let Validation_Duration;
	let Law_Initialisation_Price;
	let FunctionCall_Price;
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

			Delegation_Utils_Library = await DELEGATION_UTILS.new();
			Initiative_Legislative_Lib_Library = await INITIATIVE_LEGISLATIV_LIB.new();
			
			await CONSTITUTION_DELEGATION_LIB.link("Delegation_Uils", Delegation_Utils_Library.address);
			await CONSTITUTION_DELEGATION_LIB.link("Initiative_Legislative_Lib" , Initiative_Legislative_Lib_Library.address);
			Constitution_Register_Library = await CONSTITUTION_REGISTER_LIB.new();
			Constitution_Delegation_Library = await CONSTITUTION_DELEGATION_LIB.new();
			await CONSTITUTION.link("Constitution_Register", Constitution_Register_Library.address);
			await CONSTITUTION.link("Create_Delegation" , Constitution_Delegation_Library.address);
			await AGORA.link("Initiative_Legislative_Lib", Initiative_Legislative_Lib_Library.address);

			DemoCoin_Instance = await DEMOCOIN.new(Token_Name, Token_Symbol,Citizens, new Array(Citizens.length).fill(Citizen_Initial_Ammounts), {from: External_Account});
			Citizen_Register_Instance = await CITIZEN_REGISTER.new(Citizen_Register_Name, Citizens, DemoCoin_Instance.address, New_Citizen_Mint_Amount, {from: External_Account});	
			await DemoCoin_Instance.Add_Minter(Citizen_Register_Instance.address, {from:External_Account});
			Agora_Instance = await AGORA.new(Agora_Name, DemoCoin_Instance.address, Citizen_Register_Instance.address, {from: External_Account});
			
			//Ballot_Instance = await MAJORITY_JUDGMENT.new();

			

			/*Constitution_Instance = await CONSTITUTION.new(Constitution_Name, Citizen_Register_Name, Agora_Name,
			 Transition_Government_Account, Citizens, Token_Name, Token_Symbol, 
			 Array.from({length:Citizens.length}).fill(Citizen_Initial_Ammounts), Citizen_Initial_Ammounts, {from: External_Account, gas:15000000});*/

			Constitution_Instance = await CONSTITUTION.new(Constitution_Name, DemoCoin_Instance.address, 
			 	Citizen_Register_Instance.address, Agora_Instance.address, Transition_Government_Account, {from:External_Account}); 

			 await DemoCoin_Instance.Set_Constitution(Constitution_Instance.address, {from:External_Account});
			 await Citizen_Register_Instance.Set_Constitution(Constitution_Instance.address, {from:External_Account});
			 await Agora_Instance.Set_Constitution(Constitution_Instance.address, {from:External_Account});


	});

	describe("Constitution Initialisation", ()=>{

		it("Check Constitution's globals parameters", async function(){ 
			var authorities_list = await Constitution_Instance.Get_Authorities({from:External_Account});

			expect(JSON.stringify(authorities_list.map(Bytes32ToAddress))).to.equal(JSON.stringify([Transition_Government_Account.toLowerCase(), Agora_Instance.address.toLowerCase()]));
			expect(await Constitution_Instance.Constitution_Address()).to.equal(Constitution_Instance.address);
			expect(await Constitution_Instance.Type_Institution()).to.be.bignumber.equal(new BN(0));
			expect(await Constitution_Instance.Transitional_Government()).to.equal(Transition_Government_Account);

			expect(await DemoCoin_Instance.Constitution_Address()).to.equal(Constitution_Instance.address);
			expect(await Citizen_Register_Instance.Constitution_Address()).to.equal(Constitution_Instance.address);
			expect(await Agora_Instance.Constitution_Address()).to.equal(Constitution_Instance.address);
		});

		it("External_Account attempts to removes Transitional Government account's privileges", async function(){
			await expectRevert(Constitution_Instance.End_Transition_Government( {from:External_Account}), "Transitional_Government only");
		});

		it("Transition_Government_Account removes it's privileges", async function(){
			res= await Constitution_Instance.End_Transition_Government( {from:Transition_Government_Account});
			var authorities_list = await Constitution_Instance.Get_Authorities({from:External_Account});

			expect(authorities_list.map(Bytes32ToAddress).includes(Transition_Government_Account.toLowerCase())).to.equal(false);
			await expectEvent(res, "Transitional_Government_Finised", {}, "Transitional_Government_Finised event incorrect");
		});
		
	});

	describe("DemoCoin token's parameter setting", ()=>{


		it("External_Account attempts to edit DemoCoin's Minter list", async function(){ 
			await expectRevert(Constitution_Instance.Set_Minnter([External_Account, Transition_Government_Account], [], {from:External_Account}), "Authorities Only");
		});

		it("Transition_Government_Account edits DemoCoin's Minter list", async function(){ 
			await Constitution_Instance.Set_Minnter([External_Account, Transition_Government_Account], [Citizen_Register_Instance.address], {from:Transition_Government_Account});

			var Minter_List = await DemoCoin_Instance.Get_Mint_Authorities();
			Minter_List=Minter_List.map(Bytes32ToAddress);

			expect(Minter_List.includes(External_Account.toLowerCase())).to.equal(true);
			expect(Minter_List.includes(Transition_Government_Account.toLowerCase())).to.equal(true);
			expect(Minter_List.includes(Constitution_Instance.address.toLowerCase())).to.equal(true);
			expect(Minter_List.includes(Citizen_Register_Instance.address.toLowerCase())).to.equal(false);
			//expect(JSON.stringify(Minter_List.map(Bytes32ToAddress))).to.equal(JSON.stringify([External_Account.toLowerCase(),Transition_Government_Account.toLowerCase(),Constitution_Instance.address.toLowerCase()]));
		});

		it("External_Account attempts to edit DemoCoin's Burner list", async function(){
			await expectRevert(Constitution_Instance.Set_Burner([External_Account, Transition_Government_Account], [], {from:External_Account}), "Authorities Only");
		});

		it("Transition_Government_Account edits DemoCoin's Burner list", async function(){
			//await DemoCoin_Instance.Add_Burner(Citizen_Register_Instance.address, {from:Constitution_Instance.address});
			await Constitution_Instance.Set_Burner([External_Account, Transition_Government_Account], [], {from:Transition_Government_Account});
			var Burner_List = await DemoCoin_Instance.Get_Burn_Authorities();
			Burner_List=Burner_List.map(Bytes32ToAddress);

			expect(Burner_List.includes(External_Account.toLowerCase())).to.equal(true);
			expect(Burner_List.includes(Transition_Government_Account.toLowerCase())).to.equal(true);
			expect(Burner_List.includes(Constitution_Instance.address.toLowerCase())).to.equal(true);

			await Constitution_Instance.Set_Burner([], [External_Account], {from:Transition_Government_Account});

			var Burner_List = await DemoCoin_Instance.Get_Burn_Authorities();
			Burner_List=Burner_List.map(Bytes32ToAddress);

			expect(Burner_List.includes(External_Account.toLowerCase())).to.equal(false);

			//expect(JSON.stringify(Burner_List.map(Bytes32ToAddress))).to.equal(JSON.stringify([External_Account.toLowerCase(),Transition_Government_Account.toLowerCase(), Constitution_Instance.address.toLowerCase()]));
		});
	});


	describe("Citizen register editing", ()=>{

		it("External_Account attempts to edit New_Citizen_Mint_Amount Citizen_Register variable", async function(){ 
			await expectRevert(Constitution_Instance.Set_Citizen_Mint_Amount(20, {from:External_Account}), "Authorities Only");
		});

		it("Authority account edit New_Citizen_Mint_Amount Citizen_Register variable", async function(){ 
			res=await Constitution_Instance.Set_Citizen_Mint_Amount(20, {from:Transition_Government_Account});
			expect(await Citizen_Register_Instance.New_Citizen_Mint_Amount()).to.be.bignumber.equal(new BN(20));
		});

		it("External_Account attempts to add a register authority to Citizen_Register", async function(){ 
			await expectRevert(Constitution_Instance.Add_Registering_Authority(External_Account, {from:External_Account}), "Authorities Only");
		});

		it("Authority account add a register authority to Citizen_Register", async function(){ 
			await Constitution_Instance.Add_Registering_Authority(External_Account, {from:Transition_Government_Account});
			var Registering_Authorities = await Citizen_Register_Instance.Get_Registering_Authorities();
			expect(Registering_Authorities.map(Bytes32ToAddress).includes(External_Account.toLowerCase())).to.equal(true);
		});

		it("External_Account attempts to add a Banning authority to Citizen_Register", async function(){ 
			await expectRevert(Constitution_Instance.Add_Banning_Authority(External_Account, {from:External_Account}), "Authorities Only");
		});

		it("Authority account add a banning authority to Citizen_Register", async function(){ 
			await Constitution_Instance.Add_Banning_Authority(External_Account, {from:Transition_Government_Account});
			var Banning_Authorities = await Citizen_Register_Instance.Get_Banning_Authorities();
			expect(Banning_Authorities.map(Bytes32ToAddress).includes(External_Account.toLowerCase())).to.equal(true);
		});

		it("External_Account attempts to remove an authority from Citizen_Register", async function(){ 
			await Constitution_Instance.Add_Banning_Authority(External_Account, {from:Transition_Government_Account});
			await expectRevert(Constitution_Instance.Citizen_Register_Remove_Authority(External_Account, {from:External_Account}), "Authorities Only");
		});

		it("Authority account removes a banning authority from Citizen_Register", async function(){ 
			await Constitution_Instance.Add_Banning_Authority(External_Account, {from:Transition_Government_Account});
			await Constitution_Instance.Citizen_Register_Remove_Authority(External_Account, {from:Transition_Government_Account});
			var Banning_Authorities = await Citizen_Register_Instance.Get_Banning_Authorities();
			expect(Banning_Authorities.map(Bytes32ToAddress).includes(External_Account.toLowerCase())).to.equal(false);
		});

		it("Authority account removes a registering authority from Citizen_Register", async function(){ 
			await Constitution_Instance.Add_Registering_Authority(External_Account, {from:Transition_Government_Account});
			await Constitution_Instance.Citizen_Register_Remove_Authority(External_Account, {from:Transition_Government_Account});
			var Registering_Authorities = await Citizen_Register_Instance.Get_Registering_Authorities();
			expect(Registering_Authorities.map(Bytes32ToAddress).includes(External_Account.toLowerCase())).to.equal(false);
		});
	});



	describe("Register Handling", ()=>{

		context("Register Creation",()=>{

			beforeEach(async function () {
				Ballot_Instance = await MAJORITY_JUDGMENT.new();
				Petition_Duration = chance.natural({min:petition_duration_min, max:petition_duration_max});
				Vote_Duration= chance.natural({min:vote_duration_min, max:vote_duration_max});
				Validation_Duration = chance.natural({min:validation_duration_min, max:validation_duration_max});

				Law_Initialisation_Price= Math.floor(Citizen_Initial_Ammounts*Law_Initialisation_Price_Ratio/100);
				FunctionCall_Price = Math.floor(Citizen_Initial_Ammounts*FunctionCall_Price_Ratio/100);

				Required_Petition_Rate = chance.natural({min:Math.floor(10000*2/Citizens.length), max:petition_rate_max});
			});


			it("External_Account attempts to create a new Loi register", async function(){ 
				await expectRevert(Constitution_Instance.Create_Register("Loi", 3, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:External_Account}), "Authorities Only");
			});

			it("Authority account attempts to create a new register but the register type is not correct (must be 0, 3 or 4)", async function(){ 
				await expectRevert(Constitution_Instance.Create_Register("Loi", 2, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account}), "Not Register Type");
			});

			it("Authority account creates a new Loi register", async function(){ 
				res= await Constitution_Instance.Create_Register("Loi", 3, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account});
				
				var Register_List = (await Constitution_Instance.Get_Register_List()).map(Bytes32ToAddress);
				var loi_address=Register_List[0];
				var Referendum_Register= await Agora_Instance.Get_Referendum_Register(loi_address);
				var Parameters= await Agora_Instance.Get_Referendum_Register_Parameters(loi_address,1);
				
				expect(Referendum_Register.last_version).to.be.bignumber.equal(new BN(1));
				expect(Referendum_Register.institution_type).to.be.bignumber.equal(new BN(3));

				expect(Parameters.Petition_Duration).to.be.bignumber.equal(new BN(Petition_Duration));
				expect(Parameters.Vote_Duration).to.be.bignumber.equal(new BN(Vote_Duration));
				expect(Parameters.Vote_Checking_Duration).to.be.bignumber.equal(new BN(Validation_Duration));
				expect(Parameters.Law_Initialisation_Price).to.be.bignumber.equal(new BN(Law_Initialisation_Price));
				expect(Parameters.FunctionCall_Price).to.be.bignumber.equal(new BN(FunctionCall_Price));
				expect(Parameters.Required_Petition_Rate).to.be.bignumber.equal(new BN(Required_Petition_Rate));
				expect(Parameters.Ivote_address).to.equal(Ballot_Instance.address);

				//await expectEvent(res, "Register_Created", {register:loi_address}, "Register_Created event incorrect");
			});

			it("Authority account creates a new API register", async function(){ 
				res= await Constitution_Instance.Create_Register("API", 4, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account});
				
				var Register_List = (await Constitution_Instance.Get_Register_List()).map(Bytes32ToAddress);
				var api_address=Register_List[0];
				var Referendum_Register= await Agora_Instance.Get_Referendum_Register(api_address);
				var Parameters= await Agora_Instance.Get_Referendum_Register_Parameters(api_address,1);
			

				expect(Referendum_Register.last_version).to.be.bignumber.equal(new BN(1));
				expect(Referendum_Register.institution_type).to.be.bignumber.equal(new BN(4));

				expect(Parameters.Petition_Duration).to.be.bignumber.equal(new BN(Petition_Duration));
				expect(Parameters.Vote_Duration).to.be.bignumber.equal(new BN(Vote_Duration));
				expect(Parameters.Vote_Checking_Duration).to.be.bignumber.equal(new BN(Validation_Duration));
				expect(Parameters.Law_Initialisation_Price).to.be.bignumber.equal(new BN(Law_Initialisation_Price));
				expect(Parameters.FunctionCall_Price).to.be.bignumber.equal(new BN(FunctionCall_Price));
				expect(Parameters.Required_Petition_Rate).to.be.bignumber.equal(new BN(Required_Petition_Rate));
				expect(Parameters.Ivote_address).to.equal(Ballot_Instance.address);

				//await expectEvent(res, "Register_Created", {register:api_address}, "Register_Created event incorrect");
			});

			it("Authority account creates the Constitution register", async function(){ 
				res= await Constitution_Instance.Create_Register("Constitution", 0, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account});
				
				var Register_List = (await Constitution_Instance.Get_Register_List()).map(Bytes32ToAddress);
				var constitution_address=Register_List[0];
				var Referendum_Register= await Agora_Instance.Get_Referendum_Register(constitution_address);
				var Parameters= await Agora_Instance.Get_Referendum_Register_Parameters(constitution_address,1);
				

				var expected_constitution_address= Constitution_Instance.address
				expect(constitution_address).to.equal(expected_constitution_address.toLowerCase());
				expect(Referendum_Register.last_version).to.be.bignumber.equal(new BN(1));
				expect(Referendum_Register.institution_type).to.be.bignumber.equal(new BN(0));

				expect(Parameters.Petition_Duration).to.be.bignumber.equal(new BN(Petition_Duration));
				expect(Parameters.Vote_Duration).to.be.bignumber.equal(new BN(Vote_Duration));
				expect(Parameters.Vote_Checking_Duration).to.be.bignumber.equal(new BN(Validation_Duration));
				expect(Parameters.Law_Initialisation_Price).to.be.bignumber.equal(new BN(Law_Initialisation_Price));
				expect(Parameters.FunctionCall_Price).to.be.bignumber.equal(new BN(FunctionCall_Price));
				expect(Parameters.Required_Petition_Rate).to.be.bignumber.equal(new BN(Required_Petition_Rate));
				expect(Parameters.Ivote_address).to.equal(Ballot_Instance.address);

				await expectEvent(res, "Register_Created", {register:Constitution_Instance.address}, "Register_Created event incorrect");
			});

			it("Authority account attempts to creates the Constitution register twice", async function(){ 
				res= await Constitution_Instance.Create_Register("Constitution", 0, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account});

				await expectRevert(Constitution_Instance.Create_Register("Constitution", 0, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account}), "Register Already Existing");

			});

		});

		context("Register parameters setting",()=>{
			let register_address;

			beforeEach(async function () {
				Ballot_Instance = await MAJORITY_JUDGMENT.new();
				Petition_Duration = chance.natural({min:petition_duration_min, max:petition_duration_max});
				Vote_Duration= chance.natural({min:vote_duration_min, max:vote_duration_max});
				Validation_Duration = chance.natural({min:validation_duration_min, max:validation_duration_max});

				Law_Initialisation_Price= Math.floor(Citizen_Initial_Ammounts*Law_Initialisation_Price_Ratio/100);
				FunctionCall_Price = Math.floor(Citizen_Initial_Ammounts*FunctionCall_Price_Ratio/100);

				Required_Petition_Rate = chance.natural({min:Math.floor(10000*2/Citizens.length), max:petition_rate_max});

				await Constitution_Instance.Create_Register("Constitution", 0, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account});

				var Register_List = (await Constitution_Instance.Get_Register_List()).map(Bytes32ToAddress);
				register_address = Register_List[0];
			});

			it("External_Account attempts to edit parameters of Constitution register", async function(){ 
				await expectRevert(Constitution_Instance.Set_Register_Param(register_address, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:External_Account}), "Authorities Only");
			});

			it("Authority account attempts to edit parameters of not existing register", async function(){ 
				await expectRevert(Constitution_Instance.Set_Register_Param(web3.utils.randomHex(20), Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account}), "Register doesn't exist");
			});

			it("Authority account attempts to edit parameters but Petition_Duration is null", async function(){ 
				await expectRevert(Constitution_Instance.Set_Register_Param(register_address, 0, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account}), "Bad arguments value");
			});

			it("Authority account attempts to edit parameters but Vote_Duration is null", async function(){ 
				await expectRevert(Constitution_Instance.Set_Register_Param(register_address, Petition_Duration, 0, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account}), "Bad arguments value");
			});

			it("Authority account attempts to edit parameters but Required_Petition_Rate is null", async function(){ 
				await expectRevert(Constitution_Instance.Set_Register_Param(register_address, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, 0, Ballot_Instance.address, {from:Transition_Government_Account}), "Bad arguments value");
			});

			it("Authority account attempts to edit parameters but Required_Petition_Rate is greater than 10000 (ratio greater than 100%) ", async function(){ 
				await expectRevert(Constitution_Instance.Set_Register_Param(register_address, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, 10001, Ballot_Instance.address, {from:Transition_Government_Account}), "Bad arguments value");
			});

			it("Authority account attempts to edit parameters but Ivote_address is address(0)", async function(){ 
				await expectRevert(Constitution_Instance.Set_Register_Param(register_address, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, constants.ZERO_ADDRESS, {from:Transition_Government_Account}), "Bad arguments value");
			});

			it("Authority account edit parameters of Constitution register ", async function(){ 

				var Referendum_Register= await Agora_Instance.Get_Referendum_Register(Constitution_Instance.address);
				var Parameters= await Agora_Instance.Get_Referendum_Register_Parameters(Constitution_Instance.address,2);
			

				Petition_Duration = chance.natural({min:petition_duration_min, max:petition_duration_max});
				Vote_Duration= chance.natural({min:vote_duration_min, max:vote_duration_max});
				Validation_Duration = chance.natural({min:validation_duration_min, max:validation_duration_max});

				Law_Initialisation_Price= Math.floor(Citizen_Initial_Ammounts*Law_Initialisation_Price_Ratio/100);
				FunctionCall_Price = Math.floor(Citizen_Initial_Ammounts*FunctionCall_Price_Ratio/100);

				Required_Petition_Rate = chance.natural({min:Math.floor(10000*2/Citizens.length), max:petition_rate_max});

				res= await Constitution_Instance.Set_Register_Param(register_address, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account});

				var Referendum_Register= await Agora_Instance.Get_Referendum_Register(Constitution_Instance.address);
				var Parameters= await Agora_Instance.Get_Referendum_Register_Parameters(Constitution_Instance.address,2);
				

				expect(Referendum_Register.last_version).to.be.bignumber.equal(new BN(2));

				expect(Parameters.Petition_Duration).to.be.bignumber.equal(new BN(Petition_Duration));
				expect(Parameters.Vote_Duration).to.be.bignumber.equal(new BN(Vote_Duration));
				expect(Parameters.Vote_Checking_Duration).to.be.bignumber.equal(new BN(Validation_Duration));
				expect(Parameters.Law_Initialisation_Price).to.be.bignumber.equal(new BN(Law_Initialisation_Price));
				expect(Parameters.FunctionCall_Price).to.be.bignumber.equal(new BN(FunctionCall_Price));
				expect(Parameters.Required_Petition_Rate).to.be.bignumber.equal(new BN(Required_Petition_Rate));
				expect(Parameters.Ivote_address).to.equal(Ballot_Instance.address);
				
				var past_event = await Agora_Instance.getPastEvents( 'Referendum_Parameters_Updated', { fromBlock: 0, toBlock: 'latest' } );

				var event= '0x' + sha3("Referendum_Parameters_Updated()");
				var Referendum_Parameters_Updated_event = past_event.some(l => { 
					
					return (l.transactionHash == res.tx && l.returnValues.register_address.toLowerCase() == register_address && l.returnValues.new_version==2);
				});
				expect(Referendum_Parameters_Updated_event).to.equal(true);
			});

		});

	});



	describe("Delegation Handling", ()=>{

		beforeEach(async function () {
				Ballot_Instance = await MAJORITY_JUDGMENT.new();

				/*Legislatig Process*/
				Uint256_Legislatif_arg[0] = Math.floor(Initital_Token_Ammount/Members.length); //Member_Max_Token_Usage
				Uint256_Legislatif_arg[1] = Math.floor(Uint256_Legislatif_arg[0]*Law_Initialisation_Price_Ratio/100); //Law_Initialisation_Price
				Uint256_Legislatif_arg[2] = Math.floor(Uint256_Legislatif_arg[0]*FunctionCall_Price_Ratio/100); //FunctionCall_Price
				Uint256_Legislatif_arg[3] = chance.natural({min:Proposition_Duration_min, max:Proposition_Duration_max}); //Proposition_Duration
				Uint256_Legislatif_arg[4] = chance.natural({min:vote_duration_min, max:vote_duration_max}); //Vote_Duration
				Uint256_Legislatif_arg[5] = chance.natural({min:Law_Censor_Period_Duration_min, max:Law_Censor_Period_Duration_min}); //Law_Censor_Period_Duration
				Censor_Proposition_Petition_Rate= chance.natural({min:1, max:Censor_Proposition_Petition_Rate_max});
				Censor_Penalty_Rate = chance.natural({min:1, max:Censor_Penalty_Rate_max});

				/*Internal Governance*/
				Uint256_Governance_arg[0] = chance.natural({min:vote_duration_min, max:vote_duration_max});
				Uint256_Governance_arg[1] = chance.natural({min:validation_duration_min, max:validation_duration_max});
				Uint256_Governance_arg[2] = chance.natural({min:mandate_duration_min, max:mandate_duration_max});
				Uint256_Governance_arg[3] = Math.floor(Immunity_duration_rate*Uint256_Governance_arg[2]/100);
				Uint256_Governance_arg[4] = chance.natural({min:0, max:Delegation_Mint_max});
				/*Vote_Duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
				Validation_Duration = chance.natural({min:validation_duration_min, max:validation_duration_max});
				Mandate_Duration = chance.natural({min:mandate_duration_min, max:mandate_duration_max});
				Immunity_Duration = Math.floor(Immunity_duration_rate*Mandate_Duration/100);*/
				Next_Mandate_Max_Members = Members.length;
				New_Election_Petition_Rate = chance.natural({min:10000/Citizens.length, max:5000}); //We assure that the ratio will correspond at least at 1 citizen 	
			});


		context("Delegation Creation",()=>{

			//Legislatif process bad parameters
			it("External_Account attempts to create new Delegation", async function(){ 

				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:External_Account}), "Authorities Only");
			});

			it("Authority account attempts to create new Delegation but Proposition_Duration is null", async function(){ 
				Uint256_Legislatif_arg[3]=0;
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account}), "Legislatif: Bad Argument Value");
			});

			it("Authority account attempts to create new Delegation but législatif Vote_Duration is null", async function(){ 
				Uint256_Legislatif_arg[4]=0;
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account}), "Legislatif: Bad Argument Value");
			});

			it("Authority account attempts to create new Delegation but Censor_Proposition_Petition_Rate is bigger than 10000 (ratio is bigger than 100%)", async function(){ 
				Censor_Proposition_Petition_Rate=10001;
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account}), "Legislatif: Bad Argument Value");
			});

			it("Authority account attempts to create new Delegation but Censor_Penalty_Rate is bigger than 10000 (ratio is bigger than 100%)", async function(){ 
				Censor_Penalty_Rate=10001;
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account}), "Legislatif: Bad Argument Value");
			});

			it("Authority account attempts to create new Delegation but Legislatif Ivote_address is address(0)", async function(){ 
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, constants.ZERO_ADDRESS, Ballot_Instance.address, {from:Transition_Government_Account}), "Legislatif: Bad Argument Value");
			});


			//Internal governance bad parameters

			it("Authority account attempts to create new Delegation but election Vote_Duration is null", async function(){ 
				Uint256_Governance_arg[0]=0;
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});

			
			it("Authority account attempts to create new Delegation but Mandate_Duration is null", async function(){ 
				Uint256_Governance_arg[2]=0;
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});

			it("Authority account attempts to create new Delegation but Next_Mandate_Max_Members is null", async function(){ 
				Next_Mandate_Max_Members=0;
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});

			it("Authority account attempts to create new Delegation but New_Election_Petition_Rate is null", async function(){ 
				New_Election_Petition_Rate=0;
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});

			it("Authority account attempts to create new Delegation but New_Election_Petition_Rate is bigger than 10000 (ratio is bigger than 100%)", async function(){ 
				New_Election_Petition_Rate=10001;
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});

			it("Authority account attempts to create new Delegation but Initials members number exceed Next_Mandate_Max_Members value", async function(){ 
				var bad_member = [...Members];
				bad_member.push(web3.utils.randomHex(20));
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, bad_member, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});

			it("Authority account attempts to create new Delegation but Governance Ivote_address is address(0)", async function(){ 
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, constants.ZERO_ADDRESS, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});

			it("Authority account attempts to create new Delegation but an initial member is not a citizen", async function(){ 
				var bad_member = [...Members];
				bad_member[0]=web3.utils.randomHex(20);
				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, bad_member, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account}), "Member is not citizen");
			});

			it("Authority account creates a new Delegation", async function(){ 

				res= await Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account});

				var Delegation_List = (await Constitution_Instance.Get_Delegation_List()).map(Bytes32ToAddress);
				var delegation_address= Delegation_List[0];

				Delegation_Instance = await DELEGATION.at(delegation_address);

				var Mandates_Versions = await Delegation_Instance.Mandates_Versions(1);
				var Law_Parameters_Versions = await Delegation_Instance.Law_Parameters_Versions(1);
				var delegation_info = await Delegation_Instance.Get_Delegation_Infos();


				expect(delegation_info.legislatif_process_version).to.be.bignumber.equal(new BN(1));
				expect(delegation_info.internal_governance_version).to.be.bignumber.equal(new BN(1));

				expect(Law_Parameters_Versions.Member_Max_Token_Usage).to.be.bignumber.equal(new BN(Uint256_Legislatif_arg[0]));
				expect(Law_Parameters_Versions.Law_Initialisation_Price).to.be.bignumber.equal(new BN(Uint256_Legislatif_arg[1]));
				expect(Law_Parameters_Versions.FunctionCall_Price).to.be.bignumber.equal(new BN(Uint256_Legislatif_arg[2]));
				expect(Law_Parameters_Versions.Proposition_Duration).to.be.bignumber.equal(new BN(Uint256_Legislatif_arg[3]));
				expect(Law_Parameters_Versions.Vote_Duration).to.be.bignumber.equal(new BN(Uint256_Legislatif_arg[4]));
				expect(Law_Parameters_Versions.Law_Censor_Period_Duration).to.be.bignumber.equal(new BN(Uint256_Legislatif_arg[5]));
				expect(Law_Parameters_Versions.Censor_Proposition_Petition_Rate).to.be.bignumber.equal(new BN(Censor_Proposition_Petition_Rate));
				expect(Law_Parameters_Versions.Censor_Penalty_Rate).to.be.bignumber.equal(new BN(Censor_Penalty_Rate));
				expect(Law_Parameters_Versions.Ivote_address).to.equal(Ballot_Instance.address);

				expect(Mandates_Versions.Election_Duration).to.be.bignumber.equal(new BN(Uint256_Governance_arg[0]));
				expect(Mandates_Versions.Validation_Duration).to.be.bignumber.equal(new BN(Uint256_Governance_arg[1]));
				expect(Mandates_Versions.Mandate_Duration).to.be.bignumber.equal(new BN(Uint256_Governance_arg[2]));
				expect(Mandates_Versions.Immunity_Duration).to.be.bignumber.equal(new BN(Uint256_Governance_arg[3]));
				expect(Mandates_Versions.Next_Mandate_Max_Members).to.be.bignumber.equal(new BN(Next_Mandate_Max_Members));
				expect(Mandates_Versions.New_Election_Petition_Rate).to.be.bignumber.equal(new BN(New_Election_Petition_Rate));
				expect(Mandates_Versions.Ivote_address).to.equal(Ballot_Instance.address);

				expect(await DemoCoin_Instance.balanceOf(delegation_address)).to.be.bignumber.equal(new BN(Uint256_Governance_arg[4]));

				await expectEvent(res, "Delegation_Created", (ev)=>{return ev.delegation.toLowerCase()==delegation_address}, "Delegation_Created event incorrect");
			});

			it("Authority account add an already existing yet not registered Delegation to the DAO", async function(){ 
				Delegation_Utils_Library = await DELEGATION_UTILS.new();
				Initiative_Legislative_Lib_Library = await INITIATIVE_LEGISLATIV_LIB.new();
				
				await DELEGATION.link("Delegation_Uils", Delegation_Utils_Library.address);
				await DELEGATION.link("Initiative_Legislative_Lib" , Initiative_Legislative_Lib_Library.address);
				Delegation_Instance = await DELEGATION.new("Delegation",Members, DemoCoin_Instance.address, Citizen_Register_Instance.address, Agora_Instance.address);
				await Delegation_Instance.Set_Constitution(Constitution_Instance.address);

				res= await Constitution_Instance.Create_Delegation("Delegation", Delegation_Instance.address, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account});

				var Delegation_List = (await Constitution_Instance.Get_Delegation_List()).map(Bytes32ToAddress);
				var delegation_address= Delegation_List[0];

				var Mandates_Versions = await Delegation_Instance.Mandates_Versions(1);
				var Law_Parameters_Versions = await Delegation_Instance.Law_Parameters_Versions(1);
				var delegation_info = await Delegation_Instance.Get_Delegation_Infos();


				expect(delegation_info.legislatif_process_version).to.be.bignumber.equal(new BN(1));
				expect(delegation_info.internal_governance_version).to.be.bignumber.equal(new BN(1));
				
				expect(Law_Parameters_Versions.Member_Max_Token_Usage).to.be.bignumber.equal(new BN(Uint256_Legislatif_arg[0]));
				expect(Law_Parameters_Versions.Law_Initialisation_Price).to.be.bignumber.equal(new BN(Uint256_Legislatif_arg[1]));
				expect(Law_Parameters_Versions.FunctionCall_Price).to.be.bignumber.equal(new BN(Uint256_Legislatif_arg[2]));
				expect(Law_Parameters_Versions.Proposition_Duration).to.be.bignumber.equal(new BN(Uint256_Legislatif_arg[3]));
				expect(Law_Parameters_Versions.Vote_Duration).to.be.bignumber.equal(new BN(Uint256_Legislatif_arg[4]));
				expect(Law_Parameters_Versions.Law_Censor_Period_Duration).to.be.bignumber.equal(new BN(Uint256_Legislatif_arg[5]));
				expect(Law_Parameters_Versions.Censor_Proposition_Petition_Rate).to.be.bignumber.equal(new BN(Censor_Proposition_Petition_Rate));
				expect(Law_Parameters_Versions.Censor_Penalty_Rate).to.be.bignumber.equal(new BN(Censor_Penalty_Rate));
				expect(Law_Parameters_Versions.Ivote_address).to.equal(Ballot_Instance.address);

				expect(Mandates_Versions.Election_Duration).to.be.bignumber.equal(new BN(Uint256_Governance_arg[0]));
				expect(Mandates_Versions.Validation_Duration).to.be.bignumber.equal(new BN(Uint256_Governance_arg[1]));
				expect(Mandates_Versions.Mandate_Duration).to.be.bignumber.equal(new BN(Uint256_Governance_arg[2]));
				expect(Mandates_Versions.Immunity_Duration).to.be.bignumber.equal(new BN(Uint256_Governance_arg[3]));
				expect(Mandates_Versions.Next_Mandate_Max_Members).to.be.bignumber.equal(new BN(Next_Mandate_Max_Members));
				expect(Mandates_Versions.New_Election_Petition_Rate).to.be.bignumber.equal(new BN(New_Election_Petition_Rate));
				expect(Mandates_Versions.Ivote_address).to.equal(Ballot_Instance.address);
				
				expect(await DemoCoin_Instance.balanceOf(delegation_address)).to.be.bignumber.equal(new BN(Uint256_Governance_arg[4]));

				await expectEvent(res, "Delegation_Created", (ev)=>{return ev.delegation.toLowerCase()==delegation_address}, "Delegation_Created event incorrect");
			});

			it("Authority account attempts to add an already registered Delegation to the DAO", async function(){ 

				await Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account});

				var Delegation_List = (await Constitution_Instance.Get_Delegation_List()).map(Bytes32ToAddress);
				var delegation_address= Delegation_List[0];

				await expectRevert(Constitution_Instance.Create_Delegation("Delegation", delegation_address, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account}), "Delegation already registered")
			});
		});

		context("Delegation Legislatif process Parameters editing",()=>{
			let delegation_address;
			let New_Uint256_Legislatif_arg = Array.from({length:6});
			let New_Censor_Proposition_Petition_Rate;
			let New_Censor_Penalty_Rate;

			beforeEach(async function () {
				await Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account});
			
				var Delegation_List = (await Constitution_Instance.Get_Delegation_List()).map(Bytes32ToAddress);
				delegation_address= Delegation_List[0];

				/*Legislatig Process*/
				New_Uint256_Legislatif_arg[0] = Math.floor(Initital_Token_Ammount/Members.length); //Member_Max_Token_Usage
				New_Uint256_Legislatif_arg[1] = Math.floor(Uint256_Legislatif_arg[0]*Law_Initialisation_Price_Ratio/100); //Law_Initialisation_Price
				New_Uint256_Legislatif_arg[2] = Math.floor(Uint256_Legislatif_arg[0]*FunctionCall_Price_Ratio/100); //FunctionCall_Price
				New_Uint256_Legislatif_arg[3] = chance.natural({min:Proposition_Duration_min, max:Proposition_Duration_max}); //Proposition_Duration
				New_Uint256_Legislatif_arg[4] = chance.natural({min:vote_duration_min, max:vote_duration_max}); //Vote_Duration
				New_Uint256_Legislatif_arg[5] = chance.natural({min:Law_Censor_Period_Duration_min, max:Law_Censor_Period_Duration_min}); //Law_Censor_Period_Duration
				New_Censor_Proposition_Petition_Rate= chance.natural({min:1, max:Censor_Proposition_Petition_Rate_max});
				New_Censor_Penalty_Rate = chance.natural({min:1, max:Censor_Penalty_Rate_max});
				
			});

			it("External_Account attempts to edit Delegation Legislatif process parameters", async function(){ 

				await expectRevert(Constitution_Instance.Set_Delegation_Legislatif_Process(delegation_address, New_Uint256_Legislatif_arg,
				 New_Censor_Proposition_Petition_Rate, New_Censor_Penalty_Rate,
				 Ballot_Instance.address, {from:External_Account}), "Authorities Only");
			});

			it("Authority Account attempts to edit Legislatif process parameters of not registered Delegation", async function(){ 
				await expectRevert(Constitution_Instance.Set_Delegation_Legislatif_Process(web3.utils.randomHex(20), New_Uint256_Legislatif_arg,
				 New_Censor_Proposition_Petition_Rate, New_Censor_Penalty_Rate,
				 Ballot_Instance.address, {from:Transition_Government_Account}), "Non Existing Delegation");
			});

			it("Authority account attempts to edit Legislatif process parameters but Proposition_Duration is null", async function(){ 
				New_Uint256_Legislatif_arg[3]=0;
				await expectRevert(Constitution_Instance.Set_Delegation_Legislatif_Process(delegation_address, New_Uint256_Legislatif_arg,
				 New_Censor_Proposition_Petition_Rate, New_Censor_Penalty_Rate,
				 Ballot_Instance.address,{from:Transition_Government_Account}), "Legislatif: Bad Argument Value");
			});

			it("Authority account attempts to edit Legislatif process parameters but Vote_Duration is null", async function(){ 
				New_Uint256_Legislatif_arg[4]=0;
				await expectRevert(Constitution_Instance.Set_Delegation_Legislatif_Process(delegation_address, New_Uint256_Legislatif_arg,
				 New_Censor_Proposition_Petition_Rate, New_Censor_Penalty_Rate,
				 Ballot_Instance.address,{from:Transition_Government_Account}), "Legislatif: Bad Argument Value");
			});

			it("Authority account attempts to edit Legislatif process parameters but Censor_Proposition_Petition_Rate is bigger than 10000 (ratio is bigger than 100%)", async function(){ 
				New_Censor_Proposition_Petition_Rate=10001;
				await expectRevert(Constitution_Instance.Set_Delegation_Legislatif_Process(delegation_address, New_Uint256_Legislatif_arg,
				 New_Censor_Proposition_Petition_Rate, New_Censor_Penalty_Rate,
				 Ballot_Instance.address,{from:Transition_Government_Account}), "Legislatif: Bad Argument Value");
			});

			it("Authority account attempts to edit Legislatif process parameters but Censor_Penalty_Rate is bigger than 10000 (ratio is bigger than 100%)", async function(){ 
				New_Censor_Penalty_Rate=10001;
				await expectRevert(Constitution_Instance.Set_Delegation_Legislatif_Process(delegation_address, New_Uint256_Legislatif_arg,
				 New_Censor_Proposition_Petition_Rate, New_Censor_Penalty_Rate,
				 Ballot_Instance.address,{from:Transition_Government_Account}), "Legislatif: Bad Argument Value");
			});

			it("Authority account attempts to edit Legislatif process parameters but Legislatif Ivote_address is address(0)", async function(){ 
				await expectRevert(Constitution_Instance.Set_Delegation_Legislatif_Process(delegation_address, New_Uint256_Legislatif_arg,
				 New_Censor_Proposition_Petition_Rate, New_Censor_Penalty_Rate,
				 constants.ZERO_ADDRESS ,{from:Transition_Government_Account}), "Legislatif: Bad Argument Value");
			});

			it("Authority Account edit Legislatif process parameters of an existing Delegation", async function(){ 
				res=await Constitution_Instance.Set_Delegation_Legislatif_Process(delegation_address, New_Uint256_Legislatif_arg,
				 New_Censor_Proposition_Petition_Rate, New_Censor_Penalty_Rate,
				 Ballot_Instance.address, {from:Transition_Government_Account});

				Delegation_Instance = await DELEGATION.at(delegation_address);
					
				var Law_Parameters_Versions = await Delegation_Instance.Law_Parameters_Versions(2);
				var delegation_info = await Delegation_Instance.Get_Delegation_Infos();

				
				expect(delegation_info.legislatif_process_version).to.be.bignumber.equal(new BN(2));
				
				expect(Law_Parameters_Versions.Member_Max_Token_Usage).to.be.bignumber.equal(new BN(New_Uint256_Legislatif_arg[0]));
				expect(Law_Parameters_Versions.Law_Initialisation_Price).to.be.bignumber.equal(new BN(New_Uint256_Legislatif_arg[1]));
				expect(Law_Parameters_Versions.FunctionCall_Price).to.be.bignumber.equal(new BN(New_Uint256_Legislatif_arg[2]));
				expect(Law_Parameters_Versions.Proposition_Duration).to.be.bignumber.equal(new BN(New_Uint256_Legislatif_arg[3]));
				expect(Law_Parameters_Versions.Vote_Duration).to.be.bignumber.equal(new BN(New_Uint256_Legislatif_arg[4]));
				expect(Law_Parameters_Versions.Law_Censor_Period_Duration).to.be.bignumber.equal(new BN(New_Uint256_Legislatif_arg[5]));
				expect(Law_Parameters_Versions.Censor_Proposition_Petition_Rate).to.be.bignumber.equal(new BN(New_Censor_Proposition_Petition_Rate));
				expect(Law_Parameters_Versions.Censor_Penalty_Rate).to.be.bignumber.equal(new BN(New_Censor_Penalty_Rate));
				
				expect(Law_Parameters_Versions.Ivote_address).to.equal(Ballot_Instance.address);
			});

		});

		context("Delegation Internal Governance Parameters editing",()=>{
			let delegation_address;
			let Mint_Token;

			beforeEach(async function () {
				await Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
				 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
				 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account});
			
				var Delegation_List = (await Constitution_Instance.Get_Delegation_List()).map(Bytes32ToAddress);
				delegation_address= Delegation_List[0];

				/*Internal Governance*/
				Election_Duration = chance.natural({min:vote_duration_min, max:vote_duration_max});
				Validation_Duration = chance.natural({min:validation_duration_min, max:validation_duration_max});
				Mandate_Duration = chance.natural({min:mandate_duration_min, max:mandate_duration_max});
				Immunity_Duration = Math.floor(Immunity_duration_rate*Uint256_Governance_arg[2]/100);
				Mint_Token = chance.natural({min:0, max:Delegation_Mint_max});
		
				Next_Mandate_Max_Members = Members.length;
				New_Election_Petition_Rate = chance.natural({min:10000/Citizens.length, max:5000}); //We assure that the ratio will correspond at least at 1 citizen 	
				
			});

			it("External_Account attempts to edit Delegation Internal governance parameters", async function(){ 
			
				await expectRevert(Constitution_Instance.Set_Delegation_Internal_Governance(delegation_address, Election_Duration,
				 Validation_Duration, Mandate_Duration, Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Mint_Token, 
				 Ballot_Instance.address, {from:External_Account}), "Authorities Only");
			});

			it("Authority account attempts to edit Delegation Internal governance parameters of not registered Delegation", async function(){ 
			
				await expectRevert(Constitution_Instance.Set_Delegation_Internal_Governance(web3.utils.randomHex(20), Election_Duration,
				 Validation_Duration, Mandate_Duration, Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Mint_Token, 
				 Ballot_Instance.address, {from:Transition_Government_Account}), "Non Existing Delegation");
			});


			it("Authority account attempts to edit Delegation Internal governance parameters but election Vote_Duration is null", async function(){ 
				Election_Duration=0;
				await expectRevert(Constitution_Instance.Set_Delegation_Internal_Governance(delegation_address, Election_Duration,
				 Validation_Duration, Mandate_Duration, Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Mint_Token, 
				 Ballot_Instance.address, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});

			
			it("Authority account attempts to edit Delegation Internal governance parameters but Mandate_Duration is null", async function(){ 
				Mandate_Duration=0;
				await expectRevert(Constitution_Instance.Set_Delegation_Internal_Governance(delegation_address, Election_Duration,
				 Validation_Duration, Mandate_Duration, Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Mint_Token, 
				 Ballot_Instance.address, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});

			it("Authority account attempts to edit Delegation Internal governance parameters but Next_Mandate_Max_Members is null", async function(){ 
				Next_Mandate_Max_Members=0;
				await expectRevert(Constitution_Instance.Set_Delegation_Internal_Governance(delegation_address, Election_Duration,
				 Validation_Duration, Mandate_Duration, Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Mint_Token, 
				 Ballot_Instance.address, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});

			it("Authority account attempts to edit Delegation Internal governance parameters but New_Election_Petition_Rate is null", async function(){ 
				New_Election_Petition_Rate=0;
				await expectRevert(Constitution_Instance.Set_Delegation_Internal_Governance(delegation_address, Election_Duration,
				 Validation_Duration, Mandate_Duration, Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Mint_Token, 
				 Ballot_Instance.address, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});

			it("Authority account attempts to edit Delegation Internal governance parameters but New_Election_Petition_Rate is bigger than 10000 (ratio is bigger than 100%)", async function(){ 
				New_Election_Petition_Rate=10001;
				await expectRevert(Constitution_Instance.Set_Delegation_Internal_Governance(delegation_address, Election_Duration,
				 Validation_Duration, Mandate_Duration, Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Mint_Token, 
				 Ballot_Instance.address, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});


			it("Authority account attempts to edit Delegation Internal governance parameters but Governance Ivote_address is address(0)", async function(){ 
				await expectRevert(Constitution_Instance.Set_Delegation_Internal_Governance(delegation_address, Election_Duration,
				 Validation_Duration, Mandate_Duration, Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Mint_Token, 
				 constants.ZERO_ADDRESS, {from:Transition_Government_Account}), "Governance: Bad Argument Value");
			});


			it("Authority Account edit Internal governance parameters of an existing Delegation", async function(){ 
				var balance_before = await DemoCoin_Instance.balanceOf(delegation_address);
				await Constitution_Instance.Set_Delegation_Internal_Governance(delegation_address, Election_Duration,
				 Validation_Duration, Mandate_Duration, Immunity_Duration, Next_Mandate_Max_Members, New_Election_Petition_Rate, Mint_Token, 
				 Ballot_Instance.address, {from:Transition_Government_Account});

				Delegation_Instance = await DELEGATION.at(delegation_address);

				var Mandates_Versions = await Delegation_Instance.Mandates_Versions(2);
				var delegation_info = await Delegation_Instance.Get_Delegation_Infos();

				expect(delegation_info.internal_governance_version).to.be.bignumber.equal(new BN(2));

				expect(Mandates_Versions.Election_Duration).to.be.bignumber.equal(new BN(Election_Duration));
				expect(Mandates_Versions.Validation_Duration).to.be.bignumber.equal(new BN(Validation_Duration));
				expect(Mandates_Versions.Mandate_Duration).to.be.bignumber.equal(new BN(Mandate_Duration));
				expect(Mandates_Versions.Immunity_Duration).to.be.bignumber.equal(new BN(Immunity_Duration));
				expect(Mandates_Versions.Next_Mandate_Max_Members).to.be.bignumber.equal(new BN(Next_Mandate_Max_Members));
				expect(Mandates_Versions.New_Election_Petition_Rate).to.be.bignumber.equal(new BN(New_Election_Petition_Rate));
				expect(Mandates_Versions.Ivote_address).to.equal(Ballot_Instance.address);
				
				expect(await DemoCoin_Instance.balanceOf(delegation_address)).to.be.bignumber.equal(balance_before.addn(Mint_Token));
			});

		});
	});



	describe("Authorities editing", ()=>{
		let delegation_address;
		let loi_address;

		beforeEach(async function () {
			Ballot_Instance = await MAJORITY_JUDGMENT.new();

			/*Register parameters*/
			Petition_Duration = chance.natural({min:petition_duration_min, max:petition_duration_max});
			Vote_Duration= chance.natural({min:vote_duration_min, max:vote_duration_max});
			Validation_Duration = chance.natural({min:validation_duration_min, max:validation_duration_max});
			Law_Initialisation_Price= Math.floor(Citizen_Initial_Ammounts*Law_Initialisation_Price_Ratio/100);
			FunctionCall_Price = Math.floor(Citizen_Initial_Ammounts*FunctionCall_Price_Ratio/100);
			Required_Petition_Rate = chance.natural({min:Math.floor(10000*2/Citizens.length), max:petition_rate_max});

			/*Legislatig Process*/
			Uint256_Legislatif_arg[0] = Math.floor(Initital_Token_Ammount/Members.length); //Member_Max_Token_Usage
			Uint256_Legislatif_arg[1] = Math.floor(Uint256_Legislatif_arg[0]*Law_Initialisation_Price_Ratio/100); //Law_Initialisation_Price
			Uint256_Legislatif_arg[2] = Math.floor(Uint256_Legislatif_arg[0]*FunctionCall_Price_Ratio/100); //FunctionCall_Price
			Uint256_Legislatif_arg[3] = chance.natural({min:Proposition_Duration_min, max:Proposition_Duration_max}); //Proposition_Duration
			Uint256_Legislatif_arg[4] = chance.natural({min:vote_duration_min, max:vote_duration_max}); //Vote_Duration
			Uint256_Legislatif_arg[5] = chance.natural({min:Law_Censor_Period_Duration_min, max:Law_Censor_Period_Duration_min}); //Law_Censor_Period_Duration
			Censor_Proposition_Petition_Rate= chance.natural({min:1, max:Censor_Proposition_Petition_Rate_max});
			Censor_Penalty_Rate = chance.natural({min:1, max:Censor_Penalty_Rate_max});

			/*Internal Governance*/
			Uint256_Governance_arg[0] = chance.natural({min:vote_duration_min, max:vote_duration_max});
			Uint256_Governance_arg[1] = chance.natural({min:validation_duration_min, max:validation_duration_max});
			Uint256_Governance_arg[2] = chance.natural({min:mandate_duration_min, max:mandate_duration_max});
			Uint256_Governance_arg[3] = Math.floor(Immunity_duration_rate*Uint256_Governance_arg[2]/100);
			Uint256_Governance_arg[4] = chance.natural({min:0, max:Delegation_Mint_max});
			
			Next_Mandate_Max_Members = Members.length;
			New_Election_Petition_Rate = chance.natural({min:10000/Citizens.length, max:5000}); //We assure that the ratio will correspond at least at 1 citizen 	
			
			await Constitution_Instance.Create_Register("LOI", 3, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account});

			var Register_List = (await Constitution_Instance.Get_Register_List()).map(Bytes32ToAddress);
			loi_address= Register_List[0];

			await Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
			 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
			 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account});
			
			var Delegation_List = (await Constitution_Instance.Get_Delegation_List()).map(Bytes32ToAddress);
			delegation_address= Delegation_List[0];

			await Constitution_Instance.Add_Registering_Authority(delegation_address, {from:Transition_Government_Account});
			//await Constitution_Instance.Add_Delegation_Controled_Register(delegation_address, register_address, {from:Transition_Government_Account});
		});


		/*Add authority*/
		it("External_Account attempts to add authority to register", async function(){ 
			await expectRevert(Constitution_Instance.Add_Register_Authority(loi_address, delegation_address, {from:External_Account}), "Authorities Only");
		});

		it("Authority account attempts to add authority to unknown register", async function(){ 
			await expectRevert(Constitution_Instance.Add_Register_Authority(web3.utils.randomHex(20), delegation_address, {from:Transition_Government_Account}), "Unknown Register");
		});

		it("Authority account add authority to register", async function(){ 
			await Constitution_Instance.Add_Register_Authority(loi_address, delegation_address, {from:Transition_Government_Account});
			Loi_Instance = await LOI.at(loi_address);

			authorities_list = await Loi_Instance.Get_Authorities();

			expect(authorities_list.map(Bytes32ToAddress).includes(delegation_address)).to.equal(true);
		});

		/*Remove authority*/
		it("External_Account attempts to remove authority from register", async function(){ 
			await Constitution_Instance.Add_Register_Authority(loi_address, delegation_address, {from:Transition_Government_Account});
			await expectRevert(Constitution_Instance.Remove_Register_Authority(loi_address, delegation_address, {from:External_Account}), "Authorities Only");
		});

		it("Authority account attempts to remove authority from unknown register", async function(){ 
			await Constitution_Instance.Add_Register_Authority(loi_address, delegation_address, {from:Transition_Government_Account});
			await expectRevert(Constitution_Instance.Remove_Register_Authority(web3.utils.randomHex(20), delegation_address, {from:Transition_Government_Account}), "Unknown Register");
		});

		it("Authority account removes authority from register", async function(){ 
			await Constitution_Instance.Add_Register_Authority(loi_address, delegation_address, {from:Transition_Government_Account});
			await Constitution_Instance.Remove_Register_Authority(loi_address, delegation_address, {from:Transition_Government_Account});
			Loi_Instance = await LOI.at(loi_address);

			authorities_list = await Loi_Instance.Get_Authorities();

			expect(authorities_list.map(Bytes32ToAddress).includes(delegation_address)).to.equal(false);
		});


		it("External_Account attempts to change Constitution address of institution", async function(){ 
			await expectRevert(Constitution_Instance.Set_Instances_Constitution(Citizen_Register_Instance.address, External_Account, {from:External_Account}), "Authorities Only");
		});

		it("Authority account attempts to change Constitution address of unknown institution", async function(){ 
			await expectRevert(Constitution_Instance.Set_Instances_Constitution(web3.utils.randomHex(20), External_Account, {from:Transition_Government_Account}), "instance address unknown");
		});

		it("Authority account attempts to change Constitution address of institution but new constitution address is address(0)", async function(){ 
			await expectRevert(Constitution_Instance.Set_Instances_Constitution(Citizen_Register_Instance.address, constants.ZERO_ADDRESS, {from:Transition_Government_Account}), "address 0");
		});

		it("Authority account changes Constitution address of institution but new constitution address is address(0)", async function(){ 
			await Constitution_Instance.Set_Instances_Constitution(Citizen_Register_Instance.address, External_Account, {from:Transition_Government_Account});
			expect(await Citizen_Register_Instance.Constitution_Address()).to.equal(External_Account);
		});

	});



	describe("Edit controled register list of Delegations", ()=>{
		let delegation_address;
		let register_address;

		beforeEach(async function () {
			Ballot_Instance = await MAJORITY_JUDGMENT.new();

			/*Register parameters*/
			Petition_Duration = chance.natural({min:petition_duration_min, max:petition_duration_max});
			Vote_Duration= chance.natural({min:vote_duration_min, max:vote_duration_max});
			Validation_Duration = chance.natural({min:validation_duration_min, max:validation_duration_max});
			Law_Initialisation_Price= Math.floor(Citizen_Initial_Ammounts*Law_Initialisation_Price_Ratio/100);
			FunctionCall_Price = Math.floor(Citizen_Initial_Ammounts*FunctionCall_Price_Ratio/100);
			Required_Petition_Rate = chance.natural({min:Math.floor(10000*2/Citizens.length), max:petition_rate_max});

			/*Legislatig Process*/
			Uint256_Legislatif_arg[0] = Math.floor(Initital_Token_Ammount/Members.length); //Member_Max_Token_Usage
			Uint256_Legislatif_arg[1] = Math.floor(Uint256_Legislatif_arg[0]*Law_Initialisation_Price_Ratio/100); //Law_Initialisation_Price
			Uint256_Legislatif_arg[2] = Math.floor(Uint256_Legislatif_arg[0]*FunctionCall_Price_Ratio/100); //FunctionCall_Price
			Uint256_Legislatif_arg[3] = chance.natural({min:Proposition_Duration_min, max:Proposition_Duration_max}); //Proposition_Duration
			Uint256_Legislatif_arg[4] = chance.natural({min:vote_duration_min, max:vote_duration_max}); //Vote_Duration
			Uint256_Legislatif_arg[5] = chance.natural({min:Law_Censor_Period_Duration_min, max:Law_Censor_Period_Duration_min}); //Law_Censor_Period_Duration
			Censor_Proposition_Petition_Rate= chance.natural({min:1, max:Censor_Proposition_Petition_Rate_max});
			Censor_Penalty_Rate = chance.natural({min:1, max:Censor_Penalty_Rate_max});

			/*Internal Governance*/
			Uint256_Governance_arg[0] = chance.natural({min:vote_duration_min, max:vote_duration_max});
			Uint256_Governance_arg[1] = chance.natural({min:validation_duration_min, max:validation_duration_max});
			Uint256_Governance_arg[2] = chance.natural({min:mandate_duration_min, max:mandate_duration_max});
			Uint256_Governance_arg[3] = Math.floor(Immunity_duration_rate*Uint256_Governance_arg[2]/100);
			Uint256_Governance_arg[4] = chance.natural({min:0, max:Delegation_Mint_max});
			
			Next_Mandate_Max_Members = Members.length;
			New_Election_Petition_Rate = chance.natural({min:10000/Citizens.length, max:5000}); //We assure that the ratio will correspond at least at 1 citizen 	
			
			await Constitution_Instance.Create_Register("LOI", 3, Petition_Duration, Vote_Duration, Validation_Duration,
				 Law_Initialisation_Price, FunctionCall_Price, Required_Petition_Rate, Ballot_Instance.address, {from:Transition_Government_Account});

			var Register_List = (await Constitution_Instance.Get_Register_List()).map(Bytes32ToAddress);
			register_address= Register_List[0];
			
			await Constitution_Instance.Create_Delegation("Delegation", constants.ZERO_ADDRESS, Uint256_Legislatif_arg,
			 Uint256_Governance_arg,  Next_Mandate_Max_Members, Censor_Proposition_Petition_Rate, Censor_Penalty_Rate,
			 New_Election_Petition_Rate, Members, Ballot_Instance.address, Ballot_Instance.address, {from:Transition_Government_Account});
			
			var Delegation_List = (await Constitution_Instance.Get_Delegation_List()).map(Bytes32ToAddress);
			delegation_address= Delegation_List[0];
		});

		/*Add controled register*/
		it("External_Account attempts to set a register under the control of the delegation", async function(){ 
			await expectRevert(Constitution_Instance.Add_Delegation_Controled_Register(delegation_address, register_address, {from:External_Account}), "Authorities Only");
		});

		it("Authority account attempts to set a register under the control of a not existing delegation", async function(){ 
			await expectRevert(Constitution_Instance.Add_Delegation_Controled_Register(web3.utils.randomHex(20), register_address, {from:Transition_Government_Account}), "Non Existing Delegation");
		});

		it("Authority account attempts to set a register under the control of a not existing delegation", async function(){ 
			await expectRevert(Constitution_Instance.Add_Delegation_Controled_Register(delegation_address, web3.utils.randomHex(20), {from:Transition_Government_Account}), "Non Existing Register");
		});

		it("External_Account attempts to set a register under the control of a not existing delegation", async function(){ 
			await Constitution_Instance.Add_Delegation_Controled_Register(delegation_address, register_address, {from:Transition_Government_Account});
			await Constitution_Instance.Add_Register_Authority(register_address, delegation_address, {from:Transition_Government_Account});

			Delegation_Instance = await DELEGATION.at(delegation_address);
			Loi_Instance = await LOI.at(register_address);
			var Get_List_Law_Register = (await Delegation_Instance.Get_List_Law_Register()).Controled_Register;
			var Controled_Register = await Delegation_Instance.Controled_Registers(register_address);
			var register_authorities = (await Loi_Instance.Get_Authorities()).map(Bytes32ToAddress);

			expect(Get_List_Law_Register.map(Bytes32ToAddress).includes(register_address)).to.equal(true);
			expect(register_authorities.includes(delegation_address)).to.equal(true);
			expect(Controled_Register.Active).to.equal(true);
		});


		/*Removes controled register*/
		it("Authority account attempts to remove delegation control over a register", async function(){ 
			await Constitution_Instance.Add_Delegation_Controled_Register(delegation_address, register_address, {from:Transition_Government_Account});
			await Constitution_Instance.Add_Register_Authority(register_address, delegation_address, {from:Transition_Government_Account});
			await expectRevert(Constitution_Instance.Remove_Delegation_Controled_Register(delegation_address, register_address, {from:External_Account}), "Authorities Only");
		});

		it("Authority account attempts to set a register under the control of a not existing delegation", async function(){ 
			await Constitution_Instance.Add_Delegation_Controled_Register(delegation_address, register_address, {from:Transition_Government_Account});
			await Constitution_Instance.Add_Register_Authority(register_address, delegation_address, {from:Transition_Government_Account});
			await expectRevert(Constitution_Instance.Remove_Delegation_Controled_Register(web3.utils.randomHex(20), register_address, {from:Transition_Government_Account}), "Non Existing Delegation");
		});

		it("Authority account attempts to set a not registered register under the control of a delegation", async function(){ 
			await Constitution_Instance.Add_Delegation_Controled_Register(delegation_address, register_address, {from:Transition_Government_Account});
			await Constitution_Instance.Add_Register_Authority(register_address, delegation_address, {from:Transition_Government_Account});
			await expectRevert(Constitution_Instance.Remove_Delegation_Controled_Register(delegation_address, web3.utils.randomHex(20), {from:Transition_Government_Account}), "Non Existing Register");
		});

		it("Authority account set a register under the control of a delegation", async function(){ 
			await Constitution_Instance.Add_Delegation_Controled_Register(delegation_address, register_address, {from:Transition_Government_Account});
			await Constitution_Instance.Add_Register_Authority(register_address, delegation_address, {from:Transition_Government_Account});
			await Constitution_Instance.Remove_Delegation_Controled_Register(delegation_address, register_address, {from:Transition_Government_Account});

			Delegation_Instance = await DELEGATION.at(delegation_address);
			
			var Controled_Register = await Delegation_Instance.Controled_Registers(register_address);

			expect(Controled_Register.Active).to.equal(false);
		});

	});

	
	
	

});