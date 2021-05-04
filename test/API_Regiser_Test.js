// Test: Loi.sol
const { BN, constants, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers'); // BN: Big Number
const { expect } = require('chai');
const API = artifacts.require('API_Register');
const SIMPLESTORAGE = artifacts.require('SimpleStorage'); //We use (customed) SimpleStorage as test third arty contract
const chance = require("chance").Chance();




function Bytes32ToAddress(str){
	return str.slice(0,2) + str.slice(26);
}



contract('TEST: API_Register.sol (and Register.sol)', function(accounts){
	const Constitution_Address = accounts[0];
	const Agora_Address = accounts[1];
	const Authority_account = accounts[2];
	const External_Account = accounts[3];
	
	/*Test Parameter*/
	const Name_Size_max=32;
	const Description_Size_max = 50;
	const Bytes_Data_Size_max = 50;
	const Uint_Data_max=1000;

	const Function_Selector="0x8b282947"; // function selector of "set" function of customed SimpleStorage contract.


	let API_Instance;
	let SimpleStorage_Instance;

	beforeEach(async function () {
			API_Instance = await API.new("API",Agora_Address, {from: Constitution_Address});
		});

	describe("Initial State ", ()=>{

		it("Has correct Constitution",async function(){
			expect(await API_Instance.Constitution_Address()).to.equal(Constitution_Address);
		});

		it("Has correct Name",async function(){
			expect(await API_Instance.Name()).to.equal("API");
		});

		it("Has correct Institution Type",async function(){
			expect(await API_Instance.Type_Institution()).to.be.bignumber.equal(new BN(4));
		});

		it(" Register_Authorities contains",async function(){
			
			var authority = (await API_Instance.Get_Authorities())[0];
			expect(Bytes32ToAddress(authority)).to.equal(Agora_Address.toLowerCase());
		});		

	});


	describe("Register a new contract", ()=>{
		let Name, Description;

		beforeEach(async function(){
			SimpleStorage_Instance = await SIMPLESTORAGE.new();
			Name = web3.utils.randomHex(chance.natural({min:1, max:Name_Size_max}));
			Description = web3.utils.randomHex(chance.natural({min:1, max:Description_Size_max}));
		})

		it("External_Account attempts to register a new contract", async function(){
			await expectRevert(API_Instance.Add_Contract(SimpleStorage_Instance.address, Name, Description, {from:External_Account}), "Authorities Only");
		});

		it("Authority account registers a new contract", async function(){
			res=await API_Instance.Add_Contract(SimpleStorage_Instance.address, Name, Description, {from:Agora_Address});

			var contract = await API_Instance.Contracts(SimpleStorage_Instance.address);
			var List_Contract = (await API_Instance.Get_List_Contract()).map(Bytes32ToAddress);
			
			expect(contract.Name).to.equal(Name);
			expect(contract.Description).to.equal(Description);
			expect(List_Contract.includes(SimpleStorage_Instance.address.toLowerCase())).to.equal(true);

			await expectEvent(res, "Contract_Created", {contract_address:SimpleStorage_Instance.address}, "Contract_Created event incorrect");
		});

		it("Authority account attempts to register a new contract twice", async function(){
			await API_Instance.Add_Contract(SimpleStorage_Instance.address, Name, Description, {from:Agora_Address});
			await expectRevert(API_Instance.Add_Contract(SimpleStorage_Instance.address, Name, Description, {from:Agora_Address}), "Already created contract");
		});

	});

	describe("Register add a new function to a registered contract", ()=>{
		let Name, Description; 

		beforeEach(async function(){
			SimpleStorage_Instance = await SIMPLESTORAGE.new();
			Name = web3.utils.randomHex(chance.natural({min:1, max:Name_Size_max}));
			Description = web3.utils.randomHex(chance.natural({min:1, max:Description_Size_max}));

			await API_Instance.Add_Contract(SimpleStorage_Instance.address, Name, Description, {from:Agora_Address});
		});

		it("External_Account attempts to add a function selector to a registered contract", async function(){
			await expectRevert(API_Instance.Add_Function(SimpleStorage_Instance.address, Function_Selector, {from:External_Account}), "Authorities Only");
		});

		it("Authority Account attempts to add a function selector to a not registered contract", async function(){
			await expectRevert(API_Instance.Add_Function(web3.utils.randomHex(20), Function_Selector, {from:Agora_Address}), "Not registered contract");
		});

		it("Authority Account add a function selector to a registered contract", async function(){
			res=await API_Instance.Add_Function(SimpleStorage_Instance.address, Function_Selector, {from:Agora_Address});

			var List_Functions = await API_Instance.Get_Contract_List_Functions(SimpleStorage_Instance.address);
			var Function = await API_Instance.Get_Functions_By_Selector(SimpleStorage_Instance.address, Function_Selector);

			expect(List_Functions.includes(Function_Selector)).to.equal(true);
			expect(Function.index).to.be.bignumber.equal(new BN(1));

			await expectEvent(res, "Function_Added", {contract_address:SimpleStorage_Instance.address, function_selector:Function_Selector}, "Function_Added event incorrect");
		});
	});


	describe("Change parameters of registered contract", ()=>{
		let Name, Description; 

		beforeEach(async function(){
			SimpleStorage_Instance = await SIMPLESTORAGE.new();
			Name = web3.utils.randomHex(chance.natural({min:1, max:Name_Size_max}));
			Description = web3.utils.randomHex(chance.natural({min:1, max:Description_Size_max}));

			await API_Instance.Add_Contract(SimpleStorage_Instance.address, Name, Description, {from:Agora_Address});
			Name = web3.utils.randomHex(chance.natural({min:1, max:Name_Size_max}));
			Description = web3.utils.randomHex(chance.natural({min:1, max:Description_Size_max}));

		});

		it("External_Account attempts to change parameters of a registered contract", async function(){
			await expectRevert(API_Instance.Set_Param(SimpleStorage_Instance.address, Name, Description, {from:External_Account}), "Authorities Only");
		});

		it("Authority Account attempts to change parameters of a not registered contract", async function(){
			await expectRevert(API_Instance.Set_Param(web3.utils.randomHex(20), Name, Description, {from:Agora_Address}), "Not registered contract");
		});

		it("Authority Account change parameters of a registered contract", async function(){
			res= await API_Instance.Set_Param(SimpleStorage_Instance.address, Name, Description, {from:Agora_Address});

			var contract = await API_Instance.Contracts(SimpleStorage_Instance.address);

			expect(contract.Name).to.equal(Name);
			expect(contract.Description).to.equal(Description);

			await expectEvent(res, "Contract_param_Changed", {contract_address:SimpleStorage_Instance.address}, "Contract_param_Changed event incorrect");
		});

	});


	describe("Removes function of registered contract", ()=>{
		let Name, Description; 

		beforeEach(async function(){
			SimpleStorage_Instance = await SIMPLESTORAGE.new();
			Name = web3.utils.randomHex(chance.natural({min:1, max:Name_Size_max}));
			Description = web3.utils.randomHex(chance.natural({min:1, max:Description_Size_max}));

			await API_Instance.Add_Contract(SimpleStorage_Instance.address, Name, Description, {from:Agora_Address});
			await API_Instance.Add_Function(SimpleStorage_Instance.address, Function_Selector, {from:Agora_Address});
		});

		it("External_Account attempts to remove a function selector from a registered contract", async function(){
			await expectRevert(API_Instance.Remove_Function(SimpleStorage_Instance.address, Function_Selector, {from:External_Account}), "Authorities Only");
		});

		it("Authority Account attempts to remove a function selector from a not registered contract", async function(){
			await expectRevert(API_Instance.Remove_Function(web3.utils.randomHex(20), Function_Selector, {from:Agora_Address}), "function not registered");
		});

		it("Authority Account attempts to remove a not existing function selector from a registered contract", async function(){
			await expectRevert(API_Instance.Remove_Function(SimpleStorage_Instance.address, "0x00000000", {from:Agora_Address}), "function not registered");
		});

		it("Authority Account removes a function selector from a registered contract", async function(){
			res=await API_Instance.Remove_Function(SimpleStorage_Instance.address, Function_Selector, {from:Agora_Address});

			var List_Functions = await API_Instance.Get_Contract_List_Functions(SimpleStorage_Instance.address);
			var Function = await API_Instance.Get_Functions_By_Selector(SimpleStorage_Instance.address, Function_Selector);

			expect(List_Functions.includes(Function_Selector)).to.equal(false);
			expect(Function.index).to.be.bignumber.equal(new BN(0));

			await expectEvent(res, "Function_Removed", {contract_address:SimpleStorage_Instance.address, function_selector:Function_Selector}, "Function_Removed event incorrect");
		});

	});


	describe("Removes registered contract", ()=>{
		let Name, Description; 

		beforeEach(async function(){
			SimpleStorage_Instance = await SIMPLESTORAGE.new();
			Name = web3.utils.randomHex(chance.natural({min:1, max:Name_Size_max}));
			Description = web3.utils.randomHex(chance.natural({min:1, max:Description_Size_max}));

			await API_Instance.Add_Contract(SimpleStorage_Instance.address, Name, Description, {from:Agora_Address});
			await API_Instance.Add_Function(SimpleStorage_Instance.address, Function_Selector, {from:Agora_Address});
		});

		it("External_Account attempts to remove a registered contract", async function(){
			await expectRevert(API_Instance.Remove_Contract(SimpleStorage_Instance.address, {from:External_Account}), "Authorities Only");
		});

		it("Authority Account attempts to remove a not registered contract", async function(){
			await expectRevert(API_Instance.Remove_Contract(web3.utils.randomHex(20), {from:Agora_Address}), "Not registered contract");
		});

		it("Authority Account removes a registered contract", async function(){
			res=await API_Instance.Remove_Contract(SimpleStorage_Instance.address, {from:Agora_Address});

			var contract = await API_Instance.Contracts(SimpleStorage_Instance.address);
			var List_Contract = (await API_Instance.Get_List_Contract()).map(Bytes32ToAddress);

			expect(contract.Timestamps).to.be.bignumber.equal(new BN(0));
			expect(List_Contract.includes(SimpleStorage_Instance.address.toLowerCase())).to.equal(false);

			await expectEvent(res, "Contract_Removed", {contract_address:SimpleStorage_Instance.address}, "Contract_Removed event incorrect");
		});
	});

	describe("Execute a function from registered contract", ()=>{
		let Name, Description; 
		let Bytes_Data;
		let Uint_Data;
		let Data;

		beforeEach(async function(){
			SimpleStorage_Instance = await SIMPLESTORAGE.new();
			Name = web3.utils.randomHex(chance.natural({min:1, max:Name_Size_max}));
			Description = web3.utils.randomHex(chance.natural({min:1, max:Description_Size_max}));

			Bytes_Data = web3.utils.randomHex(chance.natural({min:1, max:Bytes_Data_Size_max}));
			Uint_Data = chance.natural({min:1, max:Uint_Data_max});
			Data= Function_Selector + web3.eth.abi.encodeParameters(["uint","bytes"], [Uint_Data, Bytes_Data]).slice(2);

			await API_Instance.Add_Contract(SimpleStorage_Instance.address, Name, Description, {from:Agora_Address});
			await API_Instance.Add_Function(SimpleStorage_Instance.address, Function_Selector, {from:Agora_Address});
		});

		it("External_Account attempts to execute a function", async function(){
			await expectRevert(API_Instance.Execute_Function(SimpleStorage_Instance.address, Data, {from:External_Account}), "Authorities Only");
		});


		it("Authority Account attempts to execute function from a not registered contract", async function(){
			await expectRevert(API_Instance.Execute_Function(web3.utils.randomHex(20), Data, {from:Agora_Address}), "Function not registered");
		});

		it("Authority Account attempts to execute not existing function from a registered contract", async function(){
			Data = web3.utils.randomHex(4) + web3.eth.abi.encodeParameters(["uint","bytes"], [Uint_Data, Bytes_Data]).slice(2);
			await expectRevert(API_Instance.Execute_Function(SimpleStorage_Instance.address, Data, {from:Agora_Address}), "Function not registered");
		});

		it("Authority Account executes a function from a registered contract", async function(){
			res=await API_Instance.Execute_Function(SimpleStorage_Instance.address, Data, {from:Agora_Address});

			var SimpleStorage_data = await SimpleStorage_Instance.get();
			var Function = await API_Instance.Get_Functions_By_Selector(SimpleStorage_Instance.address, Function_Selector);

			expect(SimpleStorage_data.uint_data).to.be.bignumber.equal(new BN(Uint_Data));
			expect(SimpleStorage_data.bytes_data).to.equal(Bytes_Data);

			expect(Function.receipts[0].Success).to.equal(true);
			expect(Function.receipts[0].Receipt).to.equal("0x");

			await expectEvent(res, "Function_Executed", {contract_address:SimpleStorage_Instance.address, function_selector:Function_Selector}, "Function_Executed event incorrect");
		});

	});
});