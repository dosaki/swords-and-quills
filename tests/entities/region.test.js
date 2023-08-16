const { expect } = require("chai");
const Region = require("../../src/entities/region");

const regionData = {
    id: "1",
    name: "A place",
    group: "A bigger place",
    d:"m 69,85 h -2 l 1,4 3,-3 z m 14,2 -12,1 -6,6 6,-2 -1,2 2,3 5,-3 1,-2 4,1 3,-3 z"
}

describe("Region", function () {
    it("should make a region", function () {
        const region = new Region(regionData);
        expect(region).to.be.an.instanceOf(Region);
        expect(region.id).to.equal("1");
        expect(region.name).to.equal("A place");
        expect(region.group).to.equal("A bigger place");
        expect(region.d).to.equal("m 69,85 h -2 l 1,4 3,-3 z m 14,2 -12,1 -6,6 6,-2 -1,2 2,3 5,-3 1,-2 4,1 3,-3 z");
    });

    describe("Region.edges", function () {
        it("should resolve a SVG Path to edges", function () {
            const region = new Region(regionData);
            expect(region.edges).to.deep.equal(
                [
                    [
                        [[69, 85], [67, 85]],
                        [[67, 85], [1, 4]],
                        [[1, 4], [3, -3]]
                    ],
                    [
                        [[14, 2], [-12, 1]],
                        [[-12, 1], [-6, 6]],
                        [[-6, 6], [6, -2]],
                        [[6, -2], [-1, 2]],
                        [[-1, 2], [2, 3]],
                        [[2, 3], [5, -3]],
                        [[5, -3], [1, -2]],
                        [[1, -2], [4, 1]],
                        [[4, 1], [3, -3]]
                    ]
                ]
            );
        });
    });
});