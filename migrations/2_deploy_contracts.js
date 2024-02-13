/*
yarn  hardhat compile
yarn  hardhat test

yarn truffle deploy --network goerli --contract=Migente
yarn truffle run verify Migente --network goerli

yarn truffle deploy --network mainnet --contract=BitBotSociety
yarn truffle run verify BitBotSociety --network mainnet
*/

const { EventEmitter } = require('node:events');
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const log4js = require("log4js");
const Web3 = require("web3");


let logging = console;

class TruffleDeploy{
  deployer;

  constructor( deployer ){
    this.deployer = deployer;
  }

  compileArgs(argv, contractArgs, sendArgs){
    //TODO: convert to equals

    //const contractArgs = [];
    let contractName = null;
    argv.forEach( arg => {
      //TODO: TruffleDeploy.isArg( arg )
      if( arg.length > 6 && arg.substring( 0, 6 ) === '--arg=' ){
        let value = arg.substring( 6 );

        //TODO: TruffleDeploy.isQuoted( value )
        if( value[0] === '"' && value.substring( value.length - 1 ) === '"' ){
          value = arg.substring( 1, arg.length - 2 );
          logging.info({ value });
        }
        else if( value[0] === "'" && value.substring( value.length - 1 ) === "'" ){
          value = arg.substring( 1, arg.length - 2 );
          logging.info({ value });
        }

        //TODO: isHex
        if(/^0x[0-9A-Fa-f]+$/.test(value)){
          logging.info( `WARN: scalar bytes arg: ${value}` );
          contractArgs.push( value );
        }
        else if( !isNaN( value ) ){
          contractArgs.push( Number( value ) );
        }
        else if( value[0] !== '[' && value[0] !== '{' ){
          contractArgs.push( value );
        }

        //TODO: isJSON( value )
        else{
          try{
            const parsed = JSON.parse( value );
            logging.info({ 'XXXXXXXXX': (typeof parsed) });
            if( typeof parsed === 'object' ){
              logging.info( 'arg object' );
              contractArgs.push( parsed );
            }
            else{
              throw new Error( `Unexpected JSON type: ${typeof parsed}` );
              //logging.info( 'arg scalar' );
              //contractArgs.push( value );
            }
          }
          catch( err ){
            logging.warn({ err });
            throw err;
            //contractArgs.push( value );
          }
        }
      }
      else if( arg.length > 11 && arg.substring( 0, 11 ) === '--contract=' ){
        contractName = arg.substring( 11 );
      }
      else if( arg.length > 6 && arg.substring(0, 6) === '--gas=' ){
        sendArgs.gas = arg.substring(6).trim();
        logging.info(`>>> Setting gas: ${sendArgs.gas}`);

        //for display only
        this.deployer.options.gas = sendArgs.gas;
      }
      else if( arg.length > 11 && arg.substring(0, 11) === '--gasPrice=' ){
        sendArgs.gasPrice = arg.substring(11).trim();
        logging.info(`>>> Setting gasPrice: ${sendArgs.gasPrice}`);

        //for display only
        this.deployer.options.gasPrice = sendArgs.gasPrice;
      }
      //maxFeePerGas: undefined,
      //maxPriorityFeePerGas: undefined
      else if( arg.length > 8 && arg.substring(0, 8) === '--nonce=' ){
        sendArgs.nonce = arg.substring(8).trim();
        logging.info(`>>> Setting nonce: ${sendArgs.nonce}`);

        //for display only
        this.deployer.options.nonce = sendArgs.nonce;
      }
    });

    return contractName;
  }

  compileSources( contract ){
    const modPath = path.join( path.dirname( __dirname ), 'node_modules' );
    const projPath = path.dirname( __dirname );


    //metadata.compiler.version
    const metadata = JSON.parse( contract._json.metadata );

    const jsonInput = {};
    jsonInput.language = metadata.language;
    jsonInput.settings = {
      //enabled: metadata.settings.optimizer.enabled
      //runs: metadata.settings.optimizer.runs
      optimizer: metadata.settings.optimizer
    };

    jsonInput.sources = {};
    const append = {};
    Object.keys( metadata.sources ).forEach( source => {
      let modulePath;
      if( source.startsWith( "project:" ) ){
        source = source.substring( 9 );
        modulePath = path.join( projPath, source);
        //logging.info({ projPath, source });

        const content = fs.readFileSync( modulePath ).toString( 'utf8' );
        jsonInput.sources[ source ] = { content };
      }
      else{
        modulePath = path.join( modPath, source );
        //logging.info({ source, modulePath });

        const content = fs.readFileSync( modulePath ).toString( 'utf8' );
        append[ source ] = { content };
      }
    });

    for(const [source, content] of Object.entries(append)){
      jsonInput.sources[ source ] = content;
    }

    return jsonInput;
  }

  configure( contractName ){
    const dt = new Date();
    const rootPath = path.dirname( __dirname );
    const deploymentsPath = path.join( rootPath, "deployments" );
    if( !fs.existsSync( deploymentsPath ) ){
      fs.mkdirSync( deploymentsPath );
    }    

    const date = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const datePath = path.join( deploymentsPath, date );
    if( !fs.existsSync( datePath ) ){
      fs.mkdirSync( datePath );
    }
    
    
    const ts = dt.getHours().toString().padStart(2,'0')
      +dt.getMinutes().toString().padStart(2,'0')
      +dt.getSeconds().toString().padStart(2,'0');

    const tag = `${ts}_${contractName}`;
    this.deployPath = path.join( datePath, tag );
    fs.mkdirSync( this.deployPath );

    const logPath = path.join(this.deployPath, "deploy.log");
    logging.info({ logPath });
    
    log4js.configure({
      disableClustering: true,
      appenders: {
        console: {
          type: "console",
          layout: { type: "colored" }
        },
        dateFile: {
          type: "dateFile",
          filename: logPath,
          keepFileExt: true,
        },
      },
      categories: {
        default: {
          appenders: ["console","dateFile"],
          level: "info",
        },
      },
    });

    logging = log4js.getLogger("index.ts");
    return `${date}/${ts}_${contractName}`;
  }

  async confirm( network ){
    if( [ 'mainnet', 'polygon' ].includes( network ) ){
    // if(['mainnet'].includes( network ) ){
      const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
      });

      const result = await new Promise((resolve, reject) => {
        rl.question( `Network: ${network}, are you sure? `, res => {
          rl.close();

          if( [ '1', 'y', 'yes' ].includes( res ) )
            resolve(true);
          else
            reject(new Error("User cancelled deployment"));
        })
      });

      // logging.info({ result });
      return result;
    }
    else{
      return true;
    }
  }

  getNetworkInfo( deployer ){
    const network = deployer.networks[ deployer.network ];

    //HDWalletProvider
    //logging.warn({ "network.provider": network.provider() });

    const { network_id, from } = network;
    const { gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas } = deployer.options;
    return {
      from,
      network_id,
      gas,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas
    };
  }

  static async process(deployer, network, accounts){
    //logging.log({ network, accounts });

    const sendArgs = {};
    const contractArgs = [];
    const deploy = new TruffleDeploy(deployer);
    const networkInfo = deploy.getNetworkInfo(deployer);
    logging.info({ networkInfo });
    ['gas', 'gasPrice', 'maxPriorityFeePerGas', 'maxFeePerGas'].forEach(key => {
      if(networkInfo[key])
        sendArgs[key] = networkInfo[key];
    });


    const contractName = deploy.compileArgs(process.argv, contractArgs, sendArgs);
    if( !contractName )
      throw new Error( 'No --contract specified' );


    const tag = deploy.configure( contractName );
    if( await deploy.confirm( deployer.network )){
      let contract;
      try{
        logging.info( `Require contract '${contractName}'...` );
        contract = artifacts.require( contractName );
      }
      catch( err ){
        logging.warn( String( err ) );
        logging.warn( `*********** is contract '${contractName}' missing? ***********` );
        return;
      }



      logging.info( `1) Saving ${tag}/verify.json...` );
      const jsonInput = deploy.compileSources( contract );
      fs.writeFileSync( path.join( deploy.deployPath, "verify.json" ), JSON.stringify( jsonInput, null, 2 ));


      logging.info( `2) Saving ${tag}/${contractName}-abi.json...` );
      fs.writeFileSync( path.join( deploy.deployPath, `${contractName}-abi.json` ), JSON.stringify(contract._json.abi) );

      const argStr = contractArgs.length ?
      ' '+ contractArgs.join( ', ' ) +' ': '';
      logging.info( `3) Deploying ${contractName}(${argStr}) to network '${deployer.network}'...` );


      if(Object.keys(sendArgs).length)
        contractArgs.push(sendArgs);


      // HACK
      deployer.options.events = new EventEmitter();
      deployer.options.events.once("deployment:start", eventArgs => {
        if (eventArgs.error) {
          logging.error(Object.keys(eventArgs.error));
          logging.error(String(eventArgs.error));
        }
        else if (eventArgs.estimate) {
          logging.info({ gas: eventArgs.estimate });
          logging.warn({ eventArgs });
        }
        else if (eventArgs.estimateError) {
          logging.error(Object.keys(eventArgs.estimateError));
          logging.error(String(eventArgs.estimateError));

          //reason
          //code
          //argument
          //value
        }
      });

      let truffleContract;
      try{
        truffleContract = await deployer.deploy(contract, ...contractArgs);
        //logging.info({ "truffleContract.contract": truffleContract.contract });
        //truffleContract.address = '0xF432867ECe7C3297a0DEb01eFEB3026497A958b1';
        //truffleContract.transactionHash = '0xdd57b44db0511e3704d816c09a6487eaef778cc5d592aaf24d11479b6b05a14d';
      }
      catch(err){
        //this is noise
        return;
      }


      logging.info( `4) Waiting for confirmation...` );
      await contract.deployed();
      //const truffleContract2 = await contract.deployed();
      //truffleContract2.address = '0xF432867ECe7C3297a0DEb01eFEB3026497A958b1';
      //truffleContract2.transactionHash = '0xdd57b44db0511e3704d816c09a6487eaef778cc5d592aaf24d11479b6b05a14d';

      const network = contract._json.networks[ networkInfo.network_id ];
      //network.address
      //network.transactionHash

      logging.info( `...contract '${contractName}' deployed to address '${network.address}'!` );


      //HDWalletProvider
      const web3 = new Web3( truffleContract.contract.currentProvider );
      //has input Data
      //const txn = await web3.eth.getTransaction( truffleContract.transactionHash );
      const receipt = await web3.eth.getTransactionReceipt( truffleContract.transactionHash );
      const { blockNumber, transactionIndex, transactionHash, from, to, contractAddress, gasUsed, logs } = receipt;
      logging.info({ receipt: { blockNumber, transactionIndex, transactionHash, from, to, contractAddress, gasUsed }});
      //TODO: logs

      //TODO: prompt for verification?
      //const network = contract._json.networks[ network_id ];
      //logging.info( contract._json.networks );
      //return;
    }
  }
}

module.exports = TruffleDeploy.process;
