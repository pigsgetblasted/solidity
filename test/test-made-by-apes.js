
const {assert, ethers, Web3} = require("hardhat");
const log4js = require("log4js");

const Provider = require("./lib/provider");

const hardhatProvider = ethers.provider._hardhatProvider;
const web3client = new Web3(hardhatProvider);

let logging = console;

contract( 'MadeByApes', (accts) => {
  let owner, ownerSigner;
  const accounts = [];
  const signers = [];
  
  it("configures logging", async () => {
    log4js.configure({
      disableClustering: true,
      appenders: {
        console: {
          type: "console",
          layout: { type: "colored" }
        },
        // dateFile: {
        //   type: "dateFile",
        //   filename: logPath,
        //   keepFileExt: true,
        // },
      },
      categories: {
        default: {
          appenders: ["console"], //,"dateFile"],
          level: "info",
          // enable line numbers in output
          // enableCallStack: true
        },
      },
    });

    logging = log4js.getLogger("test-made-by-apes.js");
  });

  it("loads accounts", async () => {
    owner = accts.shift();
    //logging.info({ owner });
  
    accounts.push( ...accts );
    //logging.info({ accounts });

    signers.push( ...(await ethers.getSigners()) );
    ownerSigner = signers.shift();
  });

  let bayc;
  it("deploys BAYC", async () => {
    const EasyERC721 = await ethers.getContractFactory("EasyERC721");
    bayc = await EasyERC721.deploy("Bored Ape Yacht Club", "BAYC");
    logging.info('\tINFO: BAYC.address', bayc.address);
  });

  let mba;
  it("deploys MadeByApes", async () => {
    const MadeByApes = await ethers.getContractFactory("MadeByApes");
    mba = await MadeByApes.deploy();
    logging.info('\tINFO: MadeByApes.address', mba.address);
  });

  let mbaProxy;
  it("deploys MBAProxy", async () => {
    const initialize = {
      inputs: [
        { internalType: 'address', name: 'baycAddress', type: 'address' }
      ],
      name: 'initialize',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    };

    const initializeData = web3client.eth.abi.encodeFunctionCall(initialize, [
      bayc.address
    ]);
    logging.warn({ initializeData });

    const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const proxy = await ERC1967Proxy.deploy(mba.address, initializeData);
    logging.info('\tINFO: ERC1967Proxy.address', proxy.address);

    mbaProxy = new ethers.Contract(proxy.address, mba.interface, ownerSigner);
  });

  let fpt;
  it("deploys MadeByApesFPT", async () => {
    const MadeByApesFPT = await ethers.getContractFactory("MadeByApesFPT");
    fpt = await MadeByApesFPT.deploy();
    logging.info('\tINFO: MadeByApesFPT.address', fpt.address);
  });

  let fptProxy
  it("deploys MBAFPTProxy", async () => {
    // 0x8129fc1c
    const initialize = {
      inputs: [
        { internalType: 'address', name: 'principal', type: 'address' }
      ],
      name: 'initialize',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    };

    const initializeData = web3client.eth.abi.encodeFunctionCall(initialize, [
      mbaProxy.address
    ]);
    logging.warn({ initializeData });

    const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const proxy = await ERC1967Proxy.deploy(fpt.address, initializeData);
    logging.info('\tINFO: ERC1967Proxy.address', proxy.address);

    fptProxy = new ethers.Contract(proxy.address, fpt.interface, ownerSigner);
  });

  after(() => {
    if(!bayc)
      assert.fail("Bored Ape Yacht Club (BAYC) not deployed");

    if(!mba)
      assert.fail("MadeByApes (MBA) not deployed");

    if(!mbaProxy)
      assert.fail("MadeByApes Proxy not deployed");

    if(!fpt)
      assert.fail("MadeByApesFPT (MBAFPT) not deployed");

    if(!fptProxy)
      assert.fail("MadeByApesFPT Proxy not deployed");


    describe("test MBA delegates", function(){
      it("add/remove account[17] as delegate", async () => {
        let isDelegate = await mbaProxy.isDelegate(accounts[17]);
        assert.isFalse(isDelegate);

        await mbaProxy.setDelegate(accounts[17], true);
        isDelegate = await mbaProxy.isDelegate(accounts[17]);
        assert.isTrue(isDelegate);

        await mbaProxy.setDelegate(accounts[17], false);
        isDelegate = await mbaProxy.isDelegate(accounts[17]);
        assert.isFalse(isDelegate);
      });

      it("add account[18] as delegate", async () => {
        let isDelegate = await mbaProxy.isDelegate(accounts[18]);
        assert.isFalse(isDelegate);

        await mbaProxy.setDelegate(accounts[18], true);
        isDelegate = await mbaProxy.isDelegate(accounts[18]);
        assert.isTrue(isDelegate);
      });

      it("delegates can't modify other delegates", async () => {
        try{
          await mbaProxy.connect(signers[18]).setDelegate(accounts[17], true);
          // isDelegate = await mbaProxy.isDelegate(accounts[17]);
          // assert.isFalse(isDelegate);
        }
        catch(ex){
          assert.include(String(ex), "OwnableUnauthorizedAccount");
        }
      });
    });


    describe("test FPT delegates", function(){
      it("add/remove account[15] as delegate", async () => {
        let isDelegate = await mbaProxy.isDelegate(accounts[15]);
        assert.isFalse(isDelegate);

        await mbaProxy.setDelegate(accounts[15], true);
        isDelegate = await mbaProxy.isDelegate(accounts[15]);
        assert.isTrue(isDelegate);

        await mbaProxy.setDelegate(accounts[15], false);
        isDelegate = await mbaProxy.isDelegate(accounts[15]);
        assert.isFalse(isDelegate);
      });

      it("add account[16] as delegate", async () => {
        let isDelegate = await mbaProxy.isDelegate(accounts[16]);
        assert.isFalse(isDelegate);

        await mbaProxy.setDelegate(accounts[16], true);
        isDelegate = await mbaProxy.isDelegate(accounts[16]);
        assert.isTrue(isDelegate);
      });

      it("delegates can't modify other delegates", async () => {
        try{
          await mbaProxy.connect(signers[16]).setDelegate(accounts[15], true);
          // isDelegate = await mbaProxy.isDelegate(accounts[17]);
          // assert.isFalse(isDelegate);
        }
        catch(ex){
          assert.include(String(ex), "OwnableUnauthorizedAccount");
        }
      });
    });


    // describe("test mint", function(){
    //   it("can mint to owner", async () => {
    //     let txn = await mbaProxy.mint(accounts[0], "prop1", "desc1");
    //     let receipt = await txn.wait();
    //     // logging.info(txn, receipt);

    //     let supply = await mbaProxy.totalSupply()
    //     assert.equal(supply, 1);

    //     let ownerOf = await mbaProxy.ownerOf(1)
    //     assert.equal(ownerOf, owner);
    //     assert.notEqual(ownerOf, accounts[0]);


    //     await mbaProxy.mint(accounts[1], "prop2", "desc2");
    //     supply = await mbaProxy.totalSupply()
    //     assert.equal(supply, 2);

    //     ownerOf = await mbaProxy.ownerOf(2)
    //     assert.equal(ownerOf, owner);
    //     assert.notEqual(ownerOf, accounts[1]);


    //     await mbaProxy.connect(signers[18]).mint(accounts[2], "prop3", "desc3");
    //     supply = await mbaProxy.totalSupply()
    //     assert.equal(supply, 3);

    //     ownerOf = await mbaProxy.ownerOf(3)
    //     assert.equal(ownerOf, owner);
    //     assert.notEqual(ownerOf, accounts[2]);


    //     // only delegates can mint
    //     try{
    //       await mbaProxy.connect(signers[0]).mint(accounts[2], "prop3", "desc3");
    //     }
    //     catch(ex) {
    //       assert.include(String(ex), "UnauthorizedDelegate");
    //       // logging.warn(ex);
    //     }
    //   });
    // });

    describe("greenfield proposal", function(){
      it("accounts[3] with BAYC creates proposal", async () => {
        const name = await mbaProxy.name();
        console.log({ name });

        const symbol = await mbaProxy.symbol();
        console.log({ symbol });

        // setup
        await bayc.setTokens(accounts[3], [17]);
        await mbaProxy.setFPT(fptProxy.address);
        await fptProxy.setDelegate(mbaProxy.address, true);

        // initiate proposal
        await mbaProxy.connect(signers[3]).propose(17, "Prop1", "Description1");

        // approve proposal
        console.warn('approve');
        // 1. get block time
        const blockNumber = await web3client.eth.getBlockNumber();
        const block = await web3client.eth.getBlock(blockNumber);

        // 2. set expiration from block time
        await mbaProxy['approve(uint256,uint64,bytes)'](1, block.timestamp + 120, []);


        // TODO!! FIX
        let ownerOf = await fptProxy.ownerOf(1);
        // logging.warn({ ownerOf });
        assert.equal(ownerOf, accounts[3]);


        // transfer BAYC token, and reverify
        await bayc.connect(signers[3]).transferFrom(accounts[3], accounts[10], 17);

        let prop = await mbaProxy.proposal(1);
        // logging.warn({ prop });
        // INVALID // 5
        assert.equal(prop.status, 5);


        // verify proposal token is owned by MBA owner
        ownerOf = await mbaProxy.ownerOf(1);
        // logging.warn({ ownerOf });
        assert.equal(ownerOf, owner);


        // verify proposal FPT is now invalid
        ownerOf = await fptProxy.ownerOf(1);
        // logging.warn({ ownerOf });
        assert.equal(ownerOf, "0x0000000000000000000000000000000000000000");
        // TODO: throw, ERC721NonexistentToken ???



        // test expiration
        const provider = new Provider(hardhatProvider);
        provider.increaseTime(125);

        prop = await mbaProxy.proposal(1);
        // logging.warn({ prop });
        // EXPIRED // 6
        assert.equal(prop.status, 6);

        // verify proposal token is owned by MBA owner
        ownerOf = await mbaProxy.ownerOf(1);
        // logging.warn({ ownerOf });
        assert.equal(ownerOf, owner);

        // TODO: throw, ERC721NonexistentToken ???
        ownerOf = await fptProxy.ownerOf(1);
        // logging.warn({ ownerOf });
        assert.equal(ownerOf, "0x0000000000000000000000000000000000000000");
        // TODO: throw, ERC721NonexistentToken ???
      });
    });
  });
});
