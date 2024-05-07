import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, toNano } from '@ton/core';
import { Roma } from '../wrappers/Roma';
import '@ton/test-utils';
import { buildOnchainMetadata } from "../utils/jetton-helpers";
import { RomaWallet } from '../build/Roma/tact_RomaWallet';
import { Beauty } from '../wrappers/Beauty';
import { waitForDebugger } from 'inspector';
import { VoteLogs } from '../wrappers/VoteLogs';

describe('Roma', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let bob: SandboxContract<TreasuryContract>;
    let roma: SandboxContract<Roma>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        alice = await blockchain.treasury('alice');
        bob = await blockchain.treasury('bob');

        const jettonParams = {
            name: "RomaMaster",
            description: "ROMA is a good coin",
            symbol: "ROMA",
            image: "",
        };

        const content = buildOnchainMetadata(jettonParams);
        const max_supply = toNano("21000000");
        roma = blockchain.openContract(await Roma.fromInit(deployer.address, max_supply, bob.address, content));


        const deployResult = await roma.send(
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
            to: roma.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and roma are ready to use
    });


    it('TEST: Process', async () => {

        const total_supply_0 = (await roma.getGetJettonData()).total_supply;
        expect(total_supply_0).toEqual(0n);

        const mintResult = await roma.send(
            deployer.getSender(),
            {
                value: toNano('0.2'),
            },
            "Mint:All"
        );

        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: roma.address,
            success: true,
        });

        const total_supply = (await roma.getGetJettonData()).total_supply;
        expect(total_supply).toEqual(toNano("21000000"));

        // check balance of deployer
        const roma_wallet_of_deployer = await roma.getGetWalletAddress(deployer.address)

        // from master -> wallet InterTransfer
        expect(mintResult.transactions).toHaveTransaction({
            from: roma.address,
            to: roma_wallet_of_deployer,
            success: true,
        });

        const roma_wallet_contract = blockchain.openContract(RomaWallet.fromAddress(roma_wallet_of_deployer));
        const balance_deployer = (await roma_wallet_contract.getGetWalletData()).balance
        expect(balance_deployer).toEqual(toNano("21000000"));

        // send beauty
        
        const voteResult = await roma.send(
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
        // 1. from user -> roma 
        expect(voteResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: roma.address,
            success: true,
        });

        // 2.1 from roma -> deployer wallet
        expect(voteResult.transactions).toHaveTransaction({
            from: roma.address,
            to: roma_wallet_of_deployer,
            success: true,
        });

        // 2.2 from deployer wallet -> bob wallet (receiver)
        const roma_wallet_of_bob = await roma.getGetWalletAddress(bob.address);
        expect(voteResult.transactions).toHaveTransaction({
            from: roma_wallet_of_deployer,
            to: roma_wallet_of_bob,
            success: true,
        });
        // 2.2.1 check the balance of receiver
        const roma_wallet_contract_bob = blockchain.openContract(RomaWallet.fromAddress(roma_wallet_of_bob));
        const bob_balance = (await roma_wallet_contract_bob.getGetWalletData()).balance
        expect(bob_balance).toEqual(100000000000n)

        // 2.3 from roma -> beauty address of id 1
        const beauty_address_of_1 = await roma.getGetBeautyAddress(1n);
        expect(voteResult.transactions).toHaveTransaction({
            from: roma.address,
            to: beauty_address_of_1,
            success: true,
        });
        // check the votes of beauty
        const beauty_contract_of_1 = blockchain.openContract(Beauty.fromAddress(beauty_address_of_1));
        
        const votes = await beauty_contract_of_1.getGetVotes()

        expect(votes).toEqual(100n)

        // 3. from roma -> logs of 1
        const logs_address_of_1 = await roma.getVoteLogAddress(1n);
        expect(voteResult.transactions).toHaveTransaction({
            from: roma.address,
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
           
    });
});
