class Player {
    constructor(country) {
        this.name = country;
        this.country = country;
        this.capital = null;
        this.regions = [];
        this.conquestPoints = 0;

        this.knownPlayers = {};
        this.alliedPlayers = {};
        this.atWarWith = {};

        this.units = [];
        this._gold = 0;
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

    get colour() {
        return this.capital ? this.capital._colour : "#000";
    }

    get strokeColour() {
        return this.capital ? this.capital._strokeColour : "#000";
    }

    moveUnits(diff) {
        this.units.forEach(unit => unit.moveUnit(diff));
    }

    onTick() {
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

    enterAllianceWith(player) {
        this.alliedPlayers[player.name] = player.alliedPlayers[this.name] = true;
    }

    isAlliedWith(player) {
        return !!this.alliedPlayers[player.name];
    }

    startWarWith(player) {
        delete this.alliedPlayers[player.name];
        delete player.name.alliedPlayers[this.name];
        this.atWarWith[player.name] = player.atWarWith[this.name] = true;
        this.reputation(player, -100);
    }

    endWarWith(player) {
        delete this.atWarWith[player.name];
        delete player.name.atWarWith[this.name];
        this.atWarWith[player.name] = player.atWarWith[this.name] = false;
    }

    isAtWarWith(player) {
        return !!this.isAtWarWith[player.name];
    }
}

module.exports = Player;
