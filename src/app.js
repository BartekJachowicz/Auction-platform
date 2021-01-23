App = {
  loading: false,
  contracts: {},

  load: async () => {
    await App.loadWeb3()
    await App.loadAccount()
    await App.loadContract()
    await App.render()
  },

  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  loadWeb3: async () => {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider
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
      App.web3Provider = web3.currentProvider
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
    App.account = web3.eth.accounts[0]
  },

  loadContract: async () => {
    // Create a JavaScript version of the smart contract
    const auctionList = await $.getJSON('AuctionList.json')
    App.contracts.AuctionList = TruffleContract(auctionList)
    App.contracts.AuctionList.setProvider(App.web3Provider)

    // Hydrate the smart contract with values from the blockchain
    App.auctionList = await App.contracts.AuctionList.deployed()
  },

  render: async () => {
    // Prevent double render
    if (App.loading) {
      return
    }

    // Update app loading state
    App.setLoading(true)

    // Render Account
    $('#account').html(App.account)
    await App.getPayoff()

    // Render Auctions
    await App.renderAuctions()

    await App.renderDeletedAuctions()

    // Update loading state
    App.setLoading(false)
  },

  renderAuctions: async () => {
    // Load the total task count from the blockchain
    const auctionNumber = await App.auctionList.auctionNumber()
    const $auctionTemplate = $('.auctionTemplate')

    // Render out each task with a new task template
    for (var i = 1; i <= auctionNumber; i++) {
      App.auctionList.getAuction.call(i).then(function(result) {
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
            .prop('id', "bidValue" + auctionId)
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
    }
  },

  renderDeletedAuctions: async () => {
    // Load the total task count from the blockchain
    const $auctionTemplate = $('.auctionTemplate')

    // Render out each task with a new task template
    var delAuctionsParams = await App.auctionList.getDeletedAuctionsParams()
    var first = delAuctionsParams[0].c[0]
    var last = delAuctionsParams[1].c[0]
    var size = delAuctionsParams[2].c[0]
    console.log(first, size)
    var maximum_del_number = await App.auctionList.MAXIMUM_NUMBER_OF_DELETED_AUCTIONS()
    var i = 0;
    while(i != size) {
      App.auctionList.getDeletedAuction.call((first + i)%maximum_del_number).then(function(result) {
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
    App.setLoading(true)
    const itemName = $('#newAuction').val()
    const startPrice = $('#startPrice').val()
    const startPriceInWei = web3.toWei(startPrice, 'ether');
    var date = new Date($('#deadline-date').val())
    var time = $('#deadline-time').val()
    var hours = time.split(":")[0];
    var minutes = time.split(":")[1]
    date.setHours(hours, minutes)
    const deadline = dateToUint(date)

    await App.auctionList.createAuction(itemName, startPriceInWei, deadline);
    window.location.reload()
  },

  makeBid: async (id) => {
    App.setLoading(true)
    const bidValue = $('#bidValue'+id).val()
    const bidInWei = web3.toWei(bidValue, 'ether')
    console.log(bidValue, bidInWei)

    var payoffsWithBid = 0
    await App.auctionList.getPayoffsWithBid.call(id).then(function(result) {
      payoffsWithBid = result.toNumber();
    })

    if (payoffsWithBid >= bidInWei) {
      await App.auctionList.makeBid(id, bidInWei, {value: 0})
    }
    else {
      console.log(bidValue, bidInWei, payoffsWithBid)
      await App.auctionList.makeBid(id, bidInWei, {value: (bidInWei - payoffsWithBid)});
    }
    window.location.reload()
  },

  returnPayoffs: async() => {
    App.setLoading(true)
    await App.auctionList.returnPayoffs()
    window.location.reload()
  },

  endAuction: async (id) => {
    App.setLoading(true)
    await App.auctionList.endAuction(id)
    window.location.reload()
  },

  getPayoff: async() => {
    var payoff;
    await App.auctionList.getPayoff.call(App.account).then(function(result) {
      payoff = result[1].toNumber()
    })
    const payoffInEth = web3.fromWei(payoff)
    $('#payoff-span').html(payoffInEth)
  },

  setLoading: (boolean) => {
    App.loading = boolean
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
    App.load()
  })
})
