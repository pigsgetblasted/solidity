
'use strict';

const { assert } = require("hardhat");
const { getLogs } = require( "./helpers" );

const zeroAddress = "0x0000000000000000000000000000000000000000";

function ERC721(){};

ERC721.prototype.assertBalanceOf = async function(...accounts){
  for(let account of accounts){
    const balanceOf = await this.methods.balanceOf(account).call();
    assert.equal(balanceOf, this.state.owners[account].length);
  }
};

ERC721.prototype.assertOwnerOf = async function(txn){
  const transfers = getLogs(txn, 'Transfer');
  assert.isAtLeast(transfers.length, 1);

  for (let transfer of transfers) {
    if (transfer.to !== zeroAddress) {
      const ownerOf = await this.methods.ownerOf(transfer.tokenId).call();
      assert.equal(ownerOf, transfer.to);
    }
  }
};

class XXX{
  assertBalanceOf( account, expected ){
    it( `IERC721::balanceOf( ${account} )`, async () =>{
      assert.equal( await this.contract.methods.balanceOf( account ).call(), expected );
    });

    return this;
  }

  assertInterfaces(){
    it( `IERC721::assertInterfaces()`, async () => {
      //ERC165
      let isSupported = await this.contract.methods.supportsInterface( '0x01ffc9a7' ).call();
      assert.equal( isSupported, true );

      //ERC721
      isSupported = await this.contract.methods.supportsInterface( '0x80ac58cd' ).call();
      assert.equal( isSupported, true );

      //ERC721Metadata
      isSupported = await this.contract.methods.supportsInterface( '0x5b5e139f' ).call();
      assert.equal( isSupported, true );
    });

    return this;
  }

  assertName( expectedName ){
    it( `IERC721::name( ${expectedName} )`, async () =>{
      assert.equal( await this.contract.methods.name().call(), expectedName );
    });

    return this;
  }

  assertSymbol( expectedSymbol ){
    it( `IERC721::symbol( ${expectedSymbol} )`, async () =>{
      assert.equal( await this.contract.methods.symbol().call(), expectedSymbol );
    });

    return this;
  }

  assertMinted( to, quantity ){}

  assertOwnerOf( tokenId, expected ){
    it( `IERC721::ownerOf( ${tokenId} )`, async () => {
      assert.equal( await this.contract.methods.ownerOf( tokenId ).call(), expected );
    });

    return this;
  }

  assertSafeTransferFrom( from, to, tokenId, options ){
    it( `IERC721::safeTransferFrom( ${from}, ${to}, ${tokenId} )`, async () =>{
      await this.contract.methods.safeTransferFrom( from, to, tokenId ).send( options || this.options );
      assert.fail();
    });

    return this;
  }

  assertSupportsInterface( interfaceId ){
    it( `IERC721::supportsInterface( ${interfaceId} )`, async () =>{
      const isSupported = await this.contract.methods.supportsInterface( '0x80ac58cd' ).call();
      assert.equal( isSupported, true );
    });

    return this;
  }

  assertTransferFrom( from, to, tokenId, options ){
    it( `IERC721::transferFrom( ${from}, ${to}, ${tokenId} )`, async () =>{
      await this.contract.methods.transferFrom( from, to, tokenId ).send( options || this.options );
      assert.fail();
    });

    return this;
  }

  /*
  testERC721(){
    it( "IERC721::implementation", async () =>{
      //function balanceOf(address owner) external view returns (uint256 balance);


      let balanceOf = await this.contract.methods.balanceOf( this.accounts[1] ).call();
      assert.equal( balanceOf.toString(), '5' );

      balanceOf = await this.contract.methods.balanceOf( this.accounts[2] ).call();
      assert.equal( balanceOf.toString(), '1' );


      //function ownerOf(uint256 tokenId) external view returns (address owner);
      let ownerOf = await this.contract.methods.ownerOf( 0 );
      assert.equal( ownerOf, this.accounts[1] );

      ownerOf = await this.contract.methods.ownerOf( 4 );
      assert.equal( ownerOf, this.accounts[1] );

      ownerOf = await this.contract.methods.ownerOf( 5 );
      assert.equal( ownerOf, this.accounts[2] );


      //ERC721Batch
      //function isOwnerOf( address account, uint[] calldata tokenIds ) external view returns( bool );
      //function walletOfOwner( address account ) external view returns( uint[] memory );
      let ownerWallet = await this.contract.methods.walletOfOwner( this.accounts[1] );
      ownerWallet = ownerWallet.map( tokenId => tokenId.toString() );
      assert.sameMembers( ownerWallet, [ '0', '1', '2', '3', '4' ] );

      let isOwnerOf = await this.contract.methods.isOwnerOf( this.accounts[1], ownerWallet);
      assert.equal( isOwnerOf, true );


      ownerWallet = await this.contract.methods.walletOfOwner( this.accounts[2] );
      ownerWallet = ownerWallet.map( tokenId => tokenId.toString() );
      assert.sameMembers( ownerWallet, [ '5' ] );

      isOwnerOf = await this.contract.methods.isOwnerOf( this.accounts[2], ownerWallet);
      assert.equal( isOwnerOf, true );

      //TODO: extract by signature
      //function safeTransferFrom(address from, address to, uint256 tokenId) external;
      //function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
      let txn = await call( this.contract.methods, 'safeTransferFrom', this.accounts[1], this.accounts[2], 0, { from: this.accounts[1] });
      verifyTransfers( txn, this.accounts[1], this.accounts[2], 0, 0 );
      assert.equal( await this.contract.methods.balanceOf( this.accounts[1] ), '4' );
      assert.equal( await this.contract.methods.balanceOf( this.accounts[2] ), '2' );
      assert.equal( await this.contract.methods.ownerOf( 0 ), this.accounts[2] );


      txn = await call( this.contract.methods, 'safeTransferFrom', this.accounts[2], this.accounts[1], 5, { from: this.accounts[2] });
      verifyTransfers( txn, this.accounts[2], this.accounts[1], 5, 5 );
      assert.equal( await this.contract.methods.balanceOf( this.accounts[2] ), '1' );
      assert.equal( await this.contract.methods.balanceOf( this.accounts[1] ), '5' );
      assert.equal( await this.contract.methods.ownerOf( 5 ), this.accounts[1] );


      //function transferFrom(address from, address to, uint256 tokenId) external;
      txn = await call( this.contract.methods, 'transferFrom', this.accounts[1], this.accounts[2], 3, { from: this.accounts[1] });
      verifyTransfers( txn, this.accounts[1], this.accounts[2], 3, 3 );
      assert.equal( await this.contract.methods.balanceOf( this.accounts[1] ), '4' );
      assert.equal( await this.contract.methods.balanceOf( this.accounts[2] ), '2' );
      assert.equal( await this.contract.methods.ownerOf( 3 ), this.accounts[2] );
      

      await call( this.contract.methods, 'transferFrom', this.accounts[2], this.accounts[1], 3, { from: this.accounts[2] });
      assert.equal( await this.contract.methods.balanceOf( this.accounts[2] ), '1' );
      assert.equal( await this.contract.methods.balanceOf( this.accounts[1] ), '5' );
      assert.equal( await this.contract.methods.ownerOf( 3 ), this.accounts[1] );


      //sanity check
      ownerWallet = await call( this.contract.methods, 'walletOfOwner', this.accounts[1] );
      ownerWallet = ownerWallet.map( tokenId => tokenId.toString() );
      assert.sameMembers( ownerWallet, [ '1', '2', '3', '4', '5' ] );
    });
  }
  */
}

module.exports = ERC721;
