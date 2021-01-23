AppCommitReveal = {
  loading: false,
  contracts: {},

  load: async () => {
    await AppCommitReveal.loadWeb3()
    await AppCommitReveal.loadAccount()
    await AppCommitReveal.loadContract()
    await AppCommitReveal.render()
  },

  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  loadWeb3: async () => {
    if (typeof web3 !== 'undefined') {
      AppCommitReveal.web3Provider = web3.currentProvider
      web3 = new Web3(web3.currentProvider)
    } else {
      window.alert("Please connect to Metamask.")
    }
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(ethereum)
      try {
        // Request account access if needed
        await ethereum.enable()
        // Acccounts now exposed
        web3.eth.sendTransaction({/* ... */})
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      AppCommitReveal.web3Provider = web3.currentProvider
      window.web3 = new Web3(web3.currentProvider)
      // Acccounts always exposed
      web3.eth.sendTransaction({/* ... */})
    }
    // Non-dapp browsers...
    else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  },

  loadAccount: async () => {
    // Set the current blockchain account
    AppCommitReveal.account = web3.eth.accounts[0]
  },

  loadContract: async () => {
      // Create a JavaScript version of the smart contract
    const commitRevealAuctionList = await $.getJSON('CommitRevealAuctionList.json')
    AppCommitReveal.contracts.CommitRevealAuctionList = TruffleContract(commitRevealAuctionList)
    AppCommitReveal.contracts.CommitRevealAuctionList.setProvider(AppCommitReveal.web3Provider)

    // Hydrate the smart contract with values from the blockchain
    AppCommitReveal.commitRevealAuctionList = await AppCommitReveal.contracts.CommitRevealAuctionList.deployed()
  },

  render: async () => {
    // Prevent double render
    if (AppCommitReveal.loading) {
      return
    }

    // Update app loading state
    AppCommitReveal.setLoading(true)

    // Render Account
    $('#account').html(AppCommitReveal.account)
    await AppCommitReveal.getPayoff()

    // Render Auctions
    await AppCommitReveal.renderAuctions()

    await AppCommitReveal.renderDeletedAuctions()

    // Update loading state
    AppCommitReveal.setLoading(false)
  },

  renderAuctions: async () => {
    // Load the total task count from the blockchain
    const auctionNumber = await AppCommitReveal.commitRevealAuctionList.auctionNumber()
    const $auctionTemplate = $('.auctionTemplate')

    // Render out each task with a new task template
    for (var i = 1; i <= auctionNumber; i++) {
      AppCommitReveal.commitRevealAuctionList.getAuction.call(i).then(function(result) {
        const auctionId = result[0].toNumber()
        const auctionContent = result[1]
        const auctionStartPrice = web3.fromWei(result[3].toNumber())
        const auctionDeadline = uintToDate(result[4])
        const highestBidderAddress = result[5]
        var highestBid = web3.fromWei(result[6].toNumber())
        const ended = Boolean(result[7])

        if(highestBid == 0) {
          highestBid = auctionStartPrice
        }



        // Create the html for the task
        const $newAuctionTemplate = $auctionTemplate.clone()
        $newAuctionTemplate.find('.content').html(auctionContent)
        $newAuctionTemplate.find('.deadline').html(auctionDeadline)
        $newAuctionTemplate.find('.startprice').html(auctionStartPrice)
        $newAuctionTemplate.find('.highestbid').html(highestBid)
        $newAuctionTemplate.find('.bidderaddress').html(highestBidderAddress)

        $newAuctionTemplate.find('#commit').prop('name', auctionId)
        $newAuctionTemplate.find('#commit').find('#bidHash').prop('id', "bidHash" + auctionId)

        $newAuctionTemplate.find('#reveal').prop('name', auctionId)
        $newAuctionTemplate.find('#reveal').find('#bidValue').prop('id', "bidValue" + auctionId)
        $newAuctionTemplate.find('#reveal').find('#nonce').prop('id', "nonce" + auctionId)

        $newAuctionTemplate.find('input').prop('disabled', ended)
        $newAuctionTemplate.find('button').prop('disabled', ended)

        if (ended) {
          $newAuctionTemplate.addClass('completedAuction')
        }

        // Put the auctions in the correct list
        $('#auctionList').append($newAuctionTemplate)

        // Show the auction
        $newAuctionTemplate.show()
      })
    }
  },

  renderDeletedAuctions: async () => {
    // Load the total task count from the blockchain
    const $auctionTemplate = $('.auctionTemplate')

    // Render out each task with a new task template
    var delAuctionsParams = await AppCommitReveal.commitRevealAuctionList.getDeletedAuctionsParams()
    var first = delAuctionsParams[0].c[0]
    var last = delAuctionsParams[1].c[0]
    var size = delAuctionsParams[2].c[0]
    console.log(first, size)
    var maximum_del_number = await AppCommitReveal.commitRevealAuctionList.MAXIMUM_NUMBER_OF_DELETED_AUCTIONS()
    var i = 0;
    while(i != size) {
      AppCommitReveal.commitRevealAuctionList.getDeletedAuction.call((first + i)%maximum_del_number).then(function(result) {
        const auctionId = result[0].toNumber()
        const auctionContent = result[1]
        const auctionStartPrice = web3.fromWei(result[3].toNumber())
        const auctionDeadline = uintToDate(result[4])
        const highestBidderAddress = result[5]
        var highestBid = web3.fromWei(result[6].toNumber())
        const ended = Boolean(result[7])

        if(highestBid == 0) {
          highestBid = auctionStartPrice
        }



        // Create the html for the task
        const $newAuctionTemplate = $auctionTemplate.clone()
        $newAuctionTemplate.find('.content').html(auctionContent)
        $newAuctionTemplate.find('.deadline').html(auctionDeadline)
        $newAuctionTemplate.find('.startprice').html(auctionStartPrice)
        $newAuctionTemplate.find('.highestbid').html(highestBid)
        $newAuctionTemplate.find('.bidderaddress').html(highestBidderAddress)
        $newAuctionTemplate.find('form')
            .prop('name', auctionId)
        $newAuctionTemplate.find('input')
            .prop('id', "bidValue2" + auctionId)
        $newAuctionTemplate.find('input').prop('disabled', ended)
        $newAuctionTemplate.find('button')
            .prop('name', auctionId)
        $newAuctionTemplate.find('button').prop('disabled', ended)

        if (ended) {
          $newAuctionTemplate.addClass('completedAuction')
        }

        // Put the auctions in the correct list
        $('#auctionList').append($newAuctionTemplate)

        // Show the auction
        $newAuctionTemplate.show()
      })
      i += 1
    }
  },

  createAuction: async () => {
    AppCommitReveal.setLoading(true)
    const itemName = $('#newAuction').val()
    const startPrice = $('#startPrice').val()
    const startPriceInWei = web3.toWei(startPrice, 'ether');
    var date = new Date($('#deadline-date').val())
    var time = $('#deadline-time').val()
    var hours = time.split(":")[0];
    var minutes = time.split(":")[1]
    date.setHours(hours, minutes)
    const deadline = dateToUint(date)

    await AppCommitReveal.commitRevealAuctionList.createAuction(itemName, startPriceInWei, deadline);
    window.location.reload()
  },

  commit: async(id) => {
    AppCommitReveal.setLoading(true)
    const bidHash = $('#bidHash'+id).val()
    console.log(bidHash)
    await AppCommitReveal.commitRevealAuctionList.commit(id, bidHash);
    window.location.reload()
  },

  reveal: async(id) => {
    AppCommitReveal.setLoading(true)

    const bidValue = $('#bidValue'+id).val()
    const bidInWei = web3.toWei(bidValue, 'ether')
    const nonce = $('#nonce'+id).val()
    console.log(bidValue, bidInWei, nonce)

    var payoffsWithBid = 0
    await AppCommitReveal.commitRevealAuctionList.getPayoffsWithBid.call(id).then(function(result) {
      payoffsWithBid = result.toNumber();
    })

    if (payoffsWithBid >= bidInWei) {
      await AppCommitReveal.commitRevealAuctionList.reveal(id, bidInWei, nonce, {value: 0})
    }
    else {
      console.log(bidValue, bidInWei, payoffsWithBid)
      await AppCommitReveal.commitRevealAuctionList.reveal(id, bidInWei, nonce, {value: (bidInWei - payoffsWithBid)});
    }

    window.location.reload()
  },

  returnPayoffs: async() => {
    AppCommitReveal.setLoading(true)
    await AppCommitReveal.commitRevealAuctionList.returnPayoffs()
    window.location.reload()
  },

  endAuction: async (id) => {
    AppCommitReveal.setLoading(true)
    await AppCommitReveal.commitRevealAuctionList.endAuction(id)
    window.location.reload()
  },

  getPayoff: async() => {
    var payoff;
    await AppCommitReveal.commitRevealAuctionList.getPayoff.call(AppCommitReveal.account).then(function(result) {
      payoff = result[1].toNumber()
    })
    const payoffInEth = web3.fromWei(payoff)
    $('#payoff-span').html(payoffInEth)
  },

  setLoading: (boolean) => {
    AppCommitReveal.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  }
}

function uintToDate(timestamp){
  return new Date(timestamp * 1000)
}

function dateToUint(date) {
  return date.getTime()/1000
}

window.addEventListener('load', async () => {
  // Modern dapp browsers...
  if (window.ethereum) {
    window.web3 = new Web3(ethereum);
    try {
      // Request account access if needed
      await ethereum.enable();
      // Acccounts now exposed
      web3.eth.sendTransaction({/* ... */});
    } catch (error) {
      // User denied account access...
    }
  }
  // Legacy dapp browsers...
  else if (window.web3) {
    window.web3 = new Web3(web3.currentProvider);
    // Acccounts always exposed
    web3.eth.sendTransaction({/* ... */});
  }
  // Non-dapp browsers...
  else {
    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
  }
});

$(() => {
  $(window).load(() => {
    AppCommitReveal.load()
  })
})
