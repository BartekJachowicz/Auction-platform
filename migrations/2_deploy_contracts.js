var AuctionList = artifacts.require("./AuctionList.sol");
var LegacyAuctionList = artifacts.require("./LegacyAuctionList.sol");

module.exports = function(deployer) {
  deployer.deploy(AuctionList);
  deployer.deploy(LegacyAuctionList)
};