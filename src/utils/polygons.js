const centroid = (polygon) => {
    const [x, y] = polygon.reduce((acc, vertex) => {
        acc[0] += vertex[0];
        acc[1] += vertex[1];
        return acc;
    }, [0, 0]);

    return [x / polygon.length, y / polygon.length];
};

module.exports = {
    centroid
};