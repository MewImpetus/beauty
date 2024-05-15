import { Address, toNano } from '@ton/core';
import { Missw } from '../wrappers/Missw';
import { NetworkProvider } from '@ton/blueprint';
import { Beauty } from '../wrappers/Beauty';
import { VoteLogs } from '../wrappers/VoteLogs';

export async function run(provider: NetworkProvider) {

    // this address is the true missw master address
    const missw_address = Address.parse("0QAmvhN60nllxT01f6ubB5oLdx2v_w5P_yXci_L4-r4PUVlU");

    const missw = provider.open(Missw.fromAddress(missw_address));


    // get beauty votes
    const beauty_address = await missw.getGetBeautyAddress();
    const beauty = provider.open(Beauty.fromAddress(beauty_address));
    const votes = await beauty.getGetVotesOf(1n);
    console.log("votes1:", votes);




    const votes100 = await beauty.getGetVotesOf(2n);
    console.log("votes100:", votes100);
    // like this:
    // 100n

    // get a log 

    const log_counts = await missw.getVoteRecordCount()
    console.log("log_counts:", log_counts)

    const log_address_of_1 = await missw.getVoteLogAddress(1n);
    const logs = provider.open(VoteLogs.fromAddress(log_address_of_1));
    const record = await logs.getVoteRecord();
    console.log('record1:', record);
    // like this:
    // {                                                                                                                                                                                                                                                                                                                                                                                                                                                      
    //     '$$type': 'VoteInfo',
    //     beauty_id: 1n,
    //     beauty_address: EQBr-bxg3EZWBaVy5NhEL4ZwT-M9ycQTm3W83hLV_gLjhuGO,
    //     voter: EQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWI3p,
    //     amount: 100000000000n,
    //     votes: 100n
    //   }

    const log_address_of_2 = await missw.getVoteLogAddress(2n);
    const logs2 = provider.open(VoteLogs.fromAddress(log_address_of_2));
    const record2 = await logs.getVoteRecord();
    console.log("record2:", record2);
}
