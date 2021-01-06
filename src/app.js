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

    // Render Auctions
    await App.renderAuctions()

    // Update loading state
    App.setLoading(false)
  },

  renderAuctions: async () => {
    // Load the total task count from the blockchain
    const auctionNumber = await App.auctionList.auctionNumber()
    const $auctionTemplate = $('.auctionTemplate')

    // Render out each task with a new task template
    for (var i = 1; i <= auctionNumber; i++) {
      // Fetch the task data from the blockchain
      const auction = await App.auctionList.auctions(i)
      const auctionId = auction[0].toNumber()
      const auctionContent = auction[1]
      const auctionStartPrice = auction[3]
      const auctionDeadline = auction[4]


      // Create the html for the task
      const $newAuctionTemplate = $auctionTemplate.clone()
      $newAuctionTemplate.find('.content').html(auctionContent)
      $newAuctionTemplate.find('.deadline').html(auctionDeadline)
      $newAuctionTemplate.find('.startprice').html(auctionStartPrice)
      $newAuctionTemplate.find('input')
                      .prop('name', auctionId)

      // Put the task in the correct list
      $('#auctionList').append($newAuctionTemplate)
      
      // Show the task
      $newAuctionTemplate.show()
    }
  },

  createAuction: async () => {
    App.setLoading(true)
    const content = $('#newAuction').val()
    console.log(content)
    await App.auctionList.createAuction(content, 0x111122223333444455556666777788889999aAaa, 143, 1);
    window.location.reload()
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

$(() => {
  $(window).load(() => {
    App.load()
  })
})