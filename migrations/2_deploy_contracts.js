var AutomaticReturnAuctionList = artifacts.require("./AutomaticReturnAuctionList.sol");
var PayoffAuctionList = artifacts.require("./PayoffAuctionList.sol")
var CommitRevealAuctionList = artifacts.require("./CommitRevealAuctionList.sol");

module.exports = function(deployer) {
  deployer.deploy(AutomaticReturnAuctionList)
  deployer.deploy(PayoffAuctionList)
  deployer.deploy(CommitRevealAuctionList);
};
