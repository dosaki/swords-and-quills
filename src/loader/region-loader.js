const { newColour } = require("../utils/colour");
const Region = require("../entities/game-objects/region");
const { centroid } = require('../utils/polygons');
const Graph = require('../utils/dijkstra');

const regionConfig = {
    "regions": [
        { "id": "242", "name": "Gwynedd", "group": "Gwynedd", "d": "m 69,85 h -2 l 1,4 3,-3 z m 14,2 -12,1 -5,5 5,-1 -1,2 2,3 5,-3 1,-2 4,1 3,-3 z" },
        { "id": "4120", "name": "Kildare", "group": "Kildare", "d": "m 47,73 -5,2 v 4 l -5,-2 -3,2 -1,-1 -2,8 v 4 h 6 l 5,3 -3,7 1,2 1,1 1,-2 1,1 5,-1 -1,-1 2,-2 3,-7 v -2 l -3,-3 2,-4 -3,-6 2,1 v -2 l 3,-1 z" },
        { "id": "4121", "name": "Ulster", "group": "Ulster", "d": "m 39,56 -3,6 -2,-4 -5,2 -3,3 2,1 -5,2 6,2 -1,1 h 3 l 5,2 1,6 5,2 v -4 l 5,-2 6,1 3,-2 -1,-4 3,3 -2,-5 -3,1 2,-2 -2,-2 -3,-4 h -6 l -5,2 2,-3 z" },
        { "id": "248", "name": "Lothian", "group": "Scotland", "d": "m 76,34 -10,4 -5,1 -3,-2 v 3 l 2,1 h -3 l -1,3 -1,9 -1,5 3,-4 3,-9 1,1 -1,3 2,2 2,-3 h 10 l 5,5 h 6 l 1,-3 4,-2 -5,-1 -1,1 -7,-1 6,-3 3,1 1,-2 -4,-2 -3,1 2,-2 z" },
        { "id": "245", "name": "York", "group": "England", "d": "m 94,69 h -2 l -2,4 5,10 h 9 l 3,1 4,-2 v -1 l 3,1 h 2 l -4,-4 2,-3 -3,-1 -7,-6 h -6 z" },
        { "id": "4373", "name": "Cornwall", "group": "England", "d": "m 71,115 -2,4 h -2 v 3 l -4,2 -4,6 h -3 l -1,2 3,-1 2,2 11,-6 3,2 8,-6 -7,-7 z" },
        { "id": "4110", "name": "Sutherland", "group": "Scotland", "d": "m 60,13 2,-5 4,2 1,-2 5,1 7,-1 1,-1 2,4 -11,9 3,1 -4,1 2,1 -2,3 -13,3 v -3 h -4 l 2,-2 -1,-4 2,1 v -2 l 4,-1 -2,-1 1,-1 -1,-3 z" },
        { "id": "253", "name": "Outer Hebrides", "group": "The Isles", "d": "m 49,8 -5,4 v 1 l -2,1 v -1 l -2,2 v 3 l 1,1 -1,1 5,-1 v -1 l 2,1 1,-2 -1,-2 3,-4 z m 0,13 -2,3 -3,1 8,5 v 2 l 3,-3 -5,-2 z m -10,0 -3,2 4,1 z m -2,4 -1,3 3,2 1,-4 z m 10,10 -2,1 v 1 h 3 z m -4,3 h -1 l -2,2 h 4 z m 6,0 1,3 1,1 4,-1 z m -2,13 h 2 v 2 l 5,-8 z" },
        { "id": "251", "name": "Aberdeen", "group": "Scotland", "d": "m 78,22 h 5 9 l 2,-1 2,2 v 2 l -3,4 -1,5 -10,6 -6,-6 5,-3 -8,-7 z" },
        { "id": "252", "name": "Inverness", "group": "Scotland", "d": "m 73,24 8,7 -5,3 -10,4 -5,1 -3,-2 -2,3 -4,-3 h -3 l 4,-1 v -1 l 2,-1 h -3 l 5,-5 13,-3 z" },
        { "id": "249", "name": "Ayrshire", "group": "Scotland", "d": "m 64,48 -2,3 3,2 1,2 -2,2 -4,7 2,1 2,-1 4,3 v -4 l 2,2 6,-1 1,-2 3,1 11,-8 v -2 l 2,-3 -3,-2 -4,2 -1,3 h -6 l -5,-5 z" },
        { "id": "246", "name": "Northumberland", "group": "England", "d": "m 93,50 -2,3 v 2 l -11,8 -4,6 3,2 1,4 10,-2 2,-4 h 2 l 4,-1 h 6 L 98,54 95,53 Z" },
        { "id": "4119", "name": "Sligo", "group": "Ulster", "d": "m 31,69 h -3 l -4,2 1,2 -5,-1 -1,2 -7,-3 -2,3 1,4 h 3 l -2,1 -1,3 -3,2 4,1 v 2 l 3,-1 -1,2 7,-1 7,-3 3,2 2,-8 1,1 3,-2 -1,-6 z" },
        { "id": "4365", "name": "Mann", "group": "England", "d": "m 72,73 -5,5 -4,-3 4,-6 z" },
        { "id": "244", "name": "Lancashire", "group": "England", "d": "m 80,75 h 4 l -2,4 1,3 v 2 l -1,2 1,1 2,3 h 3 l 2,1 3,-3 h 2 l -2,-2 2,-3 -5,-10 z" },
        { "id": "243", "name": "Lincolnshire", "group": "England", "d": "m 111,82 -4,2 -3,-1 h -9 l -2,3 2,2 7,9 v 5 l 6,-1 2,-6 6,-1 -1,-2 3,-3 z" },
        { "id": "375", "name": "Limerick", "group": "Thomond", "d": "m 21,87 -5,3 1,2 -3,3 -3,1 h 11 l -5,1 -5,4 -5,1 5,1 -2,1 -4,4 h 4 l 5,-2 -6,4 5,-1 -2,2 h 4 l 11,-3 1,-2 1,1 v 1 l 3,-2 h 3 l 1,-3 4,-1 -1,-2 3,-7 -5,-3 h -6 v -4 l -3,-2 z" },
        { "id": "4372", "name": "Coventry", "group": "England", "d": "m 90,91 -2,-1 h -3 l -3,3 1,3 -2,1 1,8 3,1 1,4 h 2 l -2,2 5,1 5,-3 2,-6 4,-2 v -5 l -7,-9 h -2 z" },
        { "id": "1860", "name": "Norfolk", "group": "England", "d": "m 118,94 h -2 l -6,1 -2,6 3,4 5,-1 v 2 l -1,2 5,3 h 4 v -3 h 3 l 1,-3 3,-2 2,-9 h -3 l -8,-4 z" },
        { "id": "4366", "name": "Montgomery", "group": "Wales", "d": "m 77,94 -5,3 -6,6 -7,2 2,2 -1,2 h 2 v 2 l 3,-2 h 5 l -1,2 5,-1 2,3 5,1 1,-2 4,-2 -1,-4 -3,-1 -1,-8 2,-1 -1,-3 -4,-1 z" },
        { "id": "237", "name": "Oxford", "group": "England", "d": "m 108,101 -6,1 -4,2 -2,6 -5,3 4,10 9,-2 2,-4 v -4 l 3,-1 2,-7 z" },
        { "id": "236", "name": "London", "group": "England", "d": "m 111,105 -2,7 -3,1 v 4 l -2,4 1,2 2,-1 h 11 l 3,-2 7,-2 2,-2 -11,-3 1,-2 -5,-3 1,-2 v -2 z" },
        { "id": "4130", "name": "Somerset", "group": "England", "d": "m 86,112 -4,5 -7,-1 7,7 3,-1 9,3 1,-2 -4,-10 z" }
    ],
    "neighbours": {
        "4110": ["253", "251", "252"],
        "252": ["253", "248", "251"],
        "251": ["253", "248"],
        "248": ["251", "253", "4121", "249"],
        "249": ["246", "4121", "4365"],

        "4121": ["4119", "4120"],
        "4119": ["4120", "375"],
        "4120": ["375", "4366"],

        "246": ["244", "245", "4365"],
        "245": ["243", "4372"],
        "244": ["245", "242", "4372"],
        "243": ["4372", "237", "1860"],
        "242": ["4372", "4366", "4372"],
        "4372": ["4366", "4130", "237"],
        "4130": ["4366", "237", "4373"],
        "1860": ["237", "236"],
        "236": ["237"]
    }
};

const colours = {};
window.regionGraph = new Graph();
window.regionLookup = {};

const loadRegions = () => {
    const regions = regionConfig["regions"].map(region => new Region(region));
    Object.keys(regionConfig["neighbours"]).forEach(region => {
        regionConfig["neighbours"][region].forEach(neighbour => {
            window.regionGraph.addEdge(region, neighbour);
        });
    });
    const numberOfGroups = [...new Set(regionConfig["regions"].map(r => r.group))];
    const increment = 1 / numberOfGroups.length;
    let lastGroup = 0;
    regions.forEach(region => {
        window.regionLookup[region.id] = region;
        const newRegions = (regionConfig["neighbours"][region.id] || []).map(id => regions.find(r => r.id === id));
        newRegions.forEach(newRegion => newRegion.neighbours = [...new Set([...newRegion.neighbours, region])]);
        region.neighbours = [...new Set([...region.neighbours, ...newRegions])];
        region.isCapital = !colours[region.group];
        if (!colours[region.group]) {
            colours[region.group] = [newColour(increment * lastGroup), newColour(null, 1, 0.5)];
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