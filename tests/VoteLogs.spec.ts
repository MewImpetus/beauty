import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { VoteLogs } from '../wrappers/VoteLogs';
import '@ton/test-utils';

describe('VoteLogs', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let voteLogs: SandboxContract<VoteLogs>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        voteLogs = blockchain.openContract(await VoteLogs.fromInit(0n));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await voteLogs.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: voteLogs.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and voteLogs are ready to use
    });
});
