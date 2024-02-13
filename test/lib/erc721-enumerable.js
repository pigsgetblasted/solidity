
'use strict';

const { assert } = require("hardhat");
//const ERC721 = require( './ERC721.js' );

function ERC721Enumerable(){}

ERC721Enumerable.prototype.assertTotalSupply = async function(){
  const totalSupply = await this.methods.totalSupply().call();
  assert.equal(totalSupply.toString(), this.state.totalSupply);
};

class YYY{
  assertInterfaces(){
    super.assertInterfaces();

    it( "IERC721Enumerable::assertInterfaces", async () => {
      //IERC721Enumerable
      const isSupported = await this.contract.methods.supportsInterface( '0x780e9d63' ).call();
      assert.equal( isSupported, true );
    });

    return this;
  }

  assertTotalSupply( expected ){
    it( `IERC721Enumerable::totalSupply( ${expected} )`, async () =>{
      assert.equal( await this.contract.methods.totalSupply().call(), expected );
    });

    return this;
  }

  testERC721Enumerable(){
    it( "IERC721Enumerable::implemenation", async () => {
      //function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, PD721) returns (bool);
  
      //ABOVE: function totalSupply() external view returns (uint256);
      //function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);
      let tokenId = await this.instance.tokenOfOwnerByIndex( this.accounts[1], 0 );
      assert.equal( tokenId, '1' );
  
      tokenId = await this.instance.tokenOfOwnerByIndex( this.accounts[1], 2 );
      assert.equal( tokenId, '3' );
  
      tokenId = await this.instance.tokenOfOwnerByIndex( this.accounts[2], 0 );
      assert.equal( tokenId, '0' );
  
  
      //function tokenByIndex(uint256 index) external view returns (uint256);
      tokenId = await this.instance.tokenByIndex( 0 );
      assert.equal( tokenId, '0' );
  
      tokenId = await this.instance.tokenByIndex( 2 );
      assert.equal( tokenId, '2' );
  
      tokenId = await this.instance.tokenByIndex( 5 );
      assert.equal( tokenId, '5' );
    });

    return this;
  }
}

module.exports = ERC721Enumerable;
