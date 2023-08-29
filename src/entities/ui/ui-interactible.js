const { Interactible } = require("../drawable");

const transformPoint = (x, y, transform) => {
    if (!transform || transform.isIdentity) {
        return [x, y];
    }
    const { a, b, c, d, e, f } = transform;

    return [
        Math.round(x * a + y * c + e),
        Math.round(x * b + y * d + f)
    ];
};

class UiInteractible extends Interactible {
    constructor(vertices, x, y, lineWidth) {
        super();
        this._vertices = vertices.map(v => [v[0] + x, v[1] + y]);
        this.lineWidth = lineWidth || 1;
        this.x = this._vertices[0][0];
        this.y = this._vertices[0][1];
        this.compoundText = [];
        this.textSize = 20;
        this.transformationOnDraw = null;
        this.help = "";
        this.disabled = false;
    }

    set text(text) {
        this.compoundText = [[text, 0, 0], ...this.compoundText];
    }

    hover(e) {
        if(this.disabled){
            return;
        }
        super.hover(e);
        window.tooltip.hoveredInteractible = this;
    }

    mouseOut(e) {
        if(this.disabled){
            return;
        }
        super.mouseOut(e);
        window.tooltip.hoveredInteractible = null;
    }

    _calculateBBox() {
        const xs = [];
        const ys = [];
        this.vertices.forEach(p => {
            const [x, y] = transformPoint(...p, this.transformationOnDraw);
            xs.push(x);
            ys.push(y);
        });
        return {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys)
        };
    }

    draw(ctx) {
        ctx.save();
        if (this.isHovering) {
            ctx.strokeStyle = "#ffd700";
            ctx.filter = "blur(8px)";
            ctx.lineWidth = this.lineWidth * 4;
            ctx.beginPath();
            ctx.moveTo(this.vertices[0][0], this.vertices[1][1]);
            this.vertices.slice(1)
                .forEach(([x, y]) => ctx.lineTo(x, y));
            ctx.closePath();
            ctx.stroke();
            ctx.filter = "none";
        }
        ctx.strokeStyle = this.strokeColour;
        ctx.fillStyle = this._colour;
        ctx.lineWidth = this.lineWidth;
        ctx.beginPath();
        ctx.moveTo(this.vertices[0][0], this.vertices[1][1]);
        this.vertices.slice(1)
            .forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const { width, height } = this._calculateBBox();
        ctx.font = `${this.textSize}px Arial`;
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        this.compoundText.forEach(compoundTextProperties => {
            const [text, normalOffset, hoverOffset] = compoundTextProperties;
            const offset = this.isHovering ? hoverOffset : normalOffset;
            const textMetrics = ctx.measureText(text);
            ctx.strokeText(text, (offset + this.x + width * 0.5) - textMetrics.width * 0.5, (this.y + height * 0.5) + this.textSize * 0.4);
            ctx.fillText(text, (offset + this.x + width * 0.5) - textMetrics.width * 0.5, (this.y + height * 0.5) + this.textSize * 0.4);
        });
        ctx.restore();
    }

    drawTooltip(ctx) {
        const { width, height } = this._calculateBBox();
        ctx.fillStyle = "#1d1d4d";
        ctx.strokeStyle = "#ffd700";
        ctx.font = `16px Arial`;
        ctx.lineWidth = 2;
        const textMetrics = ctx.measureText(this.help);
        ctx.fillRect(this.x + width, this.y - height/2, textMetrics.width + 20, 36);
        ctx.strokeRect(this.x + width, this.y - height/2, textMetrics.width + 20, 36);
        ctx.fillStyle = "#fff";
        ctx.fillText(this.help, this.x + 10 + width, this.y + 24 - height/2);
    }

    intersectedBy(cursor) {
        const { x, y, width, height } = this._calculateBBox();
        const [cx, cy] = cursor;
        return cx >= x && cx <= x + width && cy >= y && cy <= y + height;
    }
}

module.exports = UiInteractible;