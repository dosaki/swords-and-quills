const regionConfig = require("../config/british-isles-simple.json");
const { newColour } = require("../utils/colour");
const Region = require("../entities/game-objects/region");
const { centroid } = require('../utils/raycaster');

const colours = {};

const loadRegions = () => {
    const regions = regionConfig["regions"].map(region => new Region(region));
    const numberOfGroups = [...new Set(regionConfig["regions"].map(r => r.group))];
    const increment = 1 / numberOfGroups.length;
    let lastGroup = 0;
    regions.forEach(region => {
        const newRegions = (regionConfig.neighbours[region.id] || []).map(id => regions.find(r => r.id === id));
        newRegions.forEach(newRegion => newRegion.neighbours = [...new Set([...newRegion.neighbours, region])]);
        region.neighbours = [...new Set([...region.neighbours, ...newRegions])];
        region.isCapital = !colours[region.group];
        if(!colours[region.group]){
            colours[region.group] = [newColour(increment*lastGroup), newColour(null, 1, 0.5)];
            lastGroup++;
        }
        region.changeColour(...colours[region.group]);
        const largestShapeIndex = region.vertices.reduce((maxI, el, i, arr) => (el.length > arr[maxI].length) ? i : maxI, 0);
        region.largestShape = region.vertices[largestShapeIndex];
        region.centroid = centroid(region.vertices[largestShapeIndex]);
    });
    return regions;
};

const loadJoinedRegionPaths = () => {
    const path = new Path2D();
    regionConfig["regions"].forEach(r => {
       path.addPath(new Path2D(r.d));
    });
    return path;
};

module.exports = {
    loadRegions,
    loadJoinedRegionPaths
};