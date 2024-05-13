# beauty
## Complete Process
![](./beauty.png)
## How to use

`npm run install`


### Build

`npm run build` 

### Test

`npm run test`

### Deploy or run another script

`npm run start`


## Tutorial
具体操作参考scripts以及tests部分实现，核心调用都已列出，其他未提及的依样画葫芦即可，缺少的功能可在合约中添加重新build再部署。
1. 部署合约
执行命令
```
npm run start
```
选择`deployRoma` , 部署的消息如下,需要修改Token的Meta Data信息：
```js
// meta data, 根据实际情况修改， image建议用github上的图片地址，后续方便修改图片
const jettonParams = {
        name: "MISSW",
        description: "MISS web3 beauty platform",
        symbol: "MSW",
        image: "https://raw.githubusercontent.com/MewImpetus/beauty/main/logo.png",
    };
const content = buildOnchainMetadata(jettonParams);
const max_supply = toNano("10000000000"); 
const owner = Address.parse("UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs")  // roma master合约管理员
const receiver = Address.parse("UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs")  // 投票的币的接收地址,管理员可修改
const roma = provider.open(await Roma.fromInit(owner, max_supply, receiver, content));
await roma.send(
        provider.sender(),
        {
            value: toNano('0.5'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );
```

2. 挖初所有的币
```js
await roma.send(
        provider.sender(),
        {
            value: toNano('0.2'),
        },
        "Mint:All"
    );
```

3. 给 1号 beauty投票 100 票
```js
await roma.send(
        provider.sender(),
        {
            value: toNano('0.5'),
        },
        {
            $$type: "BeautyVote",
            id: 1n,
            amount: toNano("100")
        }
    );
```

4. 查询票数和日志
执行命令
```
npm run start
```
选择`getInfo`

查询1号beauty的票数，先获得第1位beauty的合约地址，再调用查询票数的函数
```js
// roma master合约 
const roma = provider.open(Roma.fromAddress(roma_address));

// get beauty votes
const beauty_address_of_1 = await roma.getGetBeautyAddress(1n);
const beauty = provider.open(Beauty.fromAddress(beauty_address_of_1));
const votes = await beauty.getGetVotes();
console.log(votes);
```

查询第1条投票日志, 先获取第1条日志的合约地址，然后调用查询记录的函数，并且可以可以通过roma合约的方法获取日志总数n，
只需要从1遍历到n，即可查询到所有的投票日志
```js
const log_address_of_1 = await roma.getVoteLogAddress(1n);
const logs = provider.open(VoteLogs.fromAddress(log_address_of_1));
const record = await logs.getVoteRecord();
console.log(record);
```