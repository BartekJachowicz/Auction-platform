pragma solidity ^0.5.0;

contract LegacyAuctionList {
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
        uint256 numberOfBids;
    }

    constructor() public {}

    mapping(uint => Auction) public auctions;
    mapping(uint => Bid[]) public auctionIdsToBids;

    event AuctionCreated(
        uint id,
        string auctionObject,
        address payable ownerAddress,
        uint256 startPrice,
        uint256 deadline,
        address payable highestBidAddress,
        uint256 highestBid,
        uint256 numberOfBids
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
        auctions[auctionNumber] = Auction(auctionNumber, auctionObject, ownerAddress, startPrice, deadline, ownerAddress, startPrice, 0);
        emit AuctionCreated(auctionNumber, auctionObject, ownerAddress, startPrice, deadline, ownerAddress, startPrice, 0);
    }

    function getAuction(uint auctionID) public view returns (uint, string memory, address, uint256, uint256, address, uint256, uint256) {
        Auction memory a = auctions[auctionID];

        return (a.id,
        a.auctionObject,
        a.ownerAddress,
        a.startPrice,
        a.deadline,
        a.highestBidAddress,
        a.highestBid,
        a.numberOfBids
        );
    }

    function makeBid(uint auctionID, uint256 bidPrice) public payable liveAuction(auctionID) returns(bool){
        require(bidPrice > auctions[auctionID].highestBid, "Bid to low!");
        (,uint256 sumOfPreviousBids) = getSumOfPreviousBids(auctionID);
        uint256 overallBid = msg.value + sumOfPreviousBids;
        require(overallBid >= bidPrice, "Wrong message value!");

        auctions[auctionID].highestBid = overallBid;
        auctions[auctionID].highestBidAddress = msg.sender;

        updateBid(msg.sender, overallBid, auctionID);

        emit BidDone(auctionID, overallBid, msg.sender);

        return true;
    }

    function endAuction(uint auctionID) public payable {
        require(now >= auctions[auctionID].deadline);

        Auction memory endedAuction = auctions[auctionID];

        payBidToLosers(endedAuction);
        sendWinningBidToOwner(endedAuction);

        deleteAuction(auctionID);

        emit AuctionEnded(endedAuction.id, endedAuction.highestBid, endedAuction.highestBidAddress);
    }

    function payBidToLosers(Auction memory endedAuction) private {
        address winnerAddress = endedAuction.highestBidAddress;
        uint256 winningBid = endedAuction.highestBid;

        for(uint256 i = 0; i < endedAuction.numberOfBids; i++){
            Bid memory current = auctionIdsToBids[endedAuction.id][i];
            if(current.BidAddress == winnerAddress && current.bidPrice == winningBid){
                continue;
            }

            current.BidAddress.transfer(current.bidPrice);
        }
    }

    function deleteAuction(uint auctionID) private {
        auctions[auctionID] = auctions[auctionNumber];
        auctionIdsToBids[auctionID] = auctionIdsToBids[auctionNumber];

        auctions[auctionID].id = auctionID;

        delete auctions[auctionNumber];
        delete auctionIdsToBids[auctionNumber];

        auctionNumber --;
    }

    function sendWinningBidToOwner(Auction memory endedAuction) private {
        address payable ownerAddress = endedAuction.ownerAddress;
        uint256 winningBid = endedAuction.highestBid;

        ownerAddress.transfer(winningBid);
    }

    function getSumOfPreviousBids(uint auctionID) public view returns(uint, uint256){
        uint256 sum = 0;
        address bidder = msg.sender;
        for(uint256 i = 0; i < auctions[auctionID].numberOfBids; i++){
            Bid memory current = auctionIdsToBids[auctionID][i];
            if(current.BidAddress == bidder){
                sum += current.bidPrice;
            }
        }

        return (auctionID, sum);
    }

    function updateBid(address payable bidder, uint256 value, uint auctionID) private {
        bool exists = false;

        for(uint256 i = 0; i < auctions[auctionID].numberOfBids; i++){
            Bid storage current = auctionIdsToBids[auctionID][i];
            if(current.BidAddress == bidder){
                current.bidPrice = value;
                exists = true;
                break;
            }
        }

        if(!exists) {
            auctions[auctionID].numberOfBids ++;
            auctionIdsToBids[auctionID].push(Bid(value, bidder));
        }
    }
}