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
message AirDrop {
    receiver: Address;
    amount: Int as uint64;
    lock: Bool;
}
message Foundation {
    receiver: Address;
    amount: Int as uint64;
}
message Development {
    receiver: Address;
    amount: Int as uint64;
    lock: Bool;
}
message Treasury {
    receiver: Address;
    amount: Int as uint64;
    lock: Bool;
}

message VoteLiquidity {
    receiver: Address;
    amount: Int as uint64;
    lock: Bool;
}

message Incentives {
    receiver: Address;
    amount: Int as uint64;
}

message EarlyInvestors {
    receiver: Address;
    amount: Int as uint64;
}

struct Limit {
    lock: Int as uint64;
    unlock: Int as uint64;
    second: Int as uint64;
    release: Int as uint32;
}
struct Allocation {
    airdrop: Limit;
    foundation: Limit;
    development: Limit;
    treasury: Limit;
    vote_liquidity: Limit;
    incentives: Limit;
    early_investors: Limit;
}
struct AllocationMinted {
    airdrop: Int as uint64;
    foundation: Int as uint64;
    development: Int as uint64;
    treasury: Int as uint64;
    vote_liquidity: Int as uint64;
    incentives: Int as uint64;
    early_investors: Int as uint64;
    airdrop_lock: Int as uint64;
    foundation_lock: Int as uint64;
    development_lock: Int as uint64;
    treasury_lock: Int as uint64;
    vote_liquidity_lock: Int as uint64;
    incentives_lock: Int as uint64;
    early_investors_lock: Int as uint64;
}

contract MisswWallet with JettonWallet {
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
        return initOf MisswWallet(owner_address, self.jetton_master);
    }
}

contract Missw with JettonMaster, Deployable {
    total_supply: Int as coins = 0;
    max_supply: Int as uint64;
    mintable: Bool = true;
    owner: Address;
    jetton_content: Cell;
    vote_receiver: Address;
    vote_record_count: Int = 0;
    amount2votes_factor: Int = ton("1");
    deployed_at: Int as uint32;
    // allocation: Allocation;
    // allocation_minted: AllocationMinted;
    init(owner: Address, vote_receiver: Address, jetton_content: Cell){
        self.owner = owner;
        self.max_supply = ton("10000000000");
        self.vote_receiver = vote_receiver;
        self.jetton_content = jetton_content;
        self.deployed_at = now();
        // self.allocation = Allocation{
        //     airdrop: Limit{
        //         lock: ton("500000000") / 2,
        //         unlock: ton("500000000") / 2,
        //         second: ton("500000000") / 2 / 3600 * 24 * 30 * 12,
        //         release: 3600 * 24 * 30 * 12
        //     },
        //     foundation: Limit{
        //         lock: ton("2000000000"),
        //         unlock: 0,
        //         second: ton("2000000000") / 3600 * 24 * 30 * 12,
        //         release: 3600 * 24 * 30 * 24
        //     },
        //     development: Limit{
        //         lock: (ton("1000000000") - ton("1000000000") / 5),
        //         unlock: ton("1000000000") / 5,
        //         second: (ton("1000000000") - ton("1000000000") / 5) / 3600 * 24 * 30 * 36,
        //         release: 3600 * 24 * 30 * 36
        //     },
        //     treasury: Limit{
        //         lock: (ton("2000000000") - ton("2000000000") / 5),
        //         unlock: ton("2000000000") / 5,
        //         second: (ton("2000000000") - ton("2000000000") / 5) / 3600 * 24 * 30 * 24,
        //         release: 3600 * 24 * 30 * 24
        //     },
        //     vote_liquidity: Limit{
        //         lock: (ton("2000000000") - ton("2000000000") / 2),
        //         unlock: ton("2000000000") / 2,
        //         second: (ton("2000000000") - ton("2000000000") / 2) / 3600 * 24 * 30 * 12,
        //         release: 3600 * 24 * 30 * 12
        //     },
        //     incentives: Limit{
        //         lock: ton("1500000000"),
        //         unlock: 0,
        //         second: ton("1500000000") / 3600 * 24 * 30 * 36,
        //         release: 3600 * 24 * 30 * 36
        //     },
        //     early_investors: Limit{
        //         lock: ton("1000000000"),
        //         unlock: 0,
        //         second: ton("1500000000") / 3600 * 24 * 30 * 12,
        //         release: 3600 * 24 * 30 * 24
        //     }
        // };
        // self.allocation_minted = AllocationMinted{
        //     airdrop: 0,
        //     foundation: 0,
        //     development: 0,
        //     treasury: 0,
        //     vote_liquidity: 0,
        //     incentives: 0,
        //     early_investors: 0,
        //     airdrop_lock: 0,
        //     foundation_lock: 0,
        //     development_lock: 0,
        //     treasury_lock: 0,
        //     vote_liquidity_lock: 0,
        //     incentives_lock: 0,
        //     early_investors_lock: 0
        // };
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

    // receive(msg: AirDrop){
    //     let ctx: Context = context();
    //     if (!(msg.lock)) {
    //         self.allocation_minted.airdrop = (self.allocation_minted.airdrop + msg.amount);
    //         require(self.allocation_minted.airdrop <= self.allocation.airdrop.unlock, "Mining amount exceeds limit");
    //     } else {
    //         let can_mint: Int = min((self.allocation.airdrop.second *
    //                 (now() -
    //                 self.deployed_at) -
    //                 self.allocation_minted.airdrop_lock),
    //             (self.allocation.airdrop.lock - self.allocation_minted.airdrop_lock)
    //         );
    //         require(msg.amount <= can_mint, "Mining amount exceeds limit");
    //         self.allocation_minted.airdrop_lock = (self.allocation_minted.airdrop_lock + msg.amount);
    //     }
    //     let _msg: JettonMint = JettonMint{
    //         origin: ctx.sender,
    //         receiver: msg.receiver,
    //         amount: msg.amount,
    //         custom_payload: emptyCell(),
    //         forward_ton_amount: 0,
    //         forward_payload: emptySlice()
    //     };
    //     self._mint_validate(ctx, _msg);
    //     self._mint(ctx, _msg);
    // }

    // receive(msg: Foundation){
    //     let delay: Int = 3600 * 24 * 30 * 12;
    //     require((now() - self.deployed_at) > delay, "Still locked, unable to mine");
    //     let ctx: Context = context();
    //     let can_mint: Int = min((self.allocation.foundation.second *
    //             ((now() -
    //             self.deployed_at) -
    //             3600 *
    //             24 *
    //             30 *
    //             12) -
    //             self.allocation_minted.foundation_lock),
    //         (self.allocation.foundation.lock - self.allocation_minted.foundation_lock)
    //     );
    //     require(msg.amount <= can_mint, "Mining amount exceeds limit");
    //     self.allocation_minted.foundation_lock = (self.allocation_minted.foundation_lock + msg.amount);
    //     let _msg: JettonMint = JettonMint{
    //         origin: ctx.sender,
    //         receiver: msg.receiver,
    //         amount: msg.amount,
    //         custom_payload: emptyCell(),
    //         forward_ton_amount: 0,
    //         forward_payload: emptySlice()
    //     };
    //     self._mint_validate(ctx, _msg);
    //     self._mint(ctx, _msg);
    // }

    // receive(msg: Development){
    //     let ctx: Context = context();
    //     if (!(msg.lock)) {
    //         self.allocation_minted.development = (self.allocation_minted.development + msg.amount);
    //         require(self.allocation_minted.development <= self.allocation.development.unlock,
    //             "Mining amount exceeds limit"
    //         );
    //     } else {
    //         let can_mint: Int = min((self.allocation.development.second *
    //                 (now() -
    //                 self.deployed_at) -
    //                 self.allocation_minted.development_lock),
    //             (self.allocation.development.lock - self.allocation_minted.development_lock)
    //         );
    //         require(msg.amount <= can_mint, "Mining amount exceeds limit");
    //         self.allocation_minted.development_lock = (self.allocation_minted.development_lock + msg.amount);
    //     }
    //     let _msg: JettonMint = JettonMint{
    //         origin: ctx.sender,
    //         receiver: msg.receiver,
    //         amount: msg.amount,
    //         custom_payload: emptyCell(),
    //         forward_ton_amount: 0,
    //         forward_payload: emptySlice()
    //     };
    //     self._mint_validate(ctx, _msg);
    //     self._mint(ctx, _msg);
    // }

    // receive(msg: Treasury){
    //     let ctx: Context = context();
    //     if (!(msg.lock)) {
    //         self.allocation_minted.treasury = (self.allocation_minted.treasury + msg.amount);
    //         require(self.allocation_minted.treasury <= self.allocation.treasury.unlock, "Mining amount exceeds limit");
    //     } else {
    //         let can_mint: Int = min((self.allocation.treasury.second *
    //                 (now() -
    //                 self.deployed_at) -
    //                 self.allocation_minted.treasury_lock),
    //             (self.allocation.treasury.lock - self.allocation_minted.treasury_lock)
    //         );
    //         require(msg.amount <= can_mint, "Mining amount exceeds limit");
    //         self.allocation_minted.treasury_lock = (self.allocation_minted.treasury_lock + msg.amount);
    //     }
    //     let _msg: JettonMint = JettonMint{
    //         origin: ctx.sender,
    //         receiver: msg.receiver,
    //         amount: msg.amount,
    //         custom_payload: emptyCell(),
    //         forward_ton_amount: 0,
    //         forward_payload: emptySlice()
    //     };
    //     self._mint_validate(ctx, _msg);
    //     self._mint(ctx, _msg);
    // }

    // receive(msg: VoteLiquidity){
    //     let ctx: Context = context();
    //     if (!(msg.lock)) {
    //         self.allocation_minted.vote_liquidity = (self.allocation_minted.vote_liquidity + msg.amount);
    //         require(self.allocation_minted.vote_liquidity <= self.allocation.vote_liquidity.unlock, "Mining amount exceeds limit");
    //     } else {
    //         let can_mint: Int = min((self.allocation.vote_liquidity.second *
    //                 (now() -
    //                 self.deployed_at) -
    //                 self.allocation_minted.vote_liquidity_lock),
    //             (self.allocation.vote_liquidity.lock - self.allocation_minted.vote_liquidity_lock)
    //         );
    //         require(msg.amount <= can_mint, "Mining amount exceeds limit");
    //         self.allocation_minted.vote_liquidity_lock = (self.allocation_minted.vote_liquidity_lock + msg.amount);
    //     }
    //     let _msg: JettonMint = JettonMint{
    //         origin: ctx.sender,
    //         receiver: msg.receiver,
    //         amount: msg.amount,
    //         custom_payload: emptyCell(),
    //         forward_ton_amount: 0,
    //         forward_payload: emptySlice()
    //     };
    //     self._mint_validate(ctx, _msg);
    //     self._mint(ctx, _msg);
    // }

    // receive(msg: Incentives){
    //     let ctx: Context = context();
    //     let can_mint: Int = min((self.allocation.incentives.second *
    //             ((now() -
    //             self.deployed_at)) -
    //             self.allocation_minted.incentives_lock),
    //         (self.allocation.incentives.lock - self.allocation_minted.incentives_lock)
    //     );
    //     require(msg.amount <= can_mint, "Mining amount exceeds limit");
    //     self.allocation_minted.incentives_lock = (self.allocation_minted.incentives_lock + msg.amount);
    //     let _msg: JettonMint = JettonMint{
    //         origin: ctx.sender,
    //         receiver: msg.receiver,
    //         amount: msg.amount,
    //         custom_payload: emptyCell(),
    //         forward_ton_amount: 0,
    //         forward_payload: emptySlice()
    //     };
    //     self._mint_validate(ctx, _msg);
    //     self._mint(ctx, _msg);
    // }

    // receive(msg: EarlyInvestors){
    //     let delay: Int = 3600 * 24 * 30 * 12;
    //     require((now() - self.deployed_at) > delay, "Still locked, unable to mine");
    //     let ctx: Context = context();
    //     let can_mint: Int = min((self.allocation.early_investors.second *
    //             ((now() -
    //             self.deployed_at) -
    //             delay) -
    //             self.allocation_minted.early_investors_lock),
    //         (self.allocation.early_investors.lock - self.allocation_minted.early_investors_lock)
    //     );
    //     require(msg.amount <= can_mint, "Mining amount exceeds limit");
    //     self.allocation_minted.early_investors_lock = (self.allocation_minted.early_investors_lock + msg.amount);
    //     let _msg: JettonMint = JettonMint{
    //         origin: ctx.sender,
    //         receiver: msg.receiver,
    //         amount: msg.amount,
    //         custom_payload: emptyCell(),
    //         forward_ton_amount: 0,
    //         forward_payload: emptySlice()
    //     };
    //     self._mint_validate(ctx, _msg);
    //     self._mint(ctx, _msg);
    // }

    receive(msg: BeautyVote){
        let ctx: Context = context();
        // send missw to receiver wallet
        let init_wallet: StateInit = self.calculate_jetton_wallet_init(ctx.sender);
        send(SendParameters{
                to: contractAddress(init_wallet),
                value: (ctx.value - ton("0.15")),
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
                value: ton("0.011"),
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

    receive(msg: Factor){
        self.amount2votes_factor = msg.value;
    }

    inline fun calculate_votes(amount: Int): Int {
        let votes: Int = amount / self.amount2votes_factor;
        require(votes > 0, "Cast at least one vote");
        return votes;
    }

    inline fun calculate_beauty_init(id: Int): StateInit {
        return initOf Beauty(id);
    }

    inline fun calculate_log_init(seqno: Int): StateInit {
        return initOf VoteLogs(seqno);
    }

    override inline fun calculate_jetton_wallet_init(owner_address: Address): StateInit {
        return initOf MisswWallet(owner_address, myAddress());
    }

    get fun get_beauty_address(id: Int): Address {
        let initCode: StateInit = self.calculate_beauty_init(id);
        return contractAddress(initCode);
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

    get fun max_supply(): Int {
        return self.max_supply;
    }
}