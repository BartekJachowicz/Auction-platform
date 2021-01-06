pragma solidity ^0.5.0;

contract AuctionList {
    uint public auctionNumber = 0;

    struct Auction {
        uint id;
        string auctionObject;
        address payable ownerAddress;
        uint startPrice;
        uint256 deadline;
    }

    constructor() public {
        createAuction("Jajeczka", 0x111122223333444455556666777788889999aAaa, uint(14), uint(1));
        createAuction("Szczypiorek", 0x111122223333444455556666777788889999aAaa, uint(14), uint(1));
        createAuction("Szyneczka", 0x111122223333444455556666777788889999aAaa, uint(14), uint(1));
    }

    mapping(uint => Auction) public auctions;

    event AuctionCreated(
        uint id,
        string auctionObject,
        address payable ownerAddress,
        uint startPrice,
        uint256 deadline
    );

    function createAuction(string memory auctionObject, address payable ownerAddress, uint startPrice, uint256 deadline) public {
        auctionNumber ++;
        auctions[auctionNumber] = Auction(auctionNumber, auctionObject, ownerAddress, startPrice, deadline);
        emit AuctionCreated(auctionNumber, auctionObject, ownerAddress, startPrice, deadline);
    }
}