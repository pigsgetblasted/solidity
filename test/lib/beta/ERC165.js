
"use strict";

function ERC165(){}

ERC165.prototype.supportsInterface = async function(){
  //ERC165 - 0x01ffc9a7;
  const isSupported = await this.methods.supportsInterface( '0x01ffc9a7' ).call();
  return isSupported;
};

module.exports = ERC165;
