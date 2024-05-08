import { Address, toNano } from '@ton/core';
import { Roma } from '../wrappers/Roma';
import { NetworkProvider } from '@ton/blueprint';
import { Beauty } from '../wrappers/Beauty';
import { VoteLogs } from '../wrappers/VoteLogs';

export async function run(provider: NetworkProvider) {

    const roma_address = Address.parse("0QAmvhN60nllxT01f6ubB5oLdx2v_w5P_yXci_L4-r4PUVlU");

    const roma = provider.open(Roma.fromAddress(roma_address));


    // get beauty votes
    const beauty_address_of_1 = await roma.getGetBeautyAddress(1n);
    const beauty = provider.open(Beauty.fromAddress(beauty_address_of_1));
    const votes = await beauty.getGetVotes();
    console.log(votes);
    // like this:
    // 100n

    // get a log 
    const log_address_of_1 = await roma.getVoteLogAddress(1n);
    const logs = provider.open(VoteLogs.fromAddress(log_address_of_1));
    const record = await logs.getVoteRecord();
    console.log(record);
    // like this:
    // {                                                                                                                                                                                                                                                                                                                                                                                                                                                      
    //     '$$type': 'VoteInfo',
    //     beauty_id: 1n,
    //     beauty_address: EQBr-bxg3EZWBaVy5NhEL4ZwT-M9ycQTm3W83hLV_gLjhuGO,
    //     voter: EQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWI3p,
    //     amount: 100000000000n,
    //     votes: 100n
    //   }

}
