const { Farm, Mine, Castle } = require('../game-objects/buildings');
const { Ambassador, Army } = require('../game-objects/units');

class Tooltip {
    constructor(tooltipElement) {
        this.tooltip = tooltipElement;
        this.isOpen = false;
        this.region = null;
    }

    open() {
        this.isOpen = true;
        tip.style.marginBottom = "0";
        tip.style.marginTop = "40px";
    }

    close() {
        this.isOpen = false;
        tip.style.marginBottom = `${-cg.height}px`;
        tip.style.marginTop = `${cg.height}px`;
    }

    update(force) {
        if (this.region) {
            this.set(this.region, force);
        }
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

    set(region, force) {
        const oldRegion = this.region;
        this.region = region;
        if (this.region !== oldRegion || force) {
            tipn.innerHTML = region.owner.name !== region.owner.country ? `${region.owner.name} <br/> <small>of ${region.owner.country}</small>` : region.owner.country;
            tipr.innerHTML = region.name + (region.isCapital ? " 👑" : "");
            tipr.title = region.isCapital ? "Capital" : "";
            tipi.setAttribute("d", region.d);
            const { x, y, width, height } = tipi.getBBox();
            tipi.setAttribute("transform", `translate(-150 -150) scale(3) translate(${(-x + 75 - (width / 2))} ${(-y + 75 - (height / 2))})`);
            tipi.setAttribute("fill", region._colour);
            tipi.setAttribute("stroke", region._strokeColour);
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