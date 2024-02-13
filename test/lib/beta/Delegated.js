
'use strict';

const { assert } = require("hardhat");
const Ownable = require("./Ownable");

class Delegated extends Ownable{
  assertDelegate( delegate, expected, from ){
    it( `Delegated::isDelegate( ${delegate} ) ${expected}`, async () =>{
      assert.equal( await this.contract.methods.isDelegate( delegate ).call({ from }), expected );
    });
  }

  setDelegate( delegate, value, from ){
    it( 'Delegated::setDelegate', async () => {
      await this.contract.methods.setDelegate(delegate, value).send({ from });
      assert.equal( await this.contract.methods.isDelegate( delegate ).call({ from }), value );
    });
  }
}

module.exports = Delegated;
