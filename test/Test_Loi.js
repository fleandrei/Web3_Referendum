// erc20.test.js
const { BN, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers'); // BN: Big Number
const { expect } = require('chai');
const LOI = artifacts.require('Loi');
const chance = require("chance").Chance();

function Winner(liste, nbrProp){
	L= new Array(nbrProp).fill(0);
	liste.forEach(choix =>{
		L[choix] +=1;
	});
	
	return L.indexOf(Math.max.apply(Math, L));
}


function Bytes32ToAddress(str){
	return str.slice(0,2) + str.slice(26);
}


contract('Loi', function(accounts){
	const Constitution_Address = accounts[0];
	const Agora_Address = accounts[1];
	const Random_Account = accounts[2];
	
	
	//var Loi_Instance = await LOI.new(Agora_Address, {from: Constitution_Address});

	let Loi_Instance;

	describe("Initial State", ()=>{

		beforeEach(async function () {
			this.Loi_Instance = await LOI.new(Agora_Address, {from: Constitution_Address});
			
		});

		it("Has correct Constitution",async function(){
			console.debug(await this.Loi_Instance.Get_Authorities());
			expect(await this.Loi_Instance.Constitution_Address()).to.equal(Constitution_Address);
		});

		it("Has correct Institution Type",async function(){
			expect(await this.Loi_Instance.Type_Institution()).to.be.bignumber.equal(new BN(3));
		});

		it("Has Agora_Address in Register_Authorities",async function(){
			console.debug(Agora_Address);
			console.debug(typeof((await this.Loi_Instance.Get_Authorities())[0]));
			var authority = (await this.Loi_Instance.Get_Authorities())[0];
			expect(Bytes32ToAddress(authority)).to.equal(Agora_Address.toLowerCase());
		});

	});


	describe("Set Laws", ()=>{

		let Title;
		let Description;

		beforeEach(async function () {
			Loi_Instance = await LOI.new(Agora_Address, {from: Constitution_Address});

			var Title_bytes_size = chance.natural({min:1, max:32});
			var Description_bytes_size = chance.natural({min:1, max:50});
			console.debug("bytes_size=",Title_bytes_size);

			Title = web3.utils.randomHex(Title_bytes_size);
			Description = web3.utils.randomHex(Description_bytes_size);
			console.debug("Title=",Title);
		});

		it("Random account attempts to Create Law", async function(){
			await expectRevert.unspecified(Loi_Instance.AddLaw( Title, Description, {from: Random_Account}));
		});

		it("Authorithy account (agora) Creates Law", async function(){
			let res = await Loi_Instance.AddLaw( Title, Description, {from:Agora_Address});
			

			await expectEvent(res, "Law_Created", {title: Title}, "Law_Created event incorrect");
			
		})
	})

});





		
	