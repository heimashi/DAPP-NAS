'use strict';

let TGQContract = function() {
    //tqg nas poll
    LocalContractStorage.defineProperty(this, "nasPerQ");  
    LocalContractStorage.defineProperty(this, "tgqPool");
    LocalContractStorage.defineProperty(this, "bonusPool");
    LocalContractStorage.defineMapProperty(this, "hash_to_point");
    //claim for free
    LocalContractStorage.defineProperty(this, "intervalFree"); 
    LocalContractStorage.defineProperty(this, "nasPerFree"); 
    LocalContractStorage.defineMapProperty(this, "userFree"); 
};

TGQContract.prototype = {

    init: function() {
        this.nasPerQ = 0.01;
        this.tgqPool = 0;
        this.bonusPool = 0;

        this.nasPerFree = 0.0005;
        this.intervalFree = 120;
    },

    tgq: function(point) {
        let from = Blockchain.transaction.from;
        let value = Blockchain.transaction.value;

        if (value != this.nasPerQ * 1000000000000000000) {
            throw new Error("Please send " + this.nasPerQ + " NAS only");
        }
        let inputPoint = point || 1;

        let currentPoint = Math.floor(Math.random() * 1000 + inputPoint);
        
        this.hash_to_point.put(Blockchain.transaction.hash, currentPoint);

        this.tgqPool = this.tgqPool + this.nasPerQ * 0.8;
        this.bonusPool = this.bonusPool + this.nasPerQ * 0.2;
        let awardAmount;
        if (currentPoint%1000===0) {
            let tmp = this.tgqPool > this.nasPerQ * 50? (this.tgqPool - this.nasPerQ * 50): this.tgqPool ;
            awardAmount = new BigNumber(tmp + this.bonusPool);
            let result = Blockchain.transfer(from, awardAmount * 1000000000000000000);
            console.log("transfer result", result);
            if (!result) {
                throw new Error("transfer failed.");
            }
            Event.Trigger("TGQAwardTransfer", {
                Transfer: {
                    from: Blockchain.transaction.to,
                    to: from,
                    value: awardAmount * 1000000000000000000
                }
            });
            this.tgqPool = this.tgqPool - tmp;
            this.bonusPool = 0;
        } else if (currentPoint%100===0) {
            let tmp = this.tgqPool > this.nasPerQ * 20? (this.tgqPool - this.nasPerQ * 20): this.tgqPool ;
            awardAmount = new BigNumber(tmp + this.bonusPool);
            this.bonusPool = 0;
            let result = Blockchain.transfer(from, awardAmount * 1000000000000000000);
            console.log("transfer result", result);
            if (!result) {
                throw new Error("transfer failed.");
            }
            Event.Trigger("TGQAwardTransfer", {
                Transfer: {
                    from: Blockchain.transaction.to,
                    to: from,
                    value: awardAmount * 1000000000000000000
                }
            });

            this.tgqPool = this.tgqPool - tmp;
            this.bonusPool = this.bonusPool - this.bonusPool*0.2;
        } else if (currentPoint%10===0) {
            let tmp = this.tgqPool > this.nasPerQ * 5? (this.tgqPool - this.nasPerQ * 5): this.tgqPool ;
            awardAmount = new BigNumber(tmp + this.bonusPool);
            let result = Blockchain.transfer(from, awardAmount * 1000000000000000000);
            console.log("transfer result", result);
            if (!result) {
                throw new Error("transfer failed.");
            }
            Event.Trigger("TGQAwardTransfer", {
                Transfer: {
                    from: Blockchain.transaction.to,
                    to: from,
                    value: awardAmount * 1000000000000000000
                }
            });

            this.tgqPool = this.tgqPool - this.nasPerQ * 5;
        }

        return [currentPoint, awardAmount, this.tgqPool, this.bonusPool];
    },

    getPoint: function(hash) {
        return this.hash_to_point.get(hash);
    },

    getBonusPoll: function() {
        return +this.bonusPool;
    },

    getTgqPool: function() {
        return +this.tgqPool;
    },

    donateTgq: function() {
        let from = Blockchain.transaction.from;
        let value = Blockchain.transaction.value;

        this.tgqPool = this.tgqPool + value / 1000000000000000000;
    },

    claimFree: function() {
        let from = Blockchain.transaction.from;
        let claimAmount = new BigNumber(this.nasPerFree);

        let now = new Date().getTime();
        let latest_time = this.userFree.get(from);

        if (this.tgqPool < this.nasPerFree) {
            throw new Error("Don't have enough free NAS to claim!");
        }

        if (latest_time) {
            if ((now - latest_time) < this.interval * 60 * 1000) {
                throw new Error("Please wait for 1 hour to get free NAS again!");
            }
        }
        this.userFree.put(from, now);

        let result = Blockchain.transfer(from, claimAmount * 1000000000000000000);
        console.log("transfer result", result);
        if (!result) {
            throw new Error("transfer failed.");
        }
        Event.Trigger("ClaimFreeTransfer", {
            Transfer: {
                from: Blockchain.transaction.to,
                to: from,
                value: claimAmount * 1000000000000000000
            }
        });
        this.tgqPool = this.tgqPool - this.nasPerFree;

        return [this.tgqPool]
    },


};

module.exports = TGQContract;
