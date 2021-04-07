//Test: Delegation.sol 
const { BN, ether, expectEvent, expectRevert, constants, time } = require('@openzeppelin/test-helpers'); // BN: Big Number
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


	/*Delegation Variables*/
	
	let Mandate_Duration;
	let Immunity_Duration;
	let Next_Mandate_Max_Members;
	let New_Election_Petition_Rate;


	let Member_Max_Token_Usage;
	let Proposition_Duration;
	let Legislatif_Vote_Duration;
	let Law_Censor_Period_Duration;
	let Censor_Proposition_Petition_Rate;
	let Censor_Penalty_Rate;
	let Uint256_arg = Array.from({length:6});


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
			//console.log("DemoCoin_Address",DemoCoin_Instance.address);
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

			console.log("Minter_List",Minter_List);
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
			console.log("Register_List:",Register_List);
			var Referendum_Register= await Agora_Instance.Get_Referendum_Register(loi_address);
			var Parameters= await Agora_Instance.Get_Referendum_Register_Parameters(loi_address,1);
			console.log(Referendum_Register);
			console.log(Parameters);

			expect(Referendum_Register.last_version).to.be.bignumber.equal(new BN(1));
			expect(Referendum_Register.institution_type).to.be.bignumber.equal(new BN(3));

			expect(Parameters.Petition_Duration).to.be.bignumber.equal(new BN(Petition_Duration));
			expect(Parameters.Vote_Duration).to.be.bignumber.equal(new BN(Vote_Duration));
			expect(Parameters.Vote_Checking_Duration).to.be.bignumber.equal(new BN(Validation_Duration));
			expect(Parameters.Law_Initialisation_Price).to.be.bignumber.equal(new BN(Law_Initialisation_Price));
			expect(Parameters.FunctionCall_Price).to.be.bignumber.equal(new BN(FunctionCall_Price));
			expect(Parameters.Required_Petition_Rate).to.be.bignumber.equal(new BN(Required_Petition_Rate));
			expect(Parameters.Ivote_address).to.equal(Ballot_Instance.address);

			await expectEvent(res, "Register_Created", {register:loi_address}, "Register_Created event incorrect");
		});

	});
});