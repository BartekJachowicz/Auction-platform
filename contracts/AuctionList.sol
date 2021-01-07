pragma solidity ^0.5.0;

contract AuctionList {
    uint public auctionNumber = 0;

    struct Bid {
        uint bidPrice;
        address payable BidAddress;
    }

    struct Auction {
        uint id;
        string auctionObject;
        address payable ownerAddress;
        uint startPrice;
        uint256 deadline;
        address payable highestBidAddress;
        uint highestBid;
        uint numberOfBids;
    }

    constructor() public {}

    mapping(uint => Auction) public auctions;
    mapping(uint => Bid[]) public auctionIdsToBids;

    event AuctionCreated(
        uint id,
        string auctionObject,
        address payable ownerAddress,
        uint startPrice,
        uint256 deadline,
        address payable highestBidAddress,
        uint highestBid,
        uint numberOfBids
    );

    event BidDone(
        uint auctionID,
        uint highestBid,
        address payable highestBidAddress
    );

    event AuctionEnded(
        uint auctionID,
        uint highestBid,
        address payable highestBidAddress
    );

    modifier liveAuction(uint auctionId) {
        // Auction should not be ended
        require(now < auctions[auctionId].deadline);
        _;
    }

    modifier onlyOwner(uint auctionID) { 
        require(msg.sender == auctions[auctionID].ownerAddress);
        _;
    } 


    function createAuction(string memory auctionObject, uint startPrice, uint256 deadline) public {
        address payable ownerAddress = msg.sender;
        auctionNumber ++;
        auctions[auctionNumber] = Auction(auctionNumber, auctionObject, ownerAddress, startPrice, deadline, ownerAddress, startPrice, 0);
        emit AuctionCreated(auctionNumber, auctionObject, ownerAddress, startPrice, deadline, ownerAddress, startPrice, 0);
    }

    function makeBid(uint auctionID, uint bidPrice) public payable liveAuction(auctionID) returns(bool){
        if(bidPrice < auctions[auctionID].highestBid){
            return false;
        }
        // TODO: check how require works and how to use it properly
        // require(bidPrice > auctions[auctionID].highestBid, "ERROR!");

        auctions[auctionID].highestBid = bidPrice;
        auctions[auctionID].highestBidAddress = msg.sender;
        auctions[auctionID].numberOfBids ++;

        auctionIdsToBids[auctionID].push(Bid(bidPrice, msg.sender));
        emit BidDone(auctionID, bidPrice, msg.sender);

        return true;
    }

    function endAuction(uint auctionID) public payable onlyOwner(auctionID) {
        require(now >= auctions[auctionID].deadline);
        
        emit AuctionEnded(auctionID, auctions[auctionID].highestBid, auctions[auctionID].highestBidAddress);
    }
}