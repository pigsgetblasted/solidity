
const {assert, ethers, Web3} = require("hardhat");

const {decodeLog, factoryABI, getABI} = require("./lib/helpers");

const hardhatProvider = ethers.provider._hardhatProvider;
const web3client = new Web3(hardhatProvider);

// const Contract = require("./lib/contract");
// const ERC721 = require("./lib/erc721");
// const ERC721Enumerable = require("./lib/erc721-enumerable");
// const Session = require("./lib/session");
// const Merkle = require( './lib/merkle' );

// Contract.prototype = Object.assign(
//   Contract.prototype,
//   ERC721.prototype,
//   ERC721Enumerable.prototype
// );

// let merkle = new Merkle();
let owner, ownerSigner;
const accounts = [];
const signers = [];

const zeroAddress = "0x0000000000000000000000000000000000000000";

contract( 'ShadowRegistryUpgradeableV2', (accts) => {
  const initRegistry = {
    inputs: [],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  };

  const initShadow = {
    inputs: [{ internalType: 'address', name: '_principal', type: 'address' }],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  };

  it( "loads accounts", async () => {
    owner = accts.shift();
    //console.info({ owner });
  
    accounts.push( ...accts );
    //console.info({ accounts });

    signers.push( ...(await ethers.getSigners()) );
    ownerSigner = signers.shift();
  });

  // it( "loads merkle tree", () => {
  //   merkle.load(accounts.slice(10, 19));
  //   //const hexRoot = merkle.getHexRoot();
  //   //const proof = merkle.getProof(accounts[3]);
  //   //console.log({ hexRoot, proof });
  // });

  let shadowRegistryImpl;
  it( "deploys ShadowRegistryUpgradeableV2", async () => {
    const ShadowRegistryUpgradeableV2 = await ethers.getContractFactory("ShadowRegistryUpgradeableV2");
    shadowRegistryImpl = await ShadowRegistryUpgradeableV2.deploy();
    console.info({ 'ShadowRegistryUpgradeableV2.address': shadowRegistryImpl.address });
  });

  let shadowRegistryProxy;
  it( "deploys ERC1967Proxy", async () => {
    const initializeSelector = web3client.eth.abi.encodeFunctionCall(initRegistry, []);
    // console.log({ initializeSelector }); // 0x8129fc1c

    const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const erc1967Proxy = await ERC1967Proxy.deploy(shadowRegistryImpl.address, initializeSelector);
    shadowRegistryProxy = new ethers.Contract(erc1967Proxy.address, shadowRegistryImpl.interface, ownerSigner);
    // ERC1967Proxy.constructor(shadowRegistryImpl.address, "0x8129fc1c");
    console.info({ 'ERC1967Proxy.address': shadowRegistryProxy.address });

    shadowRegistryProxy = new ethers.Contract(erc1967Proxy.address, shadowRegistryImpl.interface, ownerSigner);
    //shadowRegistryProxy = new ethers.Contract(erc1967Proxy.address, shadowRegistryImpl.interface, ethers.provider);
  });

  let shadowImpl;
  it( "deploys ERC721SurrogateUpgradeableV2", async () => {
    const ERC721SurrogateUpgradeableV2 = await ethers.getContractFactory("ERC721SurrogateUpgradeableV2");
    shadowImpl = await ERC721SurrogateUpgradeableV2.deploy();
    console.info({ 'ERC721SurrogateUpgradeableV2.address': shadowImpl.address });
  });


  after(() => {
    describe( "Manual Deployment", function(){
      let moonInstance;
      it("deploys EasyERC721 as Moonshot", async () => {
        const Moonshot = await ethers.getContractFactory("EasyERC721");
        moonInstance = await Moonshot.deploy("Moonshot", "MOON");
        console.info({ 'Moonshot.address': moonInstance.address });
      });

      let shadowProxy;
      it("deploys a Shadow Proxy", async () => {
        const initializeSelector = web3client.eth.abi.encodeFunctionCall(initShadow, [moonInstance.address]);
        // console.log({ initializeSelector }); // 0xc4d66de80000000000000000000000006212cb549de37c25071cf506ab7e115d140d9e42

        const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
        shadowProxy = await ERC1967Proxy.deploy(shadowImpl.address, initializeSelector);
        // ERC1967Proxy.constructor(shadowImpl.address, "0xc4d66de80000000000000000000000006212cb549de37c25071cf506ab7e115d140d9e42");

        console.info({ 'ERC1967Proxy.address': shadowProxy.address });
      });
    });


    describe( "Registry Deployment", function(){
      let moonInstance2;
      it("deploys EasyERC721 as Moonshot2", async () => {
        const Moonshot2 = await ethers.getContractFactory("EasyERC721");
        moonInstance2 = await Moonshot2.deploy("Moonshot2", "MOON2");
        console.info({ 'Moonshot2.address': moonInstance2.address });
      });

      let shadowProxy;
      it("Registry deploys a Shadow Proxy", async () => {
        let receipt = await (await shadowRegistryProxy.setShadowImpl(shadowImpl.address)).wait();

        receipt = await (await shadowRegistryProxy.deploy(moonInstance2.address)).wait();
        receipt.events.forEach(evt => {
          console.log(evt.eventSignature, evt.args);
        });
        // console.log({ events: receipt.events });
      });
    });
  });
});
