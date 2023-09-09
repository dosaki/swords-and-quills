const { Farm, Mine, Castle } = require('../game-objects/buildings');
const { Ambassador, Army } = require('../game-objects/units');
const UiInteractible = require('./ui-interactible');

class Tooltip {
    constructor() {
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

        ctx.strokeStyle = '#0008';
        ctx.filter = 'blur(4px)';
        ctx.beginPath();
        ctx.moveTo(340, -2);
        ctx.lineTo(340, cui.height);
        ctx.stroke();
        ctx.filter = 'none';

        ctx.fillStyle = '#18243d';
        ctx.fillRect(0, 0, 340, cui.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = window.resourcesBar.currentSpeed ? '#ffd700' : '#ff0000';
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(340, -2);
        ctx.lineTo(340, cui.height);
        ctx.stroke();

        // Name
        ctx.translate(10, 75);
        ctx.fillStyle = '#fff';
        ctx.font = '32px Arial';
        ctx.fillText(this.region.owner.name, 0, 32);
        ctx.font = '16px Arial';
        if (this.region.owner.name !== this.region.owner.country) {
            ctx.fillText(`of ${this.region.owner.country}`, 0, 48);
        }

        // Icon
        ctx.translate(0, 64);
        ctx.fillStyle = '#000';
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
        ctx.fillStyle = '#fff5';
        ctx.fillRect(0, 0, 150, 25);
        // Siege progress
        ctx.fillStyle = '#f44';
        ctx.fillRect(0, 125, 125 * (this.region._siegeProgress / this.region.defence), 25);
        // Icon border
        ctx.strokeStyle = '#ffd700';
        ctx.strokeRect(0, 0, 150, 150);

        ctx.fillStyle = '#fff';
        ctx.fillText(this.region.name + (this.region.isCapital ? ' 👑' : ''), 5, 20);

        ctx.fillStyle = '#ffd700';
        this._drawSectionTitle('Armies', 220, ctx);
        if (this.region.owner === window.player) {
            this._drawSectionTitle('Build', 370, ctx);
            this._drawSectionTitle('Train', 480, ctx);
        } else {
            this._drawSectionTitle('Diplomacy', 370, ctx);
            ctx.fillStyle = '#fff';
            ctx.fillText(this.region.owner.attitudeWith(window.player), 200, 400);
            ctx.font = '32px Arial';
            ctx.fillText(`${this.region.owner.reputationWith(window.player)}🪶`, 200, 440);
        }

        // Building slots
        const transform = ctx.getTransform();
        this.interactibles.forEach(interactible => {
            interactible.transformationOnDraw = transform;
            interactible.draw(ctx);
        });

        if (this.hoveredInteractible && this.hoveredInteractible.help.length) {
            this.hoveredInteractible.drawTooltip(ctx);
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
    }

    _addInteractible(interactible) {
        window.uiShapes.push(interactible);
        this.interactibles.push(interactible);
        return interactible;
    }

    _removeAllInteractibles() {
        window.uiShapes = window.uiShapes.filter(s => !this.interactibles.includes(s));
        this.interactibles = [];
        this.hoveredInteractible = null;
    }

    _populateSellBuildings() {
        this.region.buildings.forEach((b, i) => {
            const [x, y] = i.toString(2).padStart(2, '0').split('').map(n => Number(n) * 80);
            const button = this._addInteractible(new UiInteractible([[170, 0], [240, 0], [240, 70], [170, 70]], x, y, 2, b.icon, ['#000030', '#ffd700']));
            button.textSize = 50;
            button.help = `${b.name}`;
            if (this.region.owner === window.player) {
                button.help = `Sell ${b.name} for ${b.sellPrice}🟡`;
                button.onClick = () => {
                    this.region.sellBuilding(b);
                    this._populateSellBuildings();
                };
            } else {
                button.forceShowHelp = button.disabled = true;
            }
        });
        for (let i = this.region.buildings.length; i < this.region.buildingLimit; i++) {
            const [x, y] = i.toString(2).padStart(2, '0').split('').map(n => Number(n) * 80);
            const button = this._addInteractible(new UiInteractible([[170, 0], [240, 0], [240, 70], [170, 70]], x, y, 2, null, ['#000030', '#ffd700']));
            button.help = `Empty plot`;
        }
    }

    _makeBuildBuildings() {
        if (this.region.owner === window.player) {
            [Farm, Mine, Castle].forEach((B, i) => {
                const button = this._addInteractible(new UiInteractible([[0, 0], [70, 0], [70, 70], [0, 70]], i * 124, 380, 2, B.icon, ['#000030', '#ffd700']));
                button.disabled = !(B.canBeAffordedBy(window.player) && this.region.buildings.length < this.region.buildingLimit);
                button.textSize = 50;
                if (button.disabled) {
                    button.help = [
                        `${B.name}: ${B.cost}🟡`,
                        B.description,
                        '',
                        [this.region.buildings.length >= this.region.buildingLimit ? 'Not enough plots' : 'Not enough 🟡', '#f88']
                    ];
                    button.textColour = '#0006';
                    button.textOutline = 'transparent';
                    button.changeColour('#2c2c40', '#ffd700');
                    button.forceShowHelp = true;
                } else {
                    button.help = [`${B.name}: ${B.cost}🟡`, B.description];
                    button.onClick = () => {
                        this.region.addBuilding(new B(window.player));
                        this._makeBuildBuildings();
                        this._populateSellBuildings();
                        this._populateAmbassadors();
                    };
                }
            });
        }
    }

    _populateAmbassadors() {
        this.region.ambassadors.forEach((a, i) => {
            const button = this._addInteractible(new UiInteractible([[0, 0], [33, 0], [33, 33], [0, 33]], i * 41, 160, 2, '🪶', ['#000030', '#ffd700']));
            button.textSize = 20;
            button.help = `Ambassador from ${a.owner.country}`;
            if (a.owner === window.player || this.region.owner === window.player) {
                button.help = a.owner === window.player ? `Fire ambassador` : `Fire ambassador from ${a.owner.country}`;
                button.onClick = () => {
                    a.onDie();
                };
            }
        });
        if (this.region.maxAmbassadors) {
            for (let i = this.region.ambassadors.length; i < this.region.maxAmbassadors; i++) {
                const button = this._addInteractible(new UiInteractible([[0, 0], [33, 0], [33, 33], [0, 33]], i * 41, 160, 2, null, ['#000030', '#ffd700']));
                button.help = `Empty ambassador seat`;
            }
        }
        return;
    }

    _makeTrainUnits() {
        if (this.region.owner == window.player) {
            [Army, Ambassador].forEach((U, i) => {
                const button = this._addInteractible(new UiInteractible([[62, 0], [132, 0], [132, 70], [62, 70]], i * 124, 490, 2, null, ['#000030', '#ffd700']));
                button.disabled = !U.canBeAffordedBy(window.player);
                button.classWithIcon = U;
                button.textSize = 50;
                if (button.disabled) {
                    button.help = [
                        `${U.name}: ${U.cost}🟡 ${U.foodCost}🍖`,
                        U.description,
                        '',
                        ['Not enough 🟡 or 🍖', '#f88']
                    ];
                    button.textColour = '#0006';
                    button.textOutline = 'transparent';
                    button.changeColour('#2c2c40', '#ffd700');
                    button.forceShowHelp = true;
                } else {
                    button.help = [`${U.name}: ${U.cost}🟡 ${U.foodCost}🍖`, U.description];
                    button.onClick = () => {
                        if (U === Army) {
                            this.region.addUnit(new U(window.player));
                        } else {
                            window.placingAmbassador = new U(window.player);
                        }
                        this._makeTrainUnits();
                        this._populateAmbassadors();
                        this._populateArmies();
                    };
                }
            });
        }
    }

    _setDiplomacyView() {
        if (this.region.owner !== window.player) {
            const regionPrice = this.region.getPriceFor(window.player);
            const buyIsDisabled = !this.region.owner.wouldSellTo(window.player) || this.region._siegeProgress > 0 || this.region == this.region.owner.isCapital;
            const buyButtonHelp = this.region === this.region.owner.capital ? `${this.region.owner.name} cannot sell you their capital!` : !this.region.owner.wouldSellTo(window.player) ? [`${this.region.owner.name} does not want to sell to you`, 'Persuade them with Ambassadors'] : this.region._siegeProgress > 0 ? `${this.region.owner.name} is under siege` : `Buy ${this.region.name} for ${regionPrice}🟡`;
            const allyIsDisabled = !this.region.owner.wouldAllyWith(window.player);
            const allyButtonHelp = this.region.owner.wouldAllyWith(window.player) ? `Ally with ${this.region.owner.name}` : [`${this.region.owner.name} does not want to ally with you`, 'Persuade them with Ambassadors'];
            const allyButtonText = (this.region.owner.isAlliedWith(window.player) ? 'Break Alliance' : 'Make Alliance');
            const buttons = {
                'Buy land': [() => {
                    if (this.region.owner !== window.player && this.region.owner.wouldSellTo(window.player) && this.region._siegeProgress <= 0) {
                        this.region.sellTo(window.player, regionPrice);
                    }
                }, buyButtonHelp, buyIsDisabled],
                [allyButtonText]: [() => {
                    if (this.region.owner.isAlliedWith(window.player)) {
                        this.region.owner.dissolveAllianceWith(window.player);
                    } else {
                        this.region.owner.enterAllianceWith(window.player);
                    }
                    this._setDiplomacyView();
                }, allyButtonHelp, allyIsDisabled],
            };
            Object.keys(buttons).forEach((text, i) => {
                const button = this._addInteractible(new UiInteractible([[0, 0], [130, 0], [130, 40], [0, 40]], 0, i * 50 + 385, 2, text, ['#000030', '#ffd700'], buttons[text][0]));
                button.textSize = 18;
                button.help = buttons[text][1];
                button.disabled = buttons[text][2];
                button.forceShowHelp = true;
                if (button.disabled) {
                    button.textColour = '#fff6';
                    button.textOutline = 'transparent';
                    button.changeColour('#2c2c40', '#ffd700');
                }
            });
        }
    }

    _populateArmies() {
        const allArmies = [...this.region.defenders, ...this.region.attackers];
        const playerArmies = allArmies.filter(a => a.owner === window.player);
        const restOfArmies = allArmies.filter(a => a.owner !== window.player);
        [...playerArmies, ...restOfArmies].forEach((d, i) => {
            if (d.isAlive) {
                const x = (i % 7) * 39;
                const y = (Math.floor(i / 7)) * 39;
                if (Math.floor(i / 7) >= 3) {
                    return;
                }
                if (Math.floor(i % 7) === 6 && Math.floor(i / 7) === 2 && i < allArmies.length - 2) {
                    const button = this._addInteractible(new UiInteractible([[0, 0], [33, 0], [33, 33], [0, 33]], x + 52, y + 230, 2));
                    button.changeColour('#000030', '#ffd700');
                    button.text = '...';
                    button.help = `Merge your Armies`;
                    button.onClick = () => {
                        this.region.mergeArmies(window.player);
                    };
                    return;
                }
                const button = this._addInteractible(new UiInteractible([[0, 0], [33, 0], [33, 33], [0, 33]], x + 52, y + 230, 2));
                button.changeColour(d.owner?.colour, d.owner?.strokeColour);
                button.text = d.number;
                button.help = `Army of ${d.number} soldiers from ${d.owner?.country}`;
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
        const playerArmies = [...this.region.defenders, ...this.region.attackers].filter(u => u.owner === window.player);
        const mergeButton = this._addInteractible(new UiInteractible([[0, 0], [40, 0], [40, 40], [0, 40]], 0, 230, 2));
        mergeButton.compoundText = [['⇒', -9, -8], ['⇐', 9, 8]];
        mergeButton.textSize = 18;
        mergeButton.changeColour('#000030', '#ffd700');
        mergeButton.help = 'Merge Armies';
        mergeButton.disabled = playerArmies.length <= 1;
        if (mergeButton.disabled) {
            mergeButton.textColour = '#fff6';
            mergeButton.textOutline = 'transparent';
            mergeButton.changeColour('#2c2c40', '#ffd700');
        }
        mergeButton.onClick = () => {
            this.region.mergeArmies(window.player);
        };
        const splitButton = this._addInteractible(new UiInteractible([[0, 0], [40, 0], [40, 40], [0, 40]], 0, 280, 2));
        splitButton.compoundText = [['⇒', 8, 9], ['⇐', -8, -9]];
        splitButton.textSize = 18;
        splitButton.changeColour('#000030', '#ffd700');
        splitButton.help = 'Split Armies';
        splitButton.disabled = !playerArmies.length;
        if (splitButton.disabled) {
            splitButton.textColour = '#fff6';
            splitButton.textOutline = 'transparent';
            splitButton.changeColour('#2c2c40', '#ffd700');
        }
        splitButton.onClick = () => {
            this.region.splitArmies(window.player);
        };
    }

    refreshContent() {
        this.region && this.set(this.region);
    }

    set(region) {
        this.region = region;
        this._removeAllInteractibles();
        this._populateSellBuildings();
        this._populateAmbassadors();
        this._populateArmies();
        this._armyButtons();
        this._makeBuildBuildings();
        this._makeTrainUnits();
        this._setDiplomacyView();
    }
}

module.exports = Tooltip;