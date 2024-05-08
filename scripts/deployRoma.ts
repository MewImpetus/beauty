import { Address, toNano } from '@ton/core';
import { Roma } from '../wrappers/Roma';
import { NetworkProvider } from '@ton/blueprint';
import { buildOnchainMetadata } from "../utils/jetton-helpers";

export async function run(provider: NetworkProvider) {

    const jettonParams = {
        name: "RomaMaster",
        description: "ROMA is a good coin",
        symbol: "ROMA",
        image: "https://cache.tonapi.io/imgproxy/i7jumPCXC__AWJcr-0PvOjsfa-dzaZpwtIHEqQioLhE/rs:fill:200:200:1/g:no/aHR0cHM6Ly9iaXRjb2luY2FzaC1leGFtcGxlLmdpdGh1Yi5pby93ZWJzaXRlL2xvZ28ucG5n.webp",
    };

    const content = buildOnchainMetadata(jettonParams);
    const max_supply = toNano("210000000");
    const owner = Address.parse("UQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWNAs")

    const roma = provider.open(await Roma.fromInit(owner, max_supply, owner, content));

    // deploy
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

    await provider.waitForDeploy(roma.address);

    // run methods on `roma`
    // mint all
    await roma.send(
        provider.sender(),
        {
            value: toNano('0.2'),
        },
        "Mint:All"
    );

    // vote to a beauty
    await roma.send(
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
