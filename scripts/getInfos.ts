import { Address, toNano } from '@ton/core';
import { Mswvote } from '../wrappers/Mswvote';
import { NetworkProvider } from '@ton/blueprint';
import { Beauty } from '../wrappers/Beauty';
import { VoteLogs } from '../wrappers/VoteLogs';

export async function run(provider: NetworkProvider) {

    
    const mswvote = provider.open(Mswvote.fromAddress(Address.parse("kQBqT1xRNjjiAbp4G9vrNOrUnQL9CUYh2elbd-O-ufUW06Fc")))

    // get beauty votes
    const beauty_address = await mswvote.getGetBeautyAddress();

    console.log(beauty_address);

    
    const beauty = provider.open(Beauty.fromAddress(beauty_address));
    const votes = await beauty.getGetVotesOf(1n);
    console.log("votes_1:", votes);



    // get a log 

    const log_counts = await mswvote.getVoteRecordCount()
    console.log("log_counts:", log_counts)

    const log_address_of_1 = await mswvote.getVoteLogAddress(1n);
    const logs = provider.open(VoteLogs.fromAddress(log_address_of_1));
    const record = await logs.getVoteRecord();
    console.log('record1:', record);
    // like this:
    // record1: {
    //     '$$type': 'VoteInfo',
    //     beauty_id: 1n,
    //     beauty_address: EQDVtoCTG5cSOPGDsCcwZQmHIrfkr4YsokRKQbiBlFRQSVom,
    //     voter: EQAkZEqn5O4_yI3bCBzxpLEsO1Z10QSGDK5O4buL9nQrWI3p,
    //     amount: 123000000000n,
    //     votes: 123n
    //   }


}
