const Interactible= require("./interactible");

class Region extends Interactible {
    constructor({ id, name, group, d }) {
        super(d);
        this.id = id;
        this.name = name;
        this.group = group;
        this.neighbours = [];
        this.owner = null;
        this.isCapital = false;
    }

    get scoreValue() {
        return this.neighbours.length;
    }
}

module.exports = Region;