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
    }

    get resources() {
        return {
            food: this.regions.reduce((acc, region) => acc + region.food, 0) - (this.units.length + this.ambassadors), // maintenance for units, works as a cap
            gold: this._gold // buy units and buildings
        };
    }

    get ambassadors() {
        return this.regions.reduce((acc, region) => acc + region.ambassadors.length, 0);
    }

    get score() {
        return this.conquestPoints
            + this.regions.reduce((acc, region) => acc + region.scoreValue, 0)
            + Math.floor(this._gold/100)
            + Math.floor(this.units.length)/2;
    }

    get allianceScore() {
        return this.alliedPlayers.reduce((acc, player) => acc + player.score, this.score);
    }

    get hasLost() {
        return this.regions.length === 0;
    }

    get colour() {
        return this.capital ? this.capital._colour : "#000";
    }

    onTick() {
        this.regions.forEach(region => region.onTick());
        this.units.forEach(unit => unit.onTick());
    }

    onMonth() {
        this.regions.forEach(region => region.onMonth());
        this.units.forEach(unit => unit.onMonth());
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
    }

    addUnit(unit) {
        this.units.push(unit);
    }

    removeUnit(unit) {
        this.units = this.units.filter(u => u !== unit);
    }

    changeReputationWith(player, reputation) {
        this.knownPlayers[player] = player.knownPlayers[this] = (this.knownPlayers[player] || 0) + reputation;
    }

    reputationWith(player) {
        return (this.knownPlayers[player.name] || 0);
    }
}

module.exports = Player;
