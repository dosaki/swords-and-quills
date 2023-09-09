const { GameInteractible } = require("./game-objects");
const randomUtils = require("../../utils/random");

class Region extends GameInteractible {
    constructor({ id, name, group, d }) {
        super(d);
        this.id = id;
        this.name = name;
        this.group = group;
        this.neighbours = [];
        this.owner = null;
        this.isCapital = false;
        this.buildings = []; // can have a castle or a farm or a mine
        this.ambassadors = [];
        this.baseDefense = 10;
        this._siegeProgress = 0;
        this.defenders = [];
        this.attackers = [];
        this.centroid = [0, 0];
        this._defenderPower = null;
        this._attackerPower = null;
    }

    get scoreValue() {
        return this.neighbours.length;
    }

    get food() {
        return this.buildings.reduce((acc, b) => acc + (b.modifiers.food || 0), 0);
    }

    get gold() {
        return this.buildings.reduce((acc, b) => acc + (b.modifiers.gold || 0), 0);
    }

    get freeAmbassadorSlots() {
        return this.maxAmbassadors - this.ambassadors.length;
    }

    get maxAmbassadors() {
        return this.buildings.reduce((acc, b) => acc + (b.modifiers.foreignAmbassadors || 0), 0);
    }

    get buildingLimit() {
        return this.isCapital ? 4 : 2;
    }

    get defence() {
        return this.baseDefense
            + this.buildings.reduce((acc, b) => acc + (b.modifiers.defence || 0), 0);
    }

    get siegeProgress() {
        return this.defence - this._siegeProgress;
    }

    get defenderPower() {
        if (this._defenderPower === null) {
            this._defenderPower = this.defenders.reduce((acc, da) => acc + da.number, 0);
        }
        return this._defenderPower;
    }

    get attackerPower() {
        if (this._attackerPower === null) {
            this._attackerPower = this.attackers.reduce((acc, aa) => acc + aa.number, 0);
        }
        return this._attackerPower;
    }

    draw(ctx, isPlacingAmbassador) {
        ctx.save();
        if (isPlacingAmbassador && !this.isCapital) {
            ctx.filter = "grayscale(0.9) contrast(0.5) brightness(0.5)";
        }
        super.draw(ctx);
        if (this.isCapital) {
            ctx.fillStyle = "#000";
            ctx.strokeStyle = "#fff9";
            ctx.lineWidth = 0.2;
            const [x, y] = this.centroid;
            ctx.beginPath();
            ctx.arc(x, y - 2, 1, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    addBuilding(building) {
        if (this.buildings.length < this.buildingLimit && building.canBeAfforded()) {
            this.buildings.push(building);
            building.onPlacement(this);
        }
    }

    removeBuilding(building) {
        building.onRemoval();
        this.buildings = this.buildings.filter(b => b !== building);
        if (this.ambassadors.length > 0) {
            this.ambassadors.slice(this.ambassadorSlots).forEach(a => a.onDie());
        }
    }

    sellBuilding(building) {
        this.owner._gold += building.sellPrice;
        this.removeBuilding(building);
    }

    addUnit(unit) {
        if (unit.canBeAfforded()) {
            unit.onPlacement(this);
        }
    }

    _reCalculateUnitSides() {
        const allUnits = [...this.defenders, ...this.attackers];
        this.defenders = [];
        this.attackers = [];
        allUnits.forEach(unit => {
            if(!unit.owner){
                unit.onDie();
                return;
            }
            if (unit.owner === this.owner || unit.owner.isAlliedWith(this.owner)) {
                this.defenders.push(unit);
            } else {
                this.attackers.push(unit);
            }
        });
    }

    transferOwnership(player) {
        if (player) {
            if (this.owner.resources.gold < 0) {
                const goldToGive = Math.min(this.owner.resources.gold, randomUtils.int(1, 2 * this.neighbours.length));
                this.owner._gold -= goldToGive;
                player._gold += goldToGive;
            }
            player.changeReputationWith(this.owner, -15);
            this.defenders.forEach(d => d.onDie()); // in case there are any left
            this.owner.removeRegion(this);
            player.addRegion(this);
            this._reCalculateUnitSides();
            this._siegeProgress--;
        }
    }

    getPriceFor(player) {
        return this.owner.getSellMoodWith(player) * (this.scoreValue + this.food + this.gold + this.isCapital ? 10 : 0);
    }

    sellTo(player, price) {
        if (player.resources.gold >= price) {
            player._gold -= price;
            this.owner._gold += price;

            this.owner.removeRegion(this);
            player.addRegion(this);
            this._reCalculateUnitSides();
            this._siegeProgress = 0;
        }
    }

    mergeArmies(player) {
        const defenders = this.defenders.filter(d => d.owner === player);
        const attackers = this.attackers.filter(a => a.owner === player);

        if (defenders.length > 1) {
            this.defenders = this.defenders.filter(d => d.owner !== player);
            defenders[0].number = defenders.reduce((acc, d) => acc + d.number, 0);
            this.defenders.push(defenders[0]);
            defenders.slice(1).forEach(d => d.onDie());
        }
        if (attackers.length > 1) {
            this.attackers = this.attackers.filter(a => a.owner !== player);
            attackers[0].number = attackers.reduce((acc, a) => acc + a.number, 0);
            this.attackers.push(attackers[0]);
            attackers.slice(1).forEach(a => a.onDie());
        }
    }

    splitArmies(player) {
        const defenders = this.defenders.filter(d => d.owner === player);
        const attackers = this.attackers.filter(a => a.owner === player);

        if (defenders.length > 0) {
            defenders.forEach(d => {
                const half = d.number / 2;
                d.number = Math.ceil(half);
                if (half >= 1) {
                    const newArmy = d.clone();
                    newArmy.number = Math.floor(half);
                    this.defenders.push(newArmy);
                }
            });
        }
        if (attackers.length > 0) {
            attackers.forEach(a => {
                const half = a.number / 2;
                a.number = Math.ceil(half);
                if (half >= 1) {
                    const newArmy = a.clone();
                    newArmy.number = Math.floor(half);
                    this.attackers.push(newArmy);
                }
            });
        }
        window.tooltip.refreshContent();
    }

    onTick() {
        this._defenderPower = null;
        this._attackerPower = null;
        this.buildings.forEach(b => b.onTick());
        const defenderPower = this.defenderPower;
        const attackerPower = this.attackerPower;
        let defendersLeftToKill = randomUtils.int(0, attackerPower);
        let attackersLeftToKill = randomUtils.int(0, defenderPower);
        const defenderOwners = [...new Set(this.defenders.map(d => d.owner))];
        const attackerOwners = [...new Set(this.attackers.map(a => a.owner))];
        this.defenders.forEach(d => {
            const actualKilled = Math.min(defendersLeftToKill, d.number);
            d.number = d.number - actualKilled;
            defendersLeftToKill = defendersLeftToKill - actualKilled;
            attackerOwners.forEach(p => p && d?.owner && p.changeReputationWith(d.owner, -1 * actualKilled));
            if (d.number <= 0) {
                d.onDie();
            }
        });
        this.attackers.forEach(a => {
            const actualKilled = Math.min(attackersLeftToKill, a.number);
            a.number = a.number - actualKilled;
            attackersLeftToKill = attackersLeftToKill - actualKilled;
            defenderOwners.forEach(p => p && a?.owner && p.changeReputationWith(a.owner, -1 * actualKilled));
            if (a.number <= 0) {
                a.onDie();
            }
        });
        this.defenders = this.defenders.filter(d => d.number > 0);
        this.attackers = this.attackers.filter(a => a.number > 0);
        if (!defenderPower && this.siegeProgress <= 0 && this.attackers[0]) {
            this.transferOwnership(this.attackers[0].owner);
        }
        if (!this.attackerPower && this._siegeProgress) {
            this._siegeProgress--;
        }
        while(this.buildings.length > this.buildingLimit){
            this.removeBuilding(this.buildings[0]);
        }
    }

    killEnemyAmbassadors() {
        //This is called -after- the region is conquered!
        this.ambassadors.forEach(a => {
            a.owner.changeReputationWith(this.owner, -1);
            a.onDie();
        });
    }
}

module.exports = Region;