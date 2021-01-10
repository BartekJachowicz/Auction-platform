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
    const result = await this.auctionList.createAuction('Auction1', 37, 1)
    const auctionNumber = await this.auctionList.auctionNumber()
    assert.equal(auctionNumber, 1)
    const event = result.logs[0].args
    assert.equal(event.id.toNumber(), 1)
  })
})