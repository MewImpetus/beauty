import "@stdlib/deploy";
import "./jetton/master";
import "./jetton/wallet";
import "./beauty";
import "./vote_logs";
message BeautyVote {
    id: Int;
    amount: Int;
}
message VoteReceiver {
    address: Address;
}
message VoteTransfer {
    query_id: Int as uint64; // arbitrary request number
    amount: Int as coins; // amount of jettons to transfer
    destination: Address; // address of the new owner of the jettons
    response_destination: Address; // address where to send a response with confirmation of a successful transfer and the rest of the incoming message Toncoins.
    forward_ton_amount: Int as coins; // the amount of nanotons to be sent to the destination address.
    forward_payload: Slice as remaining; // optional custom data that should be sent to the destination address.
}

contract RomaWallet with JettonWallet {
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
        return initOf RomaWallet(owner_address, self.jetton_master);
    }
}

contract Roma with JettonMaster, Deployable {
    total_supply: Int as coins = 0;
    max_supply: Int as coins;
    mintable: Bool = true;
    owner: Address;
    jetton_content: Cell;
    vote_receiver: Address;
    vote_record_count: Int = 0;
    init(owner: Address, max_supply: Int, vote_receiver: Address, jetton_content: Cell){
        self.owner = owner;
        self.max_supply = max_supply;
        self.vote_receiver = vote_receiver;
        self.jetton_content = jetton_content;
    }

    receive("Mint:All"){
        let ctx: Context = context();
        let msg: JettonMint = JettonMint{
            origin: ctx.sender,
            receiver: ctx.sender,
            amount: self.max_supply,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        self._mint_validate(ctx, msg);
        self._mint(ctx, msg);
        self.mintable = false;
    }

    receive(msg: BeautyVote){
        let ctx: Context = context();
        // send roma to receiver wallet
        let init_wallet: StateInit = self.calculate_jetton_wallet_init(ctx.sender);
        send(SendParameters{
                to: contractAddress(init_wallet),
                value: ton("0.1"),
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
        let init_beauty: StateInit = self.calculate_beauty_init(msg.id);
        send(SendParameters{
                to: contractAddress(init_beauty),
                value: ton("0.01"),
                bounce: true,
                mode: SendPayGasSeparately, //SendPayGasSeparately
                body: Vote{value: self.calculate_votes(msg.amount)}.toCell(),
                code: init_beauty.code,
                data: init_beauty.data
            }
        );
        // add vote record
        self.vote_record_count = (self.vote_record_count + 1);
        let init_logs: StateInit = self.calculate_log_init(self.vote_record_count);
        send(SendParameters{
                to: contractAddress(init_logs),
                value: ton("0.01"),
                bounce: true,
                mode: SendPayGasSeparately, //SendPayGasSeparately
                body: VoteRecord{
                    beauty_id: msg.id,
                    beauty_address: contractAddress(init_beauty),
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

    inline fun calculate_votes(amount: Int): Int {
        return amount / 1000000000;
    }

    inline fun calculate_beauty_init(id: Int): StateInit {
        return initOf Beauty(id);
    }

    inline fun calculate_log_init(seqno: Int): StateInit {
        return initOf VoteLogs(seqno);
    }

    override inline fun calculate_jetton_wallet_init(owner_address: Address): StateInit {
        return initOf RomaWallet(owner_address, myAddress());
    }

    get fun get_beauty_address(id: Int): Address {
        let initCode: StateInit = self.calculate_beauty_init(id);
        return contractAddress(initCode);
    }

    get fun vote_log_address(seqno: Int): Address {
        let initCode: StateInit = self.calculate_log_init(seqno);
        return contractAddress(initCode);
    }

    get fun get_vote_receiver(): Address {
        return self.vote_receiver;
    }

    get fun get_max_supply(): Int {
        return self.max_supply;
    }
}