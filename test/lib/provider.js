
"use strict";

function Provider(provider){
  this.provider = provider;
};

Provider.prototype.sendAsync = function(command, ...params){
  //TODO: do I need to unwrap this?
  return this.provider.sendAsync({
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

Provider.prototype.increaseTime = async function(time){
  await this.sendAsync('evm_increaseTime', time);
  await this.sendAsync('evm_mine');
};

module.exports = Provider;
