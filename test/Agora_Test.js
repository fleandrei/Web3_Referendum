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

			res= await Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, Validation_Duration, Law_Initialisation_Price, FunctionCall_Price, 
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

			await expectEvent(res, "Referendum_Parameters_Updated", {register_address:Loi_instance.address , new_version:new BN(1)}, "Referendum_Parameters_Updated event incorrect");
			
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

		it("Cititen account attempt to create a referendum project but the register isn't created on the Agora contract", async function(){ 
			await expectRevert(Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description, {from:Citizens[0]}), "Increase Token Allowance");
		});

		it("Cititen account creates a referendum project", async function(){ 
			await DemoCoin_Instance.approve(Agora_Instance.address, Law_Initialisation_Price, {from:Citizens[0]});
			res=await Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description, {from:Citizens[0]});

			var referendum_register = await Agora_Instance.Get_Referendum_Register(Loi_instance.address);
			var Referendums = await Agora_Instance.Referendums(referendum_key);
			var project = await Agora_Instance.List_Law_Project(referendum_key);
			var Total_Token_To_Redistribute = await Agora_Instance.Total_Token_To_Redistribute();


			expect(referendum_register.list_referendums.includes(referendum_key)).to.equal(true);
			expect(Referendums.Version).to.be.bignumber.equal(new BN(1));
			expect(Referendums.Petition_Counter).to.be.bignumber.equal(new BN(1));
			expect(Referendums.Token_Amount_Consummed).to.be.bignumber.equal(new BN(Law_Initialisation_Price));

			expect(Total_Token_To_Redistribute).to.be.bignumber.equal(new BN(Law_Initialisation_Price));
			expect(project.Title).to.equal(Title);
			expect(project.Description).to.equal(Description);

			expect(await DemoCoin_Instance.balanceOf(Agora_Instance.address)).to.be.bignumber.equal(new BN(Law_Initialisation_Price));
			expect(await DemoCoin_Instance.balanceOf(Citizens[0])).to.be.bignumber.equal(new BN(Citizen_Initial_Ammounts - Law_Initialisation_Price));


			await expectEvent(res, "New_Referendum", {register_address:Loi_instance.address , key:referendum_key}, "New_Referendum event incorrect");
		});

		it("Cititen account attempt to create a referendum project twice", async function(){ 
			await DemoCoin_Instance.approve(Agora_Instance.address, Law_Initialisation_Price, {from:Citizens[0]});
			await Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description,{from:Citizens[0]});
			await DemoCoin_Instance.approve(Agora_Instance.address, Law_Initialisation_Price, {from:Citizens[1]});
			await expectRevert(Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description,{from:Citizens[1]}), "Referendums project already created");
		});


	});
		

	describe("Add Proposal", ()=>{
		let Title;
		let Description;
		let proposal_Description
		let referendum_key;
		let loi;

		beforeEach(async function () {
			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});
			await Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, Validation_Duration, Law_Initialisation_Price, FunctionCall_Price, 
				Required_Petition_Rate,	Ballot_Instance.address, {from:Constitution_Address});
			
			Title = web3.utils.randomHex(Title_Size_max);
			Description = web3.utils.randomHex(Description_Size_max); 
			referendum_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Description]));
			proposal_Description = web3.utils.randomHex(Description_Size_max); 

			await DemoCoin_Instance.approve(Agora_Instance.address, Law_Initialisation_Price, {from:Citizens[0]});
			await Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description, {from:Citizens[0]});

			loi = new Loi(Loi_instance.address, web3);

		});

		it("External_Account attempts to add a proposal", async function (){
			functioncall_num = chance.natural({min:0,max:functionCall_max});
			var proposal_arrays = Create_Proposal_Data(functioncall_num, 0, 0, loi, web3);


			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num, {from:Citizens[1]});
			await expectRevert(Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 1, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:External_Account}), "Citizen Only");
		});

		it("Citizen account attempts to add a proposal but register address is unknown", async function (){
			functioncall_num = chance.natural({min:0,max:functionCall_max});
			var proposal_arrays = Create_Proposal_Data(functioncall_num, 0, 0, loi, web3);

			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num, {from:Citizens[1]});
			await expectRevert(Agora_Instance.Add_Proposal(web3.utils.randomHex(20), referendum_key, 1, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Citizens[1]}), "Register unknown");
		});

		it("Citizen account attempts to add a proposal to an not existing Project", async function (){
			functioncall_num = chance.natural({min:0,max:functionCall_max});
			var proposal_arrays = Create_Proposal_Data(functioncall_num, 0, 0, loi, web3);

			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num, {from:Citizens[1]});
			await expectRevert(Agora_Instance.Add_Proposal(Loi_instance.address, web3.utils.randomHex(32), 0, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Citizens[1]}), "No existing Referendum Project");
		});

		it("Citizen account attempts to add a proposal but parent doesn't exist", async function (){
			functioncall_num = chance.natural({min:0,max:functionCall_max});
			var proposal_arrays = Create_Proposal_Data(functioncall_num, 0, 0, loi, web3);

			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num, {from:Citizens[1]});
			await expectRevert(Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 1, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Citizens[1]}), "Parent proposal doesn't exist");
		});



		it("Citizen account attempts to add a proposal but token allowance is too low", async function (){
			functioncall_num = chance.natural({min:1,max:functionCall_max});
			var proposal_arrays = Create_Proposal_Data(functioncall_num, 0, 0, loi, web3);

			//await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num, {from:Citizens[1]});
			await expectRevert(Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 0, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Citizens[1]}), "Increase Token Allowance");
		});

		it("Citizen account add a proposal to existing referendum project", async function(){ 
			functioncall_num = chance.natural({min:0,max:functionCall_max});
			var proposal_arrays = Create_Proposal_Data(functioncall_num, 0, 0, loi, web3);

			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num, {from:Citizens[1]});
			res = await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 0, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Citizens[1]});
			
			var Proposal = await Agora_Instance.Get_Proposal(referendum_key, 1);
			var Project = await Agora_Instance.List_Law_Project(referendum_key);
			var Referendum = await Agora_Instance.Referendums(referendum_key);
			var Total_Token_To_Redistribute = await Agora_Instance.Total_Token_To_Redistribute();

			var Proposal_expected_functioncalls = Get_FunctionCalls_from_arrays(proposal_arrays.Reuse, Proposal.function_calls, proposal_arrays.Functioncalls);
			var amount_transfered = new BN(Law_Initialisation_Price+FunctionCall_Price*functioncall_num);


			expect(Proposal.description).to.equal(proposal_Description);
			expect(Proposal.childrens.length).to.equal(0);
			expect(JSON.stringify(Proposal.function_calls)).to.equal(JSON.stringify(Proposal_expected_functioncalls));
			expect(Proposal.func_call_counter).to.be.bignumber.equal(new BN(proposal_arrays.Reuse.length));
			expect(Proposal.parent).to.be.bignumber.equal(new BN(0));
			expect(Proposal.author).to.equal(Citizens[1]);

			expect(Referendum.Token_Amount_Consummed).to.be.bignumber.equal(amount_transfered);
			expect(Referendum.Petition_Counter).to.be.bignumber.equal(new BN(2));

			expect(Total_Token_To_Redistribute).to.be.bignumber.equal(amount_transfered);

			//expect(project.Prop).to.equal(Title);
			expect(Project.Proposal_Count).to.be.bignumber.equal(new BN(1));

			expect(await DemoCoin_Instance.balanceOf(Agora_Instance.address)).to.be.bignumber.equal(amount_transfered);
			expect(await DemoCoin_Instance.balanceOf(Citizens[1])).to.be.bignumber.equal(new BN(Citizen_Initial_Ammounts-FunctionCall_Price*functioncall_num));
			
			await expectEvent(res, "New_Proposal", {register:Loi_instance.address , key:referendum_key, proposal_index:new BN(1)}, "New_Proposal event incorrect");
		});

	});

	describe("Add Items to proposal", ()=>{
		let Title;
		let Description;
		let proposal_Description
		let referendum_key;
		let functioncall_num;
		let proposal_arrays;
		let Proposal;
		let loi;

		beforeEach(async function () {
			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});
			await Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, Validation_Duration, Law_Initialisation_Price, FunctionCall_Price, 
				Required_Petition_Rate,	Ballot_Instance.address, {from:Constitution_Address});
			
			Title = web3.utils.randomHex(Title_Size_max);
			Description = web3.utils.randomHex(Description_Size_max); 
			referendum_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Description]));
			proposal_Description = web3.utils.randomHex(Description_Size_max); 

			await DemoCoin_Instance.approve(Agora_Instance.address, Law_Initialisation_Price, {from:Citizens[0]});
			await Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description, {from:Citizens[0]});
			
			loi = new Loi(Loi_instance.address, web3);

			functioncall_num = chance.natural({min:1,max:functionCall_max});
			proposal_arrays = Create_Proposal_Data(functioncall_num, 0, 0, loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num, {from:Citizens[1]});
			res = await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 0, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Citizens[1]});

			Proposal = await Agora_Instance.Get_Proposal(referendum_key,1);
		});

		it("External_Account attempts to add items to a proposal", async function (){
			var new_item_num = chance.natural({min:1,max:newItem_max});
			var Item_arrays = Generate_AddItem(new_item_num, Proposal.func_call_counter, loi, web3);

			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*Item_arrays.Items.length, {from:External_Account});
			await expectRevert(Agora_Instance.Add_Item(Loi_instance.address, referendum_key, 1, Item_arrays.Items, Item_arrays.Indexs, {from:External_Account}), "Citizen Only");

		});

		it("Citizen account attempts to add items but register address is unknown", async function (){
			var new_item_num = chance.natural({min:1,max:newItem_max});
			var Item_arrays = Generate_AddItem(new_item_num, Proposal.func_call_counter, loi, web3);
			
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*Item_arrays.Items.length, {from:Citizens[0]});
			await expectRevert(Agora_Instance.Add_Item( web3.utils.randomHex(20), web3.utils.randomHex(32), 1, Item_arrays.Items, Item_arrays.Indexs, {from:Citizens[1]}), "Register unknown");
		});

		it("Citizen account attempts to add items to an not existing Project", async function (){
			var new_item_num = chance.natural({min:1,max:newItem_max});
			var Item_arrays = Generate_AddItem(new_item_num, Proposal.func_call_counter, loi, web3);
			
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*Item_arrays.Items.length, {from:Citizens[0]});
			await expectRevert(Agora_Instance.Add_Item(Loi_instance.address, web3.utils.randomHex(32), 1, Item_arrays.Items, Item_arrays.Indexs, {from:Citizens[1]}), "No existing Referendum Project");
		});


		it("Citizen account attempts to add items to proposal but allowance is too low", async function (){
			var new_item_num = chance.natural({min:1,max:newItem_max});
			var Item_arrays = Generate_AddItem(new_item_num, Proposal.func_call_counter, loi, web3);

			var amount_transfered = new BN(Law_Initialisation_Price+FunctionCall_Price*functioncall_num+FunctionCall_Price*Item_arrays.Indexs.length);
			
			await expectRevert(Agora_Instance.Add_Item(Loi_instance.address, referendum_key, 1, Item_arrays.Items, Item_arrays.Indexs, {from:Citizens[1]}), "Increase Token Allowance");
		});

		it("Citizen account attempts to add items to an not existing Project", async function (){
			var new_item_num = chance.natural({min:1,max:newItem_max});
			var Item_arrays = Generate_AddItem(new_item_num, Proposal.func_call_counter, loi, web3);
			
			var expected_FunctionCalls = Add_Item([...Proposal.function_calls], Item_arrays.Items, Item_arrays.Indexs);

			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*Item_arrays.Items.length, {from:Citizens[1]});
			res =await Agora_Instance.Add_Item(Loi_instance.address, referendum_key, 1, Item_arrays.Items, Item_arrays.Indexs, {from:Citizens[1]});

			Proposal = await Agora_Instance.Get_Proposal(referendum_key, 1);
			var Project = await Agora_Instance.List_Law_Project(referendum_key);
			var Referendum = await Agora_Instance.Referendums(referendum_key);
			var Total_Token_To_Redistribute = await Agora_Instance.Total_Token_To_Redistribute();

			var amount_transfered = new BN(Law_Initialisation_Price+FunctionCall_Price*functioncall_num+FunctionCall_Price*Item_arrays.Indexs.length);
			
			expect(JSON.stringify(Proposal.function_calls)).to.equal(JSON.stringify(expected_FunctionCalls));
			expect(Proposal.func_call_counter).to.be.bignumber.equal(new BN(expected_FunctionCalls.length));

			expect(Referendum.Token_Amount_Consummed).to.be.bignumber.equal(amount_transfered);

			expect(Total_Token_To_Redistribute).to.be.bignumber.equal(amount_transfered);

			expect(await DemoCoin_Instance.balanceOf(Agora_Instance.address)).to.be.bignumber.equal(amount_transfered);
			expect(await DemoCoin_Instance.balanceOf(Citizens[1])).to.be.bignumber.equal(new BN(Citizen_Initial_Ammounts-FunctionCall_Price*Item_arrays.Indexs.length - FunctionCall_Price*functioncall_num));

		});

	});

	describe("Sign referendum project petition", ()=>{
		let Title;
		let Description;
		let proposal_Description
		let referendum_key;
		let functioncall_num;
		let proposal_arrays;
		let Proposal;
		let loi;

		beforeEach(async function () {
			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});
			await Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, Validation_Duration, Law_Initialisation_Price, FunctionCall_Price, 
				Required_Petition_Rate,	Ballot_Instance.address, {from:Constitution_Address});
			
			Title = web3.utils.randomHex(Title_Size_max);
			Description = web3.utils.randomHex(Description_Size_max); 
			referendum_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Description]));
			proposal_Description = web3.utils.randomHex(Description_Size_max); 

			await DemoCoin_Instance.approve(Agora_Instance.address, Law_Initialisation_Price, {from:Citizens[0]});
			await Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description, {from:Citizens[0]});
			
			loi = new Loi(Loi_instance.address, web3);

			functioncall_num = chance.natural({min:0,max:functionCall_max});
			proposal_arrays = Create_Proposal_Data(functioncall_num, 0, 0, loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num, {from:Citizens[1]});
			res = await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 0, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Citizens[1]});

			
			Proposal = await Agora_Instance.Get_Proposal(referendum_key,1);
		});


		it("External_Account attempts to sign referendum project", async function (){
			await expectRevert(Agora_Instance.Sign_Petition(Loi_instance.address, referendum_key, {from:External_Account}), "Citizen Only");
		});

		it("citizen account attempts to sign but register address unknown", async function (){
			await expectRevert(Agora_Instance.Sign_Petition(web3.utils.randomHex(20), referendum_key, {from:Citizens[2]}), "Register unknown");
		});

		it("citizen account attempts to sign not existing referendum project", async function (){
			await expectRevert(Agora_Instance.Sign_Petition(Loi_instance.address, web3.utils.randomHex(32), {from:Citizens[2]}), "No existing Referendum Project");
		});

		it("citizen account attempts to sign an existing referendum project twice", async function (){
			await Agora_Instance.Sign_Petition(Loi_instance.address, referendum_key, {from:Citizens[2]});
			await expectRevert(Agora_Instance.Sign_Petition(Loi_instance.address, referendum_key, {from:Citizens[2]}), "Already Signed");
		});

		it("citizen account sign an existing referendum project", async function (){
			res= await Agora_Instance.Sign_Petition(Loi_instance.address, referendum_key, {from:Citizens[2]});

			var Referendum = await Agora_Instance.Referendums(referendum_key);

			expect(Referendum.Petition_Counter).to.be.bignumber.equal(new BN(3));
			await expectEvent(res, "Projet_Signed", {register:Loi_instance.address , key:referendum_key}, "Projet_Signed event incorrect");
		});

	});


	describe("End petition stage", ()=>{
		let Title;
		let Description;
		let proposal_Description
		let referendum_key;
		let functioncall_num;
		let proposal_arrays;
		let Proposal;
		let loi;

		beforeEach(async function () {
			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});
			Required_Petition_Rate = Math.floor(3*10000/Citizens.length); //Minimum required signature amount must be >2
			await Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, Validation_Duration, Law_Initialisation_Price, FunctionCall_Price, 
				Required_Petition_Rate,	Ballot_Instance.address, {from:Constitution_Address});
			
			Title = web3.utils.randomHex(Title_Size_max);
			Description = web3.utils.randomHex(Description_Size_max); 
			referendum_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Description]));
			proposal_Description = web3.utils.randomHex(Description_Size_max); 

			await DemoCoin_Instance.approve(Agora_Instance.address, Law_Initialisation_Price, {from:Citizens[0]});
			await Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description, {from:Citizens[0]});
			
			loi = new Loi(Loi_instance.address, web3);

			functioncall_num = chance.natural({min:0,max:functionCall_max});
			proposal_arrays = Create_Proposal_Data(functioncall_num, 0, 0, loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num, {from:Citizens[1]});
			res = await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 0, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Citizens[1]});
			
			Proposal = await Agora_Instance.Get_Proposal(referendum_key,1);

		});


		it("External_Account attempts to end proposition stage", async function (){
			await expectRevert(Agora_Instance.End_Proposition_Stage(Loi_instance.address, referendum_key, {from:External_Account}), "Citizen Only");
		});

		it("citizen account attempts to end proposition stage but register address is unknown", async function (){
			await expectRevert(Agora_Instance.End_Proposition_Stage(web3.utils.randomHex(20), referendum_key, {from:Citizens[0]}), "Register unknown");
		});

		it("citizen account attempts to end proposition stage for not existing referendum project ", async function (){
			await expectRevert(Agora_Instance.End_Proposition_Stage(Loi_instance.address, web3.utils.randomHex(32), {from:Citizens[0]}), "No existing Referendum Project");
		});

		it("citizen account attempts to end proposition stage but the minimal period isn't over yet", async function (){
			await expectRevert(Agora_Instance.End_Proposition_Stage(Loi_instance.address, referendum_key, {from:Citizens[0]}), "PETITIONS stage not finished");
		});

		it("citizen account end proposition stage. There is no propositions", async function (){
			var Total_Token_To_Redistribute_before = await Agora_Instance.Total_Token_To_Redistribute();
			
			Title = web3.utils.randomHex(Title_Size_max);
			Description = web3.utils.randomHex(Description_Size_max); 
			referendum_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Description]));
			proposal_Description = web3.utils.randomHex(Description_Size_max); 

			await DemoCoin_Instance.approve(Agora_Instance.address, Law_Initialisation_Price, {from:Citizens[0]});
			await Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description, {from:Citizens[0]});

			var required_signatures = Math.floor(Required_Petition_Rate*Citizens.length/10000);
			for(var i=2;i<required_signatures;i++){
					await Agora_Instance.Sign_Petition(Loi_instance.address, referendum_key, {from:Citizens[i]});
			}

			await time.increase(Petition_Duration+1);
			res=await Agora_Instance.End_Proposition_Stage(Loi_instance.address, referendum_key, {from:Citizens[0]});

			expect((await Agora_Instance.Referendums(referendum_key)).Referendum_Status).to.be.bignumber.equal(new BN(4));
			expect((await Agora_Instance.Total_Token_To_Redistribute())).to.be.bignumber.equal(Total_Token_To_Redistribute_before);
			await expectEvent(res, "Projet_Rejected", {register:Loi_instance.address, key:referendum_key}, "Projet_Rejected event incorrect");
		});

		it("citizen account end proposition stage. There is enough signatures to begin the vote stage", async function (){
			var required_signatures = Math.floor(Required_Petition_Rate*Citizens.length/10000);
			for(var i=2;i<required_signatures;i++){
					await Agora_Instance.Sign_Petition(Loi_instance.address, referendum_key, {from:Citizens[i]});
			}

			await time.increase(Petition_Duration+1);
			res=await Agora_Instance.End_Proposition_Stage(Loi_instance.address, referendum_key, {from:Citizens[0]});
			var Referendum = await Agora_Instance.Referendums(referendum_key);
			var ballot_key = web3.utils.soliditySha3(referendum_key, Referendum.Start_Vote_Timestamps);

			var ballot= await Ballot_Instance.Ballots(ballot_key);
			

			expect(Referendum.Referendum_Status).to.be.bignumber.equal(new BN(1));

			expect(ballot.Voters_Register_Address).to.equal(Citizen_Register_Instance.address);
			expect(ballot.Check_Voter_Selector).to.equal(Contains_Selector);
			expect(ballot.Status).to.be.bignumber.equal(new BN(1));
			expect(ballot.Vote_Duration).to.be.bignumber.equal(new BN(Vote_Duration));
			expect(ballot.Vote_Validation_Duration).to.be.bignumber.equal(new BN(Validation_Duration));
			expect(ballot.Propositions_Number).to.be.bignumber.equal(new BN(1));
			expect(ballot.Max_Winning_Propositions_Number).to.be.bignumber.equal(new BN(1));

			await expectEvent(res, "Voting_Stage_Started", {register:Loi_instance.address , key:referendum_key, ballot_key: ballot_key}, "Voting_Stage_Started event incorrect");
		});

		it("citizen account end proposition stage. There is not enough signatures to begin the vote stage: The referendum project is rejected", async function (){
			var Total_Token_To_Redistribute_before = await Agora_Instance.Total_Token_To_Redistribute();
			await time.increase(Petition_Duration+1);
			res=await Agora_Instance.End_Proposition_Stage(Loi_instance.address, referendum_key, {from:Citizens[0]});

			var Referendum = await Agora_Instance.Referendums(referendum_key);
			var ballot_key = web3.utils.soliditySha3(referendum_key, Referendum.Start_Vote_Timestamps);
			var ballot= await Ballot_Instance.Ballots(ballot_key);
			
			var Total_Token_To_Redistribute_after = await Agora_Instance.Total_Token_To_Redistribute();

			var amount_transfered = new BN(Law_Initialisation_Price+FunctionCall_Price*functioncall_num);

			expect(Referendum.Referendum_Status).to.be.bignumber.equal(new BN(4));
			expect(Total_Token_To_Redistribute_after).to.be.bignumber.equal(Total_Token_To_Redistribute_before.sub(amount_transfered));
			expect(ballot.Voters_Register_Address).to.equal(constants.ZERO_ADDRESS);

			await expectEvent(res, "Projet_Rejected", {register:Loi_instance.address , key:referendum_key}, "Projet_Rejected event incorrect");
		});

		it("citizen account attempts to end vote stage altought we are not at the Voting status", async function (){
			await time.increase(Vote_Duration+1);
			await expectRevert(Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]}), "Not at VOTE status");
		});

	});


	describe("End of Vote stage", ()=>{
		let Title;
		let Description;
		let proposal_Description
		let referendum_key;
		let ballot_key;
		let functioncall_num1;
		let functioncall_num2;
		let functioncall_num3;
		let proposal_arrays1;
		let proposal_arrays2;
		let proposal_arrays3;
		let Proposal1;
		let Proposal2;
		let Proposal3;
		let loi;

		beforeEach(async function () {
			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});
			await Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, 0, Law_Initialisation_Price, FunctionCall_Price, 
				Required_Petition_Rate,	Ballot_Instance.address, {from:Constitution_Address});
			
			Title = web3.utils.randomHex(Title_Size_max);
			Description = web3.utils.randomHex(Description_Size_max); 
			referendum_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Description]));
			proposal_Description = web3.utils.randomHex(Description_Size_max); 

			await DemoCoin_Instance.approve(Agora_Instance.address, Law_Initialisation_Price, {from:Citizens[0]});
			await Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description, {from:Citizens[0]});
			
			loi = new Loi(Loi_instance.address, web3);

			functioncall_num1 = chance.natural({min:1,max:functionCall_max});
			proposal_arrays1 = Create_Proposal_Data(functioncall_num1, 0, 0, loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num1, {from:Citizens[1]});
			await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 0, proposal_arrays1.Reuse, proposal_arrays1.Functioncalls, proposal_Description, {from:Citizens[1]});
			Proposal1 = await Agora_Instance.Get_Proposal(referendum_key,1);

			functioncall_num2 = chance.natural({min:1,max:functionCall_max});
			var reuse_num2 = chance.natural({min:0,max:Proposal1.func_call_counter});
			proposal_arrays2 = Create_Proposal_Data(functioncall_num2, reuse_num2, Proposal1.func_call_counter.toNumber(), loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num2, {from:Citizens[2]});
			await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 1, proposal_arrays2.Reuse, proposal_arrays2.Functioncalls, proposal_Description, {from:Citizens[2]});
			Proposal2 = await Agora_Instance.Get_Proposal(referendum_key,2);

			functioncall_num3 = chance.natural({min:1,max:functionCall_max});
			var reuse_num3 = chance.natural({min:0,max:Proposal2.func_call_counter});
			proposal_arrays3 = Create_Proposal_Data(functioncall_num3, reuse_num3, Proposal2.func_call_counter.toNumber(), loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num3, {from:Citizens[3]});
			await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 2, proposal_arrays3.Reuse, proposal_arrays3.Functioncalls, proposal_Description, {from:Citizens[3]});
			Proposal3 = await Agora_Instance.Get_Proposal(referendum_key,3);

			var required_signatures = Math.floor(Required_Petition_Rate*Citizens.length/10000);
			for(var i=4;i<required_signatures;i++){
				await Agora_Instance.Sign_Petition(Loi_instance.address, referendum_key, {from:Citizens[i]});
			}

			await time.increase(Petition_Duration+1);
			res=await Agora_Instance.End_Proposition_Stage(Loi_instance.address, referendum_key, {from:Citizens[0]});

			var Referendum = await Agora_Instance.Referendums(referendum_key);
			ballot_key = web3.utils.soliditySha3(referendum_key, Referendum.Start_Vote_Timestamps);
		});



		it("Citizen account attempts to add a proposal but we are not at the Petition stage", async function (){
			functioncall_num = chance.natural({min:0,max:functionCall_max});
			var proposal_arrays = Create_Proposal_Data(functioncall_num, 0, 0, loi, web3);

			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num, {from:Citizens[1]});
			await expectRevert(Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 1, proposal_arrays.Reuse, proposal_arrays.Functioncalls, proposal_Description, {from:Citizens[1]}), "Not at PETITIONS status");
		});

		it("Citizen account attempts to add items but we are not at the Petition stage", async function (){
			var new_item_num = chance.natural({min:1,max:newItem_max});
			var Item_arrays = Generate_AddItem(new_item_num, Proposal1.func_call_counter, loi, web3);
			
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*Item_arrays.Items.length, {from:Citizens[0]});
			await expectRevert(Agora_Instance.Add_Item(Loi_instance.address, referendum_key, 1, Item_arrays.Items, Item_arrays.Indexs, {from:Citizens[1]}), "Not at PETITIONS status");
		});

		it("citizen account attempts to sign but we are not at the Petition stage", async function (){
			await expectRevert(Agora_Instance.Sign_Petition(Loi_instance.address, referendum_key, {from:Citizens[2]}), "Not at PETITIONS status");
		});

		it("citizen account attempts to end proposition stage but we are not at the Petition stage", async function (){
			await expectRevert(Agora_Instance.End_Proposition_Stage(Loi_instance.address, referendum_key, {from:Citizens[0]}), "Not at PETITIONS status");
		});




		it("External_Account attempts to end vote stage", async function (){
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
			});
			await time.increase(Vote_Duration+1);
			await expectRevert(Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:External_Account}), "Citizen Only");
		});

		it("citizen account attempts to end vote stage but register address is unknown", async function (){
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
			});
			await expectRevert(Agora_Instance.End_Vote(web3.utils.randomHex(20), referendum_key, {from:Citizens[0]}), "Register unknown");
		});

		it("citizen account attempts to end proposition stage for not existing referendum project ", async function (){
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
			});
			await expectRevert(Agora_Instance.End_Vote(Loi_instance.address, web3.utils.randomHex(32), {from:Citizens[0]}), "Not at VOTE status");
		});

		it("citizen account attempts to end vote stage altought it's not over yet", async function (){
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{
				await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
			});
			await expectRevert(Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]}), "Id exceed Winning length");
		});

		it("citizen account end vote stage. Winning proposal is 0.", async function (){
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{
					elem[0]=0;
					await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
			});

			await time.increase(Vote_Duration+1);
			await Ballot_Instance.End_Vote(ballot_key);
			res=await Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]});

			var Referendum = await Agora_Instance.Referendums(referendum_key);

			expect(Referendum.Referendum_Status).to.be.bignumber.equal(new BN(4));
			await expectEvent(res, "Projet_Rejected", {register:Loi_instance.address , key:referendum_key}, "Projet_Rejected event incorrect");
		});

		it("citizen account end vote stage. Winning proposal is NOT 0.", async function (){
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{
					elem[0]=4;
					await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
			});

			await time.increase(Vote_Duration+1);
			await Ballot_Instance.End_Vote(ballot_key);
			res=await Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]});

			var Referendum = await Agora_Instance.Referendums(referendum_key);

			expect(Referendum.Referendum_Status).to.be.bignumber.equal(new BN(2));
			await expectEvent(res, "Project_Adopted", {register:Loi_instance.address , key:referendum_key}, "Project_Adopted event incorrect");
		});

		it("Citizen account attempts to execute winning proposal but the vote stage isn't over yet", async function (){
			await expectRevert(Agora_Instance.Execute_Law(Loi_instance.address, referendum_key,1, {from:Citizens[1]}), "Project Not ADOPTED");
		});

	});



	describe("Execute function calls of the winning proposition", ()=>{
		let Title;
		let Description;
		let proposal_Description
		let referendum_key;
		let ballot_key;
		let functioncall_num1;
		let functioncall_num2;
		let functioncall_num3;
		let proposal_arrays1;
		let proposal_arrays2;
		let proposal_arrays3;
		let Proposal1;
		let Proposal2;
		let Proposal3;
		let loi;
		let Winning_Proposal;

		beforeEach(async function () {
			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});
			await Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, 0, Law_Initialisation_Price, FunctionCall_Price, 
				Required_Petition_Rate,	Ballot_Instance.address, {from:Constitution_Address});
			
			Title = web3.utils.randomHex(Title_Size_max);
			Description = web3.utils.randomHex(Description_Size_max); 
			referendum_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Description]));
			proposal_Description = web3.utils.randomHex(Description_Size_max); 

			/*Creation of a referendum project*/
			await DemoCoin_Instance.approve(Agora_Instance.address, Law_Initialisation_Price, {from:Citizens[0]});
			await Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description, {from:Citizens[0]});
			
			loi = new Loi(Loi_instance.address, web3);

			/*Proposition submission*/
			functioncall_num1 = chance.natural({min:1,max:functionCall_max});
			proposal_arrays1 = Create_Proposal_Data(functioncall_num1, 0, 0, loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num1, {from:Citizens[1]});
			await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 0, proposal_arrays1.Reuse, proposal_arrays1.Functioncalls, proposal_Description, {from:Citizens[1]});
			Proposal1 = await Agora_Instance.Get_Proposal(referendum_key,1);

			functioncall_num2 = chance.natural({min:1,max:functionCall_max});
			var reuse_num2 = chance.natural({min:0,max:Proposal1.func_call_counter});
			proposal_arrays2 = Create_Proposal_Data(functioncall_num2, reuse_num2, Proposal1.func_call_counter.toNumber(), loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num2, {from:Citizens[2]});
			await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 1, proposal_arrays2.Reuse, proposal_arrays2.Functioncalls, proposal_Description, {from:Citizens[2]});
			Proposal2 = await Agora_Instance.Get_Proposal(referendum_key,2);

			functioncall_num3 = chance.natural({min:1,max:functionCall_max});
			var reuse_num3 = chance.natural({min:0,max:Proposal2.func_call_counter});
			proposal_arrays3 = Create_Proposal_Data(functioncall_num3, reuse_num3, Proposal2.func_call_counter.toNumber(), loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num3, {from:Citizens[3]});
			await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 2, proposal_arrays3.Reuse, proposal_arrays3.Functioncalls, proposal_Description, {from:Citizens[3]});
			Proposal3 = await Agora_Instance.Get_Proposal(referendum_key,3);

			/*Signatures*/
			var required_signatures = Math.floor(Required_Petition_Rate*Citizens.length/10000);
			for(var i=4;i<required_signatures;i++){
				await Agora_Instance.Sign_Petition(Loi_instance.address, referendum_key, {from:Citizens[i]});
			}

			await time.increase(Petition_Duration+1);
			res=await Agora_Instance.End_Proposition_Stage(Loi_instance.address, referendum_key, {from:Citizens[0]});

			var Referendum = await Agora_Instance.Referendums(referendum_key);
			ballot_key = web3.utils.soliditySha3(referendum_key, Referendum.Start_Vote_Timestamps);

			/*Voting*/
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{
					elem[0]=4;
					await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
			});

			/*End vote*/
			await time.increase(Vote_Duration+1);
			await Ballot_Instance.End_Vote(ballot_key);
			res=await Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]});

			Winning_Proposal = (await Agora_Instance.List_Law_Project(referendum_key)).Winning_Proposal;
		});


		it("External_Account attempts to execute winning proposal", async function (){
			await expectRevert(Agora_Instance.Execute_Law(Loi_instance.address, referendum_key,1, {from:External_Account}), "Citizen Only");
		});

		it("Citizen account attempts to execute winning proposal but register address is unknown", async function (){
			await expectRevert(Agora_Instance.Execute_Law(web3.utils.randomHex(20), referendum_key,1, {from:Citizens[1]}), "Register unknown");
		});

		it("Citizen account attempts to execute winning proposal of not existing referendum project", async function (){
			await expectRevert(Agora_Instance.Execute_Law(Loi_instance.address, web3.utils.randomHex(32),1, {from:Citizens[1]}), "Project Not ADOPTED");
		});

		it("Citizen account executes winning proposal", async function (){
			var Total_Token_To_Redistribute_before = await Agora_Instance.Total_Token_To_Redistribute();
			var Proposal_to_execute = await Agora_Instance.Get_Proposal(referendum_key, Winning_Proposal);
			var Functioncalls_nbr = Proposal_to_execute.func_call_counter;
			var num_function_call_ToExecute = chance.natural({min:0, max:Functioncalls_nbr-1});

			res1=await Agora_Instance.Execute_Law(Loi_instance.address, referendum_key, num_function_call_ToExecute,{from:Citizens[0]});
			var result1= await Agora_Instance.Get_Law_Results(referendum_key);

			expect(result1.Receipts.length).to.equal(num_function_call_ToExecute);

			/*Increase Agora's DemoCoin token balance without submiting propositions*/
			var Extra_token_received= chance.natural({min:0,max:3});
			DemoCoin_Instance.Mint(Agora_Instance.address, Extra_token_received)

			res2=await Agora_Instance.Execute_Law(Loi_instance.address, referendum_key, Functioncalls_nbr-num_function_call_ToExecute,{from:Citizens[1]});
			var result2= await Agora_Instance.Get_Law_Results(referendum_key);

			var Referendum= await Agora_Instance.Referendums(referendum_key);
			var List_Lois = await Loi_instance.Get_Law_List();
			var Total_Token_To_Redistribute_after = await Agora_Instance.Total_Token_To_Redistribute();
			var Total_Reward = Referendum.Token_Amount_Consummed.addn(Extra_token_received);
			var voter_reward = Total_Reward.divn(Citizens.length);
			var rest = Total_Reward.modn(Citizens.length);


			for(var i=0; i<Functioncalls_nbr; i++){
				var parameters = Proposal_to_execute.function_calls[i].slice(0,2).concat(Proposal_to_execute.function_calls[i].slice(10));//We remove function selector
				var expected_law_title = web3.eth.abi.decodeParameters(["bytes", "bytes"], parameters);
				expect(List_Lois[i]).to.equal(expected_law_title[0]);
			}

			expect(Referendum.Referendum_Status).to.be.bignumber.equal(new BN(3));
			expect(Referendum.Voter_Reward).to.be.bignumber.equal(voter_reward);

			expect(Total_Token_To_Redistribute_after).to.be.bignumber.equal(Total_Reward.subn(rest));

			expect(await DemoCoin_Instance.balanceOf(Agora_Instance.address)).to.be.bignumber.equal(voter_reward.muln(Citizens.length).addn(rest));

			await expectEvent(res1, "Function_Call_Executed", {register:Loi_instance.address , key:referendum_key, Function_Call_Nbr:new BN(num_function_call_ToExecute)}, "Function_Call_Executed event incorrect");
			await expectEvent(res2, "Function_Call_Executed", {register:Loi_instance.address , key:referendum_key, Function_Call_Nbr:new BN(Functioncalls_nbr-num_function_call_ToExecute)}, "Function_Call_Executed event incorrect");
			await expectEvent(res2, "Project_Executed", {register:Loi_instance.address , key:referendum_key}, "Project_Executed event incorrect");

		});

	});


	describe("Voters get their reward. Vote Clear", ()=>{
		let Title;
		let Description;
		let proposal_Description
		let referendum_key;
		let ballot_key;
		let functioncall_num1;
		let functioncall_num2;
		let functioncall_num3;
		let proposal_arrays1;
		let proposal_arrays2;
		let proposal_arrays3;
		let Proposal1;
		let Proposal2;
		let Proposal3;
		let loi;
		let Winning_Proposal;

		beforeEach(async function () {
			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});
			await Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, 0, Law_Initialisation_Price, FunctionCall_Price, 
				Required_Petition_Rate,	Ballot_Instance.address, {from:Constitution_Address});
			
			Title = web3.utils.randomHex(Title_Size_max);
			Description = web3.utils.randomHex(Description_Size_max); 
			referendum_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Description]));
			proposal_Description = web3.utils.randomHex(Description_Size_max); 

			/*Creation of a referendum project*/
			await DemoCoin_Instance.approve(Agora_Instance.address, Law_Initialisation_Price, {from:Citizens[0]});
			await Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description, {from:Citizens[0]});
			
			loi = new Loi(Loi_instance.address, web3);

			/*Proposition submission*/
			functioncall_num1 = chance.natural({min:1,max:functionCall_max});
			proposal_arrays1 = Create_Proposal_Data(functioncall_num1, 0, 0, loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num1, {from:Citizens[1]});
			await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 0, proposal_arrays1.Reuse, proposal_arrays1.Functioncalls, proposal_Description, {from:Citizens[1]});
			Proposal1 = await Agora_Instance.Get_Proposal(referendum_key,1);

			functioncall_num2 = chance.natural({min:1,max:functionCall_max});
			var reuse_num2 = chance.natural({min:0,max:Proposal1.func_call_counter});
			proposal_arrays2 = Create_Proposal_Data(functioncall_num2, reuse_num2, Proposal1.func_call_counter.toNumber(), loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num2, {from:Citizens[2]});
			await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 1, proposal_arrays2.Reuse, proposal_arrays2.Functioncalls, proposal_Description, {from:Citizens[2]});
			Proposal2 = await Agora_Instance.Get_Proposal(referendum_key,2);

			functioncall_num3 = chance.natural({min:1,max:functionCall_max});
			var reuse_num3 = chance.natural({min:0,max:Proposal2.func_call_counter});
			proposal_arrays3 = Create_Proposal_Data(functioncall_num3, reuse_num3, Proposal2.func_call_counter.toNumber(), loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num3, {from:Citizens[3]});
			await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 2, proposal_arrays3.Reuse, proposal_arrays3.Functioncalls, proposal_Description, {from:Citizens[3]});
			Proposal3 = await Agora_Instance.Get_Proposal(referendum_key,3);

			/*Signatures*/
			var required_signatures = Math.floor(Required_Petition_Rate*Citizens.length/10000);
			for(var i=4;i<required_signatures;i++){
				await Agora_Instance.Sign_Petition(Loi_instance.address, referendum_key, {from:Citizens[i]});
			}

			await time.increase(Petition_Duration+1);
			res=await Agora_Instance.End_Proposition_Stage(Loi_instance.address, referendum_key, {from:Citizens[0]});

			var Referendum = await Agora_Instance.Referendums(referendum_key);
			ballot_key = web3.utils.soliditySha3(referendum_key, Referendum.Start_Vote_Timestamps);

		});
	

		it("External_Account attempts to get rewards", async function (){
			/*Voting*/
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{
					if(i!=0){ //The first citizen doesn't vote
						elem[0]=4;
						await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
					}
			});

			/*End vote*/
			await time.increase(Vote_Duration+1);
			await Ballot_Instance.End_Vote(ballot_key);
			res=await Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]});

			Winning_Proposal = (await Agora_Instance.List_Law_Project(referendum_key)).Winning_Proposal;

			var Proposal_to_execute = await Agora_Instance.Get_Proposal(referendum_key, Winning_Proposal);
			var Functioncalls_nbr = Proposal_to_execute.func_call_counter;
			await Agora_Instance.Execute_Law(Loi_instance.address, referendum_key, Functioncalls_nbr,{from:Citizens[1]});

			await expectRevert(Agora_Instance.Get_Voter_Reward(Loi_instance.address, referendum_key, {from:External_Account}), "You haven't voted");
		});

		it("citizen account attempts to get rewards but the register address is unknown", async function (){
			/*Voting*/
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{
					if(i!=0){ //The first citizen doesn't vote
						elem[0]=4;
						await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
					}
			});

			/*End vote*/
			await time.increase(Vote_Duration+1);
			await Ballot_Instance.End_Vote(ballot_key);
			res=await Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]});

			Winning_Proposal = (await Agora_Instance.List_Law_Project(referendum_key)).Winning_Proposal;

			var Proposal_to_execute = await Agora_Instance.Get_Proposal(referendum_key, Winning_Proposal);
			var Functioncalls_nbr = Proposal_to_execute.func_call_counter;
			await Agora_Instance.Execute_Law(Loi_instance.address, referendum_key, Functioncalls_nbr,{from:Citizens[1]});

			await expectRevert(Agora_Instance.Get_Voter_Reward(web3.utils.randomHex(20), referendum_key, {from:Citizens[1]}), "Register unknown");
		});

		it("citizen account attempts to get rewards for not existing referendum project ", async function (){
			/*Voting*/
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{
					if(i!=0){ //The first citizen doesn't vote
						elem[0]=4;
						await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
					}
			});

			/*End vote*/
			await time.increase(Vote_Duration+1);
			await Ballot_Instance.End_Vote(ballot_key);
			res=await Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]});

			Winning_Proposal = (await Agora_Instance.List_Law_Project(referendum_key)).Winning_Proposal;

			var Proposal_to_execute = await Agora_Instance.Get_Proposal(referendum_key, Winning_Proposal);
			var Functioncalls_nbr = Proposal_to_execute.func_call_counter;
			await Agora_Instance.Execute_Law(Loi_instance.address, referendum_key, Functioncalls_nbr,{from:Citizens[1]});

			await expectRevert(Agora_Instance.Get_Voter_Reward(Loi_instance.address, web3.utils.randomHex(32), {from:Citizens[1]}), "Project Not EXECUTED");
		});

		it("citizen account attempts to get rewards but the project isn't executed yet", async function (){
			/*Voting*/
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{
					if(i!=0){ //The first citizen doesn't vote
						elem[0]=4;
						await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
					}
			});

			/*End vote*/
			await time.increase(Vote_Duration+1);
			await Ballot_Instance.End_Vote(ballot_key);
			res=await Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]});

			await expectRevert(Agora_Instance.Get_Voter_Reward(Loi_instance.address, referendum_key, {from:Citizens[1]}), "Project Not EXECUTED");
		});

		it("citizen account attempts to get rewards althought he hasn't voted. Vote Clear", async function (){
			/*Voting*/
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{
					if(i!=0){ //The first citizen doesn't vote
						elem[0]=4;
						await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
					}
			});

			/*End vote*/
			await time.increase(Vote_Duration+1);
			await Ballot_Instance.End_Vote(ballot_key);
			res=await Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]});

			Winning_Proposal = (await Agora_Instance.List_Law_Project(referendum_key)).Winning_Proposal;

			var Proposal_to_execute = await Agora_Instance.Get_Proposal(referendum_key, Winning_Proposal);
			var Functioncalls_nbr = Proposal_to_execute.func_call_counter;
			await Agora_Instance.Execute_Law(Loi_instance.address, referendum_key, Functioncalls_nbr,{from:Citizens[1]});
			await expectRevert(Agora_Instance.Get_Voter_Reward(Loi_instance.address, referendum_key, {from:Citizens[0]}), "You haven't voted");
		});


		

		it("citizens accounts get rewards.", async function (){
			/*Voting*/
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{	
				elem[0]=4;
				await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
			});

			/*End vote*/
			await time.increase(Vote_Duration+1);
			await Ballot_Instance.End_Vote(ballot_key);
			res=await Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]});

			Winning_Proposal = (await Agora_Instance.List_Law_Project(referendum_key)).Winning_Proposal;

			var Proposal_to_execute = await Agora_Instance.Get_Proposal(referendum_key, Winning_Proposal);
			var Functioncalls_nbr = Proposal_to_execute.func_call_counter;
			await Agora_Instance.Execute_Law(Loi_instance.address, referendum_key, Functioncalls_nbr,{from:Citizens[1]});
				
			var Referendum = await Agora_Instance.Referendums(referendum_key);

			var voter_reward = Referendum.Voter_Reward;
			

			for(var i=0;i<Citizens.length;i++){
				var balance_before = await DemoCoin_Instance.balanceOf(Citizens[i]);
				var Total_Token_To_Redistribute_before = await Agora_Instance.Total_Token_To_Redistribute();
				res=await Agora_Instance.Get_Voter_Reward(Loi_instance.address, referendum_key, {from:Citizens[i]});
				expect(await DemoCoin_Instance.balanceOf(Citizens[i])).to.be.bignumber.equal(balance_before.add(voter_reward));
				expect(await Agora_Instance.Total_Token_To_Redistribute()).to.be.bignumber.equal(Total_Token_To_Redistribute_before.sub(voter_reward));
			}
			
			expect(await Agora_Instance.Total_Token_To_Redistribute()).to.be.bignumber.equal(new BN(0));

		});

		it("citizens accounts attempts to get rewards twice", async function (){
			/*Voting*/
			var Citizens_Votes = Cleared_Votes_Creation(3, Citizens.length);
			Citizens_Votes.forEach(async (elem,i,arr)=>{	
				elem[0]=4;
				await Ballot_Instance.Vote_Clear(ballot_key, elem, {from:Citizens[i]});
			});

			/*End vote*/
			await time.increase(Vote_Duration+1);
			await Ballot_Instance.End_Vote(ballot_key);
			res=await Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]});

			Winning_Proposal = (await Agora_Instance.List_Law_Project(referendum_key)).Winning_Proposal;

			var Proposal_to_execute = await Agora_Instance.Get_Proposal(referendum_key, Winning_Proposal);
			var Functioncalls_nbr = Proposal_to_execute.func_call_counter;
			await Agora_Instance.Execute_Law(Loi_instance.address, referendum_key, Functioncalls_nbr,{from:Citizens[1]});
			await Agora_Instance.Get_Voter_Reward(Loi_instance.address, referendum_key, {from:Citizens[1]})
			await expectRevert(Agora_Instance.Get_Voter_Reward(Loi_instance.address, referendum_key, {from:Citizens[1]}), "Voter already rewarded");
		});

	});

	describe("Voters get their reward. Vote hash.", ()=>{
		let Title;
		let Description;
		let proposal_Description
		let referendum_key;
		let functioncall_num1;
		let functioncall_num2;
		let functioncall_num3;
		let proposal_arrays1;
		let proposal_arrays2;
		let proposal_arrays3;
		let Proposal1;
		let Proposal2;
		let Proposal3;
		let loi;
		let Winning_Proposal;


		it("citizen account attempts to get rewards althought he hasn't voted. Vote Hashed", async function (){
			await Agora_Instance.Create_Register_Referendum(Loi_instance.address, 3, {from:Constitution_Address});
			await Agora_Instance.Update_Register_Referendum_Parameters(Loi_instance.address, Petition_Duration, Vote_Duration, Validation_Duration, Law_Initialisation_Price, FunctionCall_Price, 
				Required_Petition_Rate,	Ballot_Instance.address, {from:Constitution_Address});
			
			Title = web3.utils.randomHex(Title_Size_max);
			Description = web3.utils.randomHex(Description_Size_max); 
			referendum_key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"], [Title, Description]));
			proposal_Description = web3.utils.randomHex(Description_Size_max); 

			/*Creation of a referendum project*/
			await DemoCoin_Instance.approve(Agora_Instance.address, Law_Initialisation_Price, {from:Citizens[0]});
			await Agora_Instance.Add_Law_Project(Loi_instance.address, Title, Description, {from:Citizens[0]});
			
			loi = new Loi(Loi_instance.address, web3);

			/*Proposition submission*/
			functioncall_num1 = chance.natural({min:1,max:functionCall_max});
			proposal_arrays1 = Create_Proposal_Data(functioncall_num1, 0, 0, loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num1, {from:Citizens[1]});
			await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 0, proposal_arrays1.Reuse, proposal_arrays1.Functioncalls, proposal_Description, {from:Citizens[1]});
			Proposal1 = await Agora_Instance.Get_Proposal(referendum_key,1);

			functioncall_num2 = chance.natural({min:1,max:functionCall_max});
			var reuse_num2 = chance.natural({min:0,max:Proposal1.func_call_counter});
			proposal_arrays2 = Create_Proposal_Data(functioncall_num2, reuse_num2, Proposal1.func_call_counter.toNumber(), loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num2, {from:Citizens[2]});
			await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 1, proposal_arrays2.Reuse, proposal_arrays2.Functioncalls, proposal_Description, {from:Citizens[2]});
			Proposal2 = await Agora_Instance.Get_Proposal(referendum_key,2);

			functioncall_num3 = chance.natural({min:1,max:functionCall_max});
			var reuse_num3 = chance.natural({min:0,max:Proposal2.func_call_counter});
			proposal_arrays3 = Create_Proposal_Data(functioncall_num3, reuse_num3, Proposal2.func_call_counter.toNumber(), loi, web3);
			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*functioncall_num3, {from:Citizens[3]});
			await Agora_Instance.Add_Proposal(Loi_instance.address, referendum_key, 2, proposal_arrays3.Reuse, proposal_arrays3.Functioncalls, proposal_Description, {from:Citizens[3]});
			Proposal3 = await Agora_Instance.Get_Proposal(referendum_key,3);

			/*Signatures*/
			var required_signatures = Math.floor(Required_Petition_Rate*Citizens.length/10000);
			for(var i=4;i<required_signatures;i++){
				await Agora_Instance.Sign_Petition(Loi_instance.address, referendum_key, {from:Citizens[i]});
			}

			await time.increase(Petition_Duration+1);
			res=await Agora_Instance.End_Proposition_Stage(Loi_instance.address, referendum_key, {from:Citizens[0]});
			var Referendum = await Agora_Instance.Referendums(referendum_key);
			var ballot_key = web3.utils.soliditySha3(referendum_key, Referendum.Start_Vote_Timestamps);


			/*Voting*/
			var Citizens_Votes = Hashed_Votes_Creation(3, Citizens.length);

			Citizens_Votes.forEach(async (elem,i,arr)=>{
				if(i!=0){
					arr[i].Choice[0]=4	
					arr[i].Salt = web3.utils.randomHex(32);
					arr[i].Hash = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["uint[]", "bytes32"],[arr[i].Choice, arr[i].Salt]));
					await Ballot_Instance.Vote_Hashed(ballot_key, arr[i].Hash, {from:Citizens[i]});
				}
			});

			/*End vote, start validation*/
			await time.increase(Vote_Duration+1);
			await Ballot_Instance.End_Vote(ballot_key);

			for (var i = 1; i <Citizens.length; i++) {
				
				await Ballot_Instance.Valdiate_Vote(ballot_key, Citizens_Votes[i].Choice, Citizens_Votes[i].Salt, {from:Citizens[i]});
			}

			/*End validation*/
			await time.increase(Validation_Duration+1);
			await Ballot_Instance.End_Validation_Vote(ballot_key);
			res=await Agora_Instance.End_Vote(Loi_instance.address, referendum_key, {from:Citizens[0]});

			Winning_Proposal = (await Agora_Instance.List_Law_Project(referendum_key)).Winning_Proposal;

			var Proposal_to_execute = await Agora_Instance.Get_Proposal(referendum_key, Winning_Proposal);
			var Functioncalls_nbr = Proposal_to_execute.func_call_counter;
			await Agora_Instance.Execute_Law(Loi_instance.address, referendum_key, Functioncalls_nbr,{from:Citizens[1]});
			await expectRevert(Agora_Instance.Get_Voter_Reward(Loi_instance.address, referendum_key, {from:Citizens[0]}), "Vote hasn't been validated");
		});

	});
});