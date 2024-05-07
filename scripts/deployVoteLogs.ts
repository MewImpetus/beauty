import { toNano } from '@ton/core';
import { VoteLogs } from '../wrappers/VoteLogs';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const voteLogs = provider.open(await VoteLogs.fromInit());

    await voteLogs.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(voteLogs.address);

    // run methods on `voteLogs`
}
