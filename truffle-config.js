
const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require('web3');

const env = require('./.env.json');


const wallets = {};


//https://www.trufflesuite.com/docs/truffle/reference/configuration
module.exports = {
  //https://github.com/rkalis/truffle-plugin-verify#usage-with-other-chains
  api_keys: {
    //ethereum
    etherscan: env.ETHERSCAN_API_KEY,

    //polygon
    polygonscan: env.POLYSCAN_API_KEY
  },
  compilers: {
    solc: {
      parser: "solcjs",  // Leverages solc-js purely for speedy parsing
      settings: env.COMPILER_SETTINGS,
      version: env.COMPILER_VERSION,
      // A version or constraint - Ex. "^0.5.0"
      // Can also be set to "native" to use a native solc
      //docker: <boolean>, // Use a version obtained through docker

      // contains options for SMTChecker
      //modelCheckerSettings: {}
    }
  },
  networks: {
    mainnet: {
      provider: function() {
        return new HDWalletProvider({
          //providerOrUrl: `https://mainnet.infura.io/v3/${env.INFURA.PROJECT_ID}`,
          providerOrUrl: `wss://mainnet.infura.io/ws/v3/${env.INFURA.PROJECT_ID}`,
          privateKeys: [ env.ACCOUNTS.xxx.PK ]
        });
      },
      network_id:  1,
      // gas:                       4_000_000,
      //gasPrice:             17_000_000_000,
      //maxPriorityFeePerGas:  2_000_000_000,
      //maxFeePerGas:         30_000_000_000,
      //                   100    gwei
      //                       000_000_000
      skipDryRun: true
    },

    devnet: {
      //ok
      // url: 'https://devnet.foolprooflabs.io',

      //ok
      // host:       '192.168.1.31',
      // port:                 8545,

      gas:             5_000_000,
      // gasPrice:   30_500_000_000,
      //         100    gwei
      //             000_000_000
      network_id:          160_000, //chainId
      // networkCheckTimeout: 60000,
      skipDryRun:           true,
      provider: () => {
        if(!wallets.devnet){
          console.log(`Create wallets.devnet`);

          wallets.devnet = new HDWalletProvider({
            // Squeebo(3): 0x86427055b21C1b612AEF5Ac218D7B22D80ef6F37
            privateKeys: [ env.ACCOUNTS.SQUEEBO_3.PK ],
            // providerOrUrl: "http://192.168.1.31:8545",
            url: "https://devnet.foolprooflabs.io",
            pollingInterval: 1000
          });
        }

        return wallets.devnet;
      },
    },

    "base-mainnet": {
      provider: function() {
        return new HDWalletProvider({
          providerOrUrl: `https://mainnet.base.org`,

          privateKeys: [ env.ACCOUNTS.xxx.PK ]
        });
      },
      //gas:              5_000_000,
      // gasPrice:     1_000_000_000,
      //          100    gwei
      //            000_000_000
      network_id: 8453,
      skipDryRun: true
    },

    "base-goerli": {
      provider: function() {
        if(!wallets['base-goerli']){
          wallets['base-goerli'] = new HDWalletProvider(env.ACCOUNTS.xxx.PK, "https://goerli.base.org");
        }
        return wallets['base-goerli'];

        // return new HDWalletProvider({
        //   providerOrUrl: `https://goerli.base.org`,

        //   //Squeebo(2): 0x282D35Ee1b589F003db896b988fc59e2665Fa6a1
        //   privateKeys: [ env.ACCOUNTS.BLAST_PIGGIES.PK ]
        // });
      },
      //gas:              5_000_000,
      gasPrice:     1_000_000_000,
      //          100    gwei
      //            000_000_000
      network_id: 84531,
      skipDryRun: true
    },

    goerli: {
      provider: function() {
        return new HDWalletProvider({
          providerOrUrl: `wss://goerli.infura.io/ws/v3/${env.INFURA.PROJECT_ID}`,

          //Squeebo(2): 0x282D35Ee1b589F003db896b988fc59e2665Fa6a1
          privateKeys: [ env.ACCOUNTS.BLAST_PIGGIES.PK ]
        });
      },
      //gas:              5_000_000,
      //gasPrice:     1_000_000_000,
      //          100    gwei
      //            000_000_000
      network_id: 5,
      skipDryRun: true
    },

    sepolia: {
      provider: function() {
        return new HDWalletProvider({
          providerOrUrl: `https://sepolia.infura.io/v3/${env.INFURA.PROJECT_ID}`,

          //Squeebo(2): 0x282D35Ee1b589F003db896b988fc59e2665Fa6a1
          privateKeys: [ env.ACCOUNTS.BLAST_PIGGIES.PK ]
        });
      },
      //gas:            5_000_000,
      //gasPrice:   2_500_000_000,
      //        100    gwei
      //            000_000_000
      network_id: 11155111,
      skipDryRun: true
    },

    polygon: {
      network_id:                       137,
      // accounts: [ env.ACCOUNTS.SQUEEBO_9_APERTUS.PK ],
      // from: "0x56c844a4842f6f3d29FF4e44e06D0f5dadCE2Aa9",
      gas:                        5_000_000,
      // gasPrice:           100_000_000_000,
      maxPriorityFeePerGas:  30_000_000_000,
      maxFeePerGas:         200_000_000_000,
      //                    100    gwei
      //                        000_000_000
      skipDryRun: true,
      provider: () => {
        if(!wallets.polygon){
          console.log(`Create wallets.polygon`);

          wallets.polygon = new HDWalletProvider({
            privateKeys: [ env.ACCOUNTS.SQUEEBO_9_APERTUS.PK ],
            url: `https://polygon-mainnet.infura.io/v3/${env.INFURA.PROJECT_ID}`,
            pollingInterval: 1000
          });
        }

        return wallets.polygon;
      },
    },

    mumbai: {
      provider: function() {
        //wss://ws-matic-mumbai.chainstacklabs.com
        return new HDWalletProvider({
          providerOrUrl: `https://polygon-mumbai.infura.io/v3/${env.INFURA.PROJECT_ID}`,
        });
      },
      network_id: 80001,
    },

    devnet: {
      //ok
      // url: 'https://devnet.foolprooflabs.io',

      //ok
      // host:       '192.168.1.31',
      // port:                 8545,

      gas:             5_000_000,
      // gasPrice:   30_500_000_000,
      //         100    gwei
      //             000_000_000
      network_id:          160_000, //chainId
      // networkCheckTimeout: 60000,
      skipDryRun:           true,
      provider: () => {
        if(!wallets.devnet){
          console.log(`Create wallets.devnet`);

          wallets.devnet = new HDWalletProvider({
            // Squeebo(3): 0x86427055b21C1b612AEF5Ac218D7B22D80ef6F37
            privateKeys: [ env.ACCOUNTS.xxx.PK ],
            // providerOrUrl: "http://192.168.1.31:8545",
            url: "https://devnet.foolprooflabs.io",
            pollingInterval: 1000
          });
        }

        return wallets.devnet;
      },
    },

    //LOCAL
    development: {
      host: "192.168.1.31",
      port: 8545,
      network_id: "*"
    },
    localfork: {
      provider: function() {
        return new HDWalletProvider({
          providerOrUrl: "http://192.168.1.31:8545",
        });
      },
      network_id: 1
    },
  },
  mocha: {
    timeout: 20000
  },
  plugins: [
    'truffle-plugin-verify'
  ]
};
