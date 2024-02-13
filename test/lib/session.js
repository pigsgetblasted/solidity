
"use strict";

const Client = require("./client");
const Contract = require("./contract");
const Provider = require("./provider");

const { factoryABI } = require("./helpers");

function Session(web3client, web3contract){
  this.setClient(web3client);
  this.setContract(web3contract);
};

Session.prototype.setClient = function(web3client){
  this.client   = new Client(web3client);
  this.web3client = web3client;
};

Session.prototype.setContract = function(web3contract){
  this.address  = web3contract._address;
  this.contract = Contract.create(web3contract);
  this.contractABI = web3contract._jsonInterface;
  this.provider = new Provider(web3contract.currentProvider);
};

Session.fromEthers = (instance, ABI) => {
  if( !ABI )
    ABI = factoryABI(instance);

  const web3client = new Web3(instance.provider._hardhatProvider);
  const contract = new web3.eth.Contract(ABI, instance.address);
  return new Session(web3client, contract);
};

module.exports = Session;
