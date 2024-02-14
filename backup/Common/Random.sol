
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

abstract contract Random{
  function _hashData() internal view returns( bytes memory ){
    //uint160 cbVal = uint160( address(block.coinbase) );
    bytes memory hashData = bytes.concat("", bytes20( address(block.coinbase)));  //160 bits

    //uint40 feeVal = uint40( block.basefee  % type(uint40).max );
    hashData = bytes.concat(hashData, bytes5( uint40( block.basefee  % type(uint40).max )));  //200 bits

    //uint32 limVal = uint32( block.gaslimit % type(uint32).max );
    hashData = bytes.concat(hashData, bytes4( uint32( block.gaslimit % type(uint32).max )));  //232 bits

    //uint40 gasVal =  uint40( tx.gasprice  % type(uint40).max );
    return bytes.concat(hashData, bytes5( uint40( tx.gasprice  % type(uint40).max )));  //272 bits
  }

  function _random(bytes memory hashData, uint256 index) internal view returns( uint256 rand ){
    uint256 blockid = block.number > type(uint8).max ?
      block.number - (gasleft() % type(uint8).max) :
      gasleft() % block.number;

    uint256 blkHash = uint256(blockhash( blockid ));
    rand = uint256(keccak256(
      index % 2 == 1 ?
        abi.encodePacked( blkHash, index, hashData ):
        abi.encodePacked( hashData, index, blkHash )
      ));

    return rand;
  }
}
