import { Address, toNano } from '@ton/core';
import { Missw } from '../wrappers/Missw';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from "../utils/jetton-helpers";

export async function run(provider: NetworkProvider) {

    const jettonParams = {
        name: "MISSW",
        description: "MISS web3 beauty platform",
        symbol: "MSW",
        image: "https://raw.githubusercontent.com/MewImpetus/beauty/main/logo.png",
    };

    const content = buildOnchainMetadata(jettonParams);
    const max_supply = toNano("10000000000");
    const owner = Address.parse("UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs")

    const missw = provider.open(await Missw.fromInit(owner, max_supply, owner, content));

    // deploy
    await missw.send(
        provider.sender(),
        {
            value: toNano('0.5'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(missw.address);

    // run methods on `missw`
    // mint all
    await missw.send(
        provider.sender(),
        {
            value: toNano('0.2'),
        },
        "Mint:All"
    );

    // vote to a beauty
    await missw.send(
        provider.sender(),
        {
            value: toNano('1'),
        },
        {
            $$type: "BeautyVote",
            id: 1n,
            amount: toNano("100")
        }
    );


}
