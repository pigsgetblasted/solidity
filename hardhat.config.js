
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
    hardhat: {
      // accounts: accounts,
      forking: {
        enabled: true,
        url: `https://sepolia.blast.io`
      },
    },

    goerli: {
      url: `https://goerli.infura.io/v3/${env.INFURA.PROJECT_ID}`,
      accounts: []
    },

    sepolia: {
      url: `https://sepolia.infura.io/v3/${env.INFURA.PROJECT_ID}`,
      accounts: [
        env.ACCOUNTS.BLAST_PIGGIES.PK,
        // ...accounts.slice(2).map(acct => acct.privateKey)
      ]
    },

    "blast-mainnet": {
      url: ``,
      accounts: [
        env.ACCOUNTS.BLAST_PIGGIES.PK,
      ]
    },
    "blast-sepolia": {
      // Block Explorer: https://testnet.blastscan.io
      chainId: 168587773,
      url: `https://sepolia.blast.io`,
      accounts: [
        env.ACCOUNTS.BLAST_PIGGIES.PK,
      ]
    }
  },
  contractSizer: {
    runOnCompile: false
  },
};
