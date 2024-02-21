
const {assert, ethers, Web3} = require("hardhat");
const log4js = require("log4js");
const Merkle = require("./lib/merkle");

// const Provider = require("./lib/provider");

// const hardhatProvider = ethers.provider._hardhatProvider;
// const web3client = new Web3(hardhatProvider);
// const ethersClient = new ethers.providers.Web3Provider(hardhatProvider);
const merkle = new Merkle();

let logging = console;

contract("PIGGYBOMBS", (accts) => {
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

    logging = log4js.getLogger("test-piggybombs.js");
  });

  it("loads accounts", async () => {
    owner = accts.shift();
    //logging.info({ owner });
  
    accounts.push( ...accts );
    //logging.info({ accounts });

    signers.push( ...(await ethers.getSigners()) );
    ownerSigner = signers.shift();
  });

  it("loads merkle tree", () => {
    merkle.load(accounts.slice(0,9));
  });

  let piggies;
  it("deploys PIGGYBOMBS", async () => {
    try{
      const PIGGYBOMBS = await ethers.getContractFactory("PIGGYBOMBS");
      piggies = await PIGGYBOMBS.deploy();
      logging.info('\tINFO: PIGGYBOMBS.address', piggies.address);
    }
    catch(err){
      console.warn({err});
    }
  });

  let weth;
  it("loads WETH", async () => {
    const wethABI = require('./abi/WETH.json');
    // const wethArtifact = require('E:\\sites\\piggies-solidity\\artifacts\\contracts\\IERC20Rebasing.sol\\IERC20Rebasing.json');
    const wethAddress = '0x4200000000000000000000000000000000000023';
    weth = new ethers.Contract(wethAddress, wethABI, ownerSigner);
  });

  after(() => {
    if(!piggies)
      assert.fail("PIGGYBOMBS (PIGGYBOMBS) not deployed");


    describe("Greenfield Allowlist", function(){
      it("set merkle", async () => {
        const hexRoot = merkle.getHexRoot()
        await piggies.connect(ownerSigner).setMerkleRoot(hexRoot);
      });

      it("open sales", async () => {
        await piggies.connect(ownerSigner).setSaleState(1);
      });

      it("must approve weth", async () => {
        const signer = signers[0];
        let wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, 0);


        try{
          const proof = merkle.getProof(signer.address);
          // console.log({proof});

          await piggies.connect(signer).mint(1, 1, proof);
          assert.fail("WETH not approved");
        }
        catch(err){
          // logging.warn({ err });
          assert.include(String(err), "0x13be252b");
        }
      });

      it("must have enough weth", async () => {
        const signer = signers[0];
        // approve
        await weth.connect(signer).approve(piggies.address, '1000000000000000000');

        const wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, 0);

        try{
          const proof = merkle.getProof(signer.address);
          // console.log({proof});

          await piggies.connect(signer).mint(1, 1, proof);
          assert.fail("unsifficient WETH");
        }
        catch(err){
          // logging.warn({ err });
          assert.include(String(err), "0xf4d678b8");
        }
      });

      it("must be allowlist", async () => {
        const signer = signers[10];

        // deposit 1 ether
        await weth.connect(signer).deposit({
          value: '1000000000000000000'
        });

        // approve
        await weth.connect(signer).approve(piggies.address, '1000000000000000000');

        const wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, '1000000000000000000');


        try{
          const proof = merkle.getProof(signer.address);
          // console.log({proof});

          await piggies.connect(signer).mint(1, 1, proof);
          assert.fail("not allowlisted");
        }
        catch(err){
          // logging.warn({ err });
          assert.include(String(err), "NotAuthorized()");
        }
      });

      it("mint nuclear", async () => {
        const signer = signers[0];

        // deposit 1 ether
        await weth.connect(signer).deposit({
          value: '1000000000000000000'
        });


        let wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, '1000000000000000000');

        const proof = merkle.getProof(signer.address);
        // console.log({proof});

        const txn = await piggies.connect(signer).mint(1, 1, proof);
        // let rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, '895000000000000000');
      });

      it("burn nuclear", async () => {
        const signer = signers[0];
        const txn = await piggies.connect(signer).burn([1]);
        // rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        const wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, '995000000000000000');


        try{
          await piggies.connect(signer).burn([1]);
          assert.fail("Can't burn twice");
        }
        catch(err){
          // logging.warn({err});
          assert.include(String(err), "ERC721NonexistentToken(1)");
        }
      });

      it("mint and burn nuclear 2", async () => {
        const signer = signers[1];

        // deposit 1 ether
        await weth.connect(signer).deposit({
          value: '1000000000000000000'
        });

        // approve
        await weth.connect(signer).approve(piggies.address, '1000000000000000000');

        let wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, '1000000000000000000');


        try{
          const proof = merkle.getProof(signer.address);
          await piggies.connect(signer).mint(2, 1, proof);
        }
        catch(err){
          // logging.warn({ err });
          assert.include(String(err), "OrderExceedsAllowance()");
        }


        const proof = merkle.getProof(signer.address);
        let txn = await piggies.connect(signer).mint(1, 1, proof);
        // let rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, '895000000000000000');

        txn = await piggies.connect(signer).burn([2]);
        // rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, '995000000000000000');


        try{
          await piggies.connect(signer).burn([2]);
          assert.fail("Can't burn twice");
        }
        catch(err){
          // logging.warn({err});
          assert.include(String(err), "ERC721NonexistentToken(2)");
        }
      });
    });

    describe("Greenfield Public", function(){
      it("mint public", async () => {
        const signer = signers[10];

        // deposit 1 ether
        await weth.connect(signer).deposit({
          value: '1000000000000000000'
        });

        // approve
        await weth.connect(signer).approve(piggies.address, '1000000000000000000');

        try{
          const proof = merkle.getProof(signer.address);
          console.log({proof});

          await piggies.connect(signer).mint(2, 2, proof);
          assert.fail("sales closed");
        }
        catch(err){
          // logging.warn({ err });
          assert.include(String(err), "SalesClosed(2)");
        }
      });

      it("open sales", async () => {
        await piggies.connect(ownerSigner).setSaleState(3);
      });

      it("mint and burn large", async () => {
        const signer = signers[2];

        // deposit 1 ether
        await weth.connect(signer).deposit({
          value: '1000000000000000000'
        });

        // approve
        await weth.connect(signer).approve(piggies.address, '1000000000000000000');

        let wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, '1000000000000000000');


        let txn = await piggies.connect(signer).mint(1, 2, []);
        // let rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, '737500000000000000');

        txn = await piggies.connect(signer).burn([1001]);
        // rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, '987500000000000000');


        try{
          await piggies.connect(signer).burn([1001]);
          assert.fail("Can't burn twice");
        }
        catch(err){
          // logging.warn({err});
          assert.include(String(err), "ERC721NonexistentToken(1001)");
        }
      });
    });

    describe("Withdraw", function(){
      it("can withdraw WETH", async () => {
        let wethBalance = await weth.balanceOf(piggies.address);
        assert.equal(wethBalance, '22500000000000000');
  
        await piggies.connect(ownerSigner).withdrawWETH(accounts[15]);
  
        wethBalance = await weth.balanceOf(piggies.address);
        assert.equal(wethBalance, '0');
  
        wethBalance = await weth.balanceOf(accounts[15]);
        assert.equal(wethBalance, '22500000000000000');
      });
    });
  });
});
