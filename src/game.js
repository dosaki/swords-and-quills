const { loadRegions, loadJoinedRegionPaths } = require("./loader/region-loader");
const Player = require("./entities/player");
const ResourcesBar = require("./entities/ui/resources");
const Tooltip = require("./entities/ui/tooltip");
//
const { Farm, Mine, Castle } = require("./entities/game-objects/buildings");
const { Soldier, Ambassador } = require("./entities/game-objects/units");


const mapShadow = loadJoinedRegionPaths();

cui.width = cg.width = window.innerWidth;
cui.height = cg.height = window.innerHeight;
tip.style.width = `${cg.width / 3 > 344 ? 344 : cg.width * 0.2}px`;
tip.style.height = `${cg.height - 40}px`;
tip.style.marginBottom = `${-cg.height}px`;
tip.style.marginTop = `${cg.height}px`;
window.tooltip = new Tooltip(tip);

window.addEventListener("resize", () => {
    cui.width = cg.width = window.innerWidth;
    cui.height = cg.height = window.innerHeight;
    tip.style.width = `${cg.width / 3 > 344 ? 344 : cg.width * 0.2}px`;
    tip.style.height = `${cg.height - 40}px`;
    tip.style.marginBottom = window.tooltip.isOpen ? "0" : `${-cg.height}px`;
    tip.style.marginTop = window.tooltip.isOpen ? "40px" : `${cg.height}px`;
});


// Tooltip - Building Slots
tiprs1.addEventListener('click', () => {
    if (window.player && tooltip.region && window.player == tooltip.region.owner && tooltip.region.buildings[0]) {
        tooltip.region.sellBuilding(tooltip.region.buildings[0]);
        tooltip.update();
    }
});
tiprs2.addEventListener('click', () => {
    if (window.player && tooltip.region && window.player == tooltip.region.owner && tooltip.region.buildings[1]) {
        tooltip.region.sellBuilding(tooltip.region.buildings[1]);
        tooltip.update();
    }
});

// Tooltip - Building Buttons
bldf.innerHTML = Farm.icon;
bldf.setAttribute("title", `${Farm.name}: ${Farm.description}`);
bldfc.innerHTML = `${Farm.cost}🪙`;
bldf.addEventListener('click', () => {
    if (window.player && !bldf.hasAttribute('disabled')) {
        tooltip.region.addBuilding(new Farm(window.player));
        tooltip.update();
    }
});
bldm.innerHTML = Mine.icon;
bldm.setAttribute("title", `${Mine.name}: ${Mine.description}`);
bldmc.innerHTML = `${Mine.cost}🪙`;
bldm.addEventListener('click', () => {
    if (window.player && !bldm.hasAttribute('disabled')) {
        tooltip.region.addBuilding(new Mine(window.player));
        tooltip.update();
    }
});
bldc.innerHTML = Castle.icon;
bldc.setAttribute("title", `${Castle.name}: ${Castle.description}`);
bldcc.innerHTML = `${Castle.cost}🪙`;
bldc.addEventListener('click', () => {
    if (window.player && !bldc.hasAttribute('disabled')) {
        tooltip.region.addBuilding(new Castle(window.player));
        tooltip.update();
    }
});

const ctx = cg.getContext('2d');
const uictx = cui.getContext('2d');

window.zoomLevel = 4;
window.pan = [cg.width / 3, cg.height / 4];
window.cursor = [0, 0];
window.gameCursor = [0, 0];
window.debugGameCursors = [window.gameCursor];
let isPanning = false;

window.players = [];
window.player = null;
let regions = [];
let shapes = [];
const resourcesBar = new ResourcesBar();

let playerName = "Sir Teencen Tury I";
let playerNationName = "Jascriptland";
let isPickingNation = true;

// Get player name and stuff
bp.addEventListener('click', () => {
    if (tt.value && tn.value) {
        playerName = `${tt.value} ${tn.value}`;
    }
    if (tc.value) {
        playerNationName = tc.value;
    }
    m.setAttribute("n", "");
});

// ------------------------------

const updateCursor = ([x, y]) => {
    window.cursor = [x, y];
    window.gameCursor = [x - window.pan[0] / window.zoomLevel, y - window.pan[1] / window.zoomLevel];
};

let placingAmbassador = null;

const makeRegions = () => {
    regions = loadRegions();
    shapes = [...shapes, ...regions];
    regions.forEach(region => {
        region.onClick = (e, self) => {
            if (isPickingNation) {
                region.owner.name = playerName;
                window.player = region.owner;
                window.player.country = playerNationName;
                window.player.conquestPoints = -window.player.score; // To adjust starting with a big nation
                isPickingNation = false;
                bnr.setAttribute("fill", region._colour);
                bnr.setAttribute("stroke", region._strokeColour);
                bnrc.style.top = 0;
                // Tooltip - Unit Buttons - doing it here to use right colours:

                Soldier.drawToSvgG(trnss, trnsc, window.player);
                trns.addEventListener('click', () => {
                    if (!trns.hasAttribute('disabled')) {
                        tooltip.region.addUnit(new Soldier(window.player));
                        tooltip.update();
                    }
                });

                Ambassador.drawToSvgG(trnas, trnac, window.player);
                trna.addEventListener('click', () => {
                    if (!trna.hasAttribute('disabled')) {
                        placingAmbassador = new Ambassador(window.player);
                        tooltip.update();
                    }
                });
            }
            if (placingAmbassador && region.freeAmbassadorSlots > 0) {
                region.addUnit(placingAmbassador);
                placingAmbassador = null;
                tooltip.update();
                window.tooltip.set(region);
                window.tooltip.open();
            } else {
                window.tooltip.set(region);
                window.tooltip.open();
            }
        };
        region.onHover = (e, self) => {
            if (isPickingNation) {
                e.runDefault = false;
                regions.filter(r => r.group === self.group).forEach(r => r.isHovering = true);
            }
        };
        region.onMouseOut = (e, self) => {
            if (isPickingNation) {
                e.runDefault = false;
                regions.filter(r => r.group === self.group).forEach(r => r.isHovering = false);
            }
        };
        region.onRightClick = (e, self) => {
            e.runDefault = false;
            self.unClick();
        };
        region.onRightUnClick = (e, self) => {
            e.runDefault = false;
            self.unClick();
        };
    });
};

let currentWaveValue = 0.8;
let currentWaveDirection = 1;
const drawMap = () => {
    ctx.save();
    ctx.filter = `blur(${16 * (currentWaveValue)}px)`;
    ctx.strokeStyle = "#3c789b";
    ctx.lineWidth = 10 * currentWaveValue;
    ctx.stroke(mapShadow);

    ctx.filter = `blur(${8 * (currentWaveValue)}px)`;
    ctx.strokeStyle = "#4f94bf";
    ctx.lineWidth = 8 * currentWaveValue;
    ctx.stroke(mapShadow);
    ctx.restore();

    regions.forEach(region => region.draw(ctx));
    currentWaveValue += 0.001 * currentWaveDirection;
    if (currentWaveValue >= 1) {
        currentWaveDirection = -1;
    } else if (currentWaveValue <= 0.8) {
        currentWaveDirection = 1;
    }
};

const makePlayers = () => {
    const _players = {};
    regions.forEach(region => {
        if (!_players[region.group]) {
            _players[region.group] = new Player(region.group);
            _players[region.group]._gold = 600;
            _players[region.group].capital = region;
            region.owner = _players[region.group];
            region.addBuilding(new Castle(_players[region.group]));
        } else {
            region.owner = _players[region.group];
        }
        _players[region.group].regions.push(region);
    });
    window.players = Object.values(_players);
};

const addMovementListeners = () => {
    cui.addEventListener('wheel', (e) => {
        e.preventDefault();
        window.zoomLevel = Math.max(1, window.zoomLevel - (e.deltaY / 100));
    });
    cui.addEventListener('mousedown', (e) => {
        if (e.which == 2 || e.shiftKey) {
            updateCursor([e.offsetX / window.zoomLevel, e.offsetX / window.zoomLevel]);
            isPanning = true;
            panStart = [e.offsetX - window.pan[0], e.offsetY - window.pan[1]];
            e.preventDefault();
        }
    });
    cui.addEventListener('mouseup', (e) => {
        if (isPanning) {
            isPanning = false;
            e.preventDefault();
        }
    });
};

const addSharedListeners = () => {
    cui.addEventListener('mousemove', (e) => {
        updateCursor([e.offsetX / window.zoomLevel, e.offsetY / window.zoomLevel]);
        if (isPanning) {
            //For panning
            window.pan = [e.offsetX - panStart[0], e.offsetY - panStart[1]];
        } else {
            // console.log(window.cursor);
            // For hovering
            let selectedShape = null;
            shapes.forEach(shape => {
                if (shape.intersectedBy(window.gameCursor)) {
                    selectedShape = shape;
                }
                shape.mouseOut(e);
            });
            if (selectedShape) {
                selectedShape.hover(e);
            }
        }
    });
};

const addGenericShapeListeners = (shape) => {
    cui.addEventListener('click', (e) => {
        updateCursor([e.offsetX / window.zoomLevel, e.offsetY / window.zoomLevel]);
        // console.log(window.cursor);
        if (e.which == 2 || e.shiftKey || isPanning) {
            e.preventDefault();
        } else {
            let selectedShape = null;
            shapes.forEach(shape => {
                if (shape.intersectedBy(window.gameCursor)) {
                    selectedShape = shape;
                }
                shape.unClick(e);
            });
            if (selectedShape) {
                selectedShape.click(e);
            } else {
                window.tooltip.close();
            }
        }
    });
    cui.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateCursor([e.offsetX / window.zoomLevel, e.offsetY / window.zoomLevel]);
        // console.log(window.cursor);
        let selectedShape = null;
        shapes.forEach(shape => {
            if (shape.intersectedBy(window.gameCursor)) {
                selectedShape = shape;
            }
            shape.rightUnClick(e);
        });
        if (selectedShape) {
            selectedShape.rightClick(e);
        }
    });
};

const setupGame = () => {
    updateCursor([0, 0]);
    makeRegions();
    makePlayers();
    addMovementListeners();
    addSharedListeners();
    addGenericShapeListeners();
};

const updateGame = (now) => {
    ctx.save();
    ctx.clearRect(0, 0, cg.width, cg.height);
    ctx.translate(window.pan[0], window.pan[1]);
    ctx.scale(window.zoomLevel, window.zoomLevel);
    drawMap(now);
    // uictx.fillStyle = "#000";
    // uictx.fillRect(...window.gameCursor.map(c=>c*window.zoomLevel), 2, 2);
    ctx.restore();
};

const updateUi = () => {
    uictx.save();
    uictx.clearRect(0, 0, cg.width, cg.height);
    // uictx.fillStyle = "#000";
    // uictx.fillRect(...window.cursor.map(c => c * window.zoomLevel), 2, 2);
    resourcesBar.draw(uictx);
    uictx.restore();
};
const onTick = () => {
    if (window.player) {
        const originalMonth = resourcesBar.currentDate.getMonth();
        resourcesBar.nextDay();
        if (originalMonth !== resourcesBar.currentDate.getMonth()) {
            window.player.onMonth();
        }
        window.player.onTick();
        window.tooltip.update();
    }
};

setupGame();

let last = 0;
window.main = function (now) {
    if (now - last >= 2000) {
        onTick();
        last = now;
    }
    updateGame(now);
    updateUi();
    window.requestAnimationFrame(main);
};

main();