
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

contract Delegated is Ownable{
  error NotEOA();
  error NotAContract();
  error UnauthorizedDelegate();

  mapping(address => bool) internal _delegates;

  modifier onlyContractDelegates {
    if(!_delegates[msg.sender]) revert UnauthorizedDelegate();
    if(!_isContract(msg.sender)) revert NotAContract();

    _;
  }

  modifier onlyDelegates {
    if(!_delegates[msg.sender]) revert UnauthorizedDelegate();

    _;
  }

  modifier onlyEOADelegates {
    if(!_delegates[msg.sender]) revert UnauthorizedDelegate();
    if(_isContract(msg.sender)) revert NotEOA();

    _;
  }

  constructor()
    Ownable(msg.sender){
    setDelegate(owner(), true);
  }

  //onlyOwner
  function isDelegate(address addr) external view onlyOwner returns(bool) {
    return _delegates[addr];
  }

  function setDelegate(address addr, bool isDelegate_) public onlyOwner {
    _delegates[addr] = isDelegate_;
  }

  function transferOwnership(address newOwner) public virtual override onlyOwner {
    setDelegate(newOwner, true);
    super.transferOwnership(newOwner);
  }

  function _isContract(address _addr) private view returns (bool) {
    uint32 size;
    assembly {
      size := extcodesize(_addr)
    }
    return (size > 0);
  }
}
