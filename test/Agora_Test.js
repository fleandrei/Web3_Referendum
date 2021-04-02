//Test: Delegation.sol 
const { BN, ether, expectEvent, expectRevert, constants, time } = require('@openzeppelin/test-helpers'); // BN: Big Number
const { expect } = require('chai');
const INITIATIVE_LEGISLATIV_LIB = artifacts.require('Initiative_Legislative_Lib');
const AGORA = artifacts.require('Agora');
const MAJORITY_JUDGMENT = artifacts.require('Majority_Judgment_Ballot');
const DEMOCOIN = artifacts.require('DemoCoin');
const CITIZEN_REGISTER = artifacts.require('Citizens_Register');
const LOI = artifacts.require('Loi')
const chance = require("chance").Chance();


function Bytes32ToAddress(str){
	return str.slice(0,2) + str.slice(26);
}

contract('TEST: Agora.sol', function(accounts){
	/*Accounts*/
	const Nbr_Account = accounts.length;
	const Constitution_Address = accounts[0];
	const External_Account = accounts[1];

	const Citizens = accounts.slice(2);
	
	/*Contracts*/
	let Initiative_Legislative_Lib_Library;
	let Ballot_Instance;
	let DemoCoin_Instance;
	let Citizen_Register_Instance;
	let Loi_instance;
	let Agora_Instance;

	/*TEST PARAMETERS*/
	const Citizen_Register_Name = "Citoyens";
	const Loi_Name = "Loi";
	const Agora_Name = "Agora";
	const Citizen_Initial_Ammounts=100;
	const Initital_Token_Ammount = Citizen_Initial_Ammounts*Citizens.length;
	const Law_Initialisation_Price_Ratio = 50; //Percentage of "Citizen_Initial_Ammounts" a law initialisation cost;
	const FunctionCall_Price_Ratio = 5; //Percentage of "Member_Max_Token_Usage" a functionCall creation cost;
	
	const New_Citizen_Mint_Amount=5;
	const Prop_Max_Number=7;
	

	const Contains_Selector = "0x57f98d32";

	const vote_duration_min = time.duration.minutes(5).toNumber();
	const vote_duration_max = time.duration.days(3).toNumber();
	const validation_duration_min = time.duration.minutes(5).toNumber();
	const validation_duration_max = time.duration.days(1).toNumber();
	const petition_duration_min = time.duration.minutes(5).toNumber();
	const petition_duration_max = time.duration.days(10).toNumber();
	const petition_rate_max = 5000;

	const Title_Size_max = 20;
	const Description_Size_max= 50;
	const functionCall_max =10;
	const newItem_max = 5;


	/*Agora Parameters*/
	let Petition_Duration;
	let Vote_Duration;
	let Validation_Duration;

	let Law_Initialisation_Price;
	let FunctionCall_Price;

	let Required_Petition_Rate;

	
	//let Uint256_arg = Array.from({length:6});
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
			Citizen_Register_Instance = await CITIZEN_REGISTER.new( Citizen_Register_Name, Citizens, DemoCoin_Instance.address, New_Citizen_Mint_Amount, {from: Constitution_Address});	
			await DemoCoin_Instance.Add_Minter(Citizen_Register_Instance.address);

			//Ballot_Instance = await MAJORITY_JUDGMENT.new();
			Initiative_Legislative_Lib_Library = await INITIATIVE_LEGISLATIV_LIB.new();
			
			await AGORA.link("Initiative_Legislative_Lib" , Initiative_Legislative_Lib_Library.address);
			
			Agora_Instance = await AGORA.new(Agora_Name, DemoCoin_Instance.address, Citizen_Register_Instance.address, {from: Constitution_Address});

			Loi_instance = await LOI.new(Loi_Name, Agora_Instance.address);
			Ballot_Instance = await MAJORITY_JUDGMENT.new();
			//Loi_instance.Add_Authority(Agora_Instance.address,{from:Constitution_Address});

			Petition_Duration = chance.natural({min:petition_duration_min, max:petition_duration_max});
			Vote_Duration= chance.natural({min:vote_duration_min, max:vote_duration_max});
			Validation_Duration = chance.natural({min:validation_duration_min, max:validation_duration_max});

			Law_Initialisation_Price= Math.floor(Citizen_Initial_Ammounts*Law_Initialisation_Price_Ratio/100);
			FunctionCall_Price = Math.floor(Citizen_Initial_Ammounts*FunctionCall_Price_Ratio/100);

			Required_Petition_Rate = chance.natural({min:Math.floor(10000*2/Citizens.length), max:petition_rate_max});

			console.debug("Petition_Duration",Petition_Duration,"Vote_Duration",Vote_Duration,"Validation_Duration",Validation_Duration,
				"Law_Initialisation_Price",Law_Initialisation_Price,"FunctionCall_Price",FunctionCall_Price,"Required_Petition_Rate",
				Required_Petition_Rate,"Ballot address:",Ballot_Instance.address, "Loi_instance address",Loi_instance.address);
		});


	describe("Agora Initialisation", ()=>{

		it("Check Agora globals parameters", async function(){ 
			expect(await Agora_Instance.Constitution_Address()).to.equal(Constitution_Address);
			expect(await Agora_Instance.Type_Institution()).to.be.bignumber.equal(new BN(2));
			expect(await Agora_Instance.Name()).to.equal(Agora_Name);
			expect(await Agora_Instance.Total_Token_To_Redistribute()).to.be.bignumber.equal(new BN(0));

		});

		it("External_Account attempt to add a register", async function(){ 
			await expectRevert(Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:External_Account}), "Constitution Only");
		});

		it("Constitution_Address add a register", async function(){ 

			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});
			var referendum_register = await Agora_Instance.Get_Referendum_Register(Loi_instance.address);
			expect(referendum_register.institution_type).to.be.bignumber.equal(new BN(3));
			
		});

		it("External_Account attempt to update a register", async function(){ 
			
			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});
			await expectRevert(Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, Validation_Duration, Law_Initialisation_Price, FunctionCall_Price, 
				Required_Petition_Rate,	Ballot_Instance.address, {from:External_Account}), "Constitution Only");
		});

		it("Constitution_Address update a register", async function(){ 
			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});

			await Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, Validation_Duration, Law_Initialisation_Price, FunctionCall_Price, 
				Required_Petition_Rate,	Ballot_Instance.address, {from:Constitution_Address});

			var referendum_register = await Agora_Instance.Get_Referendum_Register(Loi_instance.address);
			var Parameters = await Agora_Instance.Get_Referendum_Register_Parameters(Loi_instance.address, 1);

			expect(referendum_register.last_version).to.be.bignumber.equal(new BN(1));
			expect(Parameters.Petition_Duration).to.be.bignumber.equal(new BN(Petition_Duration));
			expect(Parameters.Vote_Duration).to.be.bignumber.equal(new BN(Vote_Duration));
			expect(Parameters.Vote_Checking_Duration).to.be.bignumber.equal(new BN(Validation_Duration));
			expect(Parameters.Law_Initialisation_Price).to.be.bignumber.equal(new BN(Law_Initialisation_Price));
			expect(Parameters.FunctionCall_Price).to.be.bignumber.equal(new BN(FunctionCall_Price));
			expect(Parameters.Required_Petition_Rate).to.be.bignumber.equal(new BN(Required_Petition_Rate));
			expect(Parameters.Ivote_address).to.equal(Ballot_Instance.address);
			
		});

	});
		

	describe("Referendum project creation", ()=>{
		let Title;
		let Description;
		let referendum_key;
		beforeEach(async function () {
			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});
			await Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, Validation_Duration, Law_Initialisation_Price, FunctionCall_Price, 
				Required_Petition_Rate,	Ballot_Instance.address, {from:Constitution_Address});
			
			Title = web3.utils.randomHex(Title_Size_max);
			Description = web3.utils.randomHex(Description_Size_max); 
			referendum_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Description]));
		});

		it("External_Account attempt to create a referendum project", async function(){ 
			await expectRevert(Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description, {from:External_Account}), "Citizen Only");
		});

		it("Cititen account attempt to create a referendum project but the register isn't created on the Agora contract", async function(){ 
			await expectRevert(Agora_Instance.Add_Law_Project(Constitution_Address, Title, Description,{from:Citizens[0]}), "Register unknown");
		});


	});
		

	describe("Add Proposal", ()=>{
		let Title;
		let Description;
		let referendum_key;
		beforeEach(async function () {
			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});
			await Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, Validation_Duration, Law_Initialisation_Price, FunctionCall_Price, 
				Required_Petition_Rate,	Ballot_Instance.address, {from:Constitution_Address});
			
			Title = web3.utils.randomHex(Title_Size_max);
			Description = web3.utils.randomHex(Description_Size_max); 
			referendum_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Description]));
		});

});