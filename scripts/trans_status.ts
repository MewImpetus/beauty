import TonWeb from "tonweb";
import { mnemonicToPrivateKey } from "@ton/crypto";

// 使用适当的HTTP提供者初始化TON Web
const tonweb = new TonWeb(new TonWeb.HttpProvider('https://testnet.toncenter.com/api/v2/jsonRPC', {apiKey: 'ff052410e7bb39c2df4246b2a163bba75717f1e0b1dc17598dc06cef02112c35'}));


const base64ToHex = (base64:string) => {
    // Step 1: Decode base64 to bytes (Buffer)
    const buffer = Buffer.from(base64, 'base64');
  
    // Step 2: Convert bytes (Buffer) to hexadecimal string
    const hex = buffer.toString('hex');
  
    return hex;
  };

// 主函数
async function main() {
    // const keyPair = TonWeb.utils.nacl.sign.keyPair();  // 生成密钥对

    const mnemonic = "lamp woman smart lion soul coyote bean wheel destroy engage blame you hill spring pepper crawl magic abandon isolate same version utility cruise unknown";  // 你的24个钱包助记词
    const keyPair = await mnemonicToPrivateKey(mnemonic.split(" "));

    const WalletClass = tonweb.wallet.all.v4R2;

    const wallet = new WalletClass(tonweb.provider, {
        publicKey: keyPair.publicKey
    });


    const toAddress = 'UQAS8_N1tq8uFf1kzTTFjlVZN6foFzCPkVUSniWx6bHqxVSk';  // 目标地址
    const amount = TonWeb.utils.toNano('0.01');  // 发送金额: 0.01 TON

    // await wallet.deploy(keyPair.secretKey).send(); // deploy wallet to blockchain

    const seqno = await wallet.methods.seqno().call() || 0;
    
    
    const transfer = wallet.methods.transfer({
        secretKey: keyPair.secretKey,
        toAddress: toAddress,
        amount: amount,
        seqno: seqno,  // 获取钱包当前序列号
        payload: 'hello world'
    });

   

    // // 发送交易并获取结果
    const sendResult = await transfer.send();
    console.log("sendResult:", sendResult)

    // 需要上面先获取一次，这里再循环直到不一样了拿到新的id
    const transactions = await tonweb.provider.getTransactions(toAddress, 5);
    for (const tx of transactions) {
        // console.log(tx);
        console.log(tx.transaction_id.hash)
        console.log(base64ToHex(tx.transaction_id.hash))  //https://testnet.tonviewer.com/transaction/f00ae5f38578711c02855dec216723a2bd843e973d8fc2a3d9e91358435895fb
    }
    // 通过区块链浏览器获取是否被确认

}

main().catch(console.error);
