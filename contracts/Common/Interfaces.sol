
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC20Metadata.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC721Enumerable.sol";
import "@openzeppelin/contracts/interfaces/IERC721Metadata.sol";
import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC1155.sol";
import "@openzeppelin/contracts/interfaces/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/interfaces/IERC1155Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";


contract Interfaces {
  function IERC20interfaceId() external pure returns(bytes4){
    return type(IERC20).interfaceId;
  }

  function IERC20MetadatainterfaceId() external pure returns(bytes4){
    return type(IERC20Metadata).interfaceId;
  }

  function IERC165interfaceId() external pure returns(bytes4){
    return type(IERC165).interfaceId;
  }

  function IERC721interfaceId() external pure returns(bytes4){
    return type(IERC721).interfaceId;
  }

  function IERC721EnumerableinterfaceId() external pure returns(bytes4){
    return type(IERC721Enumerable).interfaceId;
  }

  function IERC721MetadatainterfaceId() external pure returns(bytes4){
    return type(IERC721Metadata).interfaceId;
  }

  function IERC721ReceiverinterfaceId() external pure returns(bytes4){
    return type(IERC721Receiver).interfaceId;
  }

  function IERC1155interfaceId() external pure returns(bytes4){
    return type(IERC1155).interfaceId;
  }

  function IERC1155MetadataURIinterfaceId() external pure returns(bytes4){
    return type(IERC1155MetadataURI).interfaceId;
  }

  function IERC1155ReceiverinterfaceId() external pure returns(bytes4){
    return type(IERC1155Receiver).interfaceId;
  }

  function IERC2981interfaceId() external pure returns(bytes4){
    return type(IERC2981).interfaceId;
  }
}
