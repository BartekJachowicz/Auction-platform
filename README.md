# Auction-platform
Ethereum smart contract

### Project structure
```aidl
.
├── README.md
├── bs-config.json
├── build
│   └── contracts
│       ├── AuctionList.json
│       ├── AutomaticReturnAuctionList.json
│       ├── CommitRevealAuctionList.json
│       ├── Migrations.json
│       └── PayoffAuctionList.json
├── contracts
│   ├── AuctionList.sol
│   ├── AutomaticReturnAuctionList.sol
│   ├── CommitRevealAuctionList.sol
│   ├── Migrations.sol
│   └── PayoffAuctionList.sol
├── migrations
│   ├── 1_initial_migration.js
│   └── 2_deploy_contracts.js
├── package.json
├── src
│   ├── app.js
│   ├── automatic.html
│   ├── automatic.js
│   ├── commit_reveal.html
│   ├── commit_reveal.js
│   └── index.html
├── test
│   ├── AutomaticReturnAuctionList.test.js
│   ├── CommitRevealAuctionList.test.js
│   └── PayoffAuctionList.test.js
└── truffle-config.js


```
## How to run the project

* run Ganache and have MetaMask connected to Ganache's instance
* compile the contracts

```bash
truffle compile
```

* migrate smart contracts

```bash
truffle migrate
```

* run frontend locally

```bash
npm run dev
```