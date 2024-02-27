
const {assert, ethers, Web3, web3} = require("hardhat");
const log4js = require("log4js");
const Merkle = require("./lib/merkle");

// const Provider = require("./lib/provider");

const hardhatProvider = ethers.provider._hardhatProvider;
const web3client = new Web3(hardhatProvider);
// const ethersClient = new ethers.providers.Web3Provider(hardhatProvider);
const merkle = new Merkle();

let logging = console;

const GWEI = BigInt(1_000_000_000);
const ETHER = GWEI * GWEI;
const DEFAULT_BALANCE = BigInt(10_000) * ETHER;

const NUCLEAR     = BigInt(100_000_000) * GWEI;
const NUCLEAR_FEE = BigInt(  5_000_000) * GWEI;

const LARGE     = BigInt(250_000_000) * GWEI;
const LARGE_FEE = BigInt( 12_500_000) * GWEI;

contract("PIGGYBOMB", (accts) => {
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
  it("deploys PIGGYBOMB", async () => {
    try{
      const PIGGYBOMB = await ethers.getContractFactory("PIGGYBOMB");
      piggies = await PIGGYBOMB.deploy(
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        "0xDa63245ee0Cf1f3C8E46C35A72e6C42836E24c8A"
      );
      logging.info('\tINFO: PIGGYBOMB.address', piggies.address);
    }
    catch(err){
      console.warn({err});
    }
  });

  // let weth;
  it.skip("loads WETH", async () => {
    const wethABI = require('./abi/WETH.json');
    // const wethArtifact = require('E:\\sites\\piggies-solidity\\artifacts\\contracts\\IERC20Rebasing.sol\\IERC20Rebasing.json');
    const wethAddress = '0x4200000000000000000000000000000000000023';
    const weth = new ethers.Contract(wethAddress, wethABI, ownerSigner);
  });

  after(() => {
    if(!piggies)
      assert.fail("PIGGYBOMB (PIGGYBOMB) not deployed");


    describe("Greenfield Allowlist", function(){
      it("set merkle", async () => {
        const hexRoot = merkle.getHexRoot()
        await piggies.connect(ownerSigner).setMerkleRoot(hexRoot);
      });

      it("open sales", async () => {
        await piggies.connect(ownerSigner).setSaleState(1);
      });

      it.skip("WETH: must approve", async () => {
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

      it.skip("WETH: must have enough", async () => {
        const signer = signers[0];
        // approve
        await weth.connect(signer).approve(piggies.address, BigInt(1) * ETHER);

        const wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, 0);

        try{
          const proof = merkle.getProof(signer.address);
          // console.log({proof});

          await piggies.connect(signer).mint(1, 1, proof);
          assert.fail("unsufficient WETH");
        }
        catch(err){
          // logging.warn({ err });
          assert.include(String(err), "0xf4d678b8");
        }
      });

      it.skip("WETH: must be allowlist", async () => {
        const signer = signers[10];

        // deposit 1 ether
        await weth.connect(signer).deposit({
          value: BigInt(1) * ETHER
        });

        // approve
        await weth.connect(signer).approve(piggies.address, BigInt(1) * ETHER);

        const wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, BigInt(1) * ETHER);


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

      it("ETH: must be allowlist", async () => {
        const signer = signers[10];

        const ethBalance = await web3client.eth.getBalance(signer.address);
        assert.equal(ethBalance, DEFAULT_BALANCE);


        try{
          const proof = merkle.getProof(signer.address);
          // console.log({proof});

          await piggies.connect(signer).mint(1, 1, proof, {
            value: NUCLEAR + NUCLEAR_FEE
          });
          assert.fail("not allowlisted");
        }
        catch(err){
          // logging.warn({ err });
          assert.include(String(err), "NotAuthorized()");
        }
      });

      it.skip("WETH: mint nuclear", async () => {
        const signer = signers[0];

        // deposit 1 ether
        await weth.connect(signer).deposit({
          value: BigInt(1) * ETHER
        });


        let wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, BigInt(1) * ETHER);

        const proof = merkle.getProof(signer.address);
        // console.log({proof});

        const txn = await piggies.connect(signer).mint(1, 1, proof);
        // let rcpt = await txn.wait();
        // logging.warn(rcpt.logs);


        const expected = BigInt(1) * ETHER - (NUCLEAR + NUCLEAR_FEE);
        wethBalance = await weth.balanceOf(signer.address);
        assert.equal(wethBalance, expected);
      });

      it("ETH: mint nuclear", async () => {
        const signer = signers[0];


        let ethBalance = await web3client.eth.getBalance(signer.address);
        assert.equal(ethBalance, DEFAULT_BALANCE);

        const proof = merkle.getProof(signer.address);
        // console.log({proof});

        const txn = await piggies.connect(signer).mint(1, 1, proof, {
          value: NUCLEAR + NUCLEAR_FEE
        });
        // let rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        const expected = DEFAULT_BALANCE - (NUCLEAR + NUCLEAR_FEE);
        ethBalance = await web3client.eth.getBalance(signer.address);
        assert.isTrue(ethBalance <= expected);
      });

      it.skip("WETH: burn nuclear", async () => {
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

      it("ETH: burn nuclear", async () => {
        const signer = signers[0];
        const txn = await piggies.connect(signer).burn([1]);
        // rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        const lessThan = DEFAULT_BALANCE - NUCLEAR_FEE;
        const greaterThan = DEFAULT_BALANCE - (NUCLEAR + NUCLEAR_FEE);
        let ethBalance = await web3client.eth.getBalance(signer.address);
        assert.isTrue(ethBalance <= lessThan);
        assert.isTrue(ethBalance > greaterThan);

        try{
          await piggies.connect(signer).burn([1]);
          assert.fail("Can't burn twice");
        }
        catch(err){
          // logging.warn({err});
          assert.include(String(err), "ERC721NonexistentToken(1)");
        }
      });

      it.skip("WETH: mint and burn nuclear 2", async () => {
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

      it.skip("ETH: mint and burn nuclear 2", async () => {
        const signer = signers[1];


        let ethBalance = await web3client.eth.getBalance(signer.address);
        assert.equal(ethBalance, '1000000000000000000');


        try{
          const proof = merkle.getProof(signer.address);
          await piggies.connect(signer).mint(2, 1, proof, {
            value: BigInt(200000000000000)
          });
        }
        catch(err){
          // logging.warn({ err });
          assert.include(String(err), "OrderExceedsAllowance()");
        }


        const proof = merkle.getProof(signer.address);
        let txn = await piggies.connect(signer).mint(1, 1, proof, {
          value: BigInt(100000000000000)
        });
        // let rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        ethBalance = await web3client.eth.getBalance(signer.address);
        assert.equal(ethBalance, '1000000000000000000');

        txn = await piggies.connect(signer).burn([2]);
        // rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        ethBalance = await web3client.eth.getBalance(signer.address);
        assert.equal(ethBalance, '1000000000000000000');


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
      it.skip("WETH: mint public", async () => {
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

      it("ETH: mint public", async () => {
        const signer = signers[10];

        try{
          const proof = merkle.getProof(signer.address);
          console.log({proof});

          await piggies.connect(signer).mint(2, 2, proof, {
            value: LARGE + LARGE_FEE
          });
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

      it.skip("WETH: mint and burn large", async () => {
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

      it("ETH: mint and burn large", async () => {
        const signer = signers[2];

        let ethBalance = await web3client.eth.getBalance(signer.address);
        assert.equal(ethBalance, DEFAULT_BALANCE);


        const mintValue = BigInt(1) * (LARGE + LARGE_FEE);
        let txn = await piggies.connect(signer).mint(1, 2, [], {
          value: mintValue
        });
        // let rcpt = await txn.wait();
        // logging.warn(rcpt.logs);


        let expected = DEFAULT_BALANCE - mintValue;
        ethBalance = await web3client.eth.getBalance(signer.address);
        assert.isTrue(ethBalance < expected);

        txn = await piggies.connect(signer).burn([1001]);
        // rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        const lessThan = DEFAULT_BALANCE - (BigInt(1) * LARGE_FEE);
        ethBalance = await web3client.eth.getBalance(signer.address);
        assert.isTrue(ethBalance <= lessThan);
        assert.isTrue(ethBalance > mintValue);


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
      it.skip("WETH: can withdraw", async () => {
        let wethBalance = await weth.balanceOf(piggies.address);
        assert.equal(wethBalance, '22500000000000000');

        await piggies.connect(ownerSigner).withdrawWETH(accounts[15]);

        wethBalance = await weth.balanceOf(piggies.address);
        assert.equal(wethBalance, '0');
  
        wethBalance = await weth.balanceOf(accounts[15]);
        assert.equal(wethBalance, '22500000000000000');
      });

      it("ETH: can withdraw", async () => {
        let ethBalance = await web3client.eth.getBalance(piggies.address);
        assert.equal(ethBalance, '17500000000000000');
  
        await piggies.connect(ownerSigner).withdrawFees(accounts[15]);
  
        ethBalance = await web3client.eth.getBalance(piggies.address);
        assert.equal(ethBalance, '0');
  
        ethBalance = await web3client.eth.getBalance(accounts[15]);
        assert.equal(ethBalance, '10000017500000000000000');
      });
    });
  });
});
