
'use strict'

const fs = require( 'fs' );
const path = require( 'path' );

const json = fs.readFileSync( path.join( __dirname, '..', '.env.json' ) );
const env = JSON.parse( json );

const Web3 = require( 'web3' );

(async () => {
  try {
    const web3 = new Web3( 'https://mainnet.infura.io/v3/c9cb8521468c426ca3475822ba4035d0' );
    //const web3 = new Web3( 'https://rinkeby.infura.io/v3/c9cb8521468c426ca3475822ba4035d0' );
    //const web3 = new Web3( 'http://php.foolproof.io/api/1.0/rpc/rinkeby' );

    //from
		const account = web3.eth.accounts.privateKeyToAccount( env.ACCOUNTS.HABIT_NEST.PK );

    //to
    const to = env.ACCOUNTS.SQUEEBO_3.ADDRESS;


    //rinkeby
    //const maxPriorityFeePerGas = 1_500_000_000;
    //const maxFeePerGas         = 1_500_000_011;

    const gasLimit             = BigInt( 21_000 );
    const baseFee              = BigInt(Web3.utils.toWei( '17.0', 'gwei' ));
    const maxPriorityFeePerGas = BigInt(Web3.utils.toWei(  '1.0', 'gwei' ));
    const maxFeePerGas         = maxPriorityFeePerGas + baseFee;
//console.info({ gasLimit, baseFee, maxPriorityFeePerGas, maxFeePerGas });


    const balance = BigInt(await web3.eth.getBalance( account.address ));
    const spend = maxFeePerGas * gasLimit;
    if( balance < spend ){
      console.error( "Not enough ETH" );
      return;
    }



    const transfer = balance - spend;
console.info({ balance, spend, transfer });

    let transaction;
    const type = 1;
    const nonce = await web3.eth.getTransactionCount( account.address );
    if( type === 1 ){
      transaction = {
        type:     Web3.utils.toHex( type ),
        nonce:    Web3.utils.toHex( nonce ),
        gas:      Web3.utils.toHex( `${gasLimit}` ),
        gasPrice: Web3.utils.toHex( `${maxFeePerGas}` ),

        to:       to,
        value:    Web3.utils.toHex( `${transfer}` ),
      };
    }
    /*
    else if( type === 2 ){
      transaction = {
        type:                 Web3.utils.toHex( type ),
        nonce:                Web3.utils.toHex( nonce ),
        maxPriorityFeePerGas: Web3.utils.toHex( `${maxPriorityFeePerGas}` ),
        maxFeePerGas:         Web3.utils.toHex( `${maxFeePerGas}` ),
        gas:                  Web3.utils.toHex( `${gasLimit}` ),

        to:       to,
        value:    Web3.utils.toHex( `${transfer}` ),
      };
    }
    */
    else{
      console.error( `Invalid type: ${type}` );
    }
//console.info( transaction );
//return;


		const signed = await account.signTransaction( transaction );
//console.info({ signed });

		const result = await web3.eth.sendSignedTransaction( signed.rawTransaction );
		console.info({ result });
  }
  catch( err ) {
    console.error({ err });
		console.error( err.stack );
  }
})();
