import "@stdlib/deploy";
import "./jetton/master";
import "./jetton/wallet";
import "./beauty";
import "./vote_logs";

message Mint {
    to: Address;
    amount: Int;
}

message BeautyVote {
    id: Int;
    amount: Int;
}
message VoteReceiver {
    address: Address;
}
message Factor {
    value: Int;
}
message VoteTransfer {
    query_id: Int as uint64; // arbitrary request number
    amount: Int as coins; // amount of jettons to transfer
    destination: Address; // address of the new owner of the jettons
    response_destination: Address; // address where to send a response with confirmation of a successful transfer and the rest of the incoming message Toncoins.
    forward_ton_amount: Int as coins; // the amount of nanotons to be sent to the destination address.
    forward_payload: Slice as remaining; // optional custom data that should be sent to the destination address.
}

message ChangeOwner {
    newOwner: Address;
}


contract MswvoteWallet with JettonWallet {
    balance: Int as coins = 0;
    owner: Address;
    jetton_master: Address;
    init(owner: Address, jetton_master: Address){
        self.owner = owner;
        self.jetton_master = jetton_master;
    }

    receive(msg: VoteTransfer){
        let ctx: Context = context();
        self.balance = (self.balance - msg.amount);
        require(self.balance >= 0, "JettonWallet: Not enough jettons to transfer");
        require(ctx.sender == self.jetton_master, "JettonWallet: Master use only"); // message should send by master
        let _msg: JettonTransfer = JettonTransfer{
            query_id: msg.query_id,
            amount: msg.amount,
            destination: msg.destination,
            response_destination: msg.response_destination,
            custom_payload: emptyCell(),
            forward_ton_amount: msg.forward_ton_amount,
            forward_payload: msg.forward_payload
        };
        self._transfer_estimate_remain_value(ctx, _msg);
        self._transfer_jetton(ctx, _msg);
    }

    override inline fun calculate_jetton_wallet_init(owner_address: Address): StateInit {
        return initOf MswvoteWallet(owner_address, self.jetton_master);
    }
}

contract Mswvote with JettonMaster, Deployable {
    total_supply: Int as coins = 0;
    mintable: Bool = true;
    owner: Address;
    jetton_content: Cell;
    vote_receiver: Address;
    vote_record_count: Int = 0;
    amount2votes_factor: Int = ton("1");
    beauty_address: Address;

    init(owner: Address, vote_receiver: Address, jetton_content: Cell){
        self.owner = owner;
        self.vote_receiver = vote_receiver;
        self.jetton_content = jetton_content;
        self.beauty_address = newAddress(0, 0);
    }

    receive("deploy beauty") {
        require(self.beauty_address == newAddress(0, 0), "Only be deployed once");
        let ctx: Context = context();
        let init_beauty: StateInit = self.calculate_beauty_init(myAddress(), self.vote_receiver);
        self.beauty_address = contractAddress(init_beauty);
        send(SendParameters{
                to: self.beauty_address,
                value: 0,
                bounce: true,
                mode: SendRemainingValue, // SendPayGasSeparately
                body: "deploy".asComment(),
                code: init_beauty.code,
                data: init_beauty.data
            }
        );
    }

    receive(msg: Mint){
        let ctx: Context = context();
        let _msg: JettonMint = JettonMint{
            origin: ctx.sender,
            receiver: msg.to,
            amount: msg.amount,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        self._mint_validate(ctx, _msg);
        self._mint(ctx, _msg);
    }

    receive("close mining") {
        self.mintable = false;
    }

 
    receive(msg: BeautyVote){
        let ctx: Context = context();
        // send missw to receiver wallet
        let init_wallet: StateInit = self.calculate_jetton_wallet_init(ctx.sender);
        send(SendParameters{
                to: contractAddress(init_wallet),
                value: (ctx.value - ton("0.04")),
                bounce: true,
                mode: SendPayGasSeparately,
                body: VoteTransfer{
                    query_id: 0,
                    amount: msg.amount,
                    destination: self.vote_receiver,
                    response_destination: ctx.sender,
                    forward_ton_amount: 0,
                    forward_payload: emptySlice()
                }.toCell(),
                code: init_wallet.code,
                data: init_wallet.data
            }
        );
        // add beauty votes
        send(SendParameters{
                to: self.beauty_address,
                value: ton("0.018"),
                bounce: true,
                mode: SendPayGasSeparately, //SendPayGasSeparately
                body: Vote{id: msg.id, value: self.calculate_votes(msg.amount)}.toCell()
            }
        );
        // add vote record
        self.vote_record_count = (self.vote_record_count + 1);
        let init_logs: StateInit = self.calculate_log_init(self.vote_record_count);
        send(SendParameters{
                to: contractAddress(init_logs),
                value: ton("0.02"),
                bounce: true,
                mode: SendPayGasSeparately, //SendPayGasSeparately
                body: VoteRecord{
                    beauty_id: msg.id,
                    beauty_address: self.beauty_address,
                    voter: ctx.sender,
                    amount: msg.amount,
                    votes: self.calculate_votes(msg.amount)
                }.toCell(),
                code: init_logs.code,
                data: init_logs.data
            }
        );
    }

    receive(msg: VoteReceiver){
        self.vote_receiver = msg.address;
    }

    receive(msg: ChangeOwner){
        self.owner = msg.newOwner;
        self.reply("success".asComment());
    }

    receive("withdraw") {
        require(sender() == self.owner, "Only owner is allowed to withdraw");
        send(SendParameters{
            to: sender(),
            bounce: true,
            value: myBalance() - context().value - ton("1"),
            mode: SendRemainingValue + SendIgnoreErrors
        });
    }

    receive(msg: Factor){
        self.amount2votes_factor = msg.value;
    }

    inline fun calculate_votes(amount: Int): Int {
        let votes: Int = amount / self.amount2votes_factor;
        require(votes > 0, "Cast at least one vote");
        return votes;
    }

    inline fun calculate_beauty_init(owner: Address, beneficiary: Address): StateInit {
        return initOf Beauty(owner, beneficiary);
    }

    inline fun calculate_log_init(seqno: Int): StateInit {
        return initOf VoteLogs(seqno);
    }

    override inline fun calculate_jetton_wallet_init(owner_address: Address): StateInit {
        return initOf MswvoteWallet(owner_address, myAddress());
    }

    get fun get_beauty_address(): Address {
        return self.beauty_address;
    }

    get fun vote_log_address(seqno: Int): Address {
        let initCode: StateInit = self.calculate_log_init(seqno);
        return contractAddress(initCode);
    }

    get fun vote_receiver(): Address {
        return self.vote_receiver;
    }

    get fun vote_record_count(): Int {
        return self.vote_record_count;
    }

    get fun amount2votes_factor(): Int {
        return self.amount2votes_factor;
    }

}
