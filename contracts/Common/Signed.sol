
// SPDX-License-Identifier: BSD-3
pragma solidity ^0.8.9;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Signed{
  address internal _signer;

  constructor(address signer) {
    _setSigner( signer );
  }

  function _createHash(bytes memory data) internal virtual view returns (bytes32) {
    return keccak256( abi.encodePacked( address(this), msg.sender, data ) );
  }

  function _getSigner(bytes32 hashed, bytes memory signature) internal pure returns (address) {
    bytes32 rehashed = MessageHashUtils.toEthSignedMessageHash( hashed );
    return ECDSA.recover(rehashed, signature);
  }

  function _getSigner(
    bytes32 hashed,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal pure returns (address) {
    bytes32 rehashed = MessageHashUtils.toEthSignedMessageHash( hashed );
    return ECDSA.recover(rehashed, v, r, s);
  }

  function _isAuthorizedSigner(address extracted) internal view virtual returns (bool) {
    return extracted == _signer;
  }

  function _setSigner(address signer) internal{
    _signer = signer;
  }

  function _verifySignature(bytes memory data, bytes memory signature) internal view returns (bool) {
    address extracted = _getSigner( _createHash( data ), signature );
    return _isAuthorizedSigner(extracted);
  }

  function _verifySignature(
    bytes memory data,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal view returns (bool) {
    address extracted = _getSigner(_createHash( data ), v, r, s);
    return _isAuthorizedSigner(extracted);
  }
}
