const { Drawable } = require('../drawable');

class Building extends Drawable {
    static name = "";
    static description = "";
    static icon = "";
    static cost = 0;
    static modifiers = {
        foreignAmbassadors: 0,
        gold: 0,
        food: 0,
        defence: 0
    };

    constructor(owner) {
        super();
        this.owner = owner;
        this.region = null;
    }

    static canBeAffordedBy(player) {
        return player.resources.gold >= this.cost;
    }

    get name() {
        return this.constructor.name;
    }

    get description() {
        return this.constructor.description;
    }

    get icon() {
        return this.constructor.icon;
    }

    get cost() {
        return this.constructor.cost;
    }

    get sellPrice() {
        return Math.floor(this.constructor.cost/2);
    }

    get modifiers() {
        return this.constructor.modifiers;
    }

    canBeAfforded() {
        return this.constructor.canBeAffordedBy(this.owner);
    }

    onTick() { }

    onPlacement(region) {
        this.region = region;
        this.owner._gold -= this.constructor.cost;
    }

    onRemoval() {
        this.region = null;
        this.owner = null;
    }
}

class Farm extends Building {
    static name = "Farm";
    static description = "+3🍖";
    static cost = 100;
    static icon = "🌽";
    static modifiers = {
        foreignAmbassadors: 0,
        gold: 0,
        food: 2,
        defence: 0
    };
}

class Mine extends Building {
    static name = "Mine";
    static description = "+1🪙/day";
    static cost = 70;
    static icon = "🪨";

    onTick() {
        this.owner._gold++;
    }
}

class Castle extends Building {
    static name = "Castle";
    static description = "+2🪙/day, +6🛡️, +2🪶 slots";
    static cost = 500;
    static icon = "🏰";
    static modifiers = {
        foreignAmbassadors: 2,
        gold: 0,
        food: 0,
        defence: 2
    };

    onTick() {
        this.owner._gold += 2;
    }
}

module.exports = {
    Building,
    Mine,
    Farm,
    Castle
};
