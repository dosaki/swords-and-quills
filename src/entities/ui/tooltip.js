const { Farm, Mine, Castle } = require('../game-objects/buildings');
const { Ambassador, Army } = require('../game-objects/units');

class Tooltip {
    constructor(tooltipElement) {
        this.tooltip = tooltipElement;
        this.state = 0; // 0 = closed, 1 = opening, 2 = open, 3 = closing
        this.region = null;
        this.x = 0;
        this.y = cui.height + 3;
    }

    get isOpen() {
        return this.state === 2;
    }

    get isClosed() {
        return this.state === 0;
    }

    open() {
        this.state = 1;
    }

    close() {
        this.state = 3;
    }

    draw(ctx) {
        if(!this.region){
            return;
        }
        ctx.save();
        ctx.translate(this.x, this.y);

        // Panel
        ctx.lineWidth = 10;

        ctx.strokeStyle = "#0008";
        ctx.filter = "blur(4px)";
        ctx.beginPath();
        ctx.moveTo(340, -2);
        ctx.lineTo(340, cui.height);
        ctx.stroke();
        ctx.filter = "none";

        ctx.fillStyle = "#18243d";
        ctx.fillRect(0, 0, 340, cui.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffd700";
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(340, -2);
        ctx.lineTo(340, cui.height);
        ctx.stroke();

        // Name
        ctx.translate(10, 75);
        ctx.fillStyle = "#fff";
        ctx.font = "32px Arial";
        ctx.fillText(this.region.owner.name, 0, 32);
        if (this.region.owner.name !== this.region.owner.country) {
            ctx.font = "16px Arial";
            ctx.fillText(`of ${this.region.owner.country}`, 0, 48);
        }

        // Icon
        ctx.translate(0, 64);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 150, 150);
        ctx.fillStyle = this.region._colour;
        ctx.strokeStyle = this.region._strokeColour;
        const { x, y, width, height } = this.region.bBox;
        ctx.save();
        ctx.translate(-150, -150);
        ctx.scale(3, 3);
        ctx.translate(-x + 75 - (width / 2), -y + 75 - (height / 2));
        ctx.fill(this.region.dPath);
        ctx.stroke(this.region.dPath);
        ctx.restore();
        ctx.strokeStyle = "#ffd700";
        ctx.strokeRect(0, 0, 150, 150);

        // Building slots
        ctx.translate(170, 0);
        for(let i=0; i<this.region.buildingLimit; i++){
            const [x, y] = i.toString(2).padStart(2, "0").split("").map(Number);
            const s = 70;
            const p = 10;
            ctx.translate(x*(s+p), y*(s+p));
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, s, s);
            ctx.strokeStyle = "#ffd700";
            ctx.strokeRect(0, 0, s, s);
            ctx.translate(-x*(s+p), -y*(s+p));
        }

        ctx.restore();
    }

    update() {
        if (this.state === 1) {
            if (this.y <= 40) {
                this.y = 40;
                this.state = 2;
            } else {
                this.y -= this.y * 0.08;
            }
        } else if (this.state === 3) {
            if (this.y >= cui.height + 3) {
                this.y = cui.height + 3;
                this.state = 0;
            } else {
                this.y += this.y * 0.08;
            }
        }


        // if (this.region) {
        //     this.set(this.region);
        // }
    }

    _populateSellBuildings() {
        const slots = [tiprs1, tiprs2];
        slots.forEach((s, i) => {
            if (this.region.buildings[i]) {
                s.innerHTML = this.region.buildings[i].icon;
                if (this.region.owner === window.player) {
                    s.setAttribute("title", `Sell ${this.region.buildings[i].name} (+${this.region.buildings[i].sellPrice}🪙)`);
                } else {
                    s.setAttribute("title", this.region.buildings[i].name);
                }
            } else {
                s.innerHTML = "";
                s.setAttribute("title", "Building plot");
            }
        });
    }

    _setMakeBuildingsAndUnits() {
        if (this.region.owner === window.player) {
            bldsc.removeAttribute("n");
            trnc.removeAttribute("n");
            const canAffordFarm = Farm.canBeAffordedBy(window.player) && this.region.hasBuildingSpace;
            if (canAffordFarm) {
                bldf.removeAttribute("disabled");
                bldf.parentElement.removeAttribute("st");
            } else {
                bldf.setAttribute("disabled", "");
                bldf.parentElement.setAttribute("st", "");
            }
            const canAffordMine = Mine.canBeAffordedBy(window.player) && this.region.hasBuildingSpace;
            if (canAffordMine) {
                bldm.removeAttribute("disabled");
                bldm.parentElement.removeAttribute("st");
            } else {
                bldm.setAttribute("disabled", "");
                bldm.parentElement.setAttribute("st", "");
            }
            const canAffordCastle = Castle.canBeAffordedBy(window.player) && this.region.hasBuildingSpace;
            if (canAffordCastle) {
                bldc.removeAttribute("disabled");
                bldc.parentElement.removeAttribute("st");
            } else {
                bldc.setAttribute("disabled", "");
                bldc.parentElement.setAttribute("st", "");
            }
        } else {
            bldsc.setAttribute("n", "");
            trnc.setAttribute("n", "");
        }
    }

    _populateAmbassadors() {
        const ambassadorSlots = [tipras0, tipras1, tipras2, tipras3];
        const ambassadorGs = [tipras0s, tipras1s, tipras2s, tipras3s];
        ambassadorSlots.forEach((slot, i) => {
            if (this.region.ambassadors[i]) {
                slot.setAttribute("title", `${this.region.ambassadors[i].name} from ${this.region.ambassadors[i].owner.country}`);
                this.region.ambassadors[i].drawToSvgG(ambassadorGs[i]);
            } else {
                slot.setAttribute("title", "Ambassador seat");
                ambassadorGs[i].innerHTML = "";
            }

            if (i < this.region.maxAmbassadors) {
                slot.removeAttribute("n");
            } else {
                slot.setAttribute("n", "");
            }
        });
    }

    _setTrainUnits() {
        const canAffordArmy = Army.canBeAffordedBy(window.player);
        if (canAffordArmy) {
            trns.removeAttribute("disabled");
            trns.parentElement.removeAttribute("st");
        } else {
            trns.setAttribute("disabled", "");
            trns.parentElement.setAttribute("st", "");
        }
        const canAffordAmbassador = Ambassador.canBeAffordedBy(window.player);
        if (canAffordAmbassador) {
            trna.removeAttribute("disabled");
            trna.parentElement.removeAttribute("st");
        } else {
            trna.setAttribute("disabled", "");
            trna.parentElement.setAttribute("st", "");
        }
    }

    _setOtherPlayerView() {
        if (this.region.owner !== window.player) {
            dvc.removeAttribute("n");
            dvv.innerHTML = this.region.owner.reputationWith(window.player);
        } else {
            dvc.setAttribute("n", "");
        }
    }

    _populateArmies() {
        while (ald.firstChild) {
            ald.removeChild(ald.lastChild);
        }
        while (ala.firstChild) {
            ala.removeChild(ala.lastChild);
        }
        this.region.defenders.forEach(d => {
            const button = document.createElement("button");
            button.innerHTML = d.number;
            button.setAttribute("style", `width: 35px; height: 35px; background: ${d.owner.colour}; border-color: ${d.owner.strokeColour}`);
            button.setAttribute("title", `${d.number} Armies from ${d.owner.country}`);
            button.addEventListener("click", () => {
                window.placingArmy = d;
            });
            ald.appendChild(button);
        });
        this.region.attackers.forEach(a => {
            const button = document.createElement("button");
            button.innerHTML = a.number;
            button.setAttribute("style", `width: 35px; height: 35px; background: ${a.owner.colour}`);
            button.setAttribute("title", `${a.number} Armies from ${a.owner.country}`);
            button.addEventListener("click", () => {
                window.placingArmy = a;
            });
            ala.appendChild(button);
        });
    }

    set(region) {
        const oldRegion = this.region;
        this.region = region;
        if (this.region !== oldRegion) {
            tipn.innerHTML = region.owner.name !== region.owner.country ? `${region.owner.name} <br/> <small>of ${region.owner.country}</small>` : region.owner.country;
            tipr.innerHTML = region.name + (region.isCapital ? " 👑" : "");
            tipr.title = region.isCapital ? "Capital" : "";
            // tipi.setAttribute("d", region.d);
            // const { x, y, width, height } = tipi.getBBox();
            // tipi.setAttribute("transform", `translate(-150 -150) scale(3) translate(${(-x + 75 - (width / 2))} ${(-y + 75 - (height / 2))})`);
            // tipi.setAttribute("fill", region._colour);
            // tipi.setAttribute("stroke", region._strokeColour);
            if (region.isCapital) {
                tiprs2.removeAttribute("n");
            } else {
                tiprs2.setAttribute("n", "");
            }

            this._populateAmbassadors();
            this._populateSellBuildings();
        }
        this._populateArmies();
        this._setMakeBuildingsAndUnits();
        this._setTrainUnits();

        this._setOtherPlayerView();
    }
}

module.exports = Tooltip;