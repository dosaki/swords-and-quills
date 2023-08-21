const { Interactable } = require("./game-objects");
const randomUtils = require("../../utils/random");
const { Castle } = require('./buildings');

class Region extends Interactable {
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

    get hasAmbassadors() {
        return this.ambassadors.length > 0;
    }

    get maxAmbassadors() {
        return this.buildings.reduce((acc, b) => acc + (b.modifiers.foreignAmbassadors || 0), 0);
    }

    get buildingLimit() {
        return this.isCapital ? 2 : 1;
    }

    get defence() {
        return this.baseDefense
            + this.buildings.reduce((acc, b) => acc + (b.modifiers.defence || 0), 0);
    }

    get siegeProgress() {
        return this.defence - this._siegeProgress;
    }

    get hasBuildingSpace() {
        return this.buildings.length < this.buildingLimit;
    }

    get canTrainAmbassador() {
        return this.buildings.some(b => b.constructor === Castle);
    }

    get canTrainArmy() {
        return this.buildings.some(b => b.constructor === Castle);
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
        if (this.hasAmbassadors < 0) {
            this.ambassadors.slice(this.ambassadorSlots).forEach(a => a.die());
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

    transferOwnership(player) {
        if (this.owner.resources.gold < 0) {
            const goldToGive = Math.min(this.owner.resources.gold, randomUtils.int(1, 2 * this.neighbours.length));
            this.owner._gold -= goldToGive;
            player._gold += goldToGive;
        }
        this.owner.removeRegion(this);
        player.addRegion(this);
        const oldDefenders = this.defenders;
        this.defenders = this.attackers;
        this.attackers = [];
        oldDefenders.forEach(d => d.onDie()); // in case there's any left
    }

    hasArmiesOfPlayer(player) {
        return this.defenders.some(d => d.owner === player) || this.attackers.some(a => a.owner === player);
    }

    mergeArmies(player) {
        const defenders = this.defenders.filter(d => d.owner === player);
        const attackers = this.attackers.filter(a => a.owner === player);
        
        if(defenders.length > 1){
            this.defenders = this.defenders.filter(d => d.owner !== player);
            defenders[0].number = defenders.reduce((acc, d) => acc + d.number, 0);
            this.defenders.push(defenders[0]);
            defenders.slice(1).forEach(d => d.onDie());
        }
        if(attackers.length > 1){
            this.attackers = this.attackers.filter(a => a.owner !== player);
            attackers[0].number = attackers.reduce((acc, a) => acc + a.number, 0);
            this.attackers.push(attackers[0]);
            attackers.slice(1).forEach(a => a.onDie());
        }
    }

    splitArmies(player) {
        const defenders = this.defenders.filter(d => d.owner === player);
        const attackers = this.attackers.filter(a => a.owner === player);
        
        if(defenders.length > 0){
            defenders.forEach(d => {
                const half = d.number / 2;
                d.number = Math.ceil(half);
                const newArmy = d.clone();
                newArmy.number = Math.floor(half);
                this.defenders.push(newArmy);
            });
        }
        if(attackers.length > 0){
            attackers.forEach(a => {
                const half = a.number / 2;
                a.number = Math.ceil(half);
                const newArmy = a.clone();
                newArmy.number = Math.floor(half);
                this.attackers.push(newArmy);
            });
        }
    }

    onTick() {
        this.buildings.forEach(b => b.onTick());
        const defenderPower = this.defenders.reduce((acc, da) => acc + da.number, 0);
        const attackerPower = this.attackers.reduce((acc, aa) => acc + aa.number, 0);
        let defendersLeftToKill = randomUtils.int(0, attackerPower);
        let attackersLeftToKill = randomUtils.int(0, defenderPower);
        this.defenders.forEach(d => {
            const actualKilled = Math.min(defendersLeftToKill, d.number);
            d.number = d.number - actualKilled;
            defendersLeftToKill = defendersLeftToKill - actualKilled;
            if (d.number <= 0) {
                d.onDie();
            }
        });
        this.attackers.forEach(a => {
            const actualKilled = Math.min(attackersLeftToKill, a.number);
            a.number = a.number - actualKilled;
            attackersLeftToKill = attackersLeftToKill - actualKilled;
            if (a.number <= 0) {
                a.onDie();
            }
        });
        this.defenders = this.defenders.filter(d => d.number > 0);
        this.attackers = this.attackers.filter(a => a.number > 0);
        if (!defenderPower && this.siegeProgress <= 0) {
            this.transferOwnership(this.attackers[0].owner);
        }
    }

    onMonth() { }

    killEnemyAmbassadors() {
        //This is called -after- the region is conquered!
        const ambassadorsToRemove = this.ambassadors.filter(a => !this.owner.alliedPlayers.keys().includes(a));
        ambassadorsToRemove.forEach(a => {
            a.owner.changeReputationWith(this.owner, -1);
            a.die();
        });
    }
}

module.exports = Region;