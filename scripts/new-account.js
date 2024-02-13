
const Web3 = require( 'web3' );

const account = (new Web3()).eth.accounts.create();
console.info({ account })
