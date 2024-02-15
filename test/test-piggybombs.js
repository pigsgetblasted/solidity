
const {assert, ethers, Web3} = require("hardhat");
const log4js = require("log4js");

const Provider = require("./lib/provider");

const hardhatProvider = ethers.provider._hardhatProvider;
const web3client = new Web3(hardhatProvider);
const ethersClient = new ethers.providers.Web3Provider(hardhatProvider);

let logging = console;

contract( 'PIGGYBOMBS', (accts) => {
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


    describe("Greenfield", function(){
      it("must approve weth", async () => {
        const signer = signers[0];
        let wethBalance = await weth.balanceOf(signer.address);
        logging.log({ 1: wethBalance }); // 0


        try{
          await piggies.connect(signer).mint(1, 1, []);
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

        let wethBalance = await weth.balanceOf(signer.address);
        logging.log({ 1: wethBalance }); // 0

        try{
          await piggies.connect(signer).mint(1, 1, []);
          assert.fail("unsifficient WETH");
        }
        catch(err){
          // logging.warn({ err });
          assert.include(String(err), "0xf4d678b8");
        }
      });


      it("mint and burn nuclear", async () => {
        const signer = signers[0];

        // deposit 1 ether
        await weth.connect(signer).deposit({
          value: '1000000000000000000'
        });

        // approve
        await weth.connect(signer).approve(piggies.address, '1000000000000000000');

        let wethBalance = await weth.balanceOf(signer.address);
        logging.log({ 1: wethBalance }); // 1000000000000000000


        let txn = await piggies.connect(signer).mint(1, 1, []);
        let rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        wethBalance = await weth.balanceOf(signer.address);
        logging.log({ 2: wethBalance }); //  737500000000000000

        txn = await piggies.connect(signer).burn([1]);
        rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        wethBalance = await weth.balanceOf(signer.address);
        logging.log({ 3: wethBalance }); //  987500000000000000


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
        logging.log({ 1: wethBalance }); // 1000000000000000000


        let txn = await piggies.connect(signer).mint(2, 1, []);
        // let rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        wethBalance = await weth.balanceOf(signer.address);
        logging.log({ 2: wethBalance }); //  475000000000000000

        txn = await piggies.connect(signer).burn([2]);
        // rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        wethBalance = await weth.balanceOf(signer.address);
        logging.log({ 3: wethBalance }); //  725000000000000000


        txn = await piggies.connect(signer).burn([3]);
        // rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        wethBalance = await weth.balanceOf(signer.address);
        logging.log({ 3: wethBalance }); //  975000000000000000


        try{
          await piggies.connect(signer).burn([2]);
          assert.fail("Can't burn twice");
        }
        catch(err){
          // logging.warn({err});
          assert.include(String(err), "ERC721NonexistentToken(2)");
        }
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
        logging.log({ 1: wethBalance }); // 1000000000000000000


        let txn = await piggies.connect(signer).mint(1, 3, []);
        let rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        wethBalance = await weth.balanceOf(signer.address);
        logging.log({ 2: wethBalance }); //  895000000000000000

        txn = await piggies.connect(signer).burn([1001]);
        rcpt = await txn.wait();
        // logging.warn(rcpt.logs);

        wethBalance = await weth.balanceOf(signer.address);
        logging.log({ 3: wethBalance }); //  995000000000000000


        try{
          await piggies.connect(signer).burn([1001]);
          assert.fail("Can't burn twice");
        }
        catch(err){
          // logging.warn({err});
          assert.include(String(err), "ERC721NonexistentToken(1001)");
        }
      });

      it("can withdraw WETH", async () => {
        let wethBalance = await weth.balanceOf(piggies.address);
        logging.log({ 1: wethBalance }); //  

        await piggies.connect(ownerSigner).withdrawWETH(accounts[10]);

        wethBalance = await weth.balanceOf(piggies.address);
        logging.log({ 2: wethBalance }); //  
      });
    });
  });
});
