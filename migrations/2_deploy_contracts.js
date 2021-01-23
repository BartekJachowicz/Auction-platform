var AuctionList = artifacts.require("./AuctionList.sol");
var LegacyAuctionList = artifacts.require("./LegacyAuctionList.sol");
var MainAuctionList = artifacts.require("./MainAuctionList.sol")

module.exports = function(deployer) {
  deployer.deploy(AuctionList);
  deployer.deploy(LegacyAuctionList)
  deployer.deploy(MainAuctionList)
};