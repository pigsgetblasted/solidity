
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {IBlast} from "./IBlast.sol";
// import {IERC20Rebasing, YieldMode} from "./IERC20Rebasing.sol";

import {ERC721B, Token, TokenType} from "./ERC721B.sol";
import {ERC721EnumerableB} from "./ERC721EnumerableB.sol";
import {Merkle2} from "./Merkle2.sol";

enum SaleState {
  NONE,
  ALLOWLIST,
  PUBLIC,
  BOTH
}

contract PIGGYBOMB is ERC721EnumerableB, Merkle2{
  error InvalidPayment();
  error InvalidPriceCount();
  error NotAuthorized();
  error NoBalance();
  error OrderExceedsAllowance();
  error OrderExceedsSupply();
  error PaymentFailed();
  error SalesClosed(SaleState);
  error UnsupportedTokenType(uint8);
  error WithdrawError(bytes);

  uint16 public constant MAX_NUKES = 1000;
  IBlast public constant BLAST = IBlast(0x4300000000000000000000000000000000000002);

  uint16 public feePercent = 5;
  uint16 public nextNuke = 1;
  uint16 public nukeLimit = 1;
  SaleState public saleState = SaleState.NONE;
  string public tokenURIPrefix;
  string public tokenURISuffix;


  // TODO: enable / disable mint

  constructor()
  ERC721B("PIGS GET BLASTED", "PIGGYBOMB")
  {
    BLAST.configureClaimableGas();
    BLAST.configureClaimableYield();

    prices[TokenType.NUCLEAR] = 0.10 ether;
    prices[TokenType.LARGE]   = 0.25 ether;
    prices[TokenType.MEDIUM]  = 0.10 ether;
    prices[TokenType.SMALL]   = 0.03 ether;
  }

  function burn(uint16[] calldata tokenIds) external {
    uint256 totalValue = 0;
    uint256 count = tokenIds.length;
    for(uint256 i = 0; i < count; ++i) {
      totalValue += tokens[tokenIds[i]].value;
      _burnFrom(msg.sender, tokenIds[i]);
    }

    Address.sendValue(payable(msg.sender), totalValue);
  }

  function mint(uint16 quantity, TokenType tokenType, bytes32[] memory proof) external payable {
    if (saleState == SaleState.NONE)
      revert SalesClosed(SaleState.NONE);

    if (tokenType == TokenType.NONE || uint8(tokenType) >= 5)
      revert UnsupportedTokenType(uint8(tokenType));

    uint256 totalPrice = prices[tokenType] * quantity;
    uint256 totalFee = totalPrice * 5 / 100;
    uint256 totalValue = totalPrice + totalFee;
    if (tokenType == TokenType.NUCLEAR) {
      if (!(saleState == SaleState.ALLOWLIST || saleState == SaleState.BOTH))
        revert SalesClosed(SaleState.ALLOWLIST);

      if (owners[msg.sender].nuclear + quantity > nukeLimit)
        revert OrderExceedsAllowance();

      if (nextNuke + quantity > MAX_NUKES)
        revert OrderExceedsSupply();

      if (msg.value != totalValue)
        revert InvalidPayment();

      bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
      if(!_isValidProof(leaf, proof))
        revert NotAuthorized();

      uint16 firstTokenId = nextNuke;

      nextNuke += quantity;

      _mintSequential(quantity, tokenType, msg.sender, firstTokenId);
    }
    else {
      if (!(saleState == SaleState.PUBLIC || saleState == SaleState.BOTH))
        revert SalesClosed(SaleState.PUBLIC);

      if (msg.value != totalValue)
        revert InvalidPayment();

      _mintSequential(quantity, tokenType, msg.sender, range.current);
    }
  }


  // onlyDelegates
  function setFeePercent(uint16 _pct) external onlyEOADelegates {
    feePercent = _pct;
  }

  function setNuclearLimit(uint16 limit) external onlyEOADelegates {
    nukeLimit = limit;
  }

  function setPrices(uint256[] calldata newPrices) external onlyEOADelegates {
    uint256 count = newPrices.length;
    if (count > uint256(type(TokenType).max))
      revert InvalidPriceCount();


    for(uint256 i = 1; i < count; ++i){
      prices[TokenType(i)] = newPrices[i];
    }
  }

  function setSaleState(SaleState newState) external onlyEOADelegates {
    if (newState <= type(SaleState).max)
      saleState = newState;
  }

  function setTokenURI(
    string calldata prefix,
    string calldata suffix
  ) external onlyEOADelegates {
    tokenURIPrefix = prefix;
    tokenURISuffix = suffix;
  }

  function withdraw(address payable to) external onlyOwner {
    uint256 amount = address(this).balance;
    if(amount > 0)
      Address.sendValue(to, amount);
    else
      revert NoBalance();
  }

  function withdrawETH(address to) external onlyEOADelegates {
    BLAST.claimAllYield(address(this), to);
  }

  function withdrawGas(address to) external onlyEOADelegates {
    BLAST.claimAllGas(address(this), to);
  }


  // view
  function getClaimableETH() public view returns (uint256) {
    return BLAST.readClaimableYield(address(this));
  }

  function getClaimableGas() public view returns (uint256) {
    uint256 etherBalance;
    (, etherBalance, , ) = BLAST.readGasParams(address(this));
    return etherBalance;
  }

  function tokenURI(uint256 tokenId) public override view returns(string memory){
    if(_exists(tokenId)) {
      Token memory token = tokens[tokenId];
      return string.concat(tokenURIPrefix, Strings.toString(uint8(token.tokenType)), tokenURISuffix);
    }
    else
      revert ERC721NonexistentToken(tokenId);
  }
}
