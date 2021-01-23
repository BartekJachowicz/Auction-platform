pragma solidity ^0.5.0;

import "./MainAuctionList.sol";

contract CommitRevealAuctionList is MainAuctionList {

  struct BidCommit {
    uint auctionId;
    bytes32 bidHash;
    uint blockNumber;
  }

  mapping(address => BidCommit) public commits;

  function stringToBytes32(string memory source) private pure returns (bytes32 result) {
    bytes memory tempEmptyStringTest = bytes(source);
    if (tempEmptyStringTest.length == 0) {
        return 0x0;
    }

    assembly {
        result := mload(add(source, 32))
    }
}

  function commit(uint auctionId, string memory bidHash) public liveAuction(auctionId) {
    commits[msg.sender] = BidCommit(auctionId, stringToBytes32(bidHash), block.number);
  }

  function reveal(uint auctionId, uint256 bid, uint256 randomNonce) public payable liveAuction(auctionId) {
    require(commits[msg.sender].blockNumber + 100 <= block.number);
    require(commits[msg.sender].bidHash == keccak256(abi.encodePacked(msg.sender, auctionId, bid, randomNonce)));
    makeBid(auctionId, bid);
  }
}