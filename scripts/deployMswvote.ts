import { toNano, Address} from '@ton/core';
import { Mswvote } from '../wrappers/Mswvote';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from "../utils/jetton-helpers";

export async function run(provider: NetworkProvider) {

    const jettonParams = {
        name: "MSWVOTE",
        description: "MISS web3 vote coin",
        symbol: "MSWVOTE",
        image: "https://raw.githubusercontent.com/MewImpetus/beauty/main/logo.png",
    };

    const content = buildOnchainMetadata(jettonParams);
    const owner = Address.parse("UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs")

    const mswvote = provider.open(await Mswvote.fromInit(owner, owner, content));

    await mswvote.send(
        provider.sender(),
        {
            value: toNano('0.5'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    // await provider.waitForDeploy(mswvote.address);
    // const mswvote = provider.open(Mswvote.fromAddress(Address.parse("kQBqT1xRNjjiAbp4G9vrNOrUnQL9CUYh2elbd-O-ufUW06Fc")))

    // deploy the beauty
    await mswvote.send(
        provider.sender(),
        {
            value: toNano('0.1'),
        },
        "deploy beauty"
    )

    // mint 1亿
    await mswvote.send(
        provider.sender(),
        {
            value: toNano('0.5'),
        },
        {
            $$type: "Mint",
            to: owner,
            amount: toNano("100000000")
        }
    )

    // vote to a miss 
    await mswvote.send(
        provider.sender(),
        {
            value: toNano('0.5'),
        },
        {
            $$type: "BeautyVote",
            id: 1n,
            amount: toNano("123")
        }
    )
}
