import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, toNano } from '@ton/core';
import { Beauty } from '../wrappers/Beauty';
import '@ton/test-utils';

describe('Beauty', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let beauty: SandboxContract<Beauty>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        const id = 1n

        beauty = blockchain.openContract(await Beauty.fromInit(deployer.address, deployer.address));

        

        const deployResult = await beauty.send(
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
            to: beauty.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and beauty are ready to use
    });

    it('Test: Vote', async () => {
        // the check is done inside beforeEach
        // blockchain and beauty are ready to use
        const vote_result = await beauty.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: "Vote",
                id: 1n,
                value: 2n
            }
        )

        expect(vote_result.transactions).toHaveTransaction({
            from: deployer.address,
            to: beauty.address,
            success: true,
        });


        const votes = await beauty.getGetVotesOf(1n);

        expect(votes).toEqual(2n)



    });
});
