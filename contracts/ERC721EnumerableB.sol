
// SPDX-License-Identifier: BSD-3
pragma solidity ^0.8.9;

import {IERC165} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import {ERC721B} from "./ERC721B.sol";

abstract contract ERC721EnumerableB is ERC721B, IERC721Enumerable {
  error ERC721OutOfBoundsIndex(address owner, uint256 index);

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721B, IERC165) returns(bool) {
    return interfaceId == type(IERC721Enumerable).interfaceId
      || super.supportsInterface(interfaceId);
  }

  function tokenOfOwnerByIndex(address owner, uint256 index) external view returns(uint256) {
    if (balanceOf(owner) <= index)
      revert ERC721OutOfBoundsIndex(owner, index);


    uint256 count;
    uint256 tokenId;
    for(tokenId = range.lower; tokenId < range.upper; ++tokenId){
      if( owner != tokens[tokenId].owner )
        continue;

      if( index == count++ )
        break;
    }
    return tokenId;
  }

  function tokenByIndex(uint256 index) external view returns(uint256) {
    uint256 tokenId = index + 1;
    if (_exists(tokenId))
      return tokenId;
    else
      revert ERC721NonexistentToken(tokenId);
  }

  function totalSupply() public view override(ERC721B, IERC721Enumerable) returns(uint256){
    return ERC721B.totalSupply();
  }
}
