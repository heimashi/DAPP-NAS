'use strict';

let RacingGameContract = function() {
    //racing nas poll
    LocalContractStorage.defineProperty(this, "nasPerQ");  
    LocalContractStorage.defineProperty(this, "racingPool");
    LocalContractStorage.defineProperty(this, "bonusPool");
    LocalContractStorage.defineMapProperty(this, "hash_to_point");
    //claim for free
    LocalContractStorage.defineProperty(this, "intervalFree"); 
    LocalContractStorage.defineProperty(this, "nasPerFree"); 
    LocalContractStorage.defineMapProperty(this, "userFree"); 
};

RacingGameContract.prototype = {

    init: function() {
        this.nasPerQ = 0.01;
        this.racingPool = 0;
        this.bonusPool = 0;

        this.nasPerFree = 0.0005;
        this.intervalFree = 120;
    },

    racing: function() {
        let from = Blockchain.transaction.from;
        let value = Blockchain.transaction.value;

        if (value != this.nasPerQ * 1000000000000000000) {
            throw new Error("Please send " + this.nasPerQ + " NAS only");
        }

        let currentPoint = Math.floor(Math.random() * 1000 + 1);
        
        this.hash_to_point.put(Blockchain.transaction.hash, currentPoint);

        this.racingPool = this.racingPool + this.nasPerQ * 0.8;
        this.bonusPool = this.bonusPool + this.nasPerQ * 0.2;
        let awardAmount;
        if (currentPoint%1000===0) {
            let tmp = this.racingPool > this.nasPerQ * 50? (this.racingPool - this.nasPerQ * 50): this.racingPool ;
            awardAmount = new BigNumber(tmp + this.bonusPool);
            let result = Blockchain.transfer(from, awardAmount * 1000000000000000000);
            console.log("transfer result", result);
            if (!result) {
                throw new Error("transfer failed.");
            }
            Event.Trigger("RacingAwardTransfer", {
                Transfer: {
                    from: Blockchain.transaction.to,
                    to: from,
                    value: awardAmount * 1000000000000000000
                }
            });
            this.racingPool = this.racingPool - tmp;
            this.bonusPool = 0;
        } else if (currentPoint%100===0) {
            let tmp = this.racingPool > this.nasPerQ * 20? (this.racingPool - this.nasPerQ * 20): this.racingPool ;
            awardAmount = new BigNumber(tmp + this.bonusPool*0.2);
            this.bonusPool = 0;
            let result = Blockchain.transfer(from, awardAmount * 1000000000000000000);
            console.log("transfer result", result);
            if (!result) {
                throw new Error("transfer failed.");
            }
            Event.Trigger("RacingAwardTransfer", {
                Transfer: {
                    from: Blockchain.transaction.to,
                    to: from,
                    value: awardAmount * 1000000000000000000
                }
            });

            this.racingPool = this.racingPool - tmp;
            this.bonusPool = this.bonusPool - this.bonusPool*0.2;
        } else if (currentPoint%10===0) {
            let tmp = this.racingPool > this.nasPerQ * 5? (this.racingPool - this.nasPerQ * 5): this.racingPool ;
            awardAmount = new BigNumber(tmp);
            let result = Blockchain.transfer(from, awardAmount * 1000000000000000000);
            console.log("transfer result", result);
            if (!result) {
                throw new Error("transfer failed.");
            }
            Event.Trigger("RacingAwardTransfer", {
                Transfer: {
                    from: Blockchain.transaction.to,
                    to: from,
                    value: awardAmount * 1000000000000000000
                }
            });

            this.racingPool = this.racingPool - tmp;
        }

        return [currentPoint, awardAmount, this.racingPool, this.bonusPool];
    },

    getPoint: function(hash) {
        return this.hash_to_point.get(hash);
    },

    getBonusPoll: function() {
        return +this.bonusPool;
    },

    getRacingPool: function() {
        return +this.racingPool;
    },

    donateRacing: function() {
        let from = Blockchain.transaction.from;
        let value = Blockchain.transaction.value;

        this.racingPool = this.racingPool + value / 1000000000000000000;
    },

    claimFree: function() {
        let from = Blockchain.transaction.from;
        let claimAmount = new BigNumber(this.nasPerFree);

        let now = new Date().getTime();
        let latest_time = this.userFree.get(from);

        if (this.racingPool < this.nasPerFree) {
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
        this.racingPool = this.racingPool - this.nasPerFree;

        return [this.racingPool]
    },


};

module.exports = RacingGameContract;
