const segmentIntersection = (A, B, C) => {
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
};

const isIntersecting = (A, B, C, D) => {
    return segmentIntersection(A, C, D) != segmentIntersection(B, C, D) && segmentIntersection(A, B, C) != segmentIntersection(A, B, D);
};

const raycast = (cursor, edges) => {
    return !!(edges.map(edge => isIntersecting(cursor, [cursor[0] + 10000, cursor[1]], edge[0], edge[1])).filter(intersecting => intersecting).length % 2);
};

const inside = (point, vs) => {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html

    let x = point[0], y = point[1];

    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];

        const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }

    return inside;
};

module.exports = {
    raycast: inside
};