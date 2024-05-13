import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, toNano } from '@ton/core';
import { Missw } from '../wrappers/Missw';
import '@ton/test-utils';
import { buildOnchainMetadata } from "../utils/jetton-helpers";
import { MisswWallet } from '../build/Missw/tact_MisswWallet';
import { Beauty } from '../wrappers/Beauty';
import { VoteLogs } from '../wrappers/VoteLogs';

describe('Missw', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let bob: SandboxContract<TreasuryContract>;
    let missw: SandboxContract<Missw>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        alice = await blockchain.treasury('alice');
        bob = await blockchain.treasury('bob');

        const jettonParams = {
            name: "MisswMaster",
            description: "MISSW is a good coin",
            symbol: "MISSW",
            image: "",
        };

        const content = buildOnchainMetadata(jettonParams);
        const max_supply = toNano("21000000");
        missw = blockchain.openContract(await Missw.fromInit(deployer.address, max_supply, bob.address, content));


        const deployResult = await missw.send(
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
            to: missw.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and missw are ready to use
    });


    it('TEST: Process', async () => {

        const total_supply_0 = (await missw.getGetJettonData()).total_supply;
        expect(total_supply_0).toEqual(0n);

        const mintResult = await missw.send(
            deployer.getSender(),
            {
                value: toNano('0.2'),
            },
            "Mint:All"
        );

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: missw.address,
            success: true,
        });

        const total_supply = (await missw.getGetJettonData()).total_supply;
        expect(total_supply).toEqual(toNano("21000000"));

        // check balance of deployer
        const missw_wallet_of_deployer = await missw.getGetWalletAddress(deployer.address)

        // from master -> wallet InterTransfer
        expect(mintResult.transactions).toHaveTransaction({
            from: missw.address,
            to: missw_wallet_of_deployer,
            success: true,
        });

        const missw_wallet_contract = blockchain.openContract(MisswWallet.fromAddress(missw_wallet_of_deployer));
        const balance_deployer = (await missw_wallet_contract.getGetWalletData()).balance
        expect(balance_deployer).toEqual(toNano("21000000"));

        // send beauty
        
        const voteResult = await missw.send(
            deployer.getSender(),
            {
                value: toNano('2'),
            },
            {
                $$type: "BeautyVote",
                id: 1n,
                amount: toNano("100")
            }
        );
        // 1. from user -> missw 
        expect(voteResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: missw.address,
            success: true,
        });

        // 2.1 from missw -> deployer wallet
        expect(voteResult.transactions).toHaveTransaction({
            from: missw.address,
            to: missw_wallet_of_deployer,
            success: true,
        });

        // 2.2 from deployer wallet -> bob wallet (receiver)
        const missw_wallet_of_bob = await missw.getGetWalletAddress(bob.address);
        expect(voteResult.transactions).toHaveTransaction({
            from: missw_wallet_of_deployer,
            to: missw_wallet_of_bob,
            success: true,
        });
        // 2.2.1 check the balance of receiver
        const missw_wallet_contract_bob = blockchain.openContract(MisswWallet.fromAddress(missw_wallet_of_bob));
        const bob_balance = (await missw_wallet_contract_bob.getGetWalletData()).balance
        expect(bob_balance).toEqual(100000000000n)

        // 2.3 from missw -> beauty address of id 1
        const beauty_address_of_1 = await missw.getGetBeautyAddress(1n);
        expect(voteResult.transactions).toHaveTransaction({
            from: missw.address,
            to: beauty_address_of_1,
            success: true,
        });
        // check the votes of beauty
        const beauty_contract_of_1 = blockchain.openContract(Beauty.fromAddress(beauty_address_of_1));
        
        const votes = await beauty_contract_of_1.getGetVotes()

        expect(votes).toEqual(100n)

        // 3. from missw -> logs of 1
        const logs_address_of_1 = await missw.getVoteLogAddress(1n);
        expect(voteResult.transactions).toHaveTransaction({
            from: missw.address,
            to: logs_address_of_1,
            success: true,
        });
        // check the vote record
        const votelogs_contract_of_1 = blockchain.openContract(VoteLogs.fromAddress(logs_address_of_1));
        const record = await votelogs_contract_of_1.getVoteRecord();
        
        expect(record.beauty_id).toEqual(1n)
        expect(record.beauty_address.toString()).toEqual(beauty_address_of_1.toString())
        expect(record.voter.toString()).toEqual(deployer.address.toString())
        expect(record.amount).toEqual(100000000000n)
        expect(record.votes).toEqual(100n)

        // send change factor
        const changeFactorResult = await missw.send(
            deployer.getSender(),
            {
                value: toNano('0.5'),
            },
            {
                $$type: "Factor",
                value: toNano("1.1")
            }
        );
        expect(changeFactorResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: missw.address,
            success: true,
        });
        
        const factor = await missw.getAmount2votesFactor();
        expect(factor).toEqual(1100000000n);
           
    });
});
