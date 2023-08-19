const raycast = (point, vs) => {
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
function centroid(polygon) {
    const [x, y] = polygon.reduce((acc, vertex) => {
        acc[0] += vertex[0];
        acc[1] += vertex[1];
        return acc;
    }, [0,0]);

    return [x/polygon.length, y/polygon.length];
}

module.exports = {
    raycast,
    centroid
};