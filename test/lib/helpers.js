
const fs = require("fs");
const path = require("path");
const {assert, Web3} = require("hardhat");
//const Web3 = hre.Web3;

const web3 = new Web3(ethers.provider._hardhatProvider);

const cloneComponent = ( cmp ) => {
  let { name, type, internalType, indexed, components } = cmp;
  if( name === null )
    name = "";

  if( !internalType )
    internalType = type;

  const output = {};
  if( indexed || indexed === false ){
    output.indexed = !!indexed;
  }

  if( components ){
    output.components = components.map( cloneComponent );
  }

  output.internalType = internalType;
  output.name = name;
  output.type = type;

  return output;
};

const decodeLog = (abi, log) => {
  const {data, topics} = log;
  if(data?.length > 2)
    return web3.eth.abi.decodeLog(abi.inputs, data, abi.anonymous ? topics : topics.slice(1));

  const decoded = {
    __length__: abi.inputs.length
  };

  for(let i = 0; i < abi.inputs.length; ++i){
    const input = abi.inputs[i];
    const t = abi.anonymous ? i : i+1;
    decoded[i] = web3.eth.abi.decodeParameter(input.type, log.topics[t]);
    if(input.name)
      decoded[input.name] = decoded[i];
  }
  return decoded;
};

const ethersToWeb3 = (instance) => {
  const web3 = new Web3( instance.contract.currentProvider );
  const contract = new web3.eth.Contract( instance.abi, instance.address );
  return [web3, contract];
};

const factoryABI = (instance) => {
  const ABI = instance.interface.fragments.map( f => {
    if( f.type === 'constructor' ){
      const { type, payable, stateMutability } = f;

      return {
        //payable,
        inputs: f.inputs.map(cloneComponent),
        stateMutability,
        type,
      };
    }
    else if( f.type === 'error' ){
      const { type, name } = f;

      return {
        inputs: f.inputs.map(cloneComponent),
        name,
        type,
      };
    }
    else if( f.type === 'event' ){
      const { type, name, anonymous } = f;

      return {
        anonymous,
        inputs: f.inputs.map(cloneComponent),
        name,
        type,
      };
    }
    else if( f.type === 'function' ){
      const { type, name, stateMutability } = f;

      const fn = {
        inputs: f.inputs.map(cloneComponent),
        name,       
        outputs: f.outputs.map(cloneComponent),
        stateMutability,
        type,
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

const factoryToWeb3 = (instance, ABI) => {
  if( !ABI ){
    ABI = factoryABI(instance);
  }

  const web3client = new Web3(instance.provider._hardhatProvider);
  const contract = new web3.eth.Contract(ABI, instance.address);
  return [web3client, contract];
};

const getABI = async (address, options) => {
  address = address.toLowerCase();
  const abiPath = path.join(
    path.dirname(__dirname), 'abi', `${address}.json`);

  const envPath = path.join(
    path.dirname(
      path.dirname(__dirname)), '.env.json');
  const json = fs.readFileSync(envPath);
  const env = JSON.parse(json);

  if(options?.useCache){
    if(fs.existsSync(abiPath)){
      const json = fs.readFileSync(abiPath);
      const data = JSON.parse(json);
      return data;
    }
  }

  const response = await fetch(`http://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${env.ETHERSCAN_API_KEY}`);
  if(response.ok){
    const data = await response.json();
    if(data.status === '1'){
      if(options?.setCache){
        fs.writeFileSync(abiPath, JSON.stringify(data.result));
      }

      return data.result;
    }
  }

  assert.fail();
}

const getLogs = (txn, eventName) => {
  if(eventName){
    if(!txn.events[eventName])
      assert.fail(`No ${eventName} events`);

    const tmp = Array.isArray(txn.events[eventName])
      ? txn.events[eventName].map( log => log.returnValues )
      : [txn.events[eventName].returnValues];

    const logs = tmp.map(log => {
      const len = Object.keys(log).length / 2;
      for(let i = 0; i < len; ++i ){
        delete log[i];
      }

      return log;
    });

    return logs;
  }
  else{
    const logs = {};
    Object.keys(txn.events).forEach(eventName => {
      const tmp = Array.isArray(txn.events[eventName])
        ? txn.events[eventName].map( log => log.returnValues )
        : [txn.events[eventName].returnValues];
  
      logs[eventName] = tmp.map(log => {
        const len = Object.keys(log).length / 2;
        for(let i = 0; i < len; ++i ){
          delete log[i];
        }
  
        return log;
      });
    });

    return logs;
  }
};

const requestRpc = async (provider, command, ...params) => {
  try{
    const result = await provider.request({
      method: command,
      params: params,
      jsonrpc: "2.0",
      id: Date.now()
    });

    return result;
  }
  catch(err){
    console.warn({ err });
    throw err;
  }
};

const sendRpc = (provider, command, ...params) => {
  return provider.sendAsync({
    method: command,
    params: params,
    jsonrpc: "2.0",
    id: Date.now()
  }, ( err, res ) => {
    if( err )
      console.warn({ err });
    //else
    //  console.info({ res });
  });
};

const setBalance = (provider, account, ethAmount) => {
  const weiAmount = Web3.utils.toWei(String(ethAmount));
  const weiHex = '0x'+ BigInt(String(weiAmount)).toString(16);
  return requestRpc(provider, "hardhat_setBalance", account, weiHex);
}

const sleep = (ms) => {
  return new Promise( resolve => {
    console.info(`------ sleep: ${ms} ------`);
    setTimeout( resolve, ms );
  })
};

const transfer = (web3, to, options) => {
  //TODO: helpers
  const sendTx = {
    ...options,
    //from:     from,
    to:       to,
    //gasLimit: Web3.utils.toHex( '100000' ),
    //gasPrice: Web3.utils.toHex( gasPrice ),
    //nonce:    Web3.utils.toHex( nonce ),
    //value:    Web3.utils.toHex( Web3.utils.toWei( '1', 'ether' ) ),
    //data:     '0x00'
  };

  return web3.eth.sendTransaction(sendTx);
};

const toEvmWord = (val) => {
  const t = typeof val;
  if(t === 'number')
    return Web3.utils.padLeft(Web3.utils.numberToHex(val), 64);

  if(val instanceof BigInt)
    return Web3.utils.padLeft(val.toString(16), 64);

  console.log({ t, val });
  return Web3.utils.padLeft(val, 64);
}

const verifyTransfers = (txn, from, to, startToken, endToken) => {
  const transferLogs = txn.logs.filter( log => log.event === 'Transfer' );
  if( transferLogs.length > 0 ){
    _verifyTransfers( transferLogs, from, to, startToken, endToken );
  }
};

const _verifyTransfers = (logs, from, to, startToken, endToken) => {
  assert.equal( logs.length, endToken - startToken + 1 );

  let i = 0;
  for( let tokenId = startToken; tokenId <= endToken; ++tokenId ){
    const log = logs[ i++ ];
    assert.equal( log.args[0], from );
    assert.equal( log.args[1], to );
    assert.equal( `${log.args[2]}`, `${tokenId}` );
  }
};

module.exports = {
  decodeLog,
  ethersToWeb3,
  factoryABI,
  factoryToWeb3,
  getABI,
  getLogs,
  requestRpc,
  sleep,
  sendRpc,
  setBalance,
  transfer,
  verifyTransfers
}
