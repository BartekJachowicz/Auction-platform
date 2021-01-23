pragma solidity ^0.5.0;

contract LegacyAuctionList {
    uint public auctionNumber = 0;
    uint256 private SMALLEST_TICK_IN_WEI = 500000000000000; // 0.0005 ETH approx to 0.6 USD
    uint public MAXIMUM_NUMBER_OF_DELETED_AUCTIONS = 12;

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
        bool ended;
    }

    struct DeletedAuctionsParams {
        uint size;
        uint first;
        uint last;
    }

    constructor() public {}

    mapping(uint => Auction) public auctions;
    mapping(uint => Bid[]) public auctionIdsToBids;
    mapping(uint => Auction) public deletedAuctionsArray;
    DeletedAuctionsParams public delAuctionsParams = DeletedAuctionsParams(0,0,0);

    event AuctionCreated(
        uint id,
        string auctionObject,
        address payable ownerAddress,
        uint256 startPrice,
        uint256 deadline,
        address payable highestBidAddress,
        uint256 highestBid,
        uint256 numberOfBids,
        bool ended
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
        auctions[auctionNumber] = Auction(auctionNumber, auctionObject, ownerAddress, startPrice, deadline, ownerAddress, startPrice, 0, false);
        emit AuctionCreated(auctionNumber, auctionObject, ownerAddress, startPrice, deadline, ownerAddress, startPrice, 0, false);
    }

    function getAuction(uint auctionID) public view returns (uint, string memory, address, uint256, uint256, address, uint256, uint256, bool) {
        Auction memory a = auctions[auctionID];

        return (a.id,
        a.auctionObject,
        a.ownerAddress,
        a.startPrice,
        a.deadline,
        a.highestBidAddress,
        a.highestBid,
        a.numberOfBids,
        a.ended);
    }

    function getDeletedAuction(uint auctionID) public view returns (uint, string memory, address, uint256, uint256, address, uint256, bool) {
        Auction memory a = deletedAuctionsArray[auctionID];

        return (a.id,
        a.auctionObject,
        a.ownerAddress,
        a.startPrice,
        a.deadline,
        a.highestBidAddress,
        a.highestBid,
        a.ended);
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

    function getDeletedAuctionsParams() public view returns (uint, uint, uint) {
        return (delAuctionsParams.first, delAuctionsParams.last, delAuctionsParams.size);
    }

    function endAuction(uint auctionID) public payable {
        require(now >= auctions[auctionID].deadline);
        Auction storage endedAuction = auctions[auctionID];
        if (endedAuction.ended) {
            return;
        }

        endedAuction.ended = true;

        payBidToLosers(endedAuction);
        sendWinningBidToOwner(endedAuction);

        addAuctionToDeleted(endedAuction);
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

    function addAuctionToDeleted(Auction storage auction) private {
        if (delAuctionsParams.size < MAXIMUM_NUMBER_OF_DELETED_AUCTIONS) {
            deletedAuctionsArray[delAuctionsParams.size] = auction;
            delAuctionsParams.size++;
            delAuctionsParams.last = (delAuctionsParams.last + 1) % MAXIMUM_NUMBER_OF_DELETED_AUCTIONS;
            return;
        }

        delete deletedAuctionsArray[delAuctionsParams.first];
        deletedAuctionsArray[delAuctionsParams.first] = auction;
        delAuctionsParams.last = delAuctionsParams.first;
        delAuctionsParams.first = (delAuctionsParams.first + 1) % MAXIMUM_NUMBER_OF_DELETED_AUCTIONS;
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