
"use strict";

function Contract(web3contract){
  this.befores = {};
  this.afters  = {};

  this.state   = {
    offset: null,
    owners: {},
    tokens: {},
    tokenId: null,
    totalSupply: 0
  }

  this.principal = web3contract;
  this.web3contract = web3contract;
}

Contract.prototype.after = function(methodName, callback){
  this.afters[methodName] = callback;
};

Contract.prototype.before = function(methodName, callback){
  this.befores[methodName] = callback;
};

Contract.prototype._getCaller = function( target, methodName, methodArgs ){
  const before = this.befores[ methodName ];
  const after = this.afters[ methodName ];

  return async function(){
    if(!(methodName in target.methods))
      throw new Error( `Methods '${methodName}' is not defined in contract or ABI` );

    const callArgs = Array.prototype.slice.call( arguments );
    if(before)
      before({ methodName, methodArgs, callArgs });

    const response = await target.methods[ methodName ]( ...methodArgs ).call( ...callArgs );
    if(after)
      after({ methodName, methodArgs, callArgs, response });

    return response;
  };
};

Contract.prototype._getSender = function( target, methodName, methodArgs ){
  const before = this.befores[ methodName ];
  const after = this.afters[ methodName ];

  return async function(){
    //const sendArgs = Array.prototype.slice.call( arguments );
    const sendArgs = arguments[0];
    if(before)
      before({ methodName, methodArgs, sendArgs });

    const response = await target.methods[ methodName ]( ...methodArgs ).send( sendArgs );
    if(after)
      after({ methodName, methodArgs, sendArgs, response });

    return response;
  };
};

Contract.create = (web3contract) => {
  //web3contract.currentProvider

  const instance = new Contract(web3contract);
  instance.methods = new Proxy(web3contract, {
    get( target, methodName ){
      const call = instance._getCaller.bind(instance, target, methodName);
      const send = instance._getSender.bind(instance, target, methodName);

      function getter(){
        const methodArgs = Array.prototype.slice.call( arguments );

        return {
          call: call( methodArgs ),
          send: send( methodArgs )
        };
      };

      return getter;
    }
  });

  return instance;
};



/*
Contract.extend = function( superClass ){
	for(const prop in Contract.prototype){
		try{
			if( Contract.prototype.hasOwnProperty( prop ) ){
				superClass.prototype[ prop ] = Contract.prototype[ prop ];
			}
		}catch( prot ){}
	}
};

*/

/*
class ContractBase{
  contract = null;
  owner    = null;
  options  = {};

  constructor( contract, owner ){
    this.contract = contract;
    this.owner = owner
  }

  fails(description, expect, callback, debug){
    it(`${description} fails`, async () => {
      try{
        const result = callback();
        if( result instanceof Promise )
          await result;

        assert.fail( `${description} succeeded` );
      }
      catch( err ){
        if(  `${err}`.includes( 'AssertionError' ) ){
          throw err;
        }

        if( debug ){
          console.warn({ err: `${err}` });
        }

        assert.include( `${err}`, expect );
      }
    });

    return this;
  }

  async increaseTime( duration ){
    await this.sendRpc('evm_increaseTime', duration );
    await this.sendRpc('evm_mine');
  }

  sendOptions( options ){
    this.options = options;
    return this;
  }

  async sendRpc(command, ...params){
    return new Promise(( resolve, reject ) => {
      this.contract.principal.currentProvider.send({
        method: command,
        params: params,
        jsonrpc: "2.0",
        id: new Date().getTime()
      }, ( err, res ) => {
        if( err )
          reject( err )
        else
          resolve( res );
      });
    });
  };
}
*/

module.exports = Contract;
