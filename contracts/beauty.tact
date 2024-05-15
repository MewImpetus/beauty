import "@stdlib/deploy";
message Vote {
    id: Int;
    value: Int;
}

contract Beauty with Deployable {
    const MinTonForStorage: Int = ton("0.1");
    owner: Address;
    beneficiary: Address;
    votes: map<Int as uint64, Int as uint64>;
    init(owner: Address, beneficiary: Address){
        self.owner = owner;
        self.beneficiary = beneficiary;
    }

    receive("active") {
        dump(self.beneficiary);
    }

    receive(msg: Vote){
        require(sender() == self.owner, "Only owner is allowed");
        if (self.votes.get(msg.id) == null) {
            self.votes.set(msg.id, 0);
        }
        self.votes.set(msg.id, (self.votes.get(msg.id)!! + msg.value));
    }

    receive("withdraw"){
        require(sender() == self.beneficiary, "Only beneficiary is allowed to withdraw");
        send(SendParameters{
                to: sender(),
                bounce: true,
                value: ((myBalance() - context().value) - self.MinTonForStorage),
                mode: SendRemainingValue
            }
        );
    }

    get fun get_votes_of(id: Int): Int {
        if (self.votes.get(id) == null) {
            return 0;
        }
        return self.votes.get(id)!!;
    }
}