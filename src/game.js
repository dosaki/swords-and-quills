const { loadRegions, loadJoinedRegionPaths } = require("./loader/region-loader");
const Player = require("./entities/player");
const ResourcesBar = require("./entities/ui/resources");
const Tooltip = require("./entities/ui/tooltip");
const { Castle } = require("./entities/game-objects/buildings");
const Region = require('./entities/game-objects/region');
import { Music, Note, Track } from './utils/audio-utils';

const mapShadow = loadJoinedRegionPaths();

cui.width = cg.width = window.innerWidth;
cui.height = cg.height = window.innerHeight;
window.tooltip = new Tooltip();

window.addEventListener("resize", () => {
    cui.width = cg.width = window.innerWidth;
    cui.height = cg.height = window.innerHeight;
});

const ctx = cg.getContext('2d');
const uictx = cui.getContext('2d');

window.zoomLevel = 4;
window.pan = [cg.width / 3, cg.height / 4];
window.cursor = [0, 0];
window.uiCursor = [0, 0];
window.gameCursor = [0, 0];
window.debugGameCursors = [window.gameCursor];
let isPanning = false;
let panStart = [0, 0];

window.players = [];
window.player = null;
let regions = [];
window.shapes = [];
window.uiShapes = [];
window.resourcesBar = new ResourcesBar();
window.resourcesBar.currentSpeed = 0;

let playerName = "Sir Teencen Tury";
let playerNationName = "Javascriptland";
let isPickingNation = true;

// Get player name and stuff
bp.addEventListener('click', () => {
    tt.value && tn.value && (playerName = `${tt.value} ${tn.value}`);
    tc.value && (playerNationName = tc.value);
    m.setAttribute("n", "");
});
// ------------------------------

const updateCursor = ([x, y]) => {
    window.cursor = [x, y];
    window.uiCursor = [x * window.zoomLevel, y * window.zoomLevel];
    window.gameCursor = [x - window.pan[0] / window.zoomLevel, y - window.pan[1] / window.zoomLevel];
};

window.placingAmbassador = null;
window.placingArmy = null;

const makeRegions = () => {
    regions = loadRegions();
    shapes = [...shapes, ...regions];
    regions.forEach(region => {
        region.onClick = () => {
            if (isPickingNation) {
                region.owner.name = playerName;
                window.player = region.owner;
                window.player.isHuman = true;
                window.player.country = playerNationName;
                window.player.conquestPoints = -window.player.score; // To adjust starting with a big nation
                isPickingNation = false;
                bnr.setAttribute("fill", region._colour);
                bnr.setAttribute("stroke", region._strokeColour);
                bnrc.style.top = 0;
                window.resourcesBar.currentSpeed = 1;
                window.resourcesBar.timeButtons[0].isSelected = false;
                window.resourcesBar.timeButtons[1].isSelected = true;
            }

            if (placingAmbassador && region.owner !== placingAmbassador.owner && region.freeAmbassadorSlots > 0) {
                region.addUnit(placingAmbassador);
                placingAmbassador = null;
                bgw.style.background = "#216288";
            } else if (window.placingArmy) {
                window.placingArmy.targetRegion = region;
                window.placingArmy.routeToRegion = window.regionGraph.findShortestPath((window.placingArmy.region || window.player.capital).id, region.id);
                window.placingArmy.routeToRegion.pop();
                window.placingArmy = null;
                window.tooltip.refreshContent();
            }
            window.tooltip.set(region);
            window.tooltip.open();
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
    });
};

let currentWaveValue = 0.8;
let currentWaveDirection = 1;
const drawMap = () => {
    ctx.save();
    // Shores
    if (placingAmbassador) {
        ctx.filter = `blur(${16 * (currentWaveValue)}px) grayscale(0.9) contrast(0.5) brightness(0.5)`;
    } else {
        ctx.filter = `blur(${16 * (currentWaveValue)}px)`;
    }
    ctx.strokeStyle = "#3c789b";
    ctx.lineWidth = 10 * currentWaveValue;
    ctx.stroke(mapShadow);
    if (placingAmbassador) {
        ctx.filter = `blur(${8 * (currentWaveValue)}px) grayscale(0.9) contrast(0.5) brightness(0.5)`;
    } else {
        ctx.filter = `blur(${8 * (currentWaveValue)}px)`;
    }
    ctx.strokeStyle = "#4f94bf";
    ctx.lineWidth = 8 * currentWaveValue;
    ctx.stroke(mapShadow);
    // End Shores
    ctx.restore();

    regions.forEach(region => region.draw(ctx, placingAmbassador));
    currentWaveValue += 0.001 * currentWaveDirection;
    currentWaveDirection = currentWaveValue >= 1 ? -1 : currentWaveValue <= 0.8 ? 1 : currentWaveDirection;
};

const makePlayers = () => {
    const _players = {};
    regions.forEach(region => {
        if (!_players[region.group]) {
            _players[region.group] = new Player(region.group);
            _players[region.group]._gold = 600;
            _players[region.group].capital = region;
            _players[region.group].colour = region._colour;
            _players[region.group].strokeColour = region._strokeColour;
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


let moveLineColour = "#333";
const addSharedListeners = () => {
    cui.addEventListener('mousemove', (e) => {
        updateCursor([e.offsetX / window.zoomLevel, e.offsetY / window.zoomLevel]);
        if (isPanning) {
            //For panning
            window.pan = [e.offsetX - panStart[0], e.offsetY - panStart[1]];
            // see game loop for logic that used to be here - this was to solve a bug with objects being recreated and their events not firing
        }
    });
};

const addGenericShapeListeners = () => {
    cui.addEventListener('click', (e) => {
        updateCursor([e.offsetX / window.zoomLevel, e.offsetY / window.zoomLevel]);
        // console.log(window.cursor);
        if (e.which == 2 || e.shiftKey || isPanning) {
            e.preventDefault();
        } else {
            let selectedShape = null;
            uiShapes.forEach(shape => {
                if (shape.intersectedBy(window.uiCursor, ctx)) {
                    selectedShape = shape;
                }
                shape.unClick(e);
            });
            shapes.forEach(shape => {
                if (shape.intersectedBy(window.gameCursor, ctx) && !selectedShape) {
                    selectedShape = shape;
                }
                shape.unClick(e);
            });
            if (selectedShape) {
                selectedShape.click(e);
            } else if (window.tooltip.isOpen && window.uiCursor[0] > 340) {
                window.tooltip.close();
            }
        }
    });
    cui.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (placingAmbassador || window.placingArmy) {
            placingAmbassador = window.placingArmy = null;
            bgw.style.background = "#216288";
            Note.new("b", 0.01, 1).play(0.5);
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

const drawGame = (now) => {
    ctx.save();
    ctx.clearRect(0, 0, cg.width, cg.height);
    ctx.translate(window.pan[0], window.pan[1]);
    ctx.scale(window.zoomLevel, window.zoomLevel);
    drawMap(now);
    window.players.forEach(p => p.units.forEach(u => u.draw(ctx)));
    // uictx.fillStyle = "#000";
    // uictx.fillRect(...window.gameCursor.map(c=>c*window.zoomLevel), 2, 2);
    ctx.restore();
};

const findD = (A, B, dist) => { // if left = 1 the D is left of the line AB 
    const nx = B[0] - A[0];
    const ny = B[1] - A[1];
    const d = dist / (Math.sqrt(nx * nx + ny * ny) * (A[0] < B[0] ? -1 : 1));
    return [A[0] + nx / 2 - ny * d, A[1] + ny / 2 + nx * d];
};

const distance = (A, B) => {
    const nx = B[0] - A[0];
    const ny = B[1] - A[1];
    return Math.sqrt(nx * nx + ny * ny);
};

let lineAnim = 0;
const drawUi = () => {
    uictx.save();
    uictx.clearRect(0, 0, cg.width, cg.height);
    if (window.placingArmy) {
        const start = uiCursor;
        const end = window.placingArmy.currentCoordinates.map((c, i) => (c * window.zoomLevel + window.pan[i]) - 5);
        const dist = distance(start, end);
        const mid = findD(start, end, dist * 0.1);
        uictx.strokeStyle = "#0008";
        uictx.lineWidth = 8;
        uictx.filter = "blur(4px)";
        uictx.beginPath();
        uictx.moveTo(...start);
        uictx.lineTo(...end);
        uictx.stroke();
        uictx.lineDashOffset = lineAnim;
        uictx.setLineDash([30, 40]);
        uictx.filter = "none";
        uictx.strokeStyle = moveLineColour;
        uictx.beginPath();
        uictx.moveTo(...start);
        uictx.arcTo(...mid, ...end, dist * 0.1);
        uictx.lineTo(...end);
        uictx.stroke();
        uictx.setLineDash([]);
        lineAnim++;
    }
    resourcesBar.draw(uictx);
    window.tooltip.draw(uictx);
    uictx.restore();
};
const onTick = () => {
    if (window.player) {
        // const originalMonth = resourcesBar.currentDate.getMonth();
        resourcesBar.nextWeek();
        window.players.forEach(p => p.onTick());
    }
};

const drawEndScreen = (text) => {
    uictx.clearRect(0, 0, cg.width, cg.height);
    uictx.fillStyle = "#1d1d4d";
    uictx.fillRect(0, 0, cg.width, cg.height);
    uictx.fillStyle = "#fff";

    uictx.font = "30px Arial";
    const { width } = uictx.measureText(`You ${text}!`);
    uictx.fillText(`You ${text}!`, (cg.width / 2) - (width / 2), (cg.height / 2) - 30);

    uictx.font = "20px Arial";
    const { width: width2 } = uictx.measureText("At the height of your power you had:");
    uictx.fillText("At the height of your power you had:", (cg.width / 2) - (width2 / 2), cg.height / 2);
    Object.keys(window.player.maxStats).forEach((stat, i) => {
        const text = `${stat}: ${window.player.maxStats[stat]}`;
        const { width } = uictx.measureText(text);
        uictx.fillText(text, (cg.width / 2) - (width / 2), cg.height / 2 + 30 + (i * 20));
    });
    uictx.font = "16px Arial";
    const { width: width3 } = uictx.measureText("Press F5 to restart");
    uictx.fillText("Press F5 to restart", (cg.width / 2) - (width3 / 2), cg.height / 2 + 30 + (Object.keys(window.player.maxStats).length * 20) + 30);
};

setupGame();

let lastTick = 0;
window.main = function (now) {
    const alivePlayers = players.filter(p => !p.hasLost);
    if (player?.hasLost) {
        drawEndScreen("were defeated");
        return;
    } else if(player) {
        const enemyAlivePlayers = alivePlayers.filter(p => !p.isAlliedWith(player) && p !== player);
        if (alivePlayers.includes(player) && enemyAlivePlayers.length === 0) {
            drawEndScreen("have prevailed");
            return;
        }
    }
    const tickDiff = now - lastTick;
    if (resourcesBar.currentSpeed && tickDiff >= (1500 * resourcesBar.currentSpeed)) {
        onTick();
        players.forEach(p => p.doAi());
        tooltip.refreshContent();
        lastTick = now;
    }
    if (resourcesBar.currentSpeed) {
        players.forEach(p => p.moveUnits(0.1 / resourcesBar.currentSpeed));
    }
    if (!isPanning) {
        let selectedShape = null;
        uiShapes.forEach(shape => {
            if (shape.intersectedBy(window.uiCursor, uictx)) {
                selectedShape = shape;
            } else {
                shape.mouseOut({});
            }
        });
        shapes.forEach(shape => {
            if (shape.intersectedBy(window.gameCursor, ctx) && !selectedShape) {
                selectedShape = shape;
            } else {
                shape.mouseOut({});
            }
        });
        moveLineColour = "#333";
        if (selectedShape) {
            selectedShape.hover({});
            if (window.player && selectedShape instanceof Region) {
                if (selectedShape.owner === window.player) {
                    moveLineColour = "#090";
                } else if (window.player.isAlliedWith(selectedShape.owner)) {
                    moveLineColour = "#03b";
                } else {
                    moveLineColour = "#900";
                }
            }
        }
    }
    tooltip.update();
    drawGame(now);
    drawUi();

    window.requestAnimationFrame(main);
};

main();