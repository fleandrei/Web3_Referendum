var SimpleStorage = artifacts.require("./Delegation.sol");
const DELEGATION_UTILS = artifacts.require('Delegation_Uils');
const INITIATIVE_LEGISLATIV_LIB = artifacts.require('Initiative_Legislative_Lib');
const CONSTITUTION_REGISTER_LIB = artifacts.require('Constitution_Register');
const CONSTITUTION_DELEGATION_LIB = artifacts.require('Constitution_Delegation');
const CONSTITUTION = artifacts.require("Constitution");
const AGORA = artifacts.require("Agora")
const DELEGATION = artifacts.require('Delegation');
const DEMOCOIN = artifacts.require('DemoCoin');
const CITIZEN_REGISTER = artifacts.require('Citizens_Register');

module.exports = async function(deployer) {
  //deployer.deploy(SimpleStorage);

  let Delegation_Utils_Library = await deployer.deploy(DELEGATION_UTILS);
  let Initiative_Legislative_Lib_Library = await deployer.deploy(INITIATIVE_LEGISLATIV_LIB);
  
  await deployer.link(DELEGATION_UTILS, [CONSTITUTION, CONSTITUTION_DELEGATION_LIB]);
  await deployer.link(INITIATIVE_LEGISLATIV_LIB, [CONSTITUTION, CONSTITUTION_DELEGATION_LIB, AGORA]);

  let Constitution_Register_Library = await deployer.deploy(CONSTITUTION_REGISTER_LIB);
  let Constitution_Delegation_Library = await deployer.deploy(CONSTITUTION_DELEGATION_LIB);

  await deployer.link(CONSTITUTION_REGISTER_LIB, [CONSTITUTION]);
  await deployer.link(CONSTITUTION_DELEGATION_LIB, [CONSTITUTION]);

  let DemoCoin_Instance = await deployer.deploy(DEMOCOIN, "Token", "TOK",[], []);
  console.log("democoin addr",DEMOCOIN.address);
  let Citizen_Register_Instance= await deployer.deploy(CITIZEN_REGISTER, "Citoyens", [], DEMOCOIN.address, 0);
  let Agora_Instance = await deployer.deploy(AGORA, "Agora", DEMOCOIN.address, CITIZEN_REGISTER.address);

  
  //console.log("Citizens_Register addr",Citizen_Register_Instance);

  await deployer.deploy(CONSTITUTION, "Constitution", DEMOCOIN.address, CITIZEN_REGISTER.address, AGORA.address, "0x479d0C799C3869244cDaD5AEa35A43E02653cDc7");
  /*await deployer.deploy(CONSTITUTION, "Constitution", "Citizens", "Agora", "0x479d0C799C3869244cDaD5AEa35A43E02653cDc7",
   ["0x479d0C799C3869244cDaD5AEa35A43E02653cDc7"], "DemoCoin","DEMO", [100], 10, {gas:6700000});*/

};
