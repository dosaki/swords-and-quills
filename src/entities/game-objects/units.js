const { Drawable } = require('./game-objects');
const ambassadorPaths = require('../../config/ambassador.json');
const soldierPaths = require('../../config/knight.json');

class Citizen extends Drawable {
    static name = "Citizen";
    static description = "";
    static icon = "";
    static cost = 0;
    static paths = {};

    constructor(owner) {
        super();
        this.owner = owner;
        this.region = null;
    }

    static canBeAffordedBy(player) {
        return player.resources.gold >= this.cost && player.resources.food > 0;
    }

    static draw(ctx, x, y, owner) {
        ctx.save();
        ctx.translate(x||0, y||0);
        Object.keys(this.paths).forEach(p => {
            const path = new Path2D(p);
            const [fill, stroke] = this.paths[p];
            if(fill){
                ctx.fillStyle = fill === "-" ? owner.colour : fill;
                ctx.fill(path);
            }
            if(stroke){
                ctx.strokeStyle = stroke === "-" ? owner.colour : stroke;
                ctx.stroke(path);
            }
        });
        ctx.restore();
    }

    static makeSvgPaths(owner) {
        return Object.keys(this.paths).map(p => {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", p);
            const [fill, stroke] = this.paths[p];
            if(fill){
                path.setAttribute("fill", fill === "-" ? owner.colour : fill);
            }
            if(stroke){
                path.setAttribute("stroke", stroke === "-" ? owner.colour : stroke);
            }
            return path
        });
    }

    static drawToSvgG(gElement, costElement, owner) {
        this.makeSvgPaths(owner).forEach(p => gElement.appendChild(p));
        if(costElement){
            gElement.parentElement.parentElement.setAttribute("title", `${this.name}: ${this.description}`);
        }
        if(costElement){
            costElement.innerHTML = `${this.cost}🪙 1🍖`;
        }
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

    canBeAfforded() {
        return this.constructor.canBeAffordedBy(this.owner);
    }

    draw(ctx, x, y) {
        this.constructor.draw(ctx, x, y, this.owner);
    }

    drawToSvgG(gElement) {
        return this.constructor.drawToSvgG(gElement, null, this.owner);
    }

    onPlacement(region) {
        this.owner._gold -= this.cost;
        this.region = region;
        this.owner.addUnit(this);
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
    static description = "+1🗡️, +1🛡️";
    static paths = soldierPaths;
    static cost = 8;

    onPlacement(region) {
        if(this.region){
            this.onLeave();
        }
        super.onPlacement(region);
        this.onArrival(region);
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

    onTick() {
        if (this.region.owner !== this.owner) {
            if (this.region.defenders.length === 0) {
                this.region.baseDefense += 2;
                this.owner._gold--;
                this.region._siegeProgress++;
            }
        }
    }
}

class Ambassador extends Citizen {
    static name = "Ambassador";
    static description = "+1🪶/day, -1🪙/day";
    static paths = ambassadorPaths;
    static cost = 10;

    onPlacement(region) {
        if(this.region){
            this.onLeave();
        }
        super.onPlacement(region);
        this.onArrival(region);
    }

    onArrival(region) {
        super.onArrival(region);
        if (region.freeAmbassadorSlots != 0 && region.owner != this.owner) {
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