const { int, pick } = require("../utils/random");
const { Farm, Mine } = require("./game-objects/buildings");
const { Army, Ambassador } = require("./game-objects/units");

class Player {
    constructor(country) {
        this.name = country;
        this.country = country;
        this.capital = null;
        this.regions = [];
        this.conquestPoints = 0;

        this.knownPlayers = {};
        this.alliedPlayers = {};

        this.units = [];
        this._gold = 0;
        this._sellMood = 0;
        this.isHuman = false;
        this.style = pick("aggressive", "friendly", "neutral", "aggressive");
        this.firstTimeSetUp = false;
        this.attackTargets = [];
        this.colour = "#000";
        this.strokeColour = "#000";
    }

    get resources() {
        return {
            food: this.regions.reduce((acc, region) => acc + region.food, 0) - (this.units.reduce((acc, u) => acc + (u.number || 1), 0) + this.ambassadors), // maintenance for units, works as a cap
            gold: this._gold // buy units and buildings
        };
    }

    get ambassadors() {
        return this.regions.reduce((acc, region) => acc + region.ambassadors.length, 0);
    }

    get score() {
        return Math.floor(this.conquestPoints
            + this.regions.reduce((acc, region) => acc + region.scoreValue, 0)
            + Math.floor(this._gold / 100)
            + Math.floor(this.units.length) / 2);
    }

    get allianceScore() {
        return Object.values(this.alliedPlayers).reduce((acc, player) => acc + player.score, this.score);
    }

    get hasLost() {
        return this.regions.length === 0;
    }

    get hasLost() {
        return this.regions.length === 0;
    }

    getSellMoodWith(player) {
        if (!this._sellMood) {
            const min = 200 - this.reputationWith(player);
            this._sellMood = int(min, min * 2);
        }
        return this._sellMood;
    }

    moveUnits(diff) {
        this.units.forEach(unit => unit.moveUnit(diff));
    }

    onTick() {
        if (this.hasLost) {
            this.units.forEach(unit => unit.onDie());
        }
        this.regions.forEach(region => region.onTick());
        this.units.forEach(unit => unit.onTick());
    }

    removeRegion(region) {
        //First remove the region!!!
        this.conquestPoints = this.conquestPoints - 1;
        this.regions = this.regions.filter(r => r !== region);
        if (region.isCapital) {
            this.conquestPoints = this.conquestPoints - 1;
            (this.regions[0] || {}).isCapital = true;
            this.capital = this.regions[0];
        }
        region.owner = null;
    }

    addRegion(region) {
        //Then add the region!!!
        this.conquestPoints++;
        this.regions.push(region);
        region.owner = this;
        if (region.isCapital) {
            this.conquestPoints++;
            region.isCapital = false;
        }
        region.killEnemyAmbassadors();
        region.changeColour(this.colour, this.strokeColour);
    }

    addUnit(unit) {
        this.units.push(unit);
    }

    removeUnit(unit) {
        this.units = this.units.filter(u => u !== unit);
    }

    changeReputationWith(player, reputation) {
        this.knownPlayers[player.name] = player.knownPlayers[this.name] = Math.max(-100, Math.min((this.knownPlayers[player.name] || 0) + reputation, 100));
    }

    setReputationWith(player, reputation) {
        this.knownPlayers[player.name] = player.knownPlayers[this.name] = reputation;
    }

    reputationWith(player) {
        return (this.knownPlayers[player.name] || 0);
    }

    attitudeWith(player) {
        const reputation = this.reputationWith(player);
        if (reputation < -50) {
            return "Hostile";
        }
        if (reputation < 0) {
            return "Unfriendly";
        }
        if (reputation < 50) {
            return "Neutral";
        }
        return this.isAlliedWith(player) ? "Ally" : "Friendly";
    }

    wouldSellTo(player) {
        return this.reputationWith(player) >= 35;
    }

    wouldAllyWith(player) {
        return this.reputationWith(player) >= 80;
    }

    enterAllianceWith(player) {
        this.alliedPlayers[player.name] = player.alliedPlayers[this.name] = true;
    }

    isAlliedWith(player) {
        return !!this.alliedPlayers[player.name];
    }

    findNeighbouringForeignRegions() {
        const neighbouringForeignRegions = [];
        this.regions.forEach(region => {
            const foreignNeighbours = region.neighbours.filter(r => !r.owner.hasLost && r.owner !== this);
            neighbouringForeignRegions.push(...foreignNeighbours);
        });
        return [...new Set(neighbouringForeignRegions)];
    }

    findNeighboringPlayers(foreignRegions) {
        return [...new Set(foreignRegions.map(r => r.owner))];
    }

    doAi() {
        if (!this.isHuman && !this.hasLost) {
            this._sellMood = 0;
            const foreignRegions = this.findNeighbouringForeignRegions();
            const neighboringPlayers = this.findNeighboringPlayers(foreignRegions);
            const alliedPlayerRegions = this.type === "neutral" ? [] : neighboringPlayers.filter(p => this.isAlliedWith(p)).map(p => p.regions).flat();
            const unprotectedAreas = [...this.regions.filter(r => r.attackerPower > r.defenderPower), ...alliedPlayerRegions];
            if (!this.firstTimeSetUp) {
                this.firstTimeSetUp = true;
                neighboringPlayers.forEach(player => {
                    if (this.style === "aggressive") {
                        this.changeReputationWith(player, -25);
                    } else if (this.style === "friendly") {
                        if (player.style === "aggressive") {
                            this.changeReputationWith(player, -5);
                        } else if (player.style === "friendly") {
                            this.changeReputationWith(player, 20);
                        }
                    } else if (this.style === "neutral") {
                        if (player.style === "aggressive") {
                            this.changeReputationWith(player, -1);
                        } else if (player.style === "friendly") {
                            this.changeReputationWith(player, 1);
                        }
                    }
                });
            }
            this.tryBuilding(neighboringPlayers, foreignRegions, unprotectedAreas);
            this.tryTraining(neighboringPlayers, unprotectedAreas);
            this.tryMoving(neighboringPlayers, foreignRegions, unprotectedAreas);
        }
    }



    tryTraining(neighbours, unprotectedAreas) {
        if (pick(0, 1, this.type === "aggressive" ? 1 : 0) && Army.canBeAffordedBy(this)) {
            this.capital.addUnit(new Army(this));
        }

        unprotectedAreas.forEach(region => {
            while (Army.canBeAffordedBy(this) && region.owner === this && region.attackers.length > region.defenders.length) {
                region.addUnit(new Army(this));
            }
        });

        if (pick(0, 1) && this.type === "friendly" && Ambassador.canBeAffordedBy(this)) {
            const potentialAmbassadorTargets = neighbours.filter(n => !n.isAlliedWith(this) && n.reputationWith(this) > -25);
            if (potentialAmbassadorTargets.length) {
                const foreignRegion = pick(...potentialAmbassadorTargets).capital;
                if (foreignRegion.freeAmbassadorSlots > 0) {
                    foreignRegion.addUnit(new Ambassador(this));
                }
            }
        }
    };

    tryMoving(neighbours, neighbouringForeignRegions, unprotectedAreas) {
        let armies = this.units.filter(u => u instanceof Army && u.region);
        if (!armies.length) {
            return;
        }
        let currentArea = 0;
        let movedTo = {};
        if (unprotectedAreas.length) {
            armies.forEach(unit => {
                const target = unprotectedAreas[currentArea];
                if (!target) {
                    return;
                }
                if (target.defenderPower + movedTo[target.uuid] > target.attackerPower) {
                    currentArea++;
                } else {
                    unit.moveTo(target);
                    movedTo[target.uuid] = (movedTo[target.uuid] || 0) + unit.number;
                }
            });
        }
        if (pick(0, 1)) {
            if (!this.attackTargets.length || pick(0, 0, 0, 0, 1)) {
                const potentialTarget = pick(...neighbours.filter(n => {
                    return (this.type === "aggressive" && !n.isAlliedWith(this))
                        || (this.type !== "aggressive" && n.reputationWith(this) < -20 && !n.isAlliedWith(this));
                }));
                if (potentialTarget) {
                    this.attackTargets.push(potentialTarget);
                }
            }
            const fringeRegions = pick(...this.attackTargets)?.regions.filter(r => neighbouringForeignRegions.includes(r));
            if (fringeRegions) {
                currentArea = 0;
                movedTo = {};
                armies = this.units.filter(u => u instanceof Army && u.region);
                armies.forEach(unit => {
                    if (unit.region?._siegeProgress <= 0) {
                        const target = fringeRegions[currentArea];
                        if (!target) {
                            return;
                        }
                        if (target.attackerPower + movedTo[target.uuid] > target.defenderPower) {
                            currentArea++;
                        } else {
                            unit.moveTo(target);
                            movedTo[target.uuid] = (movedTo[target.uuid] || 0) + unit.number;
                        }
                    }
                });
            }
        }
    };

    tryBuilding() {
        if (this.resources.food < Army.cost && Farm.canBeAffordedBy(this)) {
            pick(...this.regions.filter(r => r.buildings.length < r.buildingLimit))?.addBuilding(new Farm(this));
        }
        if (this.resources.food >= Army.cost && (this.resources.gold < Army.cost || !Farm.canBeAffordedBy(this)) && Mine.canBeAffordedBy(this)) {
            pick(...this.regions.filter(r => r.buildings.length < r.buildingLimit))?.addBuilding(new Mine(this));
        }
    }
}

module.exports = Player;
