const { Farm, Mine, Castle } = require('../game-objects/buildings');
const { Ambassador, Army } = require('../game-objects/units');
const UiInteractible = require('./ui-interactible');

class Tooltip {
    constructor(tooltipElement) {
        this.tooltip = tooltipElement;
        this.state = 0; // 0 = closed, 1 = opening, 2 = open, 3 = closing
        this.region = null;
        this.x = 0;
        this.y = cui.height + 3;
        this.interactibles = [];
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

    _drawSectionTitle(title, height, ctx) {
        const { width } = ctx.measureText(title);
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(150 - width / 2, height);
        ctx.moveTo(170 + width / 2, height);
        ctx.lineTo(320, height);
        ctx.stroke();
        ctx.fillText(title, 160 - width / 2, height + 5);
    }

    draw(ctx) {
        if (!this.region) {
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
        ctx.font = "16px Arial";
        if (this.region.owner.name !== this.region.owner.country) {
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
        // Background for region name
        ctx.fillStyle = "#fff5";
        ctx.fillRect(0, 0, 150, 25);
        // Siege progress
        ctx.fillStyle = "#f44";
        ctx.fillRect(0, 125, 125 * (this.region._siegeProgress / this.region.defence), 25);
        // Icon border
        ctx.strokeStyle = "#ffd700";
        ctx.strokeRect(0, 0, 150, 150);

        ctx.fillStyle = "#fff";
        ctx.fillText(this.region.name + (this.region.isCapital ? " 👑" : ""), 5, 20);

        ctx.fillStyle = "#ffd700";
        this._drawSectionTitle("Armies", 220, ctx);
        this._drawSectionTitle("Build", 360, ctx);

        // Building slots
        const transform = ctx.getTransform();
        this.interactibles.forEach(interactible => {
            interactible.transformationOnDraw = transform;
            interactible.draw(ctx);
        });

        if (this.hoveredInteractible && this.hoveredInteractible.help) {
            this.hoveredInteractible.drawTooltip(ctx);
        }

        // for (let i = 0; i < this.region.buildingLimit; i++) {
        //     const [x, y] = i.toString(2).padStart(2, "0").split("").map(Number);
        //     const s = 70;
        //     const p = 10;
        //     ctx.translate(x * (s + p), y * (s + p));
        //     ctx.fillStyle = "#000";
        //     ctx.fillRect(0, 0, s, s);
        //     ctx.strokeStyle = "#ffd700";
        //     ctx.strokeRect(0, 0, s, s);
        //     ctx.translate(-x * (s + p), -y * (s + p));
        // }

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
    }

    _addInteractible(interactible) {
        this.interactibles.push(interactible);
        window.uiShapes.push(interactible);
        return interactible;
    }

    _removeAllInteractibles() {
        const uuids = this.interactibles.map(i => i.uuid);
        window.uiShapes = window.uiShapes.filter(s => !uuids.includes(s.uuid));
        this.interactibles = [];
        this.hoveredInteractible = null;
    }

    _populateSellBuildings() {
        this.region.buildings.forEach((b, i) => {
            const [x, y] = i.toString(2).padStart(2, "0").split("").map(n => Number(n) * 80);
            const button = this._addInteractible(new UiInteractible([[170, 0], [240, 0], [240, 70], [170, 70]], x, y, 2));
            button.changeColour("#1d1d4d", "#ffd700");
            button.text = b.icon;
            button.textSize = 50;
            button.help = `${b.name}`;
            if (this.region.owner === window.player) {
                button.help = `Sell ${b.name} for ${b.sellPrice}🪙`;
                button.onClick = () => {
                    this.region.sellBuilding(b);
                    this._populateSellBuildings();
                };
            }
        });
        for (let i = this.region.buildings.length; i < this.region.buildingLimit; i++) {
            const [x, y] = i.toString(2).padStart(2, "0").split("").map(n => Number(n) * 80);
            const button = this._addInteractible(new UiInteractible([[170, 0], [240, 0], [240, 70], [170, 70]], x, y, 2));
            button.changeColour("#1d1d4d", "#ffd700");
            button.help = `Empty plot`;
        }
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
        this.region.ambassadors.forEach((a, i) => {
            const button = this._addInteractible(new UiInteractible([[0, 0], [33, 0], [33, 33], [0, 33]], i * 41, 160, 2));
            button.changeColour("#1d1d4d", "#ffd700");
            button.text = "?";
            button.textSize = 20;
            button.help = `Ambassador from ${a.owner.country}`;
            if (a.owner === window.player) {
                button.help = `Fire ambassador`;
                button.onClick = () => {
                    a.onDie();
                };
            }
        });
        if (this.region.maxAmbassadors) {
            for (let i = this.region.ambassadors.length; i < this.region.maxAmbassadors; i++) {
                const button = this._addInteractible(new UiInteractible([[0, 0], [33, 0], [33, 33], [0, 33]], i * 41, 160, 2));
                button.changeColour("#1d1d4d", "#ffd700");
                button.help = `Empty ambassador seat`;
            }
        }
        return;
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
        const allArmies = [...this.region.defenders, ...this.region.attackers];
        const playerArmies = allArmies.filter(a => a.owner === window.player);
        const restOfArmies = allArmies.filter(a => a.owner !== window.player);
        [...playerArmies, restOfArmies].forEach((d, i) => {
            if (d.isAlive) {
                const x = (i % 7) * 39;
                const y = (Math.floor(i / 7)) * 39;
                if (Math.floor(i / 7) >= 3) {
                    return;
                }
                if(Math.floor(i%7) === 6 && Math.floor(i / 7) === 2 && i < allArmies.length - 2) {
                    const button = this._addInteractible(new UiInteractible([[0, 0], [33, 0], [33, 33], [0, 33]], x + 52, y + 230, 2));
                    button.changeColour("#1d1d4d", "#ffd700");
                    button.text = "...";
                    button.help = `Too many armies. Merge yours.`;
                    button.onClick = () => {
                        this.region.mergeArmies(window.player);
                    }
                    return;
                }
                const button = this._addInteractible(new UiInteractible([[0, 0], [33, 0], [33, 33], [0, 33]], x + 52, y + 230, 2));
                button.changeColour(d.owner.colour, d.owner.strokeColour);
                button.text = d.number;
                button.help = `Army of ${d.number} soldiers from ${d.owner.country}`;
                if (window.player === d.owner) {
                    button.help = `Click to move ${d.number} soldiers`;
                    button.onClick = () => {
                        window.placingArmy = d;
                    };
                }
            }
        });
    }

    _armyButtons() {
        const mergeButton = this._addInteractible(new UiInteractible([[0, 0], [40, 0], [40, 40], [0, 40]], 0, 230, 2));
        mergeButton.compoundText = [["⇒", -9, -8], ["⇐", 9, 8]];
        mergeButton.textSize = 18;
        mergeButton.changeColour("#1d1d4d", "#ffd700");
        mergeButton.help = "Merge Armies";
        mergeButton.onClick = () => {
            this.region.mergeArmies(window.player);
        };
        const splitButton = this._addInteractible(new UiInteractible([[0, 0], [40, 0], [40, 40], [0, 40]], 0, 280, 2));
        splitButton.compoundText = [["⇒", 8, 9], ["⇐", -8, -9]];
        splitButton.textSize = 18;
        splitButton.changeColour("#1d1d4d", "#ffd700");
        splitButton.help = "Split Armies";
        splitButton.onClick = () => {
            this.region.splitArmies(window.player);
        };
    }

    refreshContent() {
        if (this.region) {
            this.set(this.region);
        }
    }

    set(region) {
        this.region = region;
        this._removeAllInteractibles();
        this._populateSellBuildings();
        this._populateAmbassadors();
        this._populateArmies();
        this._armyButtons();

        this._setMakeBuildingsAndUnits();
        this._setTrainUnits();
        this._setOtherPlayerView();
    }
}

module.exports = Tooltip;