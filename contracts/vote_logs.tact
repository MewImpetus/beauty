import "@stdlib/deploy";
message VoteRecord {
    beauty_id: Int;
    beauty_address: Address;
    voter: Address;
    amount: Int;
    votes: Int;
}
struct VoteInfo {
    beauty_id: Int;
    beauty_address: Address;
    voter: Address;
    amount: Int;
    votes: Int;
}

contract VoteLogs with Deployable {
    seqno: Int;
    vote_info: VoteInfo;
    init(seqno: Int){
        self.seqno = seqno;
        self.vote_info = VoteInfo{
            beauty_id: 0,
            beauty_address: newAddress(0, 0),
            voter: newAddress(0, 0),
            amount: 0,
            votes: 0
        };
    }

    receive(msg: VoteRecord){
        self.vote_info.beauty_id = msg.beauty_id;
        self.vote_info.beauty_address = msg.beauty_address;
        self.vote_info.voter = msg.voter;
        self.vote_info.amount = msg.amount;
        self.vote_info.votes = msg.votes;
    }

    get fun vote_record(): VoteInfo {
        return self.vote_info;
    }
}