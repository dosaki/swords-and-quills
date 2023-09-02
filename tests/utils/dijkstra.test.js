const { expect } = require("chai");
const Graph = require("../../src/utils/dijkstra");
describe("Dijkstra", function () {
    it("should extract the keys from a map", function () {
        const map = {
            "a": { "b": 1, "c": 2 },
            "b": { "a": 1, "c": 3 },
            "c": { "a": 2, "b": 3 }
        };
        expect(new Graph(map).extractKeys(map)).to.deep.equal(["a", "b", "c"]);
    });
});