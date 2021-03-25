//TEST: Citizen_Register.sol 
const { BN, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers'); // BN: Big Number
const { expect } = require('chai');
const CITIZEN_REGISTER = artifacts.require('Citizens_Register');
const DEMOCOIN = artifacts.require('DemoCoin');
const chance = require("chance").Chance();


function Bytes32ToAddress(str){
	return str.slice(0,2) + str.slice(26);
}

contract('TEST: Citizen_Register.sol', function(accounts){
	const Constitution_Address = accounts[0];
	const Registering_Authority = accounts[1];
	const Banning_Authority = accounts[2];
	const Basic_Account = accounts[3];

	const Initial_Citizens = accounts.slice(4,7);

	
	let Citizen_Register_Instance;
	let DemoCoin_Instance;
	let Initial_Ammounts = Initial_Citizens.map(()=>chance.natural({max:10})); 
	let New_Citizen_Mint_Amount = 10;
	
	/*function TimestampFromTxHash(txhash, web3){
		var blocknumber = (await web3.eth.getTransaction(txhash)).blockNumber;
		var timestamp = (await web3.eth.getBlock(blocknumber)).timestamp;
		return new BN(timestamp);
	}*/

	beforeEach(async function () {
			DemoCoin_Instance = await DEMOCOIN.new("Token", "TOK",Initial_Citizens, Initial_Ammounts);
			Citizen_Register_Instance = await CITIZEN_REGISTER.new(Initial_Citizens, DemoCoin_Instance.address, New_Citizen_Mint_Amount, {from: Constitution_Address});	
			await DemoCoin_Instance.Add_Minter(Citizen_Register_Instance.address);
		});

	describe("Initial State", ()=>{

		
		it("Initial Citizens are correctly registered", async function(){
			var citizens_list = (await Citizen_Register_Instance.Get_Citizens_List()).map(Bytes32ToAddress);
			for (var i = 0; i < Initial_Citizens.length; i++) {
				expect(citizens_list.includes(Initial_Citizens[i].toLowerCase())).to.equal(true);
				var citizen = await Citizen_Register_Instance.Citizens(Initial_Citizens[i]);
				expect(citizen.Active).to.equal(true);
				expect(citizen.Registration_Timestamps).not.be.bignumber.equal(new BN(0));
				expect(citizen.End_Ban_Timestamp).be.bignumber.equal(new BN(0));
				expect(citizen.Data).to.equal(null);
			}
		});


		//New_Citizen_Mint_Amount editing
		it("New_Citizen_Mint_Amount is Correct", async function(){
			expect(await Citizen_Register_Instance.New_Citizen_Mint_Amount()).to.be.bignumber.equal(new BN(New_Citizen_Mint_Amount));
		});

		it("Basic_Account attempt to set New_Citizen_Mint_Amount", async function(){
			await expectRevert(Citizen_Register_Instance.Set_Citizen_Mint_Amount(7,{from: Basic_Account}), "Constitution Only");
		});

		it("Constitution_Address set New_Citizen_Mint_Amount", async function(){
			var amount = new BN(chance.natural({min:1, max:10}));
			res=await Citizen_Register_Instance.Set_Citizen_Mint_Amount(amount,{from: Constitution_Address});
			var result = await Citizen_Register_Instance.New_Citizen_Mint_Amount();
			
			expect(result).to.be.bignumber.equal(amount);
			//expect(await Citizen_Register_Instance.New_Citizen_Mint_Amount()).to.be.bignumber.equal(amount);
			await expectEvent(res, "new_citizen_mint_amount_Set", {new_citizen_mint_amount:amount}, "new_citizen_mint_amount_Set event incorrect");
		});


		/*Add a registering authority*/
		it("Basic_Account attempt to add a registering authority", async function(){
			await expectRevert(Citizen_Register_Instance.Add_Registering_Authority(Registering_Authority,{from: Basic_Account}), "Constitution Only");
		});

		it("Constitution_Address add a registering authority", async function(){
			res = await Citizen_Register_Instance.Add_Registering_Authority(Registering_Authority,{from: Constitution_Address});

			var registering_authorities = await Citizen_Register_Instance.Get_Registering_Authorities();
			registering_authorities = registering_authorities.map(Bytes32ToAddress);
			
			expect(registering_authorities.includes(Registering_Authority.toLowerCase())).to.equal(true);
			await expectEvent(res, "Registering_Authority_Added", {authority:Registering_Authority}, "Registering_Authority_Added event incorrect");
		});

		it("Constitution_Address attempt to add an already existing registering authority", async function(){
			await Citizen_Register_Instance.Add_Registering_Authority(Registering_Authority,{from: Constitution_Address});
			await expectRevert(Citizen_Register_Instance.Add_Registering_Authority(Registering_Authority,{from: Constitution_Address}), "Already Existing Authority");
		});


		/*Add a banning authority*/
		it("Basic_Account attempt to add a banning authority", async function(){
			await expectRevert(Citizen_Register_Instance.Add_Banning_Authority(Banning_Authority,{from: Basic_Account}), "Constitution Only");
		});

		it("Constitution_Address add a banning authority", async function(){
			res= await Citizen_Register_Instance.Add_Banning_Authority(Banning_Authority,{from: Constitution_Address});

			var banning_authorities = (await Citizen_Register_Instance.Get_Banning_Authorities()).map(Bytes32ToAddress);
			expect(banning_authorities.includes(Banning_Authority.toLowerCase())).to.equal(true);
			await expectEvent(res, "Banning_Authority_Added", {authority:Banning_Authority}, "Banning_Authority_Added event incorrect");
		});

		it("Constitution_Address attempt to add an already existing banning authority", async function(){
			await Citizen_Register_Instance.Add_Banning_Authority(Banning_Authority,{from: Constitution_Address});
			await expectRevert(Citizen_Register_Instance.Add_Banning_Authority(Banning_Authority,{from: Constitution_Address}), "Already Existing Authority");
		});


		//Remove Authority
		it("Basic_Account attempt to remove an authority", async function(){
			await Citizen_Register_Instance.Add_Registering_Authority(Registering_Authority,{from: Constitution_Address});
			await expectRevert(Citizen_Register_Instance.Remove_Authority(Registering_Authority,{from: Basic_Account}), "Not Allowed Removing Authorities");
		});

		it("Constitution_Address removes a registering authority", async function(){
			await Citizen_Register_Instance.Add_Registering_Authority(Registering_Authority,{from: Constitution_Address});
			res = await Citizen_Register_Instance.Remove_Authority(Registering_Authority,{from: Constitution_Address});

			var registering_authorities = (await Citizen_Register_Instance.Get_Registering_Authorities()).map(Bytes32ToAddress);
			expect(registering_authorities.includes(Registering_Authority.toLowerCase())).to.equal(false);
			await expectEvent(res, "Registering_Authority_Removed", {authority:Registering_Authority}, "Registering_Authority_Removed event incorrect");
		});

		it("Constitution_Address removes a banning authority", async function(){
			await Citizen_Register_Instance.Add_Banning_Authority(Banning_Authority,{from: Constitution_Address});
			res = await Citizen_Register_Instance.Remove_Authority(Banning_Authority,{from: Constitution_Address});

			var banning_authorities = (await Citizen_Register_Instance.Get_Banning_Authorities()).map(Bytes32ToAddress);
			expect(banning_authorities.includes(Banning_Authority.toLowerCase())).to.equal(false);
			await expectEvent(res, "Banning_Authority_Removed", {authority:Banning_Authority}, "Banning_Authority_Removed event incorrect");
		});

		it("Authorities address removes themself", async function(){
			await Citizen_Register_Instance.Add_Registering_Authority(Registering_Authority,{from: Constitution_Address});
			await Citizen_Register_Instance.Add_Banning_Authority(Banning_Authority,{from: Constitution_Address});
			res1 = await Citizen_Register_Instance.Remove_Authority(Registering_Authority,{from: Registering_Authority});
			res2 = await Citizen_Register_Instance.Remove_Authority(Banning_Authority,{from: Banning_Authority});

			var registering_authorities = (await Citizen_Register_Instance.Get_Registering_Authorities()).map(Bytes32ToAddress);
			expect(registering_authorities.includes(Registering_Authority.toLowerCase())).to.equal(false);
			var banning_authorities = (await Citizen_Register_Instance.Get_Banning_Authorities()).map(Bytes32ToAddress);
			expect(banning_authorities.includes(Banning_Authority.toLowerCase())).to.equal(false);

			await expectEvent(res1, "Registering_Authority_Removed", {authority:Registering_Authority}, "Registering_Authority_Removed event incorrect");
			await expectEvent(res2, "Banning_Authority_Removed", {authority:Banning_Authority}, "Banning_Authority_Removed event incorrect");
		});

		it("Constitution_Address attempt to remove a not existing authority", async function(){
			await expectRevert(Citizen_Register_Instance.Remove_Authority(Registering_Authority,{from: Constitution_Address}), "Not existing authority");
		});

		/*Remove a registering authority*/
		/*it("Basic_Account attempt to remove a registering authority", async function(){
			Citizen_Register_Instance.Add_Registering_Authority(Registering_Authority,{from: Constitution_Address});
			await expectRevert(Citizen_Register_Instance.Remove_Registering_Authority(Registering_Authority,{from: Basic_Account}), "Constitution Only");
		});*/

		/*it("Constitution_Address remove a registering authority", async function(){
			Citizen_Register_Instance.Add_Registering_Authority(Registering_Authority,{from: Constitution_Address});
			Citizen_Register_Instance.Remove_Registering_Authority(Registering_Authority,{from: Constitution_Address});

			var registering_authorities = (await Citizen_Register_Instance.Get_Registering_Authorities()).map(Bytes32ToAddress);
			expect(registering_authorities.includes(Registering_Authority.toLowerCase())).to.equal(false);
		});*/

		/*it("Constitution_Address attempt to remove a not existing registering authority", async function(){
			await expectRevert(Citizen_Register_Instance.Remove_Registering_Authority(Registering_Authority,{from: Constitution_Address}), "Not Existing Authority");
		});*/


		


		/*Remove a registering authority*/
		/*it("Basic_Account attempt to remove a banning authority", async function(){
			Citizen_Register_Instance.Add_Banning_Authority(Banning_Authority,{from: Constitution_Address});
			await expectRevert(Citizen_Register_Instance.Remove_Banning_Authority(Banning_Authority,{from: Basic_Account}), "Constitution Only");
		});*/

		/*it("Constitution_Address remove a banning authority", async function(){
			Citizen_Register_Instance.Add_Banning_Authority(Banning_Authority,{from: Constitution_Address});
			Citizen_Register_Instance.Remove_Banning_Authority(Banning_Authority,{from: Constitution_Address});

			var banning_authorities = (await Citizen_Register_Instance.Get_Banning_Authorities()).map(Bytes32ToAddress);
			expect(banning_authorities.includes(Banning_Authority.toLowerCase())).to.equal(false);
		});*/

		/*it("Constitution_Address attempt to remove a not existing banning authority", async function(){
			await expectRevert(Citizen_Register_Instance.Remove_Banning_Authority(Banning_Authority,{from: Constitution_Address}), "Not Existing Authority");
		});*/
	});

	
	describe("Set Citizen", ()=>{
		const New_Citizen = accounts[7];

		beforeEach(async function () {
			//Citizen_Register_Instance = await CITIZEN_REGISTER.new(Initial_Citizens, {from: Constitution_Address});
			Citizen_Register_Instance.Add_Registering_Authority(Registering_Authority,{from: Constitution_Address});
			Citizen_Register_Instance.Add_Banning_Authority(Banning_Authority,{from: Constitution_Address});
		});

		/*Register_Citizen*/
		it("Basic_Account attempt to register a new citizen", async function(){
			await expectRevert(Citizen_Register_Instance.Register_Citizen(New_Citizen, {from:Basic_Account}), "Registering Authority Only");
		});

		it("Registering_Authority registers a new citizen", async function(){
			var balance_before = await DemoCoin_Instance.balanceOf(New_Citizen);
			res = await Citizen_Register_Instance.Register_Citizen(New_Citizen, {from:Registering_Authority});
			var balance_after = await DemoCoin_Instance.balanceOf(New_Citizen);

			var citizen_List = (await Citizen_Register_Instance.Get_Citizens_List()).map(Bytes32ToAddress);
			var citizen = await Citizen_Register_Instance.Citizens(New_Citizen);

			expect(balance_after).to.be.bignumber.equal(balance_before.addn(New_Citizen_Mint_Amount));
			expect(await Citizen_Register_Instance.Contains(New_Citizen)).to.equal(true);
			expect(citizen.Registration_Timestamps).not.be.bignumber.equal(new BN(0));
			expect(citizen.End_Ban_Timestamp).be.bignumber.equal(new BN(0));
			expect(citizen.Data).to.equal(null);
			expect(citizen_List.includes(New_Citizen.toLowerCase())).to.equal(true);
			await expectEvent(res, "New_Citizen", {citizen_address:New_Citizen}, "New_Citizen event incorrect");
		});

		it("Registering_Authority registers an already existing citizen", async function(){
			await expectRevert(Citizen_Register_Instance.Register_Citizen(Initial_Citizens[0], {from:Registering_Authority}), "Already Registered/Ban Citizen");
		});

		/*Set_Citizen_Data*/
		it("Basic_Account attempt to set Citizen's Data", async function(){
			var data = web3.utils.randomHex(chance.natural({min:1, max:50}));
			await expectRevert(Citizen_Register_Instance.Set_Citizen_Data(Initial_Citizens[0], data, {from:Basic_Account}), "Registering Authority Only");
		});

		it("Registering_Authority attempt to set Data of not existing Citizen", async function(){
			var data = web3.utils.randomHex(chance.natural({min:1, max:50}));
			
			await expectRevert(Citizen_Register_Instance.Set_Citizen_Data(New_Citizen, data, {from:Registering_Authority}), "Not Registered Citizen");
		});

		it("Registering_Authority set Citizen's Data", async function(){
			var data = web3.utils.randomHex(chance.natural({min:1, max:50}));
			res = await Citizen_Register_Instance.Set_Citizen_Data(Initial_Citizens[0], data, {from:Registering_Authority});

			expect((await Citizen_Register_Instance.Citizens(Initial_Citizens[0])).Data).to.equal(data);
			await expectEvent(res, "Citizen_Data_Set", {citizen_address:Initial_Citizens[0]}, "Citizen_Data_Set event incorrect");
		});

	});



	describe("Banning Citizen", ()=>{
		const Registered_Citizen = accounts[7];
		let data;
		
		beforeEach(async function () {
			//Citizen_Register_Instance = await CITIZEN_REGISTER.new(Initial_Citizens, {from: Constitution_Address});
			Citizen_Register_Instance.Add_Registering_Authority(Registering_Authority,{from: Constitution_Address});
			Citizen_Register_Instance.Add_Banning_Authority(Banning_Authority,{from: Constitution_Address});

			data = web3.utils.randomHex(chance.natural({min:1, max:50}));
			await Citizen_Register_Instance.Set_Citizen_Data(Initial_Citizens[2], data, {from:Registering_Authority});
			
			await Citizen_Register_Instance.Register_Citizen(Registered_Citizen, {from:Registering_Authority});
			await Citizen_Register_Instance.Set_Citizen_Data(Registered_Citizen, data, {from:Registering_Authority});
		});

		it("Basic_Account attempt to ban a registered citizen", async function(){
			await expectRevert(Citizen_Register_Instance.Ban_Citizen(Registered_Citizen, 0, {from:Basic_Account}), "Banning Authority Only");
		});

		it("Banning_Authority attempt to ban a not registered citizen", async function(){
			await expectRevert(Citizen_Register_Instance.Ban_Citizen(Basic_Account, 0, {from:Banning_Authority}), "Not Registered Citizen");
		});

		it("Banning_Authority ban a registered citizen without duration", async function(){
			res = await Citizen_Register_Instance.Ban_Citizen(Registered_Citizen, 0,{from:Banning_Authority});
			var citizen = await Citizen_Register_Instance.Citizens(Registered_Citizen);

			expect(citizen.Active).to.equal(false);
			expect(citizen.End_Ban_Timestamp).to.be.bignumber.equal(new BN(0));

			await expectEvent(res, "Citizen_Banned", {citizen_address:Registered_Citizen}, "Citizen_Banned event incorrect");
		});

		it("Banning_Authority ban a registered citizen With duration", async function(){
			duration = chance.natural({min:1, max:10000});
			res = await Citizen_Register_Instance.Ban_Citizen(Registered_Citizen, duration,{from:Banning_Authority});
			var citizen = await Citizen_Register_Instance.Citizens(Registered_Citizen);

			var blocknumber = (await web3.eth.getTransaction(res.tx)).blockNumber;
			var timestamp = (await web3.eth.getBlock(blocknumber)).timestamp;
			timestamp=new BN(timestamp);
			

			expect(citizen.Active).to.equal(false);
			expect(citizen.End_Ban_Timestamp).to.be.bignumber.equal(timestamp.addn(duration))

			await expectEvent(res, "Citizen_Banned", {citizen_address:Registered_Citizen}, "Citizen_Banned event incorrect");
		});

		
		/*Permanently_Ban_Citizen*/

		it("Basic_Account attempt to permanently ban a registered citizen", async function(){
			await expectRevert(Citizen_Register_Instance.Permanently_Ban_Citizen(Registered_Citizen, {from:Basic_Account}), "Banning Authority Only");
		});

		it("Banning_Authority attempt to permanently ban a not registered citizen", async function(){
			await expectRevert(Citizen_Register_Instance.Permanently_Ban_Citizen(Basic_Account, {from:Banning_Authority}), "Not Registered Citizen");
		});

		it("Banning_Authority permanently ban a registered citizen", async function(){
			res = await Citizen_Register_Instance.Permanently_Ban_Citizen(Registered_Citizen,{from:Banning_Authority});
			var citizen = await Citizen_Register_Instance.Citizens(Registered_Citizen);
			var Citizen_List = (await Citizen_Register_Instance.Get_Citizens_List()).map(Bytes32ToAddress);
			var Permanently_Banned_List = await Citizen_Register_Instance.Get_Permanently_Banned_Citizens();

			expect(citizen.Active).to.equal(false);
			expect(citizen.End_Ban_Timestamp).to.be.bignumber.equal(new BN(0));
			expect(Citizen_List.includes(Registered_Citizen.toLowerCase())).to.equal(false);
			expect(Permanently_Banned_List.includes(Registered_Citizen)).to.equal(true);

			await expectEvent(res, "Citizen_Permanently_Banned", {citizen_address:Registered_Citizen}, "Citizen_Permanently_Banned event incorrect");
		});
	});

	
	describe("Citizen Redemption", ()=>{
		let Banned_Citizen_Temporary = Initial_Citizens[0];
		let Banned_Citizen_Unlimited = Initial_Citizens[1];
		let Permanently_Banned_Citizen = Initial_Citizens[2];

		beforeEach(async function () {
			//Citizen_Register_Instance = await CITIZEN_REGISTER.new(Initial_Citizens, {from: Constitution_Address});
			Citizen_Register_Instance.Add_Registering_Authority(Registering_Authority,{from: Constitution_Address});
			Citizen_Register_Instance.Add_Banning_Authority(Banning_Authority,{from: Constitution_Address});
			

			await Citizen_Register_Instance.Ban_Citizen(Banned_Citizen_Unlimited,0, {from:Banning_Authority});
			await Citizen_Register_Instance.Permanently_Ban_Citizen(Permanently_Banned_Citizen,{from:Banning_Authority});
		});


		it("Basic_Account attempt to grace a banned citizen", async function(){
			await expectRevert(Citizen_Register_Instance.Grace_Citizen(Banned_Citizen_Unlimited, {from:Basic_Account}), "Banning Authority Only");
		});

		it("Banning_Authority attempt to grace a not registered citizen", async function(){
			await expectRevert(Citizen_Register_Instance.Grace_Citizen(Basic_Account, {from:Banning_Authority}), "Not Registered Citizen");
		});

		it("Banning_Authority attempt to grace a permanently banned citizen", async function(){
			await expectRevert(Citizen_Register_Instance.Grace_Citizen(Permanently_Banned_Citizen, {from:Banning_Authority}), "Not Registered Citizen");
		});

		it("Banning_Authority grace a temporary banned citizen and an unlimited banned citizen", async function(){
			Citizen_Register_Instance.Ban_Citizen(Banned_Citizen_Temporary, chance.natural({min:10, max:10000}), {from:Banning_Authority});
			res1 = await Citizen_Register_Instance.Grace_Citizen(Banned_Citizen_Temporary,{from:Banning_Authority});
			var citizen1 = await Citizen_Register_Instance.Citizens(Banned_Citizen_Temporary);
			res2 = await Citizen_Register_Instance.Grace_Citizen(Banned_Citizen_Unlimited,{from:Banning_Authority});
			var citizen2 = await Citizen_Register_Instance.Citizens(Banned_Citizen_Unlimited);

			expect(citizen1.Active).to.equal(true);
			expect(citizen1.End_Ban_Timestamp).to.be.bignumber.equal(new BN(0));

			expect(citizen2.Active).to.equal(true);
			expect(citizen2.End_Ban_Timestamp).to.be.bignumber.equal(new BN(0));
			

			await expectEvent(res1, "Citizen_Ban_Over", {citizen_address:Banned_Citizen_Temporary}, "Citizen_Ban_Over event incorrect");
			await expectEvent(res2, "Citizen_Ban_Over", {citizen_address:Banned_Citizen_Unlimited}, "Citizen_Ban_Over event incorrect");
		});



		/*Citizen_Finish_Ban*/
		it("A registered but not banned attempt to activate the end of it's banishment ", async function(){
			await Citizen_Register_Instance.Register_Citizen(Basic_Account,{from:Registering_Authority});
			await expectRevert(Citizen_Register_Instance.Citizen_Finish_Ban({from:Basic_Account}), "Ban not over (or not banned)");
		});

		it("An unlimited banned citizen attempt to activate the end of it's banishment", async function(){
			await expectRevert(Citizen_Register_Instance.Citizen_Finish_Ban( {from:Banned_Citizen_Unlimited}), "Ban not over (or not banned)");
		});

		it("A temporary banned citizen attempt to activate the end of it's banishment before the End_Ban_Timestamp", async function(){
			var duration = 10000;
			await Citizen_Register_Instance.Ban_Citizen(Banned_Citizen_Temporary,duration,{from:Banning_Authority});
			await expectRevert(Citizen_Register_Instance.Citizen_Finish_Ban( {from:Banned_Citizen_Temporary}), "Ban not over (or not banned)");
		});

		it("A temporary banned citizen activates the end of it's banishment afters the End_Ban_Timestamp", async function(){
			var duration = chance.natural({min:1, max:10});
			await Citizen_Register_Instance.Ban_Citizen(Banned_Citizen_Temporary,duration,{from:Banning_Authority});

			await time.increase(duration+1);
			res = await Citizen_Register_Instance.Citizen_Finish_Ban( {from:Banned_Citizen_Temporary});

			var citizen = await Citizen_Register_Instance.Citizens(Banned_Citizen_Temporary);

			expect(citizen.Active).to.equal(true);
			expect(citizen.End_Ban_Timestamp).to.be.bignumber.equal(new BN(0));
			await expectEvent(res, "Citizen_Ban_Over", {citizen_address:Banned_Citizen_Temporary}, "Citizen_Ban_Over event incorrect");
		});


	});

});