var AuctionList = artifacts.require("./AuctionList.sol");

module.exports = function(deployer) {
  deployer.deploy(AuctionList);
};