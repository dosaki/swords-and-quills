const { int } = require('./random');

// const colours = [
//     "#f353ff",
//     "#00ff00",
//     "#0000ff",
//     "#ff0000",
//     "#01fffe",
//     "#ffa6fe",
//     "#ffdb66",
//     "#006401",
//     "#010067",
//     "#95003a",
//     "#007db5",
//     "#ff00f6",
//     "#ffeee8",
//     "#774d00",
//     "#90fb92",
//     "#0076ff",
//     "#d5ff00",
//     "#ff937e",
//     "#6a826c",
//     "#ff029d",
//     "#fe8900",
//     "#7a4782",
//     "#7e2dd2",
//     "#85a900",
//     "#ff0056",
//     "#a42400",
//     "#00ae7e",
//     "#683d3b",
//     "#bdc6ff",
//     "#263400",
//     "#bdd393",
//     "#00b917",
//     "#9e008e",
//     "#001544",
//     "#c28c9f",
//     "#ff74a3",
//     "#01d0ff",
//     "#004754",
//     "#e56ffe",
//     "#788231",
//     "#0e4ca1",
//     "#91d0cb",
//     "#be9970",
//     "#968ae8",
//     "#bb8800",
//     "#43002c",
//     "#deff74",
//     "#00ffc6",
//     "#ffe502",
//     "#620e00",
//     "#008f9c",
//     "#98ff52",
//     "#7544b1",
//     "#b500ff",
//     "#00ff78",
//     "#ff6e41",
//     "#005f39",
//     "#6b6882",
//     "#5fad4e",
//     "#a75740",
//     "#a5ffd2",
//     "#ffb167",
//     "#009bff",
//     "#e85ebe",
// ];
// let nextColour = 0;

const adjust = (color, amount) => {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
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

// const newColour = () => {
//     const colour = colours[nextColour];
//     nextColour = (nextColour + 1) % colours.length;
//     return colour;
// };

// const newColour = () => {
//     return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`
// }

module.exports = {
    adjust,
    newColour
};