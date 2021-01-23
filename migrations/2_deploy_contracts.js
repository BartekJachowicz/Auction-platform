var LegacyAuctionList = artifacts.require("./LegacyAuctionList.sol");
var MainAuctionList = artifacts.require("./MainAuctionList.sol")
var CommitRevealAuctionList = artifacts.require("./CommitRevealAuctionList.sol");

module.exports = function(deployer) {
  deployer.deploy(LegacyAuctionList)
  deployer.deploy(MainAuctionList)
  deployer.deploy(CommitRevealAuctionList);
};
