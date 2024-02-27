
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC721, ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import {IBlast} from "./IBlast.sol";
import {IBlastPoints} from "./IBlastPoints.sol";

// import {ERC721B, Token, TokenType} from "./ERC721B.sol";
// import {ERC721Batch} from "./ERC721Batch.sol";
import {Merkle2} from "./Merkle2.sol";

enum SaleState {
  NONE,
  ALLOWLIST,
  PUBLIC,
  BOTH
}

enum TokenType {
  NONE,
  NUCLEAR,
  LARGE,
  MEDIUM,
  SMALL
}

struct ConfigData {
  uint256 totalBurned;
  uint16 feePercent;
  SaleState saleState;
  uint256 totalSupply;

  uint256[] prices;
}

struct Owner{
  uint16 balance;
  uint16 burned;
  uint16 nuclear;
}

struct Token{
  uint256 value;
  address owner; //160
  uint32 mintTS;
  uint32 burnTS;
  TokenType tokenType;
}

struct TokenRange{
  uint16 lower;
  uint16 current;
  uint16 upper;
  uint16 minted;
}

contract PIGGYBOMB is ERC721Enumerable, Merkle2, ReentrancyGuard{
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

  event Blast(address indexed from, uint16 indexed tokenId, TokenType indexed tokenType, uint32 burnTS, uint32 duration);

  IBlast public BLAST;
  IBlastPoints public BLAST_POINTS;
  uint16 public constant MAX_NUKES = 1000;

  uint16 public feePercent = 5;
  uint256 public mintFees = 0;
  uint16 public nextNuke = 1;
  uint16 public nextPiggy = 1001;
  uint16 public nukeLimit = 1;
  SaleState public saleState = SaleState.NONE;
  uint16 public totalBurned = 0;
  string public tokenURIPrefix = "";
  string public tokenURISuffix = "";

  mapping(address => uint16[]) public burned;
  mapping(address => Owner) public owners;
  mapping(TokenType => uint256) public prices;
  mapping(uint256 => Token) public tokens;

  constructor(address _blastContract, address _pointsContract, address _pointsOperator)
  ERC721("PIGS GET BLASTED", "PIGGYBOMB")
  {
    if (_blastContract != address(0)) {
      BLAST = IBlast(_blastContract);
      BLAST.configureClaimableGas();
      BLAST.configureClaimableYield();
    }

    if (_pointsContract != address(0)) {
      setBlastPointsConfig(_pointsContract, _pointsOperator);
    }

    prices[TokenType.NUCLEAR] = 0.10 ether;
    prices[TokenType.LARGE]   = 0.25 ether;
    prices[TokenType.MEDIUM]  = 0.10 ether;
    prices[TokenType.SMALL]   = 0.03 ether;
  }

  receive() external payable onlyEOADelegates {
    mintFees += msg.value;
  }

  function burn(uint16[] calldata tokenIds) external nonReentrant {
    uint16 tokenId;
    uint256 count = tokenIds.length;
    uint32 burnTS = uint32(block.timestamp);

    totalBurned += uint16(count);
    owners[msg.sender].burned += uint16(count);

    // validate and calculate
    uint256 totalValue = 0;
    for(uint256 i = 0; i < count; ++i) {
      tokenId = tokenIds[i];
      if (ownerOf(tokenId) == msg.sender) {
        burned[msg.sender].push(tokenId);

        Token memory token = tokens[tokenId];
        totalValue += token.value;
        tokens[tokenId].burnTS = burnTS;

        _burn(tokenId);
        emit Blast(
          msg.sender,
          uint16(tokenId),
          token.tokenType,
          burnTS,
          burnTS - token.mintTS
        );
      }
      else {
        revert ERC721InvalidOwner(msg.sender);
      }
    }

    Address.sendValue(payable(msg.sender), totalValue);
  }

  function mint(uint16 quantity, TokenType tokenType, bytes32[] memory proof) external payable {
    if (saleState == SaleState.NONE)
      revert SalesClosed(SaleState.NONE);

    if (tokenType == TokenType.NONE || uint8(tokenType) >= 5)
      revert UnsupportedTokenType(uint8(tokenType));


    uint256 firstTokenId;
    uint16 nukeQuantity = 0;
    Owner memory prev = owners[msg.sender];
    uint256 priceEach = prices[tokenType];
    uint256 totalPrice = priceEach * quantity;
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


      firstTokenId = nextNuke;
      nextNuke += quantity;
      nukeQuantity = quantity;
    }
    else {
      if (!(saleState == SaleState.PUBLIC || saleState == SaleState.BOTH))
        revert SalesClosed(SaleState.PUBLIC);

      if (msg.value != totalValue)
        revert InvalidPayment();


      firstTokenId = nextPiggy;
      nextPiggy += quantity;
    }


    mintFees += totalFee;
    owners[msg.sender] = Owner(
      prev.balance + quantity,
      prev.burned,
      prev.nuclear + nukeQuantity
    );

    for(uint256 i = 0; i < quantity; ++i){
      _mint(msg.sender, firstTokenId + i);
      tokens[firstTokenId + i] = Token(
        priceEach,
        msg.sender,
        uint32(block.timestamp),
        0,
        tokenType
      );
    }
  }


  // onlyDelegates
  function setBlastPointsConfig(address _pointsContract, address _pointsOperator) public {
    BLAST_POINTS = IBlastPoints(_pointsContract); 
    BLAST_POINTS.configurePointsOperator(_pointsOperator);
  }

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

  function withdrawFees(address payable to) external nonReentrant onlyOwner {
    if(mintFees > 0) {
      uint256 value = mintFees;
      mintFees = 0;
      Address.sendValue(to, value);
    }
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

  function getConfig() external view returns (ConfigData memory) {
    uint256[] memory priceArray = new uint256[](5);
    priceArray[1] = prices[TokenType.NUCLEAR];
    priceArray[2] = prices[TokenType.LARGE];
    priceArray[3] = prices[TokenType.MEDIUM];
    priceArray[4] = prices[TokenType.SMALL];
    ConfigData memory data = ConfigData(
      totalBurned,
      feePercent,
      saleState,
      totalSupply(),

      priceArray
    );

    return data;
  }

  function getTokens(uint256[] calldata tokenIds) external view returns (Token[] memory) {
    uint256 count = tokenIds.length;
    Token[] memory result = new Token[](count);
    for(uint256 i = 0; i < count; ++i){
      result[i] = tokens[tokenIds[i]];
    }
    return result;
  }

  function tokenURI(uint256 tokenId) public override view returns(string memory){
    _requireOwned(tokenId);
    return string.concat(tokenURIPrefix, Strings.toString(uint8(tokens[tokenId].tokenType)), tokenURISuffix);
  }

  function tokensOfOwner(address owner, uint256 limit, uint256 startIdx) public view returns (uint256[] memory) {
    uint256 endIdx = balanceOf(owner);
    if (limit != 0 && startIdx + limit < endIdx) {
      endIdx = startIdx + limit;
    }

    uint256[] memory tokenIds = new uint256[](endIdx - startIdx);
    for (uint256 i = startIdx; i < endIdx; ++i) {
      tokenIds[i] = tokenOfOwnerByIndex(owner, i);
    }
    return tokenIds;
  }

  function burnedOfOwner(address owner, uint256 limit, uint256 startIdx) public view returns (uint256[] memory) {
    uint16[] memory burnedTokenIds = burned[owner];
    uint256 endIdx = burnedTokenIds.length;
    if (limit != 0 && startIdx + limit < endIdx) {
      endIdx = startIdx + limit;
    }

    uint256[] memory tokenIds = new uint256[](endIdx - startIdx);
    for (uint256 i = startIdx; i < endIdx; ++i) {
      tokenIds[i] = burnedTokenIds[i];
    }
    return tokenIds;
  }
}
