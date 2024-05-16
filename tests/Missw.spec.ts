import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, toNano } from '@ton/core';
import { Missw } from '../wrappers/Missw';
import '@ton/test-utils';
import { buildOnchainMetadata } from "../utils/jetton-helpers";
import { MisswWallet } from '../build/Missw/tact_MisswWallet';
import { sleep } from '@ton/blueprint';

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
        missw = blockchain.openContract(await Missw.fromInit(deployer.address, bob.address, content));


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
        // 查看可挖的矿
        let mintable = await missw.getMintAbleInfo();
        console.log("mintable:", mintable);

        sleep(1000)

        mintable = await missw.getMintAbleInfo();
        console.log("mintable:", mintable);
    });

    // it('TEST: AirDrop', async () => {
    //     const total_supply_0 = (await missw.getGetJettonData()).total_supply;
    //     expect(total_supply_0).toEqual(0n);

    //     let airdropResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "AirDrop",
    //             receiver: deployer.address,
    //             amount: toNano("250000000"),
    //             lock: false
    //         }
    //     );

    //     expect(airdropResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: true,
    //     });

    //     const total_supply = (await missw.getGetJettonData()).total_supply;
    //     expect(total_supply).toEqual(toNano("250000000"));

    //     // check balance of deployer
    //     const missw_wallet_of_deployer = await missw.getGetWalletAddress(deployer.address)

    //     // from master -> wallet InterTransfer
    //     expect(airdropResult.transactions).toHaveTransaction({
    //         from: missw.address,
    //         to: missw_wallet_of_deployer,
    //         success: true,
    //     });

    //     const missw_wallet_contract = blockchain.openContract(MisswWallet.fromAddress(missw_wallet_of_deployer));
    //     const balance_deployer = (await missw_wallet_contract.getGetWalletData()).balance
    //     expect(balance_deployer).toEqual(toNano("250000000"));

    //     // should be fail
    //     airdropResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "AirDrop",
    //             receiver: deployer.address,
    //             amount: toNano("250000000"),
    //             lock: false
    //         }
    //     );

    //     expect(airdropResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    //     airdropResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "AirDrop",
    //             receiver: deployer.address,
    //             amount: toNano("100"),
    //             lock: true
    //         }
    //     );

    //     expect(airdropResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });


    //     await sleep(1000);
    //     airdropResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "AirDrop",
    //             receiver: deployer.address,
    //             amount: toNano(250000000/(3600*24*30*12)),
    //             lock: true
    //         }
    //     );

    //     expect(airdropResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: true,
    //     });

    //     airdropResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.5'),
    //         },
    //         {
    //             $$type: "AirDrop",
    //             receiver: deployer.address,
    //             amount: toNano(250000000/(3600*24*30*6)),
    //             lock: true
    //         }
    //     );

    //     expect(airdropResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    // });


    // it('TEST: Foundation', async () => {
    //     const total_supply_0 = (await missw.getGetJettonData()).total_supply;
    //     expect(total_supply_0).toEqual(0n);

    //     let mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "Foundation",
    //             receiver: deployer.address,
    //             amount: toNano(2000000000/(3600*24*30*12)),
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    //     await sleep(1000);

    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "Foundation",
    //             receiver: deployer.address,
    //             amount: toNano(2000000000/(3600*24*30*12)),
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    //     await sleep(2000);

    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.1'),
    //         },
    //         {
    //             $$type: "Foundation",
    //             receiver: deployer.address,
    //             amount: toNano(2000000000/(3600*24*30*12)),
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: true,
    //     });


    // });

    // it('TEST: Development', async () => {
    //     const total_supply_0 = (await missw.getGetJettonData()).total_supply;
    //     expect(total_supply_0).toEqual(0n);

    //     let mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "Development",
    //             receiver: deployer.address,
    //             amount: toNano("200000000"),
    //             lock: false
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: true,
    //     });

    //     const total_supply = (await missw.getGetJettonData()).total_supply;
    //     expect(total_supply).toEqual(toNano("200000000"));

    //     // check balance of deployer
    //     const missw_wallet_of_deployer = await missw.getGetWalletAddress(deployer.address)

    //     // from master -> wallet InterTransfer
    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: missw.address,
    //         to: missw_wallet_of_deployer,
    //         success: true,
    //     });

    //     const missw_wallet_contract = blockchain.openContract(MisswWallet.fromAddress(missw_wallet_of_deployer));
    //     const balance_deployer = (await missw_wallet_contract.getGetWalletData()).balance
    //     expect(balance_deployer).toEqual(toNano("200000000"));

    //     // should be fail
    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "Development",
    //             receiver: deployer.address,
    //             amount: toNano("100000000"),
    //             lock: false
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "Development",
    //             receiver: deployer.address,
    //             amount: toNano("100"),
    //             lock: true
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });


    //     await sleep(1000);
    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "Development",
    //             receiver: deployer.address,
    //             amount: toNano(800000000/(3600*24*30*12*3)),
    //             lock: true
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: true,
    //     });

    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.5'),
    //         },
    //         {
    //             $$type: "Development",
    //             receiver: deployer.address,
    //             amount: toNano(800000000/(3600*24*30*12)),
    //             lock: true
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    // });

    // it('TEST: Treasury', async () => {
    //     const total_supply_0 = (await missw.getGetJettonData()).total_supply;
    //     expect(total_supply_0).toEqual(0n);

    //     let mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: 'Treasury',
    //             receiver: deployer.address,
    //             amount: toNano("400000000"),
    //             lock: false
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: true,
    //     });

    //     const total_supply = (await missw.getGetJettonData()).total_supply;
    //     expect(total_supply).toEqual(toNano("400000000"));

    //     // check balance of deployer
    //     const missw_wallet_of_deployer = await missw.getGetWalletAddress(deployer.address)

    //     // from master -> wallet InterTransfer
    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: missw.address,
    //         to: missw_wallet_of_deployer,
    //         success: true,
    //     });

    //     const missw_wallet_contract = blockchain.openContract(MisswWallet.fromAddress(missw_wallet_of_deployer));
    //     const balance_deployer = (await missw_wallet_contract.getGetWalletData()).balance
    //     expect(balance_deployer).toEqual(toNano("400000000"));

    //     // should be fail
    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "Treasury",
    //             receiver: deployer.address,
    //             amount: toNano("100000"),
    //             lock: false
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.1'),
    //         },
    //         {
    //             $$type: "Treasury",
    //             receiver: deployer.address,
    //             amount: toNano("100"),
    //             lock: true
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });


    //     await sleep(1000);
    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "Treasury",
    //             receiver: deployer.address,
    //             amount: toNano(1600000000/(3600*24*30*12*2)),
    //             lock: true
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: true,
    //     });

    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "Treasury",
    //             receiver: deployer.address,
    //             amount: toNano(1600000000/(3600*24*30*12)),
    //             lock: true
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    // });

    // it('TEST: VoteLiquidity', async () => {
    //     const total_supply_0 = (await missw.getGetJettonData()).total_supply;
    //     expect(total_supply_0).toEqual(0n);

    //     let mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "VoteLiquidity",
    //             receiver: deployer.address,
    //             amount: toNano("1000000000"),
    //             lock: false
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: true,
    //     });

    //     const total_supply = (await missw.getGetJettonData()).total_supply;
    //     expect(total_supply).toEqual(toNano("1000000000"));

    //     // check balance of deployer
    //     const missw_wallet_of_deployer = await missw.getGetWalletAddress(deployer.address)

    //     // from master -> wallet InterTransfer
    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: missw.address,
    //         to: missw_wallet_of_deployer,
    //         success: true,
    //     });

    //     const missw_wallet_contract = blockchain.openContract(MisswWallet.fromAddress(missw_wallet_of_deployer));
    //     const balance_deployer = (await missw_wallet_contract.getGetWalletData()).balance
    //     expect(balance_deployer).toEqual(toNano("1000000000"));

    //     // should be fail
    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "VoteLiquidity",
    //             receiver: deployer.address,
    //             amount: toNano("1000"),
    //             lock: false
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.1'),
    //         },
    //         {
    //             $$type: "VoteLiquidity",
    //             receiver: deployer.address,
    //             amount: toNano("100"),
    //             lock: true
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });


    //     await sleep(1000);
    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "VoteLiquidity",
    //             receiver: deployer.address,
    //             amount: toNano(1000000000/(3600*24*30*12)),
    //             lock: true
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: true,
    //     });

    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "VoteLiquidity",
    //             receiver: deployer.address,
    //             amount: toNano(1100000000/(3600*24*30*12)),
    //             lock: true
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    // });

    // it('TEST: Incentives', async () => {
    //     const total_supply_0 = (await missw.getGetJettonData()).total_supply;
    //     expect(total_supply_0).toEqual(0n);

    //     let mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "Incentives",
    //             receiver: deployer.address,
    //             amount: toNano(1500000000/(3600*24*30*12*3)),
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    //     await sleep(1000);

    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.3'),
    //         },
    //         {
    //             $$type: "Incentives",
    //             receiver: deployer.address,
    //             amount: toNano(1500000000/(3600*24*30*12*3)),
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    //     await sleep(1000);

    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.1'),
    //         },
    //         {
    //             $$type: "Incentives",
    //             receiver: deployer.address,
    //             amount: toNano(1500000000/(3600*24*30*12*3)),
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: true,
    //     });


    // });

    // it('TEST: EarlyInvestors', async () => {
    //     const total_supply_0 = (await missw.getGetJettonData()).total_supply;
    //     expect(total_supply_0).toEqual(0n);

    //     let mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "EarlyInvestors",
    //             receiver: deployer.address,
    //             amount: toNano(1000000000/(3600*24*30*12)),
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    //     await sleep(900);

    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.2'),
    //         },
    //         {
    //             $$type: "EarlyInvestors",
    //             receiver: deployer.address,
    //             amount: toNano(1000000000/(3600*24*30*12)),
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: false,
    //     });

    //     await sleep(2000);

    //     mintResult = await missw.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.1'),
    //         },
    //         {
    //             $$type: "EarlyInvestors",
    //             receiver: deployer.address,
    //             amount: toNano(1000000000/(3600*24*30*12)),
    //         }
    //     );

    //     expect(mintResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: missw.address,
    //         success: true,
    //     });


    // });
});
