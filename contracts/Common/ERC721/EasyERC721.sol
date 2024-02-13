// SPDX-License-Identifier: BSD-3
pragma solidity ^0.8.9;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Address, Delegated} from "../Delegated.sol";
import {ERC721B, ERC721Batch} from "./ERC721Batch.sol";

contract EasyERC721 is ERC721Batch, Delegated{
  using Strings for uint256;

  string private _tokenURIPrefix = "https://website.com/metadata/";
  string private _tokenURISuffix = ".json";

  constructor( string memory name, string memory symbol )
    ERC721B(name, symbol)
    // solhint-disable-next-line no-empty-blocks
  {}

  // solhint-disable-next-line no-empty-blocks
  receive() external payable {}

  function withdraw() external onlyOwner {
    uint256 totalBalance = address(this).balance;
    require(totalBalance > 0, "no funds available");
    Address.sendValue(payable(owner()), totalBalance);
  }

  function tokenURI(uint tokenId) public view virtual override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
    return string(abi.encodePacked(_tokenURIPrefix, tokenId.toString(), _tokenURISuffix));
  }

  function setTokens(address newOwner, uint16[] calldata tokenIds) external {
    for(uint256 i; i < tokenIds.length; ++i ){
      uint16 tokenId = tokenIds[i];
      if( tokens[ tokenId ].owner == address(0) ){
        _mintSequential(newOwner, tokenId, 1, true);
      }
      else{
        _transfer(tokens[ tokenId ].owner, newOwner, tokenId);
      }
    }
  }

  function setBaseURI(string calldata _newPrefix, string calldata _newSuffix) external{
    _tokenURIPrefix = _newPrefix;
    _tokenURISuffix = _newSuffix;
  }


  // delegated
  //onlyDelegates
  function burnFrom(address account, uint[] calldata tokenIds) external onlyDelegates{
    unchecked{
      for(uint256 i=0; i < tokenIds.length; ++i){
        _burn(account, tokenIds[i]);
      }
    }
  }

  function mintTo(address[] calldata recipient, uint16[] calldata quantity) external payable onlyDelegates{
    require(quantity.length == recipient.length, "unbalanced recipients and quantities" );

    unchecked{
      for(uint i=0; i < recipient.length; ++i){
        _mintSequential(recipient[i], quantity[i], false);
      }
    }
  }
}
