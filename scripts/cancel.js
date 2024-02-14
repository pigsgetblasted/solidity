
'use strict'

const fs = require( 'fs' );
const path = require( 'path' );

const json = fs.readFileSync( path.join( __dirname, '..', '.env.json' ) );
const env = JSON.parse( json );

const Web3 = require( 'web3' );

(async () => {
  try {
    // const web3 = new Web3( `https://mainnet.infura.io/v3/${env.INFURA.PROJECT_ID}` );
    const web3 = new Web3( `https://sepolia.infura.io/v3/${env.INFURA.PROJECT_ID}` );

    const PRIVATE_KEY = env.ACCOUNTS.BLAST_PIGGIES.PK;
		const account = web3.eth.accounts.privateKeyToAccount( PRIVATE_KEY );

    //const nonce = 6;
    const nonce = await web3.eth.getTransactionCount( account.address );


    /**
     * SETTINGS
     **/
    const baseFee              = Web3.utils.toWei( '20.0', 'gwei' );
    const gasLimit             = 50_000;
    const maxPriorityFeePerGas = Web3.utils.toWei(  '2.0', 'gwei' );
    const maxFeePerGas         = (BigInt( maxPriorityFeePerGas ) + BigInt( baseFee )).toString();
    console.info({ baseFee, maxPriorityFeePerGas, maxFeePerGas });
    
    //rinkeby
    //const maxPriorityFeePerGas = 1_500_000_000;
    //const maxFeePerGas         = 1_500_000_011;

    //const hundred = "1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890";
    const transaction = {
      nonce:                Web3.utils.toHex( nonce ),
      //maxPriorityFeePerGas: Web3.utils.toHex( `${maxPriorityFeePerGas}` ),
      //maxFeePerGas:         Web3.utils.toHex( `${maxFeePerGas}` ),
      gas:                  Web3.utils.toHex( gasLimit ),
      gasPrice:             Web3.utils.toHex( `${maxFeePerGas}` ),

      //from:     account.address,
      to:       account.address,
      //data:     Web3.utils.toHex( hundred + hundred + hundred + hundred + hundred + hundred + hundred + hundred ),
      //value: 0
    };

		const signed = await account.signTransaction( transaction );
		console.info({ signed });

		const result = await web3.eth.sendSignedTransaction( signed.rawTransaction );
		console.info({ result });
  }
  catch( err ) {
    console.error({ err });
		console.error( err.stack );
  }
})();
