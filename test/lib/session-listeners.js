
const Contract = require("./contract");
const ERC721 = require("./erc721");
const ERC721Enumerable = require("./erc721-enumerable");

Contract.prototype = Object.assign(
  Contract.prototype,
  ERC721.prototype,
  ERC721Enumerable.prototype
);

const trunks = {
  contract: {
    after: () => {}
  }
};


trunks.contract.after( "mint", ({ methodArgs, sendArgs, response }) => {
  const [quantity, proof] = methodArgs;

  const transfers = getLogs(response, 'Transfer');
  assert.lengthOf(transfers, quantity);

  const state = trunks.contract.state;
  if(state.offset === null){
    state.offset = Number(transfers[0].tokenId);
    state.tokenId = Number(transfers[0].tokenId);
  }

  let tokenId = state.tokenId;
  for(let transfer of transfers){
    transfer.tokenId = Number(transfer.tokenId);

    //TODO: lowercase
    assert.strictEqual(transfer.from, zeroAddress);
    assert.strictEqual(transfer.to, sendArgs.from);

    //assume sequential
    assert.equal(transfer.tokenId, tokenId++);

    //TODO: lowercase
    if(state.owners[transfer.to]?.length)
      state.owners[transfer.to].push(transfer.tokenId);
    else
      state.owners[transfer.to] = [transfer.tokenId];

    state.tokens[transfer.tokenId] = {
      owner: transfer.to
    };
  }

  state.tokenId += quantity;
  state.totalSupply += quantity;
});

trunks.contract.after( "mintTo", ({ methodArgs, sendArgs, response }) => {
  const [quantities, recipients] = methodArgs;
  const total = quantities.reduce(( prev, next ) => {
    return (prev || 0) + next;
  }, 0);

  const transfers = getLogs(response, 'Transfer');
  assert.lengthOf(transfers, total);

  const state = trunks.contract.state;
  if(state.offset === null){
    state.offset = parseInt(transfers[0].tokenId);
    state.tokenId = parseInt(transfers[0].tokenId);
  }

  let tokenId = state.tokenId;
  for(let transfer of transfers){
    transfer.tokenId = Number(transfer.tokenId);

    //console.log({ transfer });
    assert.strictEqual(transfer.from, zeroAddress);
    assert.strictEqual(transfer.to, recipients[0]);

    //assume sequential
    assert.equal(transfer.tokenId, tokenId++);

    if(state.owners[transfer.to]?.length)
      state.owners[transfer.to].push(transfer.tokenId);
    else
      state.owners[transfer.to] = [transfer.tokenId];

    state.tokens[transfer.tokenId] = {
      owner: transfer.to
    };
  }

  state.tokenId += total;
  state.totalSupply += total;
});

trunks.contract.after( "safeTransferFrom", ({ methodArgs, sendArgs, response }) => {
  let [from, to, tokenId] = methodArgs;
  tokenId = Number(tokenId);

  const transfers = getLogs(response, 'Transfer');
  assert.lengthOf(transfers, 1);

  const state = trunks.contract.state;
  for(let transfer of transfers){
    transfer.tokenId = Number(transfer.tokenId);

    //TODO: lowercase
    assert.strictEqual(transfer.from, from);
    assert.strictEqual(transfer.to, to);

    //assume sequential
    assert.equal(transfer.tokenId, tokenId);

    const foundAt = state.owners[from].indexOf(tokenId);
    state.owners[from].splice(foundAt, 1);

    if(state.owners[transfer.to]?.length)
      state.owners[transfer.to].push(transfer.tokenId);
    else
      state.owners[transfer.to] = [transfer.tokenId];

    state.tokens[transfer.tokenId] = {
      owner: transfer.to
    };
  }
});

trunks.contract.after( "transferFrom", ({ methodArgs, sendArgs, response }) => {
  let [from, to, tokenId] = methodArgs;
  tokenId = Number(tokenId);

  const transfers = getLogs(response, 'Transfer');
  assert.lengthOf(transfers, 1);

  const state = trunks.contract.state;
  for(let transfer of transfers){
    transfer.tokenId = Number(transfer.tokenId);

    //TODO: lowercase
    assert.strictEqual(transfer.from, from);
    assert.strictEqual(transfer.to, to);

    //assume sequential
    assert.equal(transfer.tokenId, tokenId);

    const foundAt = state.owners[from].indexOf(tokenId);
    state.owners[from].splice(foundAt, 1);

    if(state.owners[transfer.to]?.length)
      state.owners[transfer.to].push(transfer.tokenId);
    else
      state.owners[transfer.to] = [transfer.tokenId];

    state.tokens[transfer.tokenId] = {
      owner: transfer.to
    };
  }
});

trunks.contract.after( "burn", ({ methodArgs, sendArgs, response }) => {
  const tokenIds = methodArgs[0].map(Number);
  const {from} = sendArgs;

  const transfers = getLogs(response, 'Transfer');
  const state = trunks.contract.state;
  for(let i = 0; i < transfers.length; ++i){
    const tokenId = tokenIds[i];
    const transfer = transfers[i];
    transfer.tokenId = Number(transfer.tokenId);

    //TODO: lowercase
    assert.strictEqual(transfer.from, from);
    assert.strictEqual(transfer.to, zeroAddress);

    //assume sequential
    assert.equal(transfer.tokenId, tokenId);

    const foundAt = state.owners[transfer.from].indexOf(tokenId);
    assert.notEqual(foundAt, -1);
    state.owners[transfer.from].splice(foundAt, 1);


    if(state.owners[transfer.to]?.length)
      state.owners[transfer.to].push(transfer.tokenId);
    else
      state.owners[transfer.to] = [transfer.tokenId];

    state.tokens[transfer.tokenId] = {
      owner: transfer.to
    };
  }

  state.totalSupply -= tokenIds.length;
});

trunks.contract.after( "burnToMint", ({ methodArgs, sendArgs, response }) => {
  const tokenIds = methodArgs[0].map(Number);
  const {from} = sendArgs;

  const transfers = getLogs(response, 'Transfer');
  const state = trunks.contract.state;
  for(let i = 0; i < tokenIds.length; ++i){
    const tokenId = tokenIds[i];
    const transfer = transfers[i];
    transfer.tokenId = Number(transfer.tokenId);

    //TODO: lowercase
    assert.strictEqual(transfer.from, from);
    assert.strictEqual(transfer.to, zeroAddress);

    //assume sequential
    assert.equal(transfer.tokenId, tokenId);

    const foundAt = state.owners[transfer.from].indexOf(tokenId);
    assert.notEqual(foundAt, -1);
    state.owners[transfer.from].splice(foundAt, 1);


    if(state.owners[transfer.to]?.length)
      state.owners[transfer.to].push(transfer.tokenId);
    else
      state.owners[transfer.to] = [transfer.tokenId];

    state.tokens[transfer.tokenId] = {
      owner: transfer.to
    };
  }

  state.totalSupply -= tokenIds.length;



  let tokenId = state.tokenId;
  for(let i = tokenIds.length; i < transfers.length; ++i){
    const transfer = transfers[i];
    transfer.tokenId = Number(transfer.tokenId);

    //TODO: lowercase
    assert.strictEqual(transfer.from, zeroAddress);
    assert.strictEqual(transfer.to, sendArgs.from);

    //assume sequential
    
    assert.equal(transfer.tokenId, tokenId++);

    if(state.owners[transfer.to]?.length)
      state.owners[transfer.to].push(transfer.tokenId);
    else
      state.owners[transfer.to] = [transfer.tokenId];

    state.tokens[transfer.tokenId] = {
      owner: transfer.to
    };

    state.tokenId++;
    state.totalSupply++;
  }
});

trunks.contract.after( "burnFrom", ({ methodArgs, sendArgs, response }) => {
  let [tokenIds, from] = methodArgs;
  tokenIds = tokenIds.map(Number);

  const transfers = getLogs(response, 'Transfer');
  const state = trunks.contract.state;
  for(let i = 0; i < transfers.length; ++i){
    const tokenId = tokenIds[i];
    const transfer = transfers[i];

    //TODO: lowercase
    assert.strictEqual(transfer.from, from);
    assert.strictEqual(transfer.to, zeroAddress);

    //assume sequential
    assert.equal(transfer.tokenId, tokenId);

    const foundAt = state.owners[transfer.from].indexOf(tokenId);
    assert.notEqual(foundAt, -1);
    state.owners[transfer.from].splice(foundAt, 1);


    if(state.owners[transfer.to]?.length)
      state.owners[transfer.to].push(transfer.tokenId);
    else
      state.owners[transfer.to] = [transfer.tokenId];

    state.tokens[transfer.tokenId] = {
      owner: transfer.to
    };
  }

  state.totalSupply -= tokenIds.length;
});

