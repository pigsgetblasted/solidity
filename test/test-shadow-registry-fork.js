
const {assert, ethers, Web3} = require("hardhat");

const {decodeLog, factoryABI, factoryToWeb3, getABI, getLogs} = require("./lib/helpers");

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


  let shadowRegistryProxy;
  it( "deploys ShadowRegistryUpgradeableV2", async () => {
    const implAddress = "0x6F47DfF42468a220378148Aa3Aed8846ee84aeD3";
    const implAbi = await getABI(implAddress, {setCache: true, useCache: true});

    const v1address = "0xF781583039fB1B0A08D7ececEFf53fE2a5908858";
    // const v1abi = await getABI(v1address, {setCache: true, useCache: true});

    const v1owner = "0xa2Fcd3206E830b226326C5057d555B7e2a495cf4";
    const v1signer = await ethers.getImpersonatedSigner(v1owner);
    //shadowRegistryProxy = await ethers.getContractAt(implAbi, v1address, v1signer);

    shadowRegistryProxy = new ethers.Contract(v1address, implAbi, v1signer);

    // const gakkoABI = await getABI(gakkoAddress, {setCache: true, useCache: true});
    // gakkoSigner = await ethers.getImpersonatedSigner(gakkoOwner);
    // gakkoInstance = new ethers.Contract(gakkoAddress, gakkoABI, gakkoSigner);
    // gakkoSession = factoryToWeb3( gakkoInstance );
  });

  after(() => {
    if(shadowRegistryProxy){
      describe( "Deploy and Upgrade", function(){
        let shadowRegistryV2;
        it("deploys ShadowRegistryUpgradeableV2", async () => {
          if(!shadowRegistryProxy){
            assert.fail();
            return;
          }
      
          const ShadowRegistryUpgradeableV2 = await ethers.getContractFactory("ShadowRegistryUpgradeableV2");
          shadowRegistryV2 = await ShadowRegistryUpgradeableV2.deploy();
          console.info({ 'ShadowRegistryUpgradeableV2.address': shadowRegistryV2.address });
      
          // const tmp = factoryToWeb3( lvmInstance );
          // lvMintProxy = new Session(...tmp);
        });
      
        it("upgrades ShadowRegistryProxy", async () => {
          if(!shadowRegistryProxy){
            assert.fail();
            return;
          }
      
          try{
            // ABI
            // const encodedCallData = web3client.eth.abi.encodeFunctionCall(, []);
            const encodedCallData = web3client.eth.abi.encodeFunctionSignature('upgrade()');
            await shadowRegistryProxy.upgradeToAndCall(shadowRegistryV2.address, encodedCallData);
          }
          catch(err){
            const {reason, code, method, error} = err;
            console.log({
              reason, code, method
            });
          }
        });


        it("can deploy a shadow token", async () => {
          // const eventSignature = web3client.eth.abi.encodeEventSignature('ShadowRegistered(address,address,string,string)');
          // console.log({ eventSignature });

          const shadowRegistryABI = factoryABI(shadowRegistryV2);
          const shadowRegisteredABI = shadowRegistryABI.find(abi => {
            return abi.type === 'event' && abi.name === 'ShadowRegistered';
          });
          //console.log(shadowRegisteredABI);

          const eventSignature = web3client.eth.abi.encodeEventSignature(shadowRegisteredABI);
          // console.log({ eventSignature, eventSignature2: eventSignature });

          // dGEN Network
          let receipt = await (await shadowRegistryProxy.deploy("0xDE278592D377e8a526c5eFd44596c46A44f549fd")).wait();
          let shadowRegisteredLog = receipt.logs.find(log => log.topics[0] === eventSignature);
          let decodedLog = decodeLog(shadowRegisteredABI, shadowRegisteredLog);
          console.log({
            address: '0xDE278592D377e8a526c5eFd44596c46A44f549fd',
            decodedLog
          });


          // NovoPixels
          receipt = await (await shadowRegistryProxy.deploy("0x34c89620C13392Fda4A3858D2429BC5B4EcEB8D0")).wait();
          shadowRegisteredLog = receipt.logs.find(log => log.topics[0] === eventSignature);
          decodedLog = decodeLog(shadowRegisteredABI, shadowRegisteredLog);
          console.log({
            address: '0x34c89620C13392Fda4A3858D2429BC5B4EcEB8D0',
            decodedLog
          });

          // OnchainKevins
          receipt = await (await shadowRegistryProxy.deploy("0x17B19C70bfcA098da3f2eFeF6e7FA3a1C42F5429")).wait();
          shadowRegisteredLog = receipt.logs.find(log => log.topics[0] === eventSignature);
          decodedLog = decodeLog(shadowRegisteredABI, shadowRegisteredLog);
          console.log({
            address: '0x17B19C70bfcA098da3f2eFeF6e7FA3a1C42F5429',
            decodedLog
          });

          // OnchainNovo
          receipt = await (await shadowRegistryProxy.deploy("0x22a81C80Bb6BF4B797Acf08351934b46193BDddE")).wait();
          shadowRegisteredLog = receipt.logs.find(log => log.topics[0] === eventSignature);
          decodedLog = decodeLog(shadowRegisteredABI, shadowRegisteredLog);
          console.log({
            address: '0x22a81C80Bb6BF4B797Acf08351934b46193BDddE',
            decodedLog
          });

          // Punkin Spicies
          receipt = await (await shadowRegistryProxy.deploy("0x34625Ecaa75C0Ea33733a05c584f4Cf112c10B6B")).wait();
          shadowRegisteredLog = receipt.logs.find(log => log.topics[0] === eventSignature);
          decodedLog = decodeLog(shadowRegisteredABI, shadowRegisteredLog);
          console.log({
            address: '0x34625Ecaa75C0Ea33733a05c584f4Cf112c10B6B',
            decodedLog
          });

          // RASC
          receipt = await (await shadowRegistryProxy.deploy("0xDCb1cDFe2B5f592E7Bdc2696b7A68c6e866C4Cc2")).wait();
          shadowRegisteredLog = receipt.logs.find(log => log.topics[0] === eventSignature);
          decodedLog = decodeLog(shadowRegisteredABI, shadowRegisteredLog);
          console.log({
            address: '0xDCb1cDFe2B5f592E7Bdc2696b7A68c6e866C4Cc2',
            decodedLog
          });

          //ethers
          // decodedLog = shadowRegistryV2.interface.decodeEventLog('ShadowRegistered', shadowRegisteredLog.data, shadowRegisteredLog.topics);
          // console.log({ decodedLog });
        });

        it('has registration logs', async () => {
          const shadowRegistryABI = factoryABI(shadowRegistryV2);
          const shadowRegisteredABI = shadowRegistryABI.find(abi => {
            return abi.type === 'event' && abi.name === 'ShadowRegistered';
          });
          const eventSignature = web3client.eth.abi.encodeEventSignature(shadowRegisteredABI);

          const logs = await web3client.eth.getPastLogs({
            address: shadowRegistryProxy.address,
            fromBlock: 0,
            toBlock: 'latest',
            topics: [
              eventSignature
            ]
          });

          const decoded = logs.map(log => decodeLog(shadowRegisteredABI, log));
          console.log({ decoded });
            //web3
            //decodedLog = decodeLog(shadowRegisteredABI, log);
            //ethers
            //const decodedLog = shadowRegistryV2.interface.decodeEventLog('ShadowRegistered', log.data, log.topics);
            
        });
      });
    }
  });
});
