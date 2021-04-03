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

			console.log("Referendums",Referendums);

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

			console.log("proposal_arrays",proposal_arrays);

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
			functioncall_num = chance.natural({min:0,max:functionCall_max});
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

			console.log("project",Project);

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
			console.log("\n\ncitizen 1 allowance",await DemoCoin_Instance.allowance(Citizens[1], Agora_Instance.address),"\n Item_arrays",Item_arrays,"\n new_item_num:",new_item_num,"Item_arrays.Items.length",Item_arrays.Items.length,"\n cost=",FunctionCall_Price*Item_arrays.Items.length)
			console.log("\n\n Parameter:",await Agora_Instance.Get_Referendum_Register_Parameters(Loi_instance.address, 1));
			//await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*Item_arrays.Items.length, {from:External_Account});
			
			await expectRevert(Agora_Instance.Add_Item(Loi_instance.address, referendum_key, 1, Item_arrays.Items, Item_arrays.Indexs, {from:Citizens[1]}), "Increase Token Allowance");
		});

		it("Citizen account attempts to add items to an not existing Project", async function (){
			var new_item_num = chance.natural({min:1,max:newItem_max});
			var Item_arrays = Generate_AddItem(new_item_num, Proposal.func_call_counter, loi, web3);
			
			console.log("\n\nProposal before change",Proposal)

			var expected_FunctionCalls = Add_Item([...Proposal.function_calls], Item_arrays.Items, Item_arrays.Indexs);

			await DemoCoin_Instance.approve(Agora_Instance.address, FunctionCall_Price*Item_arrays.Items.length, {from:Citizens[1]});
			res =await Agora_Instance.Add_Item(Loi_instance.address, referendum_key, 1, Item_arrays.Items, Item_arrays.Indexs, {from:Citizens[1]});

			Proposal = await Agora_Instance.Get_Proposal(referendum_key, 1);
			console.log("\n\n Proposal after change:", Proposal);
			var Project = await Agora_Instance.List_Law_Project(referendum_key);
			var Referendum = await Agora_Instance.Referendums(referendum_key);
			var Total_Token_To_Redistribute = await Agora_Instance.Total_Token_To_Redistribute();

			var amount_transfered = new BN(Law_Initialisation_Price+FunctionCall_Price*functioncall_num+FunctionCall_Price*Item_arrays.Indexs.length);
			
			console.log("\nItem_arrays",Item_arrays);
			expect(JSON.stringify(Proposal.function_calls)).to.equal(JSON.stringify(expected_FunctionCalls));
			expect(Proposal.func_call_counter).to.be.bignumber.equal(new BN(expected_FunctionCalls.length));

			expect(Referendum.Token_Amount_Consummed).to.be.bignumber.equal(amount_transfered);

			expect(Total_Token_To_Redistribute).to.be.bignumber.equal(amount_transfered);

			expect(await DemoCoin_Instance.balanceOf(Agora_Instance.address)).to.be.bignumber.equal(amount_transfered);
			expect(await DemoCoin_Instance.balanceOf(Citizens[1])).to.be.bignumber.equal(new BN(Citizen_Initial_Ammounts-FunctionCall_Price*Item_arrays.Indexs.length - FunctionCall_Price*functioncall_num));

			await expectEvent(res, "Proposal_Modified", {register:Loi_instance.address , key:referendum_key, proposal_index:new BN(1)}, "Proposal_Modified event incorrect");
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


	describe("Achieve project petition", ()=>{
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

		it("citizen account end proposition stage. There is enough signatures to begin the vote stage", async function (){
			var required_signatures = Math.floor(Required_Petition_Rate*Citizens.length/10000);
			for(var i=2;i<required_signatures-1;i++){
					await Agora_Instance.Sign_Petition(Loi_instance.address, referendum_key, {from:Citizens[i]});
			}

			await time.increase(Petition_Duration+1);
			res=await Agora_Instance.End_Proposition_Stage(Loi_instance.address, referendum_key, {from:Citizens[0]});
			
			var ballot= await Ballot_Instance.Ballots()

			await expectEvent(res, "Voting_Stage_Started", {register:Loi_instance.address , key:referendum_key}, "Voting_Stage_Started event incorrect");
		});


	});


});