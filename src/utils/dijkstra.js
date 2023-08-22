const sorter = (a, b) => {
    return parseFloat(a) - parseFloat(b);
};


class Graph {
    extractKeys(obj) {
        let keys = [], key;
        for (key in obj) {
            Object.prototype.hasOwnProperty.call(obj, key) && keys.push(key);
        }
        return keys;
    }

    findPaths(map, start, end, infinity) {
        infinity = infinity || Infinity;

        let costs = {},
            open = { '0': [start] },
            predecessors = {},
            keys;

        let addToOpen = function (cost, vertex) {
            let key = "" + cost;
            if (!open[key]) open[key] = [];
            open[key].push(vertex);
        };

        costs[start] = 0;

        while (open) {
            if (!(keys = this.extractKeys(open)).length) break;

            keys.sort(sorter);

            let key = keys[0],
                bucket = open[key],
                node = bucket.shift(),
                currentCost = parseFloat(key),
                adjacentNodes = map[node] || {};

            if (!bucket.length) delete open[key];

            for (let vertex in adjacentNodes) {
                if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
                    let cost = adjacentNodes[vertex],
                        totalCost = cost + currentCost,
                        vertexCost = costs[vertex];

                    if ((vertexCost === undefined) || (vertexCost > totalCost)) {
                        costs[vertex] = totalCost;
                        addToOpen(totalCost, vertex);
                        predecessors[vertex] = node;
                    }
                }
            }
        }

        if (costs[end] === undefined) {
            return null;
        } else {
            return predecessors;
        }

    }

    extractShortest(predecessors, end) {
        let nodes = [],
            u = end;

        while (u !== undefined) {
            nodes.push(u);
            u = predecessors[u];
        }

        nodes.reverse();
        return nodes;
    }

    _findShortestPath(map, nodes) {
        let start = nodes.shift(),
            end,
            predecessors,
            path = [],
            shortest;

        while (nodes.length) {
            end = nodes.shift();
            predecessors = this.findPaths(map, start, end);

            if (predecessors) {
                shortest = this.extractShortest(predecessors, end);
                if (nodes.length) {
                    path.push.apply(path, shortest.slice(0, -1));
                } else {
                    return path.concat(shortest);
                }
            } else {
                return null;
            }

            start = end;
        }
    }

    constructor(map) {
        this.map = map || {};
    }

    findShortestPath(start, end) {
        return this._findShortestPath(this.map, [start, end]).reverse();
    }

    addEdge(vertex1, vertex2) {
        if(!this.map[vertex1]){
            this.map[vertex1] = {};
        }
        if(!this.map[vertex2]){
            this.map[vertex2] = {};
        }
        this.map[vertex1][vertex2] = 1;
        this.map[vertex2][vertex1] = 1;
    }
}

module.exports = Graph;
