const { Drawable } = require('../drawable');
const { pick } = require('../../utils/random');
const ambassadorPaths = {
    'm 8,6 h 1 v 1 H 8 Z': ['#e9c9a5', null],
    'M 3,6 H 2 v 1 h 1 v 3 H 4 V 9 h 2 v 1 H 7 V 7 H 8 V 6 H 7 Z': ['#694726', null],
    'm 3,2 4,0 V 6 H 3 Z': ['#e9c9a5', null],
    'M 4,4 V 3': [null, '#000000'],
    'M 3,9 C 5,9 7,8 7,6': [null, '-'],
    'M 6,4 V 3': [null, '#000000'],
    'M 1,6 H 2 V 7 H 1 Z': ['#e9c9a5', null],
    'M 3,1 H 7 V 2 H 3 Z': ['-', '-']
};

const soldierPaths = {
    'm 3,6 v 4 H 4 V 9 h 2 v 1 H 7 V 7 H 9 V 6 H 7 Z': ['#808080', null],
    'M 3,2 H 7 V 6 H 3 Z': ['#000000', null],
    'M 9,1 V 6': [null, '#808080'],
    'M 9,7 V 6': [null, '#85633f'],
    'M 5,2 V 5': [null, '#808080'],
    'M 7,6 V 2 H 3 v 4': [null, '#808080'],
    'M 3,8 H 7': [null, '-'],
    'M 0,6 2,4 4,6 2,10 Z': ['-', '#9b9b9b']
};


const isNearPoint = ([x, y], [cx, cy], radius) => {
    const dx = Math.abs(x - cx);
    const dy = Math.abs(y - cy);
    if (dx > radius)
        return false;
    if (dy > radius)
        return false;
    if (dx + dy <= radius)
        return true;
    return dx ^ 2 + dy ^ 2 <= radius ^ 2;
};

class Citizen extends Drawable {
    static name = 'Citizen';
    static description = '';
    static icon = '';
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

    static draw(ctx, x, y, owner, scale) {
        const _scale = scale || 0.3;
        ctx.save();
        ctx.translate((x || 0) - 3, ((y || 0) - 3));
        ctx.scale(_scale, _scale);
        Object.keys(this.paths).forEach(p => {
            const path = new Path2D(p);
            const [fill, stroke] = this.paths[p];
            if (fill) {
                ctx.fillStyle = fill === '-' ? owner.colour : fill;
                ctx.fill(path);
            }
            if (stroke) {
                ctx.strokeStyle = stroke === '-' ? owner.colour : stroke;
                ctx.stroke(path);
            }
        });
        ctx.restore();
    }

    static makeSvgPaths(owner) {
        return Object.keys(this.paths).map(p => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', p);
            const [fill, stroke] = this.paths[p];
            if (fill) {
                path.setAttribute('fill', fill === '-' ? owner.colour : fill);
            }
            if (stroke) {
                path.setAttribute('stroke', stroke === '-' ? owner.colour : stroke);
            }
            return path;
        });
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

    get isAlive() {
        return true;
    }

    canBeAfforded() {
        return this.constructor.canBeAffordedBy(this.owner);
    }

    drawAt(ctx, x, y) {
        if (this.isAlive) {
            this._bounceNumber += 0.1;
            this.constructor.draw(ctx, x, y + (Math.sin(this._bounceNumber)) / 4, this.owner);
        }
    }

    draw(ctx) {
        this.drawAt(ctx, ...this.currentCoordinates);
    }

    onPlacement(region) {
        this.owner._gold -= this.cost;
        this.region = region;
        this.owner.addUnit(this);
        tooltip.refreshContent();
    }

    onArrival(region, stayInOriginalCoords) {
        this.region = region;
        if (!stayInOriginalCoords) {
            this.currentCoordinates = pick(...this.region.largestShape).map((v, i) => (v + this.region.centroid[i]) / 2 + Math.random());
        }
    }

    onLeave() {
        this.region = null;
        tooltip.refreshContent();
    }

    moveTo(target) {
        if(!this.region){
            this.onDie();
        }
        this.targetRegion = target;
        this.routeToRegion = window.regionGraph.findShortestPath(this.region.id, target.id);
        this.routeToRegion.pop();
    }

    moveUnit(velocity) {
        if (this.isAlive) {
            if(this.region?.hasEnemiesOf(this)){
                return;
            }
            if (this.routeToRegion.length > 0) {
                if (this.region) {
                    this.onLeave();
                }
                const targetRegion = window.regionLookup[this.routeToRegion[this.routeToRegion.length - 1]];
                const [targetX, targetY] = targetRegion.centroid;

                var tx = targetX - this.currentCoordinates[0],
                    ty = targetY - this.currentCoordinates[1],
                    dist = Math.sqrt(tx * tx + ty * ty);

                let velX = (tx / dist) * velocity;
                let velY = (ty / dist) * velocity;

                this.currentCoordinates[0] += velX;
                this.currentCoordinates[1] += velY;

                if (isNearPoint(this.currentCoordinates, targetRegion.centroid, 4)) {
                    this.onArrival(targetRegion, this.routeToRegion.length);
                }
                if (isNearPoint(this.currentCoordinates, targetRegion.centroid, 2)) {
                    this.routeToRegion.pop();
                    this.onArrival(targetRegion, this.routeToRegion.length);
                }
            }
        }
    }

    onDie() {
        this.owner?.removeUnit(this);
        this.owner = null;
        this.region = null;
        tooltip.refreshContent();
    }
}

class Army extends Citizen {
    static name = 'Army';
    static description = '+5🗡️, +5🛡️';
    static paths = soldierPaths;
    static cost = 40;
    static foodCost = 5;

    constructor(owner) {
        super(owner);
        this.number = 5;
    }

    get description() {
        return `${this.number}🗡️, ${this.number}🛡️`;
    }

    get isAlive() {
        return this.number > 0;
    }

    draw(ctx) {
        super.draw(ctx);
        if (this.isAlive) {
            ctx.save();
            ctx.translate(...this.currentCoordinates);
            // show number of soldiers
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.font = '2px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText(this.number, -1.5, 2);
            ctx.fillText(this.number, -1.5, 2);
            ctx.restore();
        }
    }

    onPlacement(region) {
        super.onPlacement(region);
        this.onArrival(region);
    }

    onArrival(region, stayInOriginalCoords) {
        super.onArrival(region, stayInOriginalCoords);
        if (region.owner === this.owner || region.owner.isAlliedWith(this.owner)) {
            !region.defenders.includes(this) && region.defenders.push(this);
        } else {
            !region.attackers.includes(this) && region.attackers.push(this);
        }
        tooltip.refreshContent();
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
        if(!this.owner){
            this.onDie();
        }
        if (this.region && this.region.owner !== this.owner) {
            if (this.region.defenders.length === 0) {
                this.region._siegeProgress++;
            }
        } else if (this.region && this.region.owner === this.owner && this.region._siegeProgress) {
            if (this.region.attackers.length === 0) {
                this.region._siegeProgress = Math.max(this.region._siegeProgress - 1, 0);
            }
        }
    }
}

class Ambassador extends Citizen {
    static name = 'Ambassador';
    static description = '+1🪶/week, -1🟡/week';
    static paths = ambassadorPaths;
    static cost = 100;

    onPlacement(region) {
        super.onPlacement(region);
        this.onArrival(region);
    }

    onArrival(region, stayInOriginalCoords) {
        super.onArrival(region, stayInOriginalCoords);
        if (region.freeAmbassadorSlots != 0 && region.owner != this.owner) {
            region.ambassadors.push(this);
        }
        tooltip.refreshContent();
    }

    onLeave() {
        if (this.region.ambassadors.includes(this)) {
            this.region.ambassadors = this.region.ambassadors.filter(a => a !== this);
        }
        super.onLeave();
    }

    onTick() {
        if(!this.owner){
            this.onDie();
        }
        if (this.region && this.region.ambassadors.includes(this)) {
            this.owner._gold--;
            this.region.owner._gold++;
            this.owner.changeReputationWith(this.region.owner, 1);
        }
    }

    onDie() {
        this.onLeave();
        super.onDie();
    }
}

module.exports = {
    Army,
    Ambassador
};