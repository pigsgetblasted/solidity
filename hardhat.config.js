
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
        enabled: false,
        url: `https://sepolia.blast.io`
      },
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
