
"use strict";

function Client( web3client ){
  this.web3client = web3client;
};

Client.prototype.getBalance = function( account ){
  return this.web3client.eth.getBalance( account );
};

Client.prototype.getBlock = async function(){
  const blockNum = await this.getBlockNumber();
  return this.web3client.eth.getBlock( blockNum );
};

Client.prototype.getBlockNumber = function(){
  return this.web3client.eth.getBlockNumber();
};

Client.prototype.sendTransaction = function(options){
  const sendTx = {
    ...options,
    //from:     from,
    //to:       to,
    //gasLimit: Web3.utils.toHex( '100000' ),
    //gasPrice: Web3.utils.toHex( gasPrice ),
    //nonce:    Web3.utils.toHex( nonce ),
    //value:    Web3.utils.toHex( Web3.utils.toWei( '1', 'ether' ) ),
    //data:     '0x00'
  };

  return this.web3client.eth.sendTransaction( sendTx );
};

Client.prototype.transfer = function(from, to, value){
  const options = {
    from,
    to,
    value
  };

  return this.sendTransaction(options);
};

module.exports = Client;
