
const DELEGATION_UTILS = artifacts.require('Delegation_Uils');
const INITIATIVE_LEGISLATIV_LIB = artifacts.require('Initiative_Legislative_Lib');
const CONSTITUTION_REGISTER_LIB = artifacts.require('Constitution_Register');
const CONSTITUTION_DELEGATION_LIB = artifacts.require('Constitution_Delegation');
const CONSTITUTION = artifacts.require("Constitution");
const AGORA = artifacts.require("Agora")
const DELEGATION = artifacts.require('Delegation');
const DEMOCOIN = artifacts.require('DemoCoin');
const CITIZEN_REGISTER = artifacts.require('Citizens_Register');
const MAJORITY_JUDGMENT_BALLOT = artifacts.require('Majority_Judgment_Ballot')
const Migration_Parameters = require('./Migration_Parameters.json');

module.exports = async function(deployer) {
  //deployer.deploy(SimpleStorage);
  
  //console.log("Migration_Parameters",Migration_Parameters);	
  //console.log("Initial_Owners", Migration_Parameters.DemoCoin.Initial_Owners, ",\n type of Initial_Owners", typeof Migration_Parameters.DemoCoin.Initial_Owners )

  /*let Delegation_Utils_Library = await deployer.deploy(DELEGATION_UTILS);
  let Delegation_Utils_Library_deployed = await DELEGATION_UTILS.deployed();
  let Initiative_Legislative_Lib_Library = await deployer.deploy(INITIATIVE_LEGISLATIV_LIB);
  let Initiative_Legislative_Lib_Library_deployed = await INITIATIVE_LEGISLATIV_LIB.deployed();

  await deployer.link(DELEGATION_UTILS, [CONSTITUTION, CONSTITUTION_DELEGATION_LIB]);
  await deployer.link(INITIATIVE_LEGISLATIV_LIB, [CONSTITUTION, CONSTITUTION_DELEGATION_LIB, AGORA]);

  let Constitution_Register_Library = await deployer.deploy(CONSTITUTION_REGISTER_LIB);
  let Constitution_Register_Library_deployed = await CONSTITUTION_REGISTER_LIB.deployed();
  let Constitution_Delegation_Library = await deployer.deploy(CONSTITUTION_DELEGATION_LIB);
  let Constitution_Delegation_Library_deployed = await CONSTITUTION_DELEGATION_LIB.deployed();

  await deployer.link(CONSTITUTION_REGISTER_LIB, [CONSTITUTION]);
  await deployer.link(CONSTITUTION_DELEGATION_LIB, [CONSTITUTION]);

  let DemoCoin_Instance = await deployer.deploy(DEMOCOIN, Migration_Parameters.DemoCoin.Name,  Migration_Parameters.DemoCoin.Symbol,  Migration_Parameters.DemoCoin.Initial_Owners, Migration_Parameters.DemoCoin.Initial_Amount);
  let DemoCoin_Instance_deployed = await DEMOCOIN.deployed();
  let Citizen_Register_Instance= await deployer.deploy(CITIZEN_REGISTER, Migration_Parameters.Citizens_Register.Name, Migration_Parameters.Citizens_Register.Initial_Citizens, DEMOCOIN.address, Migration_Parameters.Citizens_Register.new_citizen_mint_amount);
  let Citizen_Register_Instance_deployed = await CITIZEN_REGISTER.deployed();
  let Agora_Instance = await deployer.deploy(AGORA, Migration_Parameters.Agora_Name, DEMOCOIN.address, CITIZEN_REGISTER.address);
  let Agora_Instance_deployed = await AGORA.deployed();
  
  //console.log("Citizens_Register addr",Citizen_Register_Instance);

  await deployer.deploy(CONSTITUTION, Migration_Parameters.Constitution.Name, DEMOCOIN.address, CITIZEN_REGISTER.address, AGORA.address, Migration_Parameters.Constitution.transition_government);
  let Constitution_deployed = await CONSTITUTION.deployed();

  /*Set Constitution_Address state variable for contracts that have been deployed before Constitution contract*/
  /*await DemoCoin_Instance.Set_Constitution(CONSTITUTION.address);
  await Citizen_Register_Instance.Set_Constitution(CONSTITUTION.address);
  await Agora_Instance.Set_Constitution(CONSTITUTION.address);*/

  await deployer.deploy(MAJORITY_JUDGMENT_BALLOT);
  
  /*await deployer.deploy(CONSTITUTION, "Constitution", "Citizens", "Agora", "0x479d0C799C3869244cDaD5AEa35A43E02653cDc7",
   ["0x479d0C799C3869244cDaD5AEa35A43E02653cDc7"], "DemoCoin","DEMO", [100], 10, {gas:6700000});*/

};
