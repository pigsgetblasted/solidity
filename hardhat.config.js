
// require("solidity-coverage");
//require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-waffle");

//https://hardhat.org/plugins/hardhat-gas-reporter.html
// require("hardhat-contract-sizer");
// require("hardhat-gas-reporter");

const env = require('./.env.json');
// const accounts = require('./accounts.json');

module.exports = {
  etherscan: {
    apiKey: {
      mainnet: env.ETHERSCAN_API_KEY
    }
  },
  mocha: {
    timeout: 20000
  },
  paths: {
    artifacts: "./artifacts",
    cache:     "./cache",
    sources:   "./contracts",
    tests:     "./test",
  },
  solidity: {
    settings: env.COMPILER_SETTINGS,
    version: env.COMPILER_VERSION,
  },
  // ref: https://hardhat.org/hardhat-network/docs/reference
  networks: {
    devnet: {
      chainId: 160000,
      url: "http://192.168.1.31:8545"
    },
    hardhat: {
      // accounts: accounts,
      forking: {
        enabled: false,
        url: `https://mainnet.infura.io/v3/${env.INFURA.PROJECT_ID}`
      },
    },

    "base-goerli": {
      url: 'https://goerli.base.org',
      accounts: [ env.ACCOUNTS.SQUEEBO_2.PK ],
      gasPrice: 100_000_000,
    },
    "base-mainnet": {
      url: 'https://mainnet.base.org',
      accounts: [ env.ACCOUNTS.SQUEEBO_2.PK ],
      // gasPrice: 1000000000,
    },

    goerli: {
      url: `https://goerli.infura.io/v3/${env.INFURA.PROJECT_ID}`,
      accounts: []
    },

    sepolia: {
      url: `https://sepolia.infura.io/v3/${env.INFURA.PROJECT_ID}`,
      accounts: [
        env.ACCOUNTS.SQUEEBO_2.PK,
        // ...accounts.slice(2).map(acct => acct.privateKey)
      ]
    },

    mainnet: {
      url: `https://mainnet.infura.io/v3/${env.INFURA.PROJECT_ID}`,
      accounts: []
    }
  },
  contractSizer: {
    runOnCompile: false
  },
};
