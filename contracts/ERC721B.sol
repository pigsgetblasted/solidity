
// SPDX-License-Identifier: BSD-3
pragma solidity ^0.8.9;

import {IERC165, IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC721Metadata} from "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

enum TokenType {
  NONE,
  NUCLEAR,
  LARGE,
  MEDIUM,
  SMALL
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


abstract contract ERC721B is Context, ERC165, IERC721, IERC721Metadata, IERC721Errors {
  event Blast(address indexed from, uint16 indexed tokenId, TokenType indexed tokenType, uint32 burnTS, uint32 duration);

  TokenRange public range = TokenRange(
    1,
    1001,
    0,
    0
  );
  
  mapping(address => Owner) public owners;
  mapping(TokenType => uint256) public prices;
  mapping(uint256 => Token) public tokens;

  string private _name;
  string private _symbol;

  mapping(uint256 => address) internal _tokenApprovals;
  mapping(address => mapping(address => bool)) private _operatorApprovals;

  constructor(string memory name_, string memory symbol_){
    _name = name_;
    _symbol = symbol_;
  }

  //public view
  function balanceOf(address owner) public view returns( uint256 balance ){
    if (owner == address(0))
      revert ERC721InvalidOwner(address(0));

    return owners[owner].balance;
  }

  function burned() public view returns(uint256){
    return owners[address(0)].balance;
  }

  function name() external view returns( string memory name_ ){
    return _name;
  }

  function ownerOf(uint256 tokenId) public view virtual returns(address owner){
    if (!_exists(tokenId))
      revert ERC721NonexistentToken(tokenId);

    return tokens[tokenId].owner;
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns( bool isSupported ){
    return
      interfaceId == type(IERC721).interfaceId ||
      interfaceId == type(IERC721Metadata).interfaceId ||
      super.supportsInterface(interfaceId);
  }

  function symbol() external view returns(string memory symbol_){
    return _symbol;
  }

  function totalSupply() public view virtual returns( uint256 ){
    return range.minted - burned();
  }


  //approvals
  function approve(address operator, uint256 tokenId) public virtual{
    address owner = tokens[tokenId].owner;
    if (_msgSender() != owner && !isApprovedForAll(owner, _msgSender()))
      revert ERC721InvalidApprover(_msgSender());

    _approve(operator, tokenId);
  }

  function getApproved(uint256 tokenId) public view returns( address approver ){
    if (!_exists(tokenId))
      revert ERC721NonexistentToken(tokenId);

    return _tokenApprovals[tokenId];
  }

  function isApprovedForAll(address owner, address operator) public view returns( bool isApproved ){
    return _operatorApprovals[owner][operator];
  }

  function setApprovalForAll(address operator, bool approved) public virtual{
    _operatorApprovals[_msgSender()][operator] = approved;
    emit ApprovalForAll(_msgSender(), operator, approved);
  }


  //transfers
  function safeTransferFrom(address from, address to, uint256 tokenId) public virtual{
    safeTransferFrom(from, to, tokenId, "");
  }

  function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual{
    if (!_isApprovedOrOwner(_msgSender(), tokenId))
      revert ERC721InsufficientApproval(msg.sender, tokenId);

    _safeTransfer(from, to, tokenId, _data);
  }

  function transferFrom(address from, address to, uint256 tokenId) public virtual{
    if (!_isApprovedOrOwner(_msgSender(), tokenId))
      revert ERC721InsufficientApproval(msg.sender, tokenId);

    _transfer(from, to, tokenId);
  }


  //internal
  function _approve(address to, uint256 tokenId) internal{
    _tokenApprovals[tokenId] = to;
    emit Approval(tokens[tokenId].owner, to, tokenId);
  }

  function _burn(uint256 tokenId) internal virtual{
    address from = _ownerOf(tokenId);

    unchecked{
      --owners[from].balance;
      ++owners[from].burned;
      ++owners[address(0)].balance;
    }

    // Clear approvals from the previous owner
    delete _tokenApprovals[tokenId];

    uint32 burnTS = uint32(block.timestamp);
    Token memory prev = tokens[tokenId];
    tokens[tokenId] = Token(
      prev.value,
      address(0),
      prev.mintTS,
      burnTS,
      prev.tokenType
    );

    tokens[tokenId].owner = address(0);
    emit Transfer(from, address(0), tokenId);
    emit Blast(from, uint16(tokenId), prev.tokenType, burnTS, burnTS - prev.mintTS);
  }

  function _burnFrom(address from, uint256 tokenId) internal {
    if (ownerOf(tokenId) != from)
      revert ERC721InvalidOwner(from);

    _burn(tokenId);
  }

  function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data) private {
    if (to.code.length > 0) {
      try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, _data) returns (bytes4 retval) {
        if (retval != IERC721Receiver.onERC721Received.selector)
          revert ERC721InvalidReceiver(to);
      } catch (bytes memory reason) {
        if (reason.length == 0) {
          revert ERC721InvalidReceiver(to);
        } else {
          /// @solidity memory-safe-assembly
          // solhint-disable-next-line no-inline-assembly
          assembly {
            revert(add(32, reason), mload(reason))
          }
        }
      }
    }
  }

  function _exists(uint256 tokenId) internal view returns (bool) {
    Token memory token = tokens[tokenId];
    return token.mintTS > 0
        && token.burnTS == 0
        && tokens[tokenId].owner != address(0);
  }

  function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns(bool isApproved) {
    if (!_exists(tokenId))
      revert ERC721NonexistentToken(tokenId);

    address owner = tokens[tokenId].owner;
    return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
  }

  function _mintSequential(uint16 quantity, TokenType tokenType, address recipient) internal {
    _mintSequential(quantity, tokenType, recipient, range.current);
  }

  function _mintSequential(uint16 quantity, TokenType tokenType, address recipient, uint16 tokenId) internal {
    uint256 tokenValue = prices[tokenType];
    Owner memory prev = owners[recipient];
    TokenRange memory _range = range;

    uint16 endTokenId = tokenId + quantity;

    unchecked{
      owners[recipient] = Owner(
        prev.balance + quantity,
        prev.burned,
        prev.nuclear + (tokenType == TokenType.NUCLEAR ? quantity : 0)
      );

      range = TokenRange(
        _range.lower < tokenId ? _range.lower : tokenId,
        _range.current > endTokenId ? _range.current : endTokenId,
        _range.upper > endTokenId ? _range.upper : endTokenId,
        _range.minted + quantity
      );
    }

    for (; tokenId < endTokenId; ++tokenId) {
      address currentOwner = _ownerOf(tokenId);
      if (tokens[tokenId].owner != address(0))
        revert ERC721IncorrectOwner(address(this), tokenId, currentOwner);

      tokens[tokenId] = Token(
        tokenValue,
        recipient,
        uint32(block.timestamp),
        0,
        tokenType
      );
      emit Transfer(address(0), recipient, tokenId);
    }
  }

  function _next() internal virtual returns (uint256 current) {
    return range.current;
  }

  function _ownerOf(uint256 tokenId) internal view virtual returns (address) {
    return tokens[tokenId].owner;
  }

  function _safeTransfer(address from, address to, uint256 tokenId, bytes memory _data) internal {
    _transferFrom(from, to, tokenId);
    _checkOnERC721Received(from, to, tokenId, _data);
  }

  function _transfer(address from, address to, uint256 tokenId) internal virtual {
    if (to == address(0))
      revert ERC721InvalidReceiver(address(0));

    // Clear approvals from the previous owner
    delete _tokenApprovals[tokenId];

    unchecked{
      --owners[from].balance;
      ++owners[to].balance;
    }

    tokens[tokenId].owner = to;
    emit Transfer(from, to, tokenId);
  }

  function _transferFrom(address from, address to, uint256 tokenId) internal virtual {
    if (ownerOf(tokenId) != from)
      revert ERC721InvalidOwner(from);

    _transfer(from, to, tokenId);
  }
}
