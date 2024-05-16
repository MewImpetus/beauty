import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, toNano } from '@ton/core';
import { Mswvote } from '../wrappers/Mswvote';
import { MswvoteWallet } from '../build/Mswvote/tact_MswvoteWallet';
import '@ton/test-utils';
import { buildOnchainMetadata } from "../utils/jetton-helpers";
import { Beauty } from '../wrappers/Beauty';
import { VoteLogs } from '../wrappers/VoteLogs';

describe('Mswvote', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let bob: SandboxContract<TreasuryContract>;
    let mswvote: SandboxContract<Mswvote>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        alice = await blockchain.treasury('alice');
        bob = await blockchain.treasury('bob');

        const jettonParams = {
            name: "MswvoteMaster",
            description: "MISSW is a good coin",
            symbol: "MISSW",
            image: "",
        };

        const content = buildOnchainMetadata(jettonParams);
        mswvote = blockchain.openContract(await Mswvote.fromInit(deployer.address, bob.address, content));


        const deployResult = await mswvote.send(
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
            to: mswvote.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and mswvote are ready to use
    });



    it('TEST: Process', async () => {

        const total_supply_0 = (await mswvote.getGetJettonData()).total_supply;
        expect(total_supply_0).toEqual(0n);

        const mintResult = await mswvote.send(
            deployer.getSender(),
            {
                value: toNano('0.2'),
            },
            {
                $$type: "Mint",
                to: deployer.address,
                amount: toNano("1000000000"),
            }
        );

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: mswvote.address,
            success: true,
        });

        const total_supply = (await mswvote.getGetJettonData()).total_supply;
        expect(total_supply).toEqual(toNano("1000000000"));

        // check balance of deployer
        const mswvote_wallet_of_deployer = await mswvote.getGetWalletAddress(deployer.address)

        // from master -> wallet InterTransfer
        expect(mintResult.transactions).toHaveTransaction({
            from: mswvote.address,
            to: mswvote_wallet_of_deployer,
            success: true,
        });

        const mswvote_wallet_contract = blockchain.openContract(MswvoteWallet.fromAddress(mswvote_wallet_of_deployer));
        const balance_deployer = (await mswvote_wallet_contract.getGetWalletData()).balance
        expect(balance_deployer).toEqual(toNano("1000000000"));

        let beauty_address = await mswvote.getGetBeautyAddress();
        expect(beauty_address.toString()).toEqual("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c")
        // deploy beauty
        const deployedResult = await mswvote.send(
            deployer.getSender(),
            {
                value: toNano('0.2'),
            },
            "deploy beauty"
        );
        beauty_address = await mswvote.getGetBeautyAddress();
        expect(deployedResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: mswvote.address,
            success: true,
        });

        // send beauty
        const voteResult = await mswvote.send(
            deployer.getSender(),
            {
                value: toNano('2'),
            },
            {
                $$type: "BeautyVote",
                id: 1n,
                amount: toNano("123")
            }
        );
        // 1. from user -> mswvote 
        expect(voteResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: mswvote.address,
            success: true,
        });

        // 2.1 from mswvote -> deployer wallet
        expect(voteResult.transactions).toHaveTransaction({
            from: mswvote.address,
            to: mswvote_wallet_of_deployer,
            success: true,
        });

        // 2.2 from deployer wallet -> bob wallet (receiver)
        const mswvote_wallet_of_bob = await mswvote.getGetWalletAddress(bob.address);
        expect(voteResult.transactions).toHaveTransaction({
            from: mswvote_wallet_of_deployer,
            to: mswvote_wallet_of_bob,
            success: true,
        });
        // 2.2.1 check the balance of receiver
        const mswvote_wallet_contract_bob = blockchain.openContract(MswvoteWallet.fromAddress(mswvote_wallet_of_bob));
        const bob_balance = (await mswvote_wallet_contract_bob.getGetWalletData()).balance
        expect(bob_balance).toEqual(123000000000n)
        // 2.3 from mswvote -> beauty address
        beauty_address = await mswvote.getGetBeautyAddress();

        expect(voteResult.transactions).toHaveTransaction({
            from: mswvote.address,
            to: beauty_address,
            success: true,
        });
        
        // check the votes of beauty
        const beauty_contract = blockchain.openContract(Beauty.fromAddress(beauty_address));
        
        const votes = await beauty_contract.getGetVotesOf(1n)
        expect(votes).toEqual(123n)
        
        // 3. from mswvote -> logs of 1
        const logs_address_of_1 = await mswvote.getVoteLogAddress(1n);
        expect(voteResult.transactions).toHaveTransaction({
            from: mswvote.address,
            to: logs_address_of_1,
            success: true,
        });
        // check the vote record
        const votelogs_contract_of_1 = blockchain.openContract(VoteLogs.fromAddress(logs_address_of_1));
        const record = await votelogs_contract_of_1.getVoteRecord();
        expect(record.beauty_id).toEqual(1n)
        expect(record.beauty_address.toString()).toEqual(beauty_address.toString())
        expect(record.voter.toString()).toEqual(deployer.address.toString())
        expect(record.amount).toEqual(123000000000n)
        expect(record.votes).toEqual(123n)

        // send change factor
        const changeFactorResult = await mswvote.send(
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
            to: mswvote.address,
            success: true,
        });
        
        const factor = await mswvote.getAmount2votesFactor();
        expect(factor).toEqual(1100000000n);
           
    });
});
