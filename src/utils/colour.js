const { int } = require('./random');

const adjust = (colour, amount) => {
    if(!colour){
        return "#00000000";
    }
    return '#' + colour.replace(/^#/, '').replace(/../g, colour => ('0' + Math.min(255, Math.max(0, parseInt(colour, 16) + amount)).toString(16)).substr(-2));
};

const hsvToRgb = (h, s, v) => {
    let r, g, b;

    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [r * 255, g * 255, b * 255];
};

const newColour = (h, s, v) => {
    return "#" + hsvToRgb(h !== null ? h : int(0, 360) / 360, s || 0.5, v || 1).map(c => Math.floor(c).toString(16).padStart(2, "0")).join("");
};

module.exports = {
    adjust,
    newColour
};