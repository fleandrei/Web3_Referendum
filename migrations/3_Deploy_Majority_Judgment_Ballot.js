const MAJORITY_JUDGMENT_BALLOT = artifacts.require('Majority_Judgment_Ballot')


module.exports = async function(deployer) {
	await deployer.deploy(MAJORITY_JUDGMENT_BALLOT);
}
