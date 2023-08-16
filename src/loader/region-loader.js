const regionConfig = require("../config/british-isles-simple.json");
const { adjust } = require("../utils/colour");
const Region = require("../entities/game-objects/region");

const colours = {}

const loadRegions = () => {
    const regions = regionConfig["regions"].map(region => new Region(region));
    regions.forEach(region => {
        const newRegions = (regionConfig.neighbours[region.id] || []).map(id => regions.find(r => r.id === id));
        newRegions.forEach(newRegion => newRegion.neighbours = [...new Set([...newRegion.neighbours, region])]);
        region.neighbours = [...new Set([...region.neighbours, ...newRegions])];
        colours[region.group] = colours[region.group] || adjust(`#${Math.floor(Math.random()*16777215).toString(16).padStart(6, "0")}`, 32);
        region.changeColour(colours[region.group]);
    });
    return regions;
};

module.exports = {
    loadRegions
};