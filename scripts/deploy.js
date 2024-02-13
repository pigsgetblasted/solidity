
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const {ethers, network} = require("hardhat");
const log4js = require("log4js");

let logging = console;


class HardhatDeploy{
  deployPath;
  receipt;
  signers;

  async compileArgs() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });


    const contractName = await new Promise((resolve) => {
      rl.question( `Contract name[:path]=`, arg => {
        resolve(arg);
      });
    });

    console.info(`Loading contract "${contractName}"...`);
    const contract = await ethers.getContractFactory(contractName);
    console.info(`... loaded.`);

    const contractArgs = [];
    for(let i = 0; i < contract.interface.deploy.inputs.length; ++i){
      const input = contract.interface.deploy.inputs[i];
      await new Promise((resolve) => {
        rl.question( ` - parameter[${i}] ${input.name} (${input.type})=`, arg => {
          //TODO: verify type?

          contractArgs.push(arg);
          resolve(arg);
        })
      });
    }

    // TODO: override gasPrice?
    // TODO: override gas?

    rl.close();

    return {
      contract,
      contractName,
      contractArgs
    };
  }

  compileOverrides() {
    const sendArgs = {};
    const networkInfo = this.getNetworkInfo();

    const keys = ['gas', 'gasPrice'];
    keys.forEach(key => {
      const value = networkInfo[key];      
      switch(key){
        case 'gas':
          if (value && value !== 'auto')
            sendArgs.gasLimit = networkInfo[key];
          break;

        case 'gasPrice':
          if (value && value !== 'auto')
            sendArgs.gasPrice = networkInfo[key];
          break;
      }
    });

    return sendArgs;
  }

  compileSources(contractName) {
    const projPath = path.dirname(__dirname);

    // dev: open the hardhat cache to find where the contract artifacts are
    const cachePath = path.join(projPath, 'cache/solidity-files-cache.json');
    const cache = require(cachePath);

    let contractInfo;
    for(const [_, info] of Object.entries(cache.files)){
      if(info.artifacts.includes(contractName))
        contractInfo = info;
    }
    if (!contractInfo)
      throw new Error(`Artifact for ${contractName} not found`);


    const debugPath = path.join(projPath, 'artifacts', contractInfo.sourceName, `${contractName}.dbg.json`);    
    const data = require(debugPath);

    const buildInfoPath = path.join(path.dirname(debugPath), data.buildInfo);
    const buildInfo = require(buildInfoPath);

    const jsonInput = {};
    jsonInput.language = buildInfo.input.language;
    jsonInput.settings = {
      optimizer: buildInfo.input.settings.optimizer
    };

    jsonInput.sources = {};
    for(const [source, data] of Object.entries(buildInfo.input.sources)){
      jsonInput.sources[source] = { content: data.content };
    };

    return jsonInput;
  }

  configure(contractName, suffix){
    const dt = new Date();
    const rootPath = path.dirname( __dirname );
    const deploymentsPath = path.join( rootPath, "deployments" );
    if( !fs.existsSync( deploymentsPath ) ){
      fs.mkdirSync( deploymentsPath );
    }    

    const date = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const datePath = path.join( deploymentsPath, `${date}_${network.name}` );
    if (!fs.existsSync( datePath ))
      fs.mkdirSync( datePath );
    
    
    const ts = dt.getHours().toString().padStart(2,'0')
      +dt.getMinutes().toString().padStart(2,'0')
      +dt.getSeconds().toString().padStart(2,'0');

    const tag = `${ts}_${contractName}`;
    this.deployPath = path.join(datePath, `${tag}${suffix}`);
    fs.mkdirSync(this.deployPath);

    const logPath = path.join(this.deployPath, "deploy.log");
    // logging.info({ logPath });
    
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

  async confirmNetwork(networkName){
    if (['base-mainnet', 'mainnet', 'polygon'].includes(networkName)) {
    // if(['mainnet'].includes( network ) ){
      const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
      });

      const result = await new Promise((resolve, reject) => {
        rl.question( `Network: ${networkName}, are you sure? (1,y,yes) `, (res) => {
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

  async confirmProxy() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  
    const result = await new Promise((resolve, reject) => {
      rl.question( `Deploy FiatTokenProxy for the previous contract? (1,y,yes) `, res => {
        rl.close();

        if ([ '1', 'y', 'yes' ].includes(res))
          resolve(true);
        else
          reject(new Error("User cancelled deployment"));
      })
    });

    return result;
  }

  async deploy(
    contractName,
    contractArgs,
    sendArgs,
    tag,
    contractPath
  ) {
    let contract;

    try{
      logging.info( `Require contract '${contractName}'...` );
      contract = await ethers.getContractFactory(
        contractPath
          ? `${contractPath}:${contractName}`
          : contractName
      );
    }
    catch( err ){
      // logging.warn( String( err ) );
      logging.warn( `*********** is contract '${contractName}' missing? ***********` );
      throw err;
    }

    logging.info( `1) Saving ${tag}/verify.json...` );
    const jsonInput = this.compileSources(contractName);
    fs.writeFileSync(
      path.join(this.deployPath, "verify.json" ),
      JSON.stringify( jsonInput, null, 2 )
    );

    logging.info( `2) Saving ${tag}/${contractName}-abi.json...` );

    const abi = HardhatDeploy.factoryABI(contract.interface.fragments);
    fs.writeFileSync(
      path.join(this.deployPath, `${contractName}-abi.json`),
      JSON.stringify(abi)
    );

    const argStr = contractArgs.length ? ' '+ contractArgs.join(', ') +' ': '';
    logging.info( `3) Deploying ${contractName}(${argStr}) to network '${network.name}'...` );


    if (Object.keys(sendArgs).length) {
      contractArgs.push(sendArgs);
    }


    let instance;
    try{
      instance = await contract.deploy(...contractArgs);
    }
    catch(deployErr){
      //this is usually noise
      console.warn(contractArgs);
      // console.warn({ deployErr });
      throw deployErr;
    }


    logging.info( `4) Waiting for confirmation...` );
    const receipt = await instance.deployTransaction.wait();
    // console.log({ receipt: receipt });


    logging.info( `...contract '${contractName}' deployed to address '${receipt.contractAddress}'!` );

    const { blockNumber, transactionIndex, transactionHash, from, to, contractAddress, gasUsed, logs } = receipt;
    logging.info({ receipt: { blockNumber, transactionIndex, transactionHash, from, to, contractAddress, gasUsed }});
    return {
      instance,
      receipt
    };
  }

  async deployContract() {
    const {
      contractName,
      contractArgs
    } = await this.compileArgs();

    const suffix = '';
    const contractPath = '';
    const sendArgs = this.compileOverrides();
    const tag = this.configure(contractName, suffix);
    return this.deploy(contractName, contractArgs, sendArgs, tag, contractPath);
  }

  // async deployProxy(tokenAddress){
  //   const contractArgs = [tokenAddress];
  //   const contractName = 'FiatTokenProxy';

  //   const sendArgs = {};
  //   const tag = this.configure(contractName);
  //   await this.deploy(contractName, contractArgs, sendArgs, tag);
  // }

  getNetworkInfo() {
    let {from, gas, gasPrice} = network.config;
    if (!from && this?.signers?.[0]) {
      from = this.signers[0].address;
    }

    return {
      from,
      gas,
      gasPrice
    };
  }

  async loadSigners() {
    this.signers = await ethers.getSigners();
    if(this?.signers?.length >= 1)
      return this.signers;
    else
      throw new Error(`Not enough accounts provided for ${network.name}`);
  }

  static cloneComponent(cmp) {
    let { name, type, internalType, indexed, components } = cmp;
    if(!name)
      name = "";
  
    if(!internalType)
      internalType = type;
  
    const output = {
      internalType,
      name,
      type
    };
    if(indexed || indexed === false){
      output.indexed = !!indexed;
    }
  
    if(components){
      output.components = components.map( HardhatDeploy.cloneComponent );
    }

    return output;
  };

  static factoryABI(fragments) {
    const ABI = fragments.map((f) => {
      if( f.type === 'constructor' ){
        const { type, payable, stateMutability } = f;
  
        return {
          //payable,
          inputs: f.inputs.map(HardhatDeploy.cloneComponent),
          stateMutability,
          type,
        };
      }
      else if( f.type === 'error' ){
        const { type, name } = f;
  
        return {
          inputs: f.inputs.map(HardhatDeploy.cloneComponent),
          name,
          type,
        };
      }
      else if( f.type === 'event' ){
        const { type, name, anonymous } = f;
  
        return {
          anonymous,
          inputs: f.inputs.map(HardhatDeploy.cloneComponent),
          name,
          type,
        };
      }
      else if( f.type === 'function' ){
        const { type, name, stateMutability } = f;
  
        const fn = {
          name,
          stateMutability,
          type,
          inputs: f.inputs.map(HardhatDeploy.cloneComponent),
          outputs: f.outputs.map(HardhatDeploy.cloneComponent),
        };
  
        return fn;
      }
      else{
        console.info({ f });
        process.exit( 55 );
      }
    });
  
    return ABI;
  };
}

(async () => {
  try{
    const deployer = new HardhatDeploy();
    if (!(await deployer.confirmNetwork(network.name)))
      return;

    await deployer.loadSigners();
    await deployer.deployContract();
  }
  catch(err){
    console.error(err);
    process.exit(1);
  }
  finally{
    process.exit(0);
  }
})();
