import {
    WalletContractV4,
    TonClient4,
    Address,
  } from "@ton/ton";
  import { mnemonicToPrivateKey } from "@ton/crypto";
  import { toNano } from "@ton/core";
  import { Mswvote } from '../wrappers/Mswvote';
  
  const Sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
  
  (async () => {
    //create client for testnet sandboxv4 API - alternative endpoint
    const client4 = new TonClient4({
      endpoint: "https://sandbox-v4.tonhubapi.com",
    });
  
    let mnemonics = [
      "thank",
      "green",
      "heavy",
      "earth",
      "ghost",
      "forest",
      "tortoise",
      "clog",
      "grain",
      "trade",
     // ... 24 个提示词
    ];
  
    let keyPair = await mnemonicToPrivateKey(mnemonics);
  
    let workchain = 0;
    let deployer_wallet = WalletContractV4.create({
      workchain,
      publicKey: keyPair.publicKey,
    });
    console.log(deployer_wallet.address);
  
    let deployer_wallet_contract = client4.open(deployer_wallet);
    const walletSender = deployer_wallet_contract.sender(keyPair.secretKey);
  
    let mswvote_address = Address.parse(
      "..."
    );
  
    let contract = Mswvote.fromAddress(mswvote_address);
    let xfi = client4.open(contract);
    
    // 这里加个循环即可
    await xfi.send(
      walletSender,
      { value: toNano("0.5") },
      {
        $$type: "Mint",
        to: Address.parse("xxx 空投对象"),
        amount: toNano("100000000") //空头数量
      }
    );
  
    await Sleep(3000);
  

  })();
  