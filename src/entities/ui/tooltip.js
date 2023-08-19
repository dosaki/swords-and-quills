const { Farm, Mine, Castle } = require('../game-objects/buildings');

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

    update() {
        if (this.region) {
            this.set(this.region);
        }
    }

    set(region) {
        this.region = region;
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

        if (region.owner === window.player) {
            bldsc.removeAttribute("n");
            const canAffordFarm = Farm.canBeAffordedBy(window.player) && region.hasBuildingSpace;
            if (canAffordFarm) {
                bldf.removeAttribute("disabled");
                bldf.parentElement.removeAttribute("st");
            } else {
                bldf.setAttribute("disabled", "");
                bldf.parentElement.setAttribute("st", "");
            }
            const canAffordMine = Mine.canBeAffordedBy(window.player) && region.hasBuildingSpace;
            if (canAffordMine) {
                bldm.removeAttribute("disabled");
                bldm.parentElement.removeAttribute("st");
            } else {
                bldm.setAttribute("disabled", "");
                bldm.parentElement.setAttribute("st", "");
            }
            const canAffordCastle = Castle.canBeAffordedBy(window.player) && region.hasBuildingSpace;
            if (canAffordCastle) {
                bldc.removeAttribute("disabled");
                bldc.parentElement.removeAttribute("st");
            } else {
                bldc.setAttribute("disabled", "");
                bldc.parentElement.setAttribute("st", "");
            }
        } else {
            bldsc.setAttribute("n", "");
        }


        const slots = [tiprs1, tiprs2];
        slots.forEach((s, i) => {
            if (region.buildings[i]) {
                s.innerHTML = region.buildings[i].icon;
                if (region.owner === window.player) {
                    s.setAttribute("title", `Sell ${region.buildings[i].name} (+${region.buildings[i].sellPrice}🪙)`);
                } else {
                    s.setAttribute("title", region.buildings[i].name);
                }
            } else {
                s.innerHTML = "";
                s.removeAttribute("title");
            }
        });
    }
}

module.exports = Tooltip;