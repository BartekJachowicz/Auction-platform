AppLegacy = {
    loading: false,
    contracts: {},

    load: async () => {
        await AppLegacy.loadWeb3()
        await AppLegacy.loadAccount()
        await AppLegacy.loadContract()
        await AppLegacy.render()
    },

    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
            AppLegacy.web3Provider = web3.currentProvider
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
            AppLegacy.web3Provider = web3.currentProvider
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
        AppLegacy.account = web3.eth.accounts[0]
    },

    loadContract: async () => {
        // Create a JavaScript version of the smart contract
        const legacyAuctionList = await $.getJSON('LegacyAuctionList.json')
        AppLegacy.contracts.LegacyAuctionList = TruffleContract(legacyAuctionList)
        AppLegacy.contracts.LegacyAuctionList.setProvider(AppLegacy.web3Provider)

        // Hydrate the smart contract with values from the blockchain
        AppLegacy.legacyAuctionList = await AppLegacy.contracts.LegacyAuctionList.deployed()
    },

    render: async () => {
        // Prevent double render
        if (AppLegacy.loading) {
            return
        }

        // Update AppLegacy loading state
        AppLegacy.setLoading(true)

        // Render Account
        $('#account').html(AppLegacy.account)

        // Render Auctions
        await AppLegacy.renderAuctions()

        // Update loading state
        AppLegacy.setLoading(false)
    },

    renderAuctions: async () => {
        // Load the total task count from the blockchain
        const auctionNumber = await AppLegacy.legacyAuctionList.auctionNumber()
        const $auctionTemplate = $('.auctionTemplate')

        // Render out each task with a new task template
        for (var i = 1; i <= auctionNumber; i++) {
            AppLegacy.legacyAuctionList.getAuction.call(i).then(function(result) {
                const auctionId = result[0].toNumber()
                const auctionContent = result[1]
                const auctionStartPrice = web3.fromWei(result[3].toNumber())
                const auctionDeadline = uintToDate(result[4])
                const highestBidderAddress = result[5]
                const highestBid = web3.fromWei(result[6].toNumber())



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
                    .prop('id', "bidValue"+auctionId)
                $newAuctionTemplate.find('button')
                    .prop('name', auctionId)

                // Put the auctions in the correct list
                $('#auctionList').append($newAuctionTemplate)

                // Show the auction
                $newAuctionTemplate.show()
            })
        }
    },

    createAuction: async () => {
        AppLegacy.setLoading(true)
        const itemName = $('#newAuction').val()
        const startPrice = $('#startPrice').val()
        const startPriceInWei = web3.toWei(startPrice, 'ether');
        var date = new Date($('#deadline-date').val())
        var time = $('#deadline-time').val()
        var hours = time.split(":")[0];
        var minutes = time.split(":")[1]
        date.setHours(hours, minutes)
        const deadline = dateToUint(date)

        await AppLegacy.legacyAuctionList.createAuction(itemName, startPriceInWei, deadline);
        window.location.reload()
    },

    makeBid: async (id) => {
        AppLegacy.setLoading(true)
        const bidValue = $('#bidValue'+id).val()

        const bidInWei = web3.toWei(bidValue, 'ether');
        var sumOfPreviousBids = 0;
        await AppLegacy.legacyAuctionList.getSumOfPreviousBids.call(id).then(function(result) {
            sumOfPreviousBids = result[1].toNumber();
        })

        await AppLegacy.legacyAuctionList.makeBid(id, bidInWei, {value: (bidInWei - sumOfPreviousBids)});
        window.location.reload()
    },

    endAuction: async (id) => {
        AppLegacy.setLoading(true)
        await AppLegacy.legacyAuctionList.endAuction(id)
        window.location.reload()
    },

    setLoading: (boolean) => {
        AppLegacy.loading = boolean
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
        AppLegacy.load()
    })
})