const { Note } = require('../../utils/audio-utils');
const { Interactible } = require('../drawable');

class GameInteractible extends Interactible {
    constructor(d) {
        super();
        this.d = d;
        this.dPath = new Path2D(this.d);
        measurer.setAttribute('d', this.d);
        this.bBox = measurer.getBBox();
    }

    get vertices() {
        if (!this._vertices) {
            this._vertices = this._verticesByShape();
        }
        return this._vertices;
    }

    click(e) {
        Note.new('f#', 3, 0.2).play(0.4);
        super.click(e);
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = this.strokeColour;
        ctx.fillStyle = this.colour;
        ctx.lineWidth = 1;
        ctx.fill(this.dPath);
        ctx.stroke(this.dPath);
        ctx.restore();
    }

    intersectedBy(cursor, ctx) {
        return ctx.isPointInPath(this.dPath, ...cursor);
    }

    _verticesByShape() {
        let previousVertex = [0, 0];
        return this.d.split(/m/i).slice(1).map(d => {
            let previousInstruction = this.d[0];
            const svgD = d.replace(/z/i, '').trim().split(' ');
            const vertices = [];
            svgD.forEach(element => {
                if (['h', 'v', 'l'].includes(element.toLowerCase())) {
                    previousInstruction = element;
                } else {
                    const [x0, y0] = previousVertex;
                    if (['m', 'l'].includes(previousInstruction)) {
                        const [x, y] = element.split(',').map(Number);
                        vertices.push([x0 + x, y0 + y]);
                    } else if (previousInstruction === 'h') {
                        vertices.push([x0 + Number(element), y0]);
                    } else if (previousInstruction === 'v') {
                        vertices.push([x0, y0 + Number(element)]);
                    } else if (['M', 'L'].includes(previousInstruction)) {
                        const [x, y] = element.split(',').map(Number);
                        vertices.push([x, y]);
                    } else if (previousInstruction === 'H') {
                        vertices.push([Number(element), y0]);
                    } else if (previousInstruction === 'V') {
                        vertices.push([x0, Number(element)]);
                    }
                    previousVertex = vertices[vertices.length - 1];
                }
            });
            return vertices;
        });
    }
}


module.exports = {
    GameInteractible
};