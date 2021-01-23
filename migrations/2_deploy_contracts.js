var AuctionList = artifacts.require("./AuctionList.sol");
var LegacyAuctionList = artifacts.require("./AutomaticReturnAuctionList.sol");
var MainAuctionList = artifacts.require("./PayoffAuctionList.sol")

module.exports = function(deployer) {
  deployer.deploy(AuctionList);
  deployer.deploy(LegacyAuctionList)
  deployer.deploy(MainAuctionList)
};