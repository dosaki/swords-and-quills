const { loadRegions } = require("./loader/region-loader");
const Player = require("./entities/player");


const gameCanvas = cg;
const uiCanvas = cui;
uiCanvas.width = gameCanvas.width = window.innerWidth;
uiCanvas.height = gameCanvas.height = window.innerHeight;
const ctx = gameCanvas.getContext('2d');
const uictx = uiCanvas.getContext('2d');

window.addEventListener("resize", () => {
    uiCanvas.width = gameCanvas.width = window.innerWidth;
    uiCanvas.height = gameCanvas.height = window.innerHeight;
});

window.zoomLevel = 1;
window.pan = [0, 0];
window.cursor = [0, 0];
window.gameCursor = [0, 0];
let isPanning = false;

window.players = [];
window.player = null;
let regions = [];
let shapes = [];

let playerName = "Sir Teencen Tury I";
let playerNationName = "Webland";
let isPickingNation = true;

bp.addEventListener('click', () => {
    if (tt.value && tt.value) {
        playerName = `${tt.value} ${tn.value}`;
    }
    if (tn.value) {
        playerNationName = tn.value;
    }
    m.setAttribute("n", "");
});

// ------------------------------

const updateCursor = ([x, y]) => {
    window.cursor = [x, y];
    window.gameCursor = [x - window.pan[0], y - window.pan[1]];
};

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

const drawMap = () => {
    regions.forEach(region => region.draw(ctx));
};

const makePlayers = () => {
    const players = {};
    regions.forEach(region => {
        if (!players[region.group]) {
            players[region.group] = new Player(region.group);
            players[region.group].capital = region;
        }
        region.owner = players[region.group];
        players[region.group].regions.push(region);
    });
    window.players = Object.values(players);
};

const setupGame = () => {
    makeRegions();
    makePlayers();
    uiCanvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        window.zoomLevel = Math.max(1, window.zoomLevel - (e.deltaY / 100));
    });
    uiCanvas.addEventListener('mousemove', (e) => {
        updateCursor([e.offsetX / window.zoomLevel, e.offsetY / window.zoomLevel]);
        if (isPanning) {
            window.pan = [e.offsetX - panStart[0], e.offsetY - panStart[1]];
        } else {
            // console.log(window.cursor);
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
    uiCanvas.addEventListener('mousedown', (e) => {
        if (e.which == 2 || e.shiftKey) {
            updateCursor([e.offsetX / window.zoomLevel, e.offsetX / window.zoomLevel]);
            isPanning = true;
            panStart = [e.offsetX + window.cursor[0], e.offsetY + window.cursor[1]];
            e.preventDefault();
        }
    });
    uiCanvas.addEventListener('mouseup', (e) => {
        if (isPanning) {
            isPanning = false;
            e.preventDefault();
        }
    });
    uiCanvas.addEventListener('click', (e) => {
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
            }
        }
    });
    uiCanvas.addEventListener('contextmenu', (e) => {
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

const updateGame = () => {
    ctx.save();
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    ctx.translate(...window.pan);
    ctx.scale(window.zoomLevel, window.zoomLevel);
    drawMap();
    ctx.restore();
};

const updateUi = () => {
    uictx.save();
    uictx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    // uictx.fillStyle = "#000";
    // uictx.fillRect(...window.cursor.map(c=>c*window.zoomLevel), 1, 1);
    uictx.restore();
};

setupGame();

window.main = function (t) {
    updateGame();
    updateUi();
    window.requestAnimationFrame(main);
};

main();