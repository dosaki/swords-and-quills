const { Drawable } = require('./game-objects');

class Citizen extends Drawable {
    static name = "Citizen";
    static description = "";
    static cost = 0;

    constructor(owner) {
        super();
        this.owner = owner;
        this.region = null;
    }

    static canBeAffordedBy(player) {
        return player._gold >= this.cost;
    }

    get name() {
        return this.constructor.name;
    }

    get description() {
        return this.constructor.description;
    }

    get cost() {
        return this.constructor.cost;
    }

    canBeAfforded() {
        return this.constructor.canBeAffordedBy(this.owner);
    }

    onPlacement(region) {
        this.owner._gold -= this.cost;
        this.region = region;
    }

    onArrival(region) {
        this.region = region;
    }

    onLeave() {
        this.region = null;
    }

    onTick() { }

    onMonth() { }

    onDie() {
        this.owner.removeUnit(this);
        this.owner = null;
        this.region = null;
    }
}

class Soldier extends Citizen {
    static name = "Soldier";
    static description = "+1🗡️, +2🛡️";

    onTick() {
        if (this.region.owner !== this.owner) {
            if (this.region.defenders.length === 0) {
                this.region.baseDefense += 2;
                this.owner._gold--;
                this.region._siegeProgress++;
            }
        }
    }

    onArrival(region) {
        super.onArrival(region);
        if (region.owner === this.owner) {
            region.defenders.push(this);
        } else {
            region.attackers.push(this);
        }
    }

    onLeave() {
        if (region.owner === this.owner) {
            region.defenders.push(this);
        } else {
            region.attackers.push(this);
        }
        super.onLeave();
    }
}

class Ambassador extends Citizen {
    static name = "Ambassador";
    static description = "+1🪶/day, -1🪙/day";

    onArrival(region) {
        super.onArrival(region);
        if (region.ambassadorSlots != 0 && region.owner != this.owner) {
            region.ambassadors.push(this);
        }
    }

    onLeave() {
        if (this.region.ambassadors.includes(this)) {
            this.region.ambassadors = this.region.ambassadors.filter(a => a !== this);
        }
        super.onLeave();
    }

    onTick() {
        if (this.region.ambassadors.includes(this)) {
            this.owner._gold--;
            this.region.owner._gold++;
            this.owner.changeReputationWith(this.region.owner, 1);
        }
    }
}

module.exports = {
    Citizen,
    Soldier,
    Ambassador
};