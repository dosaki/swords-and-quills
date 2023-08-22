const { Drawable } = require('./game-objects');
const ambassadorPaths = require('../../config/ambassador.json');
const soldierPaths = require('../../config/knight.json');
const { pick } = require('../../utils/random');

class Citizen extends Drawable {
    static name = "Citizen";
    static description = "";
    static icon = "";
    static cost = 0;
    static foodCost = 1;
    static paths = {};

    constructor(owner) {
        super();
        this.owner = owner;
        this.region = null;
        this.targetRegion = null;
        this.routeToRegion = [];
        this.currentCoordinates = [];
        this._bounceNumber = 0;
    }

    static canBeAffordedBy(player) {
        return player.resources.gold >= this.cost && player.resources.food - this.foodCost >= 0;
    }

    static draw(ctx, x, y, owner) {
        ctx.save();
        ctx.translate((x || 0) - 3, ((y || 0) - 3));
        ctx.scale(0.3, 0.3);
        Object.keys(this.paths).forEach(p => {
            const path = new Path2D(p);
            const [fill, stroke] = this.paths[p];
            if (fill) {
                ctx.fillStyle = fill === "-" ? owner.colour : fill;
                ctx.fill(path);
            }
            if (stroke) {
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
            if (fill) {
                path.setAttribute("fill", fill === "-" ? owner.colour : fill);
            }
            if (stroke) {
                path.setAttribute("stroke", stroke === "-" ? owner.colour : stroke);
            }
            return path;
        });
    }

    static drawToSvgG(gElement, costElement, owner) {
        this.makeSvgPaths(owner).forEach(p => gElement.appendChild(p));
        if (costElement) {
            gElement.parentElement.parentElement.setAttribute("title", `${this.name}: ${this.description}`);
        }
        if (costElement) {
            costElement.innerHTML = `${this.cost}🪙 ${this.foodCost}🍖`;
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

    drawAt(ctx, x, y) {
        this._bounceNumber += 0.1;
        this.constructor.draw(ctx, x, y + (Math.sin(this._bounceNumber)) / 4, this.owner);
    }

    draw(ctx) {
        this.drawAt(ctx, ...this.currentCoordinates);
    }

    drawToSvgG(gElement) {
        return this.constructor.drawToSvgG(gElement, null, this.owner);
    }

    onPlacement(region) {
        this.owner._gold -= this.cost;
        this.region = region;
        this.owner.addUnit(this);
    }

    onArrival(region, stayInOriginalCoords) {
        this.region = region;
        if(!stayInOriginalCoords){
            this.currentCoordinates = pick(...this.region.largestShape).map((v, i) => (v + this.region.centroid[i]) / 2 + Math.random());
        }
    }

    onLeave() {
        this.region = null;
    }

    moveUnit() {
        if (this.routeToRegion.length > 0) {
            if (this.region) {
                this.onLeave();
            }
            const targetRegion = window.regionLookup[this.routeToRegion[this.routeToRegion.length - 1]];
            const [targetX, targetY] = targetRegion.centroid;

            // let dx = targetX - this.currentCoordinates[0];
            // let dy = targetY - this.currentCoordinates[1];
            // const angle = Math.atan2(dy, dx);

            // this.currentCoordinates = [Math.sin(angle), Math.cos(angle)].map((v, i) => v + this.currentCoordinates[i]);
            // console.log(this.currentCoordinates);


            var tx = targetX - this.currentCoordinates[0],
                ty = targetY - this.currentCoordinates[1],
                dist = Math.sqrt(tx * tx + ty * ty);

            let velX = (tx / dist) * 0.05;
            let velY = (ty / dist) * 0.05;

            this.currentCoordinates[0] += velX;
            this.currentCoordinates[1] += velY;

            const [x0, y0] = this.currentCoordinates.map(c => Math.floor(c * 10));
            const [x1, y1] = targetRegion.centroid.map(c => Math.floor(c * 10));
            if (x0 === x1 && y0 === y1) {
                this.routeToRegion.pop();
                this.onArrival(targetRegion, !this.routeToRegion.length);
            }
        }
    }

    onTick() { }

    onDie() {
        this.owner.removeUnit(this);
        this.owner = null;
        this.region = null;
    }
}

class Army extends Citizen {
    static name = "Army";
    static description = "+10🗡️, +10🛡️";
    static paths = soldierPaths;
    static cost = 80;
    static foodCost = 10;

    constructor(owner) {
        super(owner);
        this.number = 10;
    }

    get description() {
        return `${this.number}🗡️, ${this.number}🛡️`;
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.save();
        ctx.translate(...this.currentCoordinates);
        // show number of soldiers
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 0.1;
        ctx.font = "2px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(this.number, -1.5, 2);
        ctx.strokeText(this.number, -1.5, 2);
        ctx.restore();
    }

    onPlacement(region) {
        if (this.region) {
            this.onLeave();
        }
        super.onPlacement(region);
        this.onArrival(region);
    }

    onArrival(region) {
        super.onArrival(region);
        if (region.owner === this.owner || region.owner.isAlliedWith(this.owner)) {
            region.defenders.push(this);
        } else {
            region.attackers.push(this);
        }
    }

    clone() {
        const thisClone = new this.constructor(this.owner);
        thisClone.number = this.number;
        thisClone.region = this.region;
        thisClone.targetRegion = this.targetRegion;
        thisClone.routeToRegion = this.routeToRegion;
        thisClone.currentCoordinates = pick(...this.region.largestShape).map((v, i) => (v + this.region.centroid[i]) / 2 + Math.random());
        thisClone._bounceNumber = 0;
        this.owner.addUnit(thisClone);
        return thisClone;
    }

    onLeave() {
        if (this.region.owner === this.owner) {
            this.region.defenders = this.region.defenders.filter(d => d !== this);
        } else {
            this.region.attackers = this.region.attackers.filter(a => a !== this);
        }
        super.onLeave();
    }

    onTick() {
        if (this.region && this.region.owner !== this.owner) {
            if (this.region.defenders.length === 0) {
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
        if (this.region) {
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
        if (this.region && this.region.ambassadors.includes(this)) {
            this.owner._gold--;
            this.region.owner._gold++;
            this.owner.changeReputationWith(this.region.owner, 1);
        }
    }
}

module.exports = {
    Citizen,
    Army,
    Ambassador
};