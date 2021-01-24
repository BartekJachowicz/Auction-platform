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
      const newBlockHash = web3.eth.getBlock('latest').firstHash

      return resolve(newBlockHash)
    })
  })
}

contract('CommitRevealAuctionList', async (accounts) => {
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

  const firstBidder = accounts[0]
  const firstBid = web3.utils.toWei('10', 'ether')
  const firstNonce = 213123
  var auctionId
  var firstHash
  
  it('commit succeeds', async () => {
    await this.auctionList.createAuction(object, startPrice, deadline)
    auctionId = await this.auctionList.auctionNumber()
    firstHash = await this.auctionList.hash(auctionId, firstBid, firstNonce, {from: firstBidder})

    const commitResult = await this.auctionList.commit(auctionId, firstHash, {from: firstBidder})
    const commitEvent = commitResult.logs[0].args
    assert.equal(commitEvent.auctionId.toNumber(), auctionId)
    assert.equal(commitEvent.bidHash, firstHash)
  })

  it('too early reveals', async() => {
    try {
      await this.auctionList.reveal(auctionId, firstBid, firstNonce, {value: firstBid, from: firstBidder})
    }
    catch (err) {
      assert.include(err.message, "Too early reveal");
    }   

    // Jump some blocks, but not enough to accept reveal
    for (i = 0; i < 50; i++)
      await advanceBlock()

    try {
      await this.auctionList.reveal(auctionId, firstBid, firstNonce, {value: firstBid, from: firstBidder})
    }
    catch (err) {
      assert.include(err.message, "Too early reveal");
    }   
  })

  it('reveal succeeds', async() => {
    // Jump enough number of blocks to accept reveal
    for (i = 0; i < 50; i++)
      await advanceBlock()

    const revealResult = await this.auctionList.reveal(auctionId, firstBid, firstNonce, {value: firstBid, from: firstBidder})
    const revealEvent = revealResult.logs[0].args
    assert.equal(revealEvent.auctionID.toNumber(), auctionId)
    assert.equal(revealEvent.highestBid, firstBid)   
    assert.equal(revealEvent.highestBidAddress, firstBidder)   
  })

  it('nonce impacts hash', async() => {
    try {
      await this.auctionList.reveal(auctionId, firstBid, firstNonce + 1, {value: firstBid, from: firstBidder})
    }
    catch (err) {
      assert.include(err.message, "Incorrect hash");
    }
  })

  const secondBidder = accounts[1]
  it('bidder address impacts hash', async() => {
    try {
      await this.auctionList.reveal(auctionId, firstBid, firstNonce, {value: firstBid, from: secondBidder})
    }
    catch (err) {
      assert.include(err.message, "Incorrect hash");
    }
  })
  
  it('bid amount impacts hash', async() => {
    try {
      await this.auctionList.reveal(auctionId, firstBid + 1, firstNonce, {value: firstBid, from: firstBidder})
    }
    catch (err) {
      assert.include(err.message, "Incorrect hash");
    }   
  })

  it('account id impacts hash', async() => {
    await this.auctionList.createAuction(object, startPrice, deadline)
    try {
      await this.auctionList.reveal(await this.auctionList.auctionNumber(), firstBid, firstNonce, {value: firstBid, from: firstBidder})
    }
    catch (err) {
      assert.include(err.message, "Incorrect hash");
    }    
  })

  const secondBid = web3.utils.toWei('20', 'ether')
  const secondNonce = 83127417
  var secondHash
  
  it('second commit succeeds', async () => {
    secondHash = await this.auctionList.hash(auctionId, secondBid, secondNonce, {from: secondBidder})

    const commitResult = await this.auctionList.commit(auctionId, secondHash, {from: secondBidder})
    const commitEvent = commitResult.logs[0].args
    assert.equal(commitEvent.auctionId.toNumber(), auctionId)
    assert.equal(commitEvent.bidHash, secondHash)
  })

  it('second reveal succeeds', async() => {
    for (i = 0; i < 100; i++)
      await advanceBlock()

    const revealResult = await this.auctionList.reveal(auctionId, secondBid, secondNonce, {value: secondBid, from: secondBidder})
    const revealEvent = revealResult.logs[0].args
    assert.equal(revealEvent.auctionID.toNumber(), auctionId)
    assert.equal(revealEvent.highestBid, secondBid)   
    assert.equal(revealEvent.highestBidAddress, secondBidder)   
  })

  it('saving payoffs succeeds', async() => {
    firstBidderPayoff = await this.auctionList.getPayoff(firstBidder)
    assert.equal(firstBidderPayoff[1], firstBid)
  })
})