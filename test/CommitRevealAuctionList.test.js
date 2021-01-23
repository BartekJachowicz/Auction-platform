const { assert } = require("chai")

const CommitRevealAuctionList = artifacts.require('./CommitRevealAuctionList.sol')

advanceBlock = () => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      const newBlockHash = web3.eth.getBlock('latest').hash

      return resolve(newBlockHash)
    })
  })
}

contract('CommitRevealAuctionList', (accounts) => {
  before(async () => {
    this.auctionList = await CommitRevealAuctionList.deployed()
  })

  it('deploys successfully', async () => {
    const address = await this.auctionList.address
    assert.notEqual(address, 0x0)
    assert.notEqual(address, '')
    assert.notEqual(address, null)
    assert.notEqual(address, undefined)
  })

  const object = 'item'
  const startPrice = web3.utils.toWei('1', 'ether')
  const date = new Date(2022, 06, 12)
  const deadline = date.getTime()/1000  
  
  it('commit-reveal flow', async () => {
    await this.auctionList.createAuction(object, startPrice, deadline)
    const bid = web3.utils.toWei('10', 'ether')
    const nonce = 213123
    const auctionId = await this.auctionList.auctionNumber()
    const hash = await this.auctionList.hash(auctionId, bid, nonce, {from: accounts[0]})

    const commitResult = await this.auctionList.commit(auctionId, hash, {from: accounts[0]})
    const commitEvent = commitResult.logs[0].args
    assert.equal(commitEvent.auctionId.toNumber(), auctionId)
    assert.equal(commitEvent.bidHash, hash)

    try {
      await this.auctionList.reveal(auctionId, bid, nonce, {value: bid, from: accounts[0]})
    }
    catch (err) {
      assert.include(err.message, "Too early reveal");
    }   

    for (i = 0; i < 100; i++)
      await advanceBlock()

    const revealResult = await this.auctionList.reveal(auctionId, bid, nonce, {value: bid, from: accounts[0]})
    const revealEvent = revealResult.logs[0].args
    assert.equal(revealEvent.auctionID.toNumber(), auctionId)
    assert.equal(revealEvent.highestBid, bid)   
    assert.equal(revealEvent.highestBidAddress, accounts[0])   

    try {
      await this.auctionList.reveal(auctionId, bid, nonce + 1, {value: bid, from: accounts[0]})
    }
    catch (err) {
      assert.include(err.message, "Incorrect hash");
    }   

    try {
      await this.auctionList.reveal(auctionId, bid, nonce, {value: bid, from: accounts[1]})
    }
    catch (err) {
      assert.include(err.message, "Incorrect hash");
    }   


    try {
      await this.auctionList.reveal(auctionId, bid + 1, nonce, {value: bid, from: accounts[0]})
    }
    catch (err) {
      assert.include(err.message, "Incorrect hash");
    }   

    await this.auctionList.createAuction(object, startPrice, deadline)

    try {
      await this.auctionList.reveal(await this.auctionList.auctionNumber(), bid, nonce, {value: bid, from: accounts[0]})
    }
    catch (err) {
      assert.include(err.message, "Incorrect hash");
    }    
  })
})