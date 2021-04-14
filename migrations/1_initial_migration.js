var Migrations = artifacts.require("./Migrations.sol");
var SimpleStorage = artifacts.require("SimpleStorage");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(SimpleStorage);
};
