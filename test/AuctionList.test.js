const { assert } = require("chai")

const AuctionList = artifacts.require('./AuctionList.sol')

contract('AuctionList', (accounts) => {
  before(async () => {
    this.auctionList = await AuctionList.deployed()
  })

  it('deploys successfully', async () => {
    const address = await this.auctionList.address
    assert.notEqual(address, 0x0)
    assert.notEqual(address, '')
    assert.notEqual(address, null)
    assert.notEqual(address, undefined)
  })

  it('creates auction', async () => {
    var date = new Date(2022, 06, 12)
    var deadline = date.getTime()/1000  
    var result = await this.auctionList.createAuction('Auction1', 5, deadline)
    var auctionNumber = await this.auctionList.auctionNumber()
    assert.equal(auctionNumber, 1)
    var event = result.logs[0].args
    assert.equal(event.id.toNumber(), 1)

    date = new Date(2020, 06, 12)
    deadline = date.getTime()/1000
    result = await this.auctionList.createAuction('Auction2', 10, deadline)
    auctionNumber = await this.auctionList.auctionNumber()
    assert.equal(auctionNumber, 2)
    event = result.logs[0].args
    assert.equal(event.id.toNumber(), 2)
  })

  it('make highest bid', async () => {
    var result = await this.auctionList.makeBid(1, 10)
    var event = result.logs[0].args
    assert.equal(event.auctionID.toNumber(), 1)
    assert.equal(event.highestBid.toNumber(), 10)   
  })

  it('end finished auction', async () => {
    const result = await this.auctionList.endAuction(2)
    const auctionNumber = await this.auctionList.auctionNumber()
    assert.equal(auctionNumber, 1)
    const event = result.logs[0].args
    assert.equal(event.auctionID.toNumber(), 2)
    assert.equal(event.highestBid.toNumber(), 10)     
  })
})