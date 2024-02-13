
const {assert, ethers, Web3} = require("hardhat");

const hardhatProvider = ethers.provider._hardhatProvider;
const web3client = new Web3(hardhatProvider);

contract( 'Deploy FP: Subs', (accts) => {
  let owner, ownerSigner;
  const accounts = [];
  const signers = [];
  
  it( "loads accounts", async () => {
    owner = accts.shift();
    //console.info({ owner });
  
    accounts.push( ...accts );
    //console.info({ accounts });

    signers.push( ...(await ethers.getSigners()) );
    ownerSigner = signers.shift();
  });

  
  let shadowRegistryImpl;
  it( "deploys ShadowRegistryUpgradeableV2", async () => {
    const ShadowRegistryUpgradeableV2 = await ethers.getContractFactory("ShadowRegistryUpgradeableV2");
    shadowRegistryImpl = await ShadowRegistryUpgradeableV2.deploy();
    console.info(`\tShadowRegistryUpgradeableV2.address: ${shadowRegistryImpl.address}\n`);
  });

  let shadowRegistryProxy;
  it( "deploys ERC1967Proxy", async () => {
    const initRegistry = {
      inputs: [],
      name: 'initialize',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    };

    const initializeSelector = web3client.eth.abi.encodeFunctionCall(initRegistry, []);
    // console.log({ initializeSelector }); // 0x8129fc1c

    const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const erc1967Proxy = await ERC1967Proxy.deploy(shadowRegistryImpl.address, initializeSelector);
    shadowRegistryProxy = new ethers.Contract(erc1967Proxy.address, shadowRegistryImpl.interface, ownerSigner);
    // ERC1967Proxy.constructor(shadowRegistryImpl.address, "0x8129fc1c");
    console.info(`\tERC1967Proxy.address: ${shadowRegistryProxy.address}\n`);

    shadowRegistryProxy = new ethers.Contract(erc1967Proxy.address, shadowRegistryImpl.interface, ownerSigner);
    //shadowRegistryProxy = new ethers.Contract(erc1967Proxy.address, shadowRegistryImpl.interface, ethers.provider);
  });

  let shadowImpl;
  it( "deploys ERC721SurrogateUpgradeableV2", async () => {
    const ERC721SurrogateUpgradeableV2 = await ethers.getContractFactory("ERC721SurrogateUpgradeableV2");
    shadowImpl = await ERC721SurrogateUpgradeableV2.deploy();
    console.info(`\tERC721SurrogateUpgradeableV2.address: ${shadowImpl.address}\n`);
  });

  let subsImpl;
  it( "deploys ERC721SubscriptionSurrogateUpgradeable", async () => {
    const ERC721SubscriptionSurrogateUpgradeable = await ethers.getContractFactory("ERC721SubscriptionSurrogateUpgradeable");
    subsImpl = await ERC721SubscriptionSurrogateUpgradeable.deploy();
    console.info(`\tERC721SubscriptionSurrogateUpgradeable.address: ${subsImpl.address}\n`);
  });

  after(() => {
    if(!shadowRegistryImpl)
      assert.fail("\tSetup failed: ShadowRegistryUpgradeableV2");

    if(!shadowRegistryProxy)
      assert.fail("\tSetup failed: shadowRegistryProxy");

    if(!shadowImpl)
      assert.fail("\tSetup failed: ERC721SurrogateUpgradeableV2");

    if(!subsImpl)
      assert.fail("\tSetup failed: ERC721SubscriptionSurrogateUpgradeable");


    describe("Test FP: Subs", function(){
      //this.timeout( 120000 ); //120s

      let pudgyPenguins;
      it("deploys EasyERC721 as PudgyPenguins", async () => {
        const PudgyPenguins_PPG = await ethers.getContractFactory("EasyERC721");
        pudgyPenguins = await PudgyPenguins_PPG.deploy("PudgyPenguins", "PPG");
        console.info(`\PudgyPenguins_PPG.address: ${pudgyPenguins.address}\n`);


        for(let i = 0; i < 19; ++i){
          const tokens = [];
          for(let j = i*3; j < (i+1)*3; ++j){
            tokens.push(j);
          }

          await pudgyPenguins.setTokens(accounts[i], tokens);
          console.log(`\ttokens(${i}): ${accounts[i]} = ${tokens}`);
        }
      });

      let ppShadow, shadowContract;
      it("Registry deploys a Shadow Proxy", async () => {
        let receipt = await (await shadowRegistryProxy.setShadowImpl(shadowImpl.address)).wait();

        receipt = await (await shadowRegistryProxy.deploy(pudgyPenguins.address)).wait();
        receipt.events.forEach(evt => {
          // console.log(evt.eventSignature, evt.args);
          if(evt.event === 'ShadowRegistered'){
            shadowContract = evt.args.surrogate;
            console.log(`\tFound ${evt.eventSignature}\n\tthe FPT address is ${shadowContract}\n`);
          }
        });


        ppShadow = new ethers.Contract(shadowContract, shadowImpl.interface, ownerSigner);
        let PRINCIPAL = await ppShadow.PRINCIPAL();
        assert.equal(PRINCIPAL, pudgyPenguins.address);


        for(let i = 0; i < 19; ++i){
          for(let tokenId = i*3; tokenId < (i+1)*3; ++tokenId){
            const ownerOf = await ppShadow.ownerOf(tokenId);
            assert.equal(ownerOf, accounts[i]);
          }
        }


        for(let tokenId = 0; tokenId < 10; ++tokenId){
          const ownerIndex = Math.floor(tokenId / 3)
          await ppShadow.connect(signers[ownerIndex]).setSurrogate(tokenId, owner);
          const ownerOf = await ppShadow.ownerOf(tokenId);
          assert.equal(ownerOf, owner);
          assert.notEqual(ownerOf, accounts[ownerIndex]);
        }
      });


      let ppSubs;
      it("Upgrades to a Subscription Proxy", async () => {
        const initShadow = {
          inputs: [],
          name: 'reinitialize',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function'
        };

        const calldata = web3client.eth.abi.encodeFunctionCall(initShadow, []);
        ppSubs = new ethers.Contract(shadowContract, subsImpl.interface, ownerSigner);
        const receipt = await (await ppSubs.upgradeToAndCall(subsImpl.address, calldata)).wait();

        console.log("\t--== Upgrade Events ==--");
        receipt.events.forEach(evt => {
          console.log(`\t\t${evt.eventSignature}\n\t\t\t${evt.args}`);
        });
        console.log("\n");


        //verify the upgrade was clean
        for(let tokenId = 0; tokenId < 10; ++tokenId){
          const ownerIndex = Math.floor(tokenId / 3)
          await ppSubs.connect(signers[ownerIndex]).setSurrogate(tokenId, owner);
          const ownerOf = await ppSubs.ownerOf(tokenId);
          assert.equal(ownerOf, owner);
          assert.notEqual(ownerOf, accounts[ownerIndex]);
        }


        for(let i = 0; i < 19; ++i){
          const tokens = [];
          for(let j = i*3; j < (i+1)*3; ++j){
            tokens.push(j);
          }

          for(let tokenId of tokens){
            const ownerOf = await ppSubs.ownerOf(tokenId);

            if(tokenId < 10){
              assert.equal(ownerOf, owner);
            }
            else{
              const ownerIndex = Math.floor(tokenId / 3)
              assert.equal(ownerOf, accounts[ownerIndex]);
            }
          }
        }

        // nothing should be amped
        for(let tokenId = 0; tokenId < 57; ++tokenId){
          const isAmped = await ppSubs.isAmped(tokenId);
          assert.equal(isAmped, false);
        }
      });


      it("Can subscribe", async () => {
        try{
          await ppSubs.subscribe([0], 1, {
            value: 100
          });
        }
        catch(err){
          assert.include(String(err), "Sales/Subscriptions are currently closed");
        }

        await ppSubs.setConfig({
          price: 100, //wei
          period: 30 * 24 * 60 * 60,
          maxDuration: 0,

          setupNum: 1,
          setupDenom: 100,
          isActive: true
        });


        try{
          await ppSubs.subscribe([0], 1, {
            value: 1
          });
        }
        catch(err){
          assert.include(String(err), "Not enough ETH for selected duration");
        }


        await ppSubs.subscribe([0], 1, {
          value: 100
        });

        try{
          await ppSubs.subscribe([10], 1, {
            value: 100
          });
        }
        catch(err){
          assert.include(String(err), "Sales/Subscriptions are restricted to the current FPT owner");
        }


        await ppSubs.connect(signers[3]).subscribe([10], 1, {
          value: 100
        });


        let isAmped = await ppSubs.isAmped(0);
        assert.equal(isAmped, true);

        for(let tokenId = 1; tokenId < 10; ++tokenId){
          isAmped = await ppSubs.isAmped(tokenId);
          assert.equal(isAmped, false);
        }

        isAmped = await ppSubs.isAmped(10);
        assert.equal(isAmped, true);
      });

      it("Can blacklist", async () => {

      });
    });
  });
});
