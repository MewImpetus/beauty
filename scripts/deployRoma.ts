import { toNano } from '@ton/core';
import { Roma } from '../wrappers/Roma';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const roma = provider.open(await Roma.fromInit());

    await roma.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(roma.address);

    // run methods on `roma`
}
