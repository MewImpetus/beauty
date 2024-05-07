import { toNano } from '@ton/core';
import { Beauty } from '../wrappers/Beauty';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const beauty = provider.open(await Beauty.fromInit());

    await beauty.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(beauty.address);

    // run methods on `beauty`
}
