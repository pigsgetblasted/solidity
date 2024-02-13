
'use strict';

const { assert } = require("hardhat");

class Ownable{
  assertOwner( expected ){
    it( `Ownable::owner( ${expected} )`, async () =>{
      assert.equal( await this.contract.methods.owner().call(), expected );
    });
  }

  //transferOwnership
}

module.exports = Ownable;
