
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Delegated} from "./Delegated.sol";

contract Merkle2 is Delegated{
  bytes32 public merkleRootPrimary;
  bytes32 public merkleRootSecondary;

  function updateMerkleRoot(bytes32 merkleRoot) public onlyEOADelegates {
    merkleRootSecondary = merkleRootPrimary;
    merkleRootPrimary = merkleRoot;
  }

  function setMerkleRoot(bytes32 merkleRoot) public onlyEOADelegates {
    merkleRootSecondary = bytes1(0x01);
    merkleRootPrimary = merkleRoot;
  }

  function _isValidProof(bytes32 leaf, bytes32[] memory proof) internal view returns(bool) {
    return _isValidProofPrimary(leaf, proof)
      || _isValidProofSecondary(leaf, proof);
  }

  function _isValidProofPrimary(bytes32 leaf, bytes32[] memory proof) internal view returns(bool) {
    return MerkleProof.processProof(proof, leaf) == merkleRootPrimary;
  }

  function _isValidProofSecondary(bytes32 leaf, bytes32[] memory proof) internal view returns(bool) {
    return MerkleProof.processProof(proof, leaf) == merkleRootSecondary;
  }
}
