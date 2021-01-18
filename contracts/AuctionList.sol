pragma solidity ^0.5.0;

contract AuctionList {
    uint public auctionNumber = 0;

    struct Bid {
        uint256 bidPrice;
        address payable BidAddress;
    }

    struct Auction {
        uint id;
        string auctionObject;
        address payable ownerAddress;
        uint256 startPrice;
        uint256 deadline;
        address payable highestBidAddress;
        uint256 highestBid;
    }

    constructor() public {}

    mapping(uint => Auction) public auctions;
    mapping(address => uint256) public payoffs;

    event AuctionCreated(
        uint id,
        string auctionObject,
        address payable ownerAddress,
        uint256 startPrice,
        uint256 deadline,
        address payable highestBidAddress,
        uint256 highestBid
    );

    event BidDone(
        uint auctionID,
        uint256 highestBid,
        address payable highestBidAddress
    );

    event AuctionEnded(
        uint auctionID,
        uint256 highestBid,
        address payable highestBidAddress
    );

    modifier liveAuction(uint auctionId) {
        // Auction should not be ended
        require(now < auctions[auctionId].deadline);
        _;
    }

    modifier validDeadline(uint256 deadline) {
        // Deadline cannot be from the past
        require(now < deadline);
        _;
    }

    modifier onlyOwner(uint auctionID) { 
        require(msg.sender == auctions[auctionID].ownerAddress);
        _;
    } 


    function createAuction(string memory auctionObject, uint256 startPrice, uint256 deadline) validDeadline(deadline) public {
        address payable ownerAddress = msg.sender;
        auctionNumber ++;
        auctions[auctionNumber] = Auction(auctionNumber, auctionObject, ownerAddress, startPrice, deadline, ownerAddress, 0);
        emit AuctionCreated(auctionNumber, auctionObject, ownerAddress, startPrice, deadline, ownerAddress, 0);
    }

    function getAuction(uint auctionID) public view returns (uint, string memory, address, uint256, uint256, address, uint256) {
        Auction memory a = auctions[auctionID];

        return (a.id,
        a.auctionObject,
        a.ownerAddress,
        a.startPrice,
        a.deadline,
        a.highestBidAddress,
        a.highestBid);
    }

    function makeBid(uint auctionID, uint256 bidPrice) public payable liveAuction(auctionID) returns (bool) {
        require(bidPrice > auctions[auctionID].highestBid, "Bid too low!");
        require(msg.value + getPayoffsWithBid(auctionID) >= bidPrice, "Wrong message value!");

        address prevHighestBidderAddress = auctions[auctionID].highestBidAddress;
        uint256 prevHighestBid = auctions[auctionID].highestBid;

        payoffs[prevHighestBidderAddress] += prevHighestBid;

        auctions[auctionID].highestBid = bidPrice;
        auctions[auctionID].highestBidAddress = msg.sender;

        if(payoffs[msg.sender] >= bidPrice) {
          payoffs[msg.sender] -= bidPrice;
        }
        else {
          payoffs[msg.sender] = 0;
        }

        emit BidDone(auctionID, auctions[auctionID].highestBid, auctions[auctionID].highestBidAddress);
        return true;
    }

    function endAuction(uint auctionID) public payable {
        require(now >= auctions[auctionID].deadline);
        Auction memory endedAuction = auctions[auctionID];

        sendWinningBidToOwner(endedAuction);
        deleteAuction(auctionID);
        
        emit AuctionEnded(endedAuction.id, endedAuction.highestBid, endedAuction.highestBidAddress);
    }
    
    function sendWinningBidToOwner(Auction memory endedAuction) private {
        address payable ownerAddress = endedAuction.ownerAddress;
        uint256 winningBid = endedAuction.highestBid;

        ownerAddress.transfer(winningBid);
    }

    function deleteAuction(uint auctionID) private {
        auctions[auctionID] = auctions[auctionNumber];
        auctions[auctionID].id = auctionID;

        delete auctions[auctionNumber];
        auctionNumber --;
    }

    function getPayoffsWithBid(uint auctionId) public view returns (uint256) {
      uint256 result = payoffs[msg.sender];
      if (msg.sender == auctions[auctionId].highestBidAddress)
        result += auctions[auctionId].highestBid;

      return result;
    }

    function returnPayoffs() public {
      uint payoff = payoffs[msg.sender];
      if (payoff == 0)
        return;

      payoffs[msg.sender] = 0;
      address payable payoffOwner = msg.sender;
      payoffOwner.transfer(payoff);
    }
}