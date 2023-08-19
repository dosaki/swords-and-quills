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
        return this.buildings.reduce((acc, b) => acc + (b.modifiers.foreignAmbassadors || 0), 0)
    }

    get buildingLimit() {
        return this.isCapital ? 2 : 1;
    }

    get defence() {
        return this.baseDefense + this.buildings.reduce((acc, b) => acc + (b.modifiers.defence || 0), 0);
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

    get canTrainSoldier() {
        return this.buildings.some(b => b.constructor === Castle);
    }


    draw(ctx) {
        ctx.shadowColor = '#000';
        ctx.strokeStyle = '#000';
        ctx.shadowBlur = window.shadowblur || 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
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
        if(unit.canBeAfforded()) {
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

    onTick() {
        this.buildings.forEach(b => b.onTick());
        const defenderPower = this.defenders.length;
        const attackerPower = this.attackers.length;
        const defendersToDie = this.defenders.slice(0, attackerPower);
        const attackersToDie = this.attackers.slice(0, defenderPower);
        this.defenders = this.defenders.slice(attackerPower);
        this.attackers = this.attackers.slice(defenderPower);
        defendersToDie.forEach(d => d.onDie());
        attackersToDie.forEach(a => a.onDie());
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