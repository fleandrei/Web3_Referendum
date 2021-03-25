//TEST: DemoCoin.sol 
const { BN, ether, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers'); // BN: Big Number
const { expect } = require('chai');
const DEMOCOIN = artifacts.require('DemoCoin');
const chance = require("chance").Chance();


function Bytes32ToAddress(str){
	return str.slice(0,2) + str.slice(26);
}

contract('TEST: DemoCoin.sol', function(accounts){

	const Initial_Ammount_Max = 10;


	const num_accounts = accounts.length;
	const Constitution_Address = accounts[0];
	const Initial_Accounts = accounts.slice(1,4);
	const Minting_Authority = accounts[4];
	const Burning_Authority = accounts[5];
	const Random_Account = Initial_Accounts[0];
	let Initial_Ammounts;

	
	let Democoin_Instance;

	describe("DemoCoin Initialisation ", ()=>{
		
		

		beforeEach(async function () {
			Initial_Ammounts = Initial_Accounts.map(()=>chance.natural({max:Initial_Ammount_Max})); 
			Democoin_Instance = await DEMOCOIN.new("Token", "TOK", Initial_Accounts, Initial_Ammounts,{from: Constitution_Address});
			
		});

		it("Check Constitution Address", async function(){
			mint_authority=(await Democoin_Instance.Get_Mint_Authorities()).map(Bytes32ToAddress);
			burn_authority=(await Democoin_Instance.Get_Burn_Authorities()).map(Bytes32ToAddress);

			expect(await Democoin_Instance.Constitution_Address()).to.equal(Constitution_Address);
			expect(mint_authority.includes(Constitution_Address.toLowerCase())).to.equal(true);
			expect(burn_authority.includes(Constitution_Address.toLowerCase())).to.equal(true);
		});

		it("Check Initial accounts have correct balances", async function(){

			for (var i = 0; i <3; i++) {
				console.debug("Initial_Accounts",Initial_Accounts[i]);
				console.debug("balance", await Democoin_Instance.balanceOf(Initial_Accounts[i]));
				expect(await Democoin_Instance.balanceOf(Initial_Accounts[i])).to.be.bignumber.equal(new BN(Initial_Ammounts[i]));
			}

			
		});

	});

	describe("DemoCoin Edit Minter/Burner authority ", ()=>{
		

		beforeEach(async function () {
			Initial_Ammount = Initial_Accounts.map(()=>chance.natural({max:Initial_Ammount_Max})); 
			Democoin_Instance = await DEMOCOIN.new("Token", "TOK", Initial_Accounts, Initial_Ammount,{from: Constitution_Address});
		});

		//add minter
		it("Random account attempt to add a Minter", async function(){
			await expectRevert(Democoin_Instance.Add_Minter(Minting_Authority,{from: Random_Account}), "Constitution Only");
		});

		it("Constitution add a Minter", async function(){
			var res= await Democoin_Instance.Add_Minter(Minting_Authority,{from: Constitution_Address});
			mint_authority=(await Democoin_Instance.Get_Mint_Authorities()).map(Bytes32ToAddress);

			expect(mint_authority.includes(Minting_Authority.toLowerCase())).to.equal(true);
			await expectEvent(res, "Minter_Added", {minter:Minting_Authority}, "Minter_Added event incorrect");
		});

		it("Constitution attempt to add a Minter twice", async function(){
			await Democoin_Instance.Add_Minter(Minting_Authority,{from: Constitution_Address});
			await expectRevert(Democoin_Instance.Add_Minter(Minting_Authority,{from: Constitution_Address}), "Is already minter");
		});


		//Add Burner
		it("Random account attempt to add a Burner", async function(){
			await expectRevert(Democoin_Instance.Add_Burner(Burning_Authority,{from: Random_Account}), "Constitution Only");
		});

		it("Constitution add a Burner", async function(){
			var res= await Democoin_Instance.Add_Burner(Burning_Authority,{from: Constitution_Address});
			burn_authority=(await Democoin_Instance.Get_Burn_Authorities()).map(Bytes32ToAddress);

			expect(burn_authority.includes(Burning_Authority.toLowerCase())).to.equal(true);
			await expectEvent(res, "Burner_Added", {burner:Burning_Authority}, "Burner_Added event incorrect");
		});

		it("Constitution attempt to add a Burner twice", async function(){
			await Democoin_Instance.Add_Burner(Burning_Authority,{from: Constitution_Address});
			await expectRevert(Democoin_Instance.Add_Burner(Burning_Authority,{from: Constitution_Address}), "Is already burner");
		});


		//Remove Minter
		it("Random account attempt to remove a Minter", async function(){
			await Democoin_Instance.Add_Minter(Minting_Authority,{from: Constitution_Address});
			await expectRevert(Democoin_Instance.Remove_Minter(Minting_Authority,{from: Random_Account}), "Constitution Only");
		});

		it("Constitution attempt to remove a Constitution_Address from Minter Authorities", async function(){
			await expectRevert(Democoin_Instance.Remove_Minter(Constitution_Address,{from: Constitution_Address}), "Constitution can't be removed");
		});

		it("Constitution remove a Minter", async function(){
			await Democoin_Instance.Add_Minter(Minting_Authority,{from: Constitution_Address});
			var res= await Democoin_Instance.Remove_Minter(Minting_Authority,{from: Constitution_Address});
			mint_authority=(await Democoin_Instance.Get_Mint_Authorities()).map(Bytes32ToAddress);

			expect(mint_authority.includes(Minting_Authority.toLowerCase())).to.equal(false);
			await expectEvent(res, "Minter_Removed", {minter:Minting_Authority}, "Minter_Removed event incorrect");
		});

		it("Constitution attempt to remove a not existing Minter", async function(){
			await expectRevert(Democoin_Instance.Remove_Minter(Minting_Authority,{from: Constitution_Address}), "minter don't exist");
		});


		//Remove Burner
		it("Random account attempt to remove a Burner", async function(){
			await Democoin_Instance.Add_Burner(Burning_Authority,{from: Constitution_Address});
			await expectRevert(Democoin_Instance.Remove_Burner(Burning_Authority,{from: Random_Account}), "Constitution Only");
		});

		it("Constitution attempt to remove a Constitution_Address from Burner Authorities", async function(){
			await expectRevert(Democoin_Instance.Remove_Burner(Constitution_Address,{from: Constitution_Address}), "Constitution can't be removed");
		});

		it("Constitution remove a Burner", async function(){
			await Democoin_Instance.Add_Burner(Burning_Authority,{from: Constitution_Address});
			var res= await Democoin_Instance.Remove_Burner(Burning_Authority,{from: Constitution_Address});
			burn_authority=(await Democoin_Instance.Get_Burn_Authorities()).map(Bytes32ToAddress);

			expect(burn_authority.includes(Burning_Authority.toLowerCase())).to.equal(false);
			await expectEvent(res, "Burner_Removed", {burner:Burning_Authority}, "Burner_Removed event incorrect");
		});

		it("Constitution attempt to remove a not existing Burner", async function(){
			await expectRevert(Democoin_Instance.Remove_Burner(Burning_Authority,{from: Constitution_Address}), "burner don't exist");
		});
	});

	describe("DemoCoin Mint/Burn ", ()=>{

		beforeEach(async function () {
			Initial_Ammount = Initial_Accounts.map(()=>chance.natural({max:Initial_Ammount_Max})); 
			Democoin_Instance = await DEMOCOIN.new("Token", "TOK", Initial_Accounts, Initial_Ammount,{from: Constitution_Address})
		});

		it("Random account attempt to Mint token", async function(){
			var amount = chance.natural({max:Initial_Ammount_Max});
			await expectRevert(Democoin_Instance.Mint(Random_Account, amount, {from: Random_Account}), "Address Not Allowed to mint");
		});

		it("Minter Authority (Constitution_Address) Mint token", async function(){
			var amount = chance.natural({min:1, max:Initial_Ammount_Max});
			var balance_before = await Democoin_Instance.balanceOf(Random_Account);
			await Democoin_Instance.Mint(Random_Account, amount, {from: Constitution_Address});
			var balance_after = await Democoin_Instance.balanceOf(Random_Account);
			console.log("balance_before:",balance_before,", balance_after:",balance_after,", amount:",amount);
			expect(balance_after).to.be.bignumber.equal(balance_before.addn(amount));
		});

		it("Random account attempt to Burn token", async function(){
			var amount = chance.natural({max:Initial_Ammount_Max});
			await expectRevert(Democoin_Instance.Burn(Random_Account, amount, {from: Random_Account}), "Address Not Allowed to burn");
		});

		it("Burner Authority (Constitution_Address) Burn token", async function(){
			var balance_before = await Democoin_Instance.balanceOf(Random_Account);
			var amount = chance.natural({min:1, max:balance_before});
			await Democoin_Instance.Burn(Random_Account, amount, {from: Constitution_Address});
			var balance_after = await Democoin_Instance.balanceOf(Random_Account);
			console.log("balance_before:",balance_before,", balance_after:",balance_after,", amount:",amount);
			expect(balance_after).to.be.bignumber.equal(balance_before.subn(amount));
		});

	});

});