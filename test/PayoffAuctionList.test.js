const { assert } = require("chai")

const PayoffAuctionList = artifacts.require('./PayoffAuctionList.sol')

contract('PayoffAuctionList', (accounts) => {
  before(async () => {
    this.auctionList = await PayoffAuctionList.deployed()
  })

  it('deploys successfully', async () => {
    const address = await this.auctionList.address
    assert.notEqual(address, 0x0)
    assert.notEqual(address, '')
    assert.notEqual(address, null)
    assert.notEqual(address, undefined)
  })

  it('creates auction', async () => {
    // Create two new auctions and check parameters with assers
    var date = new Date(2022, 06, 12)
    var deadline = date.getTime()/1000  
    var result = await this.auctionList.createAuction('Auction1', 1, deadline)
    var auctionNumber = await this.auctionList.auctionNumber()
    assert.equal(auctionNumber, 1)
    var event = result.logs[0].args
    assert.equal(event.id.toNumber(), 1)

    date = new Date(2021, 06, 12)
    deadline = date.getTime()/1000
    result = await this.auctionList.createAuction('Auction2', 2, deadline)
    auctionNumber = await this.auctionList.auctionNumber()
    assert.equal(auctionNumber, 2)
    event = result.logs[0].args
    assert.equal(event.id.toNumber(), 2)
  })

  it('get auction', async () => {
    // Get just created auction (id = 2)
    const result = await this.auctionList.getAuction(2);
    assert.equal(result[0].toNumber(), 2)
    assert.equal(result[1], 'Auction2')
    assert.equal(result[3].toNumber(), 2)
  })

  it('make highest bid', async () => {
    // Make new highest bid for the first auction
    const SMALLEST_TICK_IN_WEI = 500000000000000;
    var result = await this.auctionList.makeBid(1, 2 + SMALLEST_TICK_IN_WEI, {value: 2 + SMALLEST_TICK_IN_WEI, from: accounts[0]})
    var event = result.logs[0].args
    assert.equal(event.auctionID.toNumber(), 1)
    assert.equal(event.highestBid.toNumber(), 2 + SMALLEST_TICK_IN_WEI)   
    assert.equal(event.highestBidAddress, accounts[0])
  })

  it('make lower bid', async () => {
    try {
        await this.auctionList.makeBid(1, 1, {value: 1})
        assert.fail("The transaction should have thrown an error");
    }
    catch (err) {
        assert.include(err.message, "Bid too low", "The error message should contain 'Bid too low'");
    }   
  })

  it('get auction after bid', async () => {
    // Get auction after bid done (auction id = 1)
    const SMALLEST_TICK_IN_WEI = 500000000000000;
    const result = await this.auctionList.getAuction(1);
    assert.equal(result[0].toNumber(), 1)
    assert.equal(result[1], 'Auction1')
    assert.equal(result[3].toNumber(), 1)
    assert.equal(result[6].toNumber(), 2 + SMALLEST_TICK_IN_WEI)
  })

  it('end not finished auction', async () => {
    try {
        await this.auctionList.endAuction(1)
        assert.fail("The transaction should have thrown an error");
    }
    catch (err) {
        assert.include(err.message, "Auction should be finished");
    }   
  })
})