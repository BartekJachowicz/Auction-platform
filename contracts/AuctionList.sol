pragma solidity ^0.5.0;

contract AuctionList {
    uint public auctionNumber = 0;

    struct Bid {
        uint bidPrice;
        address payable bidderAddress;
    }

    struct Auction {
        uint id;
        string auctionObject;
        address payable ownerAddress;
        uint startPrice;
        uint256 deadline;
        address payable largestBidAddress;
        uint largestBid;
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
        address payable largestBidderAddress,
        uint largestBid,
        uint numberOfBids
    );

    function createAuction(string memory auctionObject, uint startPrice, uint256 deadline) public {
        address payable ownerAddress = msg.sender;
        auctionNumber ++;
        auctions[auctionNumber] = Auction(auctionNumber, auctionObject, ownerAddress, startPrice, deadline, ownerAddress, startPrice, 0);
        emit AuctionCreated(auctionNumber, auctionObject, ownerAddress, startPrice, deadline, ownerAddress, startPrice, 0);
    }

    function makeBid(uint auctionID, uint bidPrice) public {
        auctions[auctionID].largestBid = bidPrice;
        auctions[auctionID].largestBidAddress = msg.sender;
        auctions[auctionID].numberOfBids ++;

        auctionIdsToBids[auctionID].push(Bid(bidPrice, msg.sender));
    }
}