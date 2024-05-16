import "@stdlib/deploy";
import "./jetton/master";
import "./jetton/wallet";
import "./vote_logs";

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
    minted_lock: Int as uint64;
    minted_unlock: Int as uint64;
}
struct MintAbleAmount {
    lock: Int as uint64;
    unlock: Int as uint64;
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
struct MintAbleInfo {
    airdrop: MintAbleAmount;
    foundation: MintAbleAmount;
    development: MintAbleAmount;
    treasury: MintAbleAmount;
    vote_liquidity: MintAbleAmount;
    incentives: MintAbleAmount;
    early_investors: MintAbleAmount;
}

contract MisswWallet with JettonWallet {
    balance: Int as coins = 0;
    owner: Address;
    jetton_master: Address;
    init(owner: Address, jetton_master: Address){
        self.owner = owner;
        self.jetton_master = jetton_master;
    }

    override inline fun calculate_jetton_wallet_init(owner_address: Address): StateInit {
        return initOf MisswWallet(owner_address, self.jetton_master);
    }
}

contract Missw with JettonMaster, Deployable {
    total_supply: Int as coins = 0;
    max_supply: Int as coins;
    mintable: Bool = true;
    owner: Address;
    jetton_content: Cell;
    vote_receiver: Address;
    vote_record_count: Int = 0;
    amount2votes_factor: Int = ton("1");
    deployed_at: Int as uint32;
    allocation: Allocation;
    init(owner: Address, vote_receiver: Address, jetton_content: Cell){
        self.owner = owner;
        self.max_supply = ton("10000000000");
        self.vote_receiver = vote_receiver;
        self.jetton_content = jetton_content;
        self.deployed_at = now();
        let year_second: Int = 3600 * 24 * 30 * 12;
        self.allocation = Allocation{
            airdrop: Limit{
                lock: ton("250000000"),
                unlock: ton("250000000"),
                second: ton("250000000") / year_second,
                release: year_second,
                minted_lock: 0,
                minted_unlock: 0
            },
            foundation: Limit{
                lock: ton("2000000000"),
                unlock: 0,
                second: ton("2000000000") / year_second,
                release: year_second * 2,
                minted_lock: 0,
                minted_unlock: 0
            },
            development: Limit{
                lock: ton("800000000"),
                unlock: ton("200000000"),
                second: ton("800000000")/ (year_second * 3),
                release: year_second * 3,
                minted_lock: 0,
                minted_unlock: 0
            },
            treasury: Limit{
                lock: ton("1600000000"),
                unlock: ton("400000000"),
                second: ton("1600000000") / (year_second * 2),
                release: year_second * 2,
                minted_lock: 0,
                minted_unlock: 0
            },
            vote_liquidity: Limit{
                lock: ton("1000000000"),
                unlock: ton("1000000000"),
                second: ton("1000000000") / year_second,
                release: year_second,
                minted_lock: 0,
                minted_unlock: 0
            },
            incentives: Limit{
                lock: ton("1500000000"),
                unlock: 0,
                second: ton("1500000000") / (year_second * 3),
                release: (year_second * 3),
                minted_lock: 0,
                minted_unlock: 0
            },
            early_investors: Limit{
                lock: ton("1000000000"),
                unlock: 0,
                second: ton("1500000000") / year_second,
                release: year_second * 2,
                minted_lock: 0,
                minted_unlock: 0
            }
        };
    }


    receive(msg: AirDrop){
        let ctx: Context = context();
        // unlock
        if (!msg.lock) {
            self.allocation.airdrop.minted_unlock = (self.allocation.airdrop.minted_unlock + msg.amount);
            require(self.allocation.airdrop.minted_unlock <= self.allocation.airdrop.unlock, "Mining amount exceeds limit");
        } else {
            let can_mint: Int = min((self.allocation.airdrop.second *
                    (now() -
                    self.deployed_at) -
                    self.allocation.airdrop.minted_lock),
                (self.allocation.airdrop.lock - self.allocation.airdrop.minted_lock)
            );
            require(msg.amount <= can_mint, "Mining amount exceeds limit");
            self.allocation.airdrop.minted_lock = self.allocation.airdrop.minted_lock + msg.amount;
        }
        let _msg: JettonMint = JettonMint{
            origin: ctx.sender,
            receiver: msg.receiver,
            amount: msg.amount,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        self._mint_validate(ctx, _msg);
        self._mint(ctx, _msg);
    }

    receive(msg: Foundation){
        let delay: Int = 3600 * 24 * 30 * 12; // TODO modify to 3600 * 24 * 30 * 12;
        require((now() - self.deployed_at) > delay, "Still locked, unable to mine");
        let ctx: Context = context();
        let can_mint: Int = min((self.allocation.foundation.second *
                ((now() -
                self.deployed_at) -
                delay) -
                self.allocation.foundation.minted_lock),
            (self.allocation.foundation.lock - self.allocation.foundation.minted_lock)
        );
        require(msg.amount <= can_mint, "Mining amount exceeds limit");
        self.allocation.foundation.minted_lock = self.allocation.foundation.minted_lock  + msg.amount;
        let _msg: JettonMint = JettonMint{
            origin: ctx.sender,
            receiver: msg.receiver,
            amount: msg.amount,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        self._mint_validate(ctx, _msg);
        self._mint(ctx, _msg);
    }

    receive(msg: Development){
        let ctx: Context = context();
        // unlock
        if (!msg.lock) {
            self.allocation.development.minted_unlock = (self.allocation.development.minted_unlock + msg.amount);
            require(self.allocation.development.minted_unlock <= self.allocation.development.unlock, "Mining amount exceeds limit");
        } else {
            let can_mint: Int = min((self.allocation.development.second *
                    (now() -
                    self.deployed_at) -
                    self.allocation.development.minted_lock),
                (self.allocation.development.lock - self.allocation.development.minted_lock)
            );
            require(msg.amount <= can_mint, "Mining amount exceeds limit");
            self.allocation.development.minted_lock = self.allocation.development.minted_lock + msg.amount;
        }
        let _msg: JettonMint = JettonMint{
            origin: ctx.sender,
            receiver: msg.receiver,
            amount: msg.amount,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        self._mint_validate(ctx, _msg);
        self._mint(ctx, _msg);
    }

    receive(msg: Treasury){
        let ctx: Context = context();
        // unlock
        if (!msg.lock) {
            self.allocation.treasury.minted_unlock = (self.allocation.treasury.minted_unlock + msg.amount);
            require(self.allocation.treasury.minted_unlock <= self.allocation.treasury.unlock, "Mining amount exceeds limit");
        } else {
            let can_mint: Int = min((self.allocation.treasury.second *
                    (now() -
                    self.deployed_at) -
                    self.allocation.treasury.minted_lock),
                (self.allocation.treasury.lock - self.allocation.treasury.minted_lock)
            );
            require(msg.amount <= can_mint, "Mining amount exceeds limit");
            self.allocation.treasury.minted_lock = self.allocation.treasury.minted_lock + msg.amount;
        }
        let _msg: JettonMint = JettonMint{
            origin: ctx.sender,
            receiver: msg.receiver,
            amount: msg.amount,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        self._mint_validate(ctx, _msg);
        self._mint(ctx, _msg);
    }

    receive(msg: VoteLiquidity){
        let ctx: Context = context();
        // unlock
        if (!msg.lock) {
            self.allocation.vote_liquidity.minted_unlock = (self.allocation.vote_liquidity.minted_unlock + msg.amount);
            require(self.allocation.vote_liquidity.minted_unlock <= self.allocation.vote_liquidity.unlock, "Mining amount exceeds limit");
        } else {
            let can_mint: Int = min((self.allocation.vote_liquidity.second *
                    (now() -
                    self.deployed_at) -
                    self.allocation.vote_liquidity.minted_lock),
                (self.allocation.vote_liquidity.lock - self.allocation.vote_liquidity.minted_lock)
            );
            require(msg.amount <= can_mint, "Mining amount exceeds limit");
            self.allocation.vote_liquidity.minted_lock = self.allocation.vote_liquidity.minted_lock + msg.amount;
        }
        let _msg: JettonMint = JettonMint{
            origin: ctx.sender,
            receiver: msg.receiver,
            amount: msg.amount,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        self._mint_validate(ctx, _msg);
        self._mint(ctx, _msg);
    }

    receive(msg: Incentives){
        let ctx: Context = context();
        let can_mint: Int = min((self.allocation.incentives.second *
                (now() -
                self.deployed_at) -
                self.allocation.incentives.minted_lock),
            (self.allocation.incentives.lock - self.allocation.incentives.minted_lock)
        );
        require(msg.amount <= can_mint, "Mining amount exceeds limit");
        self.allocation.incentives.minted_lock = self.allocation.incentives.minted_lock  + msg.amount;
        let _msg: JettonMint = JettonMint{
            origin: ctx.sender,
            receiver: msg.receiver,
            amount: msg.amount,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        self._mint_validate(ctx, _msg);
        self._mint(ctx, _msg);
    }

    receive(msg: EarlyInvestors){
        let delay: Int = 3600 * 24 * 30 * 12; // TODO modify to 3600 * 24 * 30 * 12;
        require((now() - self.deployed_at) > delay, "Still locked, unable to mine");
        let ctx: Context = context();
        let can_mint: Int = min((self.allocation.early_investors.second *
                ((now() -
                self.deployed_at) -
                delay) -
                self.allocation.early_investors.minted_lock),
            (self.allocation.early_investors.lock - self.allocation.early_investors.minted_lock)
        );
        require(msg.amount <= can_mint, "Mining amount exceeds limit");
        self.allocation.early_investors.minted_lock = self.allocation.early_investors.minted_lock  + msg.amount;
        let _msg: JettonMint = JettonMint{
            origin: ctx.sender,
            receiver: msg.receiver,
            amount: msg.amount,
            custom_payload: emptyCell(),
            forward_ton_amount: 0,
            forward_payload: emptySlice()
        };
        self._mint_validate(ctx, _msg);
        self._mint(ctx, _msg);
    }

    override inline fun calculate_jetton_wallet_init(owner_address: Address): StateInit {
        return initOf MisswWallet(owner_address, myAddress());
    }

    get fun max_supply(): Int {
        return self.max_supply;
    }

    get fun mint_able_info(): MintAbleInfo {
        let year_second: Int = 3600 * 24 * 30 * 12;
        let delta: Int = (now() - self.deployed_at);
        let _foundation_lock: Int = 0;
        let _early_investors_lock: Int = 0;
        if (delta > year_second) {
            _foundation_lock = min((self.allocation.foundation.second *
                    ((now() -
                    self.deployed_at) -
                    year_second) -
                    self.allocation.foundation.minted_lock),
                (self.allocation.foundation.lock - self.allocation.foundation.minted_lock)
            );
            _early_investors_lock = min((self.allocation.early_investors.second *
                    ((now() -
                    self.deployed_at) -
                    year_second) -
                    self.allocation.early_investors.minted_lock),
                (self.allocation.early_investors.lock - self.allocation.early_investors.minted_lock)
            );
        }
        return
            MintAbleInfo{
                airdrop: MintAbleAmount{
                    lock: min((self.allocation.airdrop.second *
                            (now() -
                            self.deployed_at) -
                            self.allocation.airdrop.minted_lock),
                        (self.allocation.airdrop.lock - self.allocation.airdrop.minted_lock)
                    ),
                    unlock: (self.allocation.airdrop.unlock - self.allocation.airdrop.minted_unlock)
                },
                foundation: MintAbleAmount{
                    lock: _foundation_lock,
                    unlock: (self.allocation.foundation.unlock - self.allocation.foundation.minted_unlock)
                },
                development: MintAbleAmount{
                    lock: min((self.allocation.development.second *
                            (now() -
                            self.deployed_at) -
                            self.allocation.development.minted_lock),
                        (self.allocation.development.lock - self.allocation.development.minted_lock)
                    ),
                    unlock: (self.allocation.foundation.unlock - self.allocation.foundation.minted_unlock)
                },
                treasury: MintAbleAmount{
                    lock: min((self.allocation.treasury.second *
                            (now() -
                            self.deployed_at) -
                            self.allocation.treasury.minted_lock),
                        (self.allocation.treasury.lock - self.allocation.treasury.minted_lock)
                    ),
                    unlock: (self.allocation.treasury.unlock - self.allocation.treasury.minted_unlock)
                },
                vote_liquidity: MintAbleAmount{
                    lock: min((self.allocation.vote_liquidity.second *
                            (now() -
                            self.deployed_at) -
                            self.allocation.vote_liquidity.minted_lock),
                        (self.allocation.vote_liquidity.lock - self.allocation.vote_liquidity.minted_lock)
                    ),
                    unlock: (self.allocation.vote_liquidity.unlock - self.allocation.vote_liquidity.minted_unlock)
                },
                incentives: MintAbleAmount{
                    lock: min((self.allocation.incentives.second *
                            (now() -
                            self.deployed_at) -
                            self.allocation.incentives.minted_lock),
                        (self.allocation.incentives.lock - self.allocation.incentives.minted_lock)
                    ),
                    unlock: 0
                },
                early_investors: MintAbleAmount{
                    lock: _early_investors_lock,
                    unlock: (self.allocation.early_investors.unlock - self.allocation.early_investors.minted_unlock)
                }
            };
    }
}