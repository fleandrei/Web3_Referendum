// Test: Loi.sol
const { BN, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers'); // BN: Big Number
const { expect } = require('chai');
const LOI = artifacts.require('Loi');
const chance = require("chance").Chance();




function Bytes32ToAddress(str){
	return str.slice(0,2) + str.slice(26);
}



contract('TEST: Loi.sol (and Register.sol)', function(accounts){
	const Constitution_Address = accounts[0];
	const Agora_Address = accounts[1];
	const Authority_account = accounts[2];
	const Random_Account = accounts[3];
	
	
	//var Loi_Instance = await LOI.new(Agora_Address, {from: Constitution_Address});

	let Loi_Instance;

	/*function Test(){
		it("Constitution add address to Register_Authorities", async function(){
			await Loi_Instance.Add_Authority(Authority_account,{from:Constitution_Address});
			var authorities_list= await Loi_Instance.Get_Authorities();

			expect(authorities_list.includes(Authority_account));
		});
	}*/

	describe("Test Register.sol (inherited) contract",()=>{
		beforeEach(async function () {
			Loi_Instance = await LOI.new(Agora_Address, {from: Constitution_Address});	
		});

		it("Random_Account attempt to add address to Register_Authorities", async function(){
			await expectRevert(Loi_Instance.Add_Authority(Authority_account,{from: Random_Account}), "Constitution Only");
		});	

		it("Constitution add address to Register_Authorities", async function(){
			res= await Loi_Instance.Add_Authority(Authority_account,{from:Constitution_Address});
			var authorities_list= await Loi_Instance.Get_Authorities();
			authorities_list=authorities_list.map(Bytes32ToAddress);
			expect(authorities_list.includes(Authority_account.toLowerCase())).to.equal(true);
			await expectEvent(res, "Authority_Added", {authority: Authority_account}, "Authority_Added event incorrect");
		});

		it("Constitution add to Register_Authorities an already registered authority account", async function(){
			await Loi_Instance.Add_Authority(Authority_account,{from:Constitution_Address});
			//await expectRevert.unspecified(Loi_Instance.Add_Authority(Authority_account,{from: Constitution_Address}));
			await expectRevert(Loi_Instance.Add_Authority(Authority_account,{from: Constitution_Address}), "Already existing authority");
		});

		it("Random_Account attempt to remove address from Register_Authorities", async function(){
			await Loi_Instance.Add_Authority(Authority_account,{from:Constitution_Address});
			await expectRevert(Loi_Instance.Remove_Authority(Authority_account,{from: Random_Account}), "Not Allowed Removing Authorities");
		});

		it("Constitution_Address attempt to remove not existing address from Register_Authorities", async function(){
			await expectRevert(Loi_Instance.Remove_Authority(Authority_account,{from: Constitution_Address}), "Not existing authority account");
		});

		it("Authority account removes himself from Register_Authorities", async function(){
			await Loi_Instance.Add_Authority(Authority_account,{from:Constitution_Address});
			res = await Loi_Instance.Remove_Authority(Authority_account,{from: Authority_account});

			var authorities_list= await Loi_Instance.Get_Authorities();
			authorities_list=authorities_list.map(Bytes32ToAddress);
			expect(!authorities_list.includes(Authority_account.toLowerCase())).to.equal(true);
			await expectEvent(res, "Authority_Removed", {authority: Authority_account}, "Authority_Removed event incorrect");
		});
	});



	describe("Initial State ", ()=>{

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

		it(" Register_Authorities contains",async function(){
			console.debug(Agora_Address);
			console.debug(typeof((await this.Loi_Instance.Get_Authorities())[0]));
			var authority = (await this.Loi_Instance.Get_Authorities())[0];
			expect(Bytes32ToAddress(authority)).to.equal(Agora_Address.toLowerCase());
		});		

	});



	describe("Set Laws", ()=>{

		let Title, Description;

		beforeEach(async function () {
			Loi_Instance = await LOI.new(Agora_Address, {from: Constitution_Address});

			var Title_bytes_size = chance.natural({min:1, max:32});
			var Description_bytes_size = chance.natural({min:1, max:50});
			console.debug("bytes_size=",Title_bytes_size);

			Title = web3.utils.randomHex(Title_bytes_size);
			Description = web3.utils.randomHex(Description_bytes_size);
			console.debug("Title=",Title,", Description:",Description);
		});

		it("Random account attempts to Create Law", async function(){
			await expectRevert.unspecified(Loi_Instance.AddLaw( Title, Description, {from: Random_Account}));
		});

		it("Authorithy account (agora) Creates Law", async function(){
			let res = await Loi_Instance.AddLaw( Title, Description, {from:Agora_Address});
			let result= await Loi_Instance.Get_Law_Info(Title);

			expect(result.description).to.equal(Description);
			expect((await Loi_Instance.Get_Law_List()).includes(Title)).to.equal(true);
			await expectEvent(res, "Law_Created", {title: Title}, "Law_Created event incorrect");
		});

		it("Authorithy account (agora) attempts to create 2 laws with same title", async function(){
			let res1 = await Loi_Instance.AddLaw( Title, Description, {from:Agora_Address});
			await expectRevert.unspecified( Loi_Instance.AddLaw( Title, web3.utils.randomHex(Description.length), {from:Agora_Address}));
		});

		it("Authorithy account (agora) change description of already created law", async function(){
			await Loi_Instance.AddLaw( Title, Description, {from:Agora_Address});
			let new_description = web3.utils.randomHex(chance.natural({min:1, max:50}));
			res = await Loi_Instance.Change_Law_Description(Title, new_description, {from: Agora_Address});

			expect((await Loi_Instance.Get_Law_Info(Title)).description).to.equal(new_description);
			await expectEvent(res, "Description_Changed", {title:Title}, "Description_Changed event incorrect");
		});

		it("Random account attempts to change description of already existing Law", async function(){
			Loi_Instance.AddLaw( Title, Description, {from: Agora_Address});
			let new_description = web3.utils.randomHex(chance.natural({min:1, max:50}));
			await expectRevert.unspecified(Loi_Instance.Change_Law_Description(Title, new_description,{from:Random_Account}));
		});

		it("Authorithy account (agora) attempts to change description of not existing law", async function(){
			let new_description = web3.utils.randomHex(chance.natural({min:1, max:50}));
			await expectRevert.unspecified(Loi_Instance.Change_Law_Description(Title, new_description,{from:Agora_Address}));
		});

	});




	describe("Add Articles", ()=>{

		let Law_Title, Law_Description, Article_Title, Article_Content; 

		beforeEach(async function () {
			Loi_Instance = await LOI.new(Agora_Address, {from: Constitution_Address});

			Law_Title = web3.utils.randomHex(chance.natural({min:1, max:32}));
			Law_Description = web3.utils.randomHex(chance.natural({min:1, max:50}));

			await Loi_Instance.AddLaw( Law_Title, Law_Description, {from:Agora_Address});

			Article_Title = web3.utils.randomHex(chance.natural({min:1, max:32}));
			Article_Content = web3.utils.randomHex(chance.natural({min:1, max:50}));

		});


		it("Random account attempts to Create an Article for existing law", async function(){
			await expectRevert.unspecified(Loi_Instance.AddArticle( Law_Title, Article_Title, Article_Content, {from: Random_Account}));
		});

		it("Authorithy account (agora) attempts to Create an Article for non existing law", async function(){
			var random_title = web3.utils.randomHex(chance.natural({min:1, max:32}));
			await expectRevert.unspecified(Loi_Instance.AddArticle( random_title , Article_Title, Article_Content, {from: Agora_Address}));
		});

		it("Authorithy account (agora) Creates an Article for existing law", async function(){
			res1 = await Loi_Instance.AddArticle( Law_Title, Article_Title, Article_Content, {from: Agora_Address});		
			let key = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"],[Article_Title, Article_Content]));

			res2 = await Loi_Instance.Articles(key);
			
			expect(web3.utils.soliditySha3(res2.Title, res2.Content)).to.equal(web3.utils.soliditySha3(Article_Title, Article_Content));
			expect((await Loi_Instance.Get_Law_Article_List(Law_Title)).includes(key)).to.equal(true);
			await expectEvent(res1, "Article_Created", {law_title:Law_Title, key:key}, "Article_Created event incorrect");
		});

		it("Authorithy account (agora) attempts to Create 2 identical Articles for 2 different existing law", async function(){
			await Loi_Instance.AddArticle( Law_Title, Article_Title, Article_Content, {from: Agora_Address});		
			
			let other_law_title = web3.utils.randomHex(chance.natural({min:1, max:32}));
			await Loi_Instance.AddLaw( other_law_title, Law_Description, {from:Agora_Address});

			await expectRevert.unspecified(Loi_Instance.AddArticle( other_law_title, Article_Title, Article_Content, {from: Agora_Address}));
		});
	});



	describe("Remove Articles/Laws", ()=>{

		let Law_Title, Law_Description, Article_Title1, Article_Content1, Article_Title2, Article_Content2, key1, key2; 

		beforeEach(async function () {
			Loi_Instance = await LOI.new(Agora_Address, {from: Constitution_Address});

			Law_Title1 = web3.utils.randomHex(chance.natural({min:1, max:32}));
			Law_Description1 = web3.utils.randomHex(chance.natural({min:1, max:50}));
			Law_Title2 = web3.utils.randomHex(chance.natural({min:1, max:32}));
			Law_Description2 = web3.utils.randomHex(chance.natural({min:1, max:50}));

			await Loi_Instance.AddLaw( Law_Title1, Law_Description1, {from:Agora_Address});
			await Loi_Instance.AddLaw( Law_Title2, Law_Description2, {from:Agora_Address});

			Article_Title1 = web3.utils.randomHex(chance.natural({min:1, max:32}));
			Article_Content1 = web3.utils.randomHex(chance.natural({min:1, max:50}));
			Article_Title2 = web3.utils.randomHex(chance.natural({min:1, max:32}));
			Article_Content2 = web3.utils.randomHex(chance.natural({min:1, max:50}));
			Article_Title3 = web3.utils.randomHex(chance.natural({min:1, max:32}));
			Article_Content3 = web3.utils.randomHex(chance.natural({min:1, max:50}));

			key1 = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"],[Article_Title1, Article_Content1]));
			key2 = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"],[Article_Title2, Article_Content2]));
			key3 = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(["bytes", "bytes"],[Article_Title3, Article_Content3]));

			await Loi_Instance.AddArticle( Law_Title1, Article_Title1, Article_Content1, {from: Agora_Address});
			await Loi_Instance.AddArticle( Law_Title1, Article_Title2, Article_Content2, {from: Agora_Address});
			await Loi_Instance.AddArticle( Law_Title2, Article_Title3, Article_Content3, {from: Agora_Address});
		});

		/*Article Removal*/
		it("Random account attempts to remove an Article from the law", async function(){
			await expectRevert.unspecified(Loi_Instance.Remove_Article( Law_Title1, key1, {from: Random_Account}));
		});

		it("Authorithy account (agora) attempts to remove an existing Article from an not existing law", async function(){
			await expectRevert.unspecified(Loi_Instance.Remove_Article( web3.utils.randomHex(chance.natural({min:1, max:32})), key1, {from: Agora_Address}));
		});

		it("Authorithy account (agora) attempts to remove an non existing Article from a law", async function(){
			await expectRevert.unspecified(Loi_Instance.Remove_Article( Law_Title1, web3.utils.randomHex(32), {from: Agora_Address}));
		});

		it("Authorithy account (agora) attempts to remove an existing Article from the wrong law", async function(){
			await expectRevert.unspecified(Loi_Instance.Remove_Article( Law_Title2, key1, {from: Agora_Address}));
		});

		it("Authorithy account removes an existing Article from the good existing law", async function(){
			res = await Loi_Instance.Remove_Article( Law_Title1, key1, {from: Agora_Address});

			var Articles_List = await Loi_Instance.Get_Law_Article_List(Law_Title1);
			
			expect(Articles_List.includes(key2)).to.equal(true) //The law still contain key2 article 
			expect(!Articles_List.includes(key1)).to.equal(true); //The Law doesn't contain the key1 article anymore
			expect((await Loi_Instance.Articles(key1)).Timestamp).to.be.bignumber.equal(new BN(0)); //The key1 article doesn't exist anymore
			await expectEvent(res, "Article_Removed", {law_title:Law_Title1, key:key1}, "Article_Removed event incorrect");
		});


		/*Law Removal*/
		
		it("Random account attempts to remove an existing law", async function(){
			await expectRevert.unspecified(Loi_Instance.Remove_Law( Law_Title1, {from: Random_Account}));
		});

		it("Authorithy account (agora) attempts to remove an not existing law", async function(){
			await expectRevert.unspecified(Loi_Instance.Remove_Law( web3.utils.randomHex(chance.natural({min:1, max:32})), {from: Agora_Address}));
		});

		it("Authorithy account (agora) removes an existing law", async function(){
			res= await Loi_Instance.Remove_Law( Law_Title1, {from: Agora_Address});

			var Null_BN = new BN(0);
			var Law_List = await Loi_Instance.Get_Law_List();
			var Article1 = await Loi_Instance.Articles(key1);
			var Article2 = await Loi_Instance.Articles(key2);
			var Law_Info = await Loi_Instance.Get_Law_Info(Law_Title1);

			expect(Law_List.includes(Law_Title2)).to.equal(true);
			expect(!Law_List.includes(Law_Title1)).to.equal(true);
			expect(Law_Info.description).to.equal(null);
			expect(Law_Info.timestamp).to.be.bignumber.equal(Null_BN);
			expect(Article1.Timestamp).to.be.bignumber.equal(Null_BN); 
			expect(Article2.Timestamp).to.be.bignumber.equal(Null_BN);
			await expectEvent(res, "Law_Removed", {title:Law_Title1}, "Law_Removed event incorrect");
		});

	});


});





		
	