
"use strict";

const { Web3 } = require("hardhat");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");

function Merkle(){
  this.accounts = {};
  this.tree = null;
};

Merkle.prototype.getHexRoot = function(){
  return this.tree.getHexRoot();
};

Merkle.prototype.getProof = function(account){
  account = account.toLowerCase();
  if(account in this.accounts){
    return this.tree.getHexProof(this.accounts[account].leaf);
  }
  else{
    return [];
  }
};

Merkle.prototype.load = function(accounts){
  accounts.sort();

  const leafNodes = accounts.map(account => {
    const normalized = this.normalize(account);
    const leaf = keccak256(normalized);
    this.accounts[account.toLowerCase()] = {
      account,
      leaf,
    };
    return leaf;
  });

  this.tree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
};

Merkle.prototype.normalize = function( account ){
  try{
    return Web3.utils.toChecksumAddress( account );
  }
  catch( err ){
    return account;
  }
};

module.exports = Merkle;
