
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

import {IBlast} from "./IBlast.sol";
import {IERC20Rebasing, YieldMode} from "./IERC20Rebasing.sol";

import {ERC721B, TokenType} from "./ERC721B.sol";
import {ERC721EnumerableB} from "./ERC721EnumerableB.sol";
import {Merkle2} from "./Merkle2.sol";

contract PIGGYBOMBS is ERC721EnumerableB, Merkle2{
  error InvalidPayment();
  error InvalidPriceCount();
  error NotAuthorized();
  error NoBalance();
  error OrderExceedsSupply();
  error PaymentFailed();
  error UnsupportedTokenType(uint8);
  error WithdrawError(bytes);

  uint16 public constant MAX_NUKES = 1000;
  IBlast public constant BLAST = IBlast(0x4300000000000000000000000000000000000002);
  IERC20Rebasing public constant WETH = IERC20Rebasing(0x4200000000000000000000000000000000000023);

  uint16 public feePercent = 5;
  uint16 public nextNuke = 1;
  string public tokenURIPrefix;
  string public tokenURISuffix;


  // TODO: enable / disable mint

  constructor()
  ERC721B("PIGGYBOMBS", "PIGGYBOMBS")
  {
    // BLAST.configureClaimableYield();
    WETH.configure(YieldMode.CLAIMABLE);

    prices[TokenType.NUCLEAR] = 0.25 ether;
    prices[TokenType.LARGE] = 0.1 ether;
    prices[TokenType.MEDIUM] = 0.1 ether;
    prices[TokenType.SMALL] = 0.03 ether;
  }

  function burn(uint16[] calldata tokenIds) external {
    uint256 wethValue = 0;
    uint256 count = tokenIds.length;
    for(uint256 i = 0; i < count; ++i) {
      wethValue += tokens[tokenIds[i]].value;
      _burnFrom(msg.sender, tokenIds[i]);

      // TODO: emit burn
    }

    WETH.transfer(msg.sender, wethValue);
  }

  function mint(uint16 quantity, TokenType tokenType, bytes32[] memory proof) external payable {
    // checks
    if (tokenType == TokenType.NONE || uint8(tokenType) >= 5)
      revert UnsupportedTokenType(uint8(tokenType));

    uint256 basePrice = prices[tokenType] * quantity;
    uint256 totalPrice = basePrice + feePercent * basePrice / 100;
    if (tokenType == TokenType.NUCLEAR) {
      if (nextNuke + quantity > MAX_NUKES)
        revert OrderExceedsSupply();

      // TODO: mint limits
      // bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
      // if(!_isValidProof(leaf, proof))
      //   revert NotAuthorized();

      uint16 firstTokenId = nextNuke;

      // effects
      nextNuke += quantity;

      // interactions
      if (WETH.transferFrom(msg.sender, address(this), totalPrice))
        _mintSequential(quantity, tokenType, msg.sender, firstTokenId);
      else
        revert PaymentFailed();
    }
    else {
      // interactions
      if (WETH.transferFrom(msg.sender, address(this), totalPrice))
        _mintSequential(quantity, tokenType, msg.sender);
      else
        revert PaymentFailed();
    }
  }


  // onlyDelegates
  function setFeePercent(uint16 _pct) external onlyEOADelegates {
    feePercent = _pct;
  }

  function setPrices(uint256[] calldata newPrices) external onlyEOADelegates {
    uint256 count = newPrices.length;
    if (count > uint256(type(TokenType).max))
      revert InvalidPriceCount();


    for(uint256 i = 1; i < count; ++i){
      prices[TokenType(i)] = newPrices[i];
    }
  }

  function setTokenURI(
    string calldata prefix,
    string calldata suffix
  ) external onlyEOADelegates {
    tokenURIPrefix = prefix;
    tokenURISuffix = suffix;
  }

  function withdraw() external onlyOwner {
    if(address(this).balance == 0)
      revert NoBalance();

    (bool success, bytes memory data) = payable(owner()).call{ value: address(this).balance }("");
    if(!success)
      revert WithdrawError(data);
  }


  function withdrawETH(address to) external onlyEOADelegates {
    BLAST.claimAllYield(address(this), to);
  }

  function withdrawWETH(address to) external onlyEOADelegates {
    uint256 amount = WETH.getClaimableAmount(address(this));
    WETH.claim(to, amount);

    uint256 balance = WETH.balanceOf(address(this));
    WETH.transfer(to, balance);
  }


  // view
  function getClaimableETH() public view returns (uint256) {
    return BLAST.readClaimableYield(address(this));
  }

  function getClaimableWETH() public view returns (uint256) {
    return WETH.getClaimableAmount(address(this));
  }

  function tokenURI(uint256 tokenId) public override view returns(string memory){
    if(_exists(tokenId))
      return string.concat(tokenURIPrefix, Strings.toString(tokenId), tokenURISuffix);
    else
      revert ERC721NonexistentToken(tokenId);
  }
}
