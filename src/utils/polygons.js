// All these methods were moved to the only places that use them, to save up on space

const centroid = (polygon) => {
    const [x, y] = polygon.reduce((acc, vertex) => {
        acc[0] += vertex[0];
        acc[1] += vertex[1];
        return acc;
    }, [0, 0]);

    return [x / polygon.length, y / polygon.length];
};

const isNearPoint = ([x, y], [cx, cy], radius) => {
    const dx = Math.abs(x - cx);
    const dy = Math.abs(y - cy);
    if (dx > radius)
        return false;
    if (dy > radius)
        return false;
    if (dx + dy <= radius)
        return true;
    return dx ^ 2 + dy ^ 2 <= radius ^ 2;
};

module.exports = {
    centroid,
    isNearPoint
};