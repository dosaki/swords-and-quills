class Player {
    constructor(country) {
        this.name = country;
        this.country = country;
        this.capital = null;
        this.regions = [];
        this.conquestPoints = 0;
    }

    get score() {
        return this.conquestPoints + this.regions.reduce((acc, region) => acc + region.scoreValue, 0);
    }

    get hasLost() {
        return this.regions.length === 0;
    }

    addRegion(region) {
        this.conquestPoints++;
        this.regions.push(region);
        if(region.isCapital) {
            this.conquestPoints++;
            region.isCapital = false;
        }
    }

    removeRegion(region) {
        this.conquestPoints = this.conquestPoints - 1;
        this.regions = this.regions.filter(r => r !== region);
        if(region.isCapital) {
            this.conquestPoints = this.conquestPoints - 1;
            (this.regions[0]||{}).isCapital = true;
            this.capital = this.regions[0];
        }
    }
}

module.exports = Player;