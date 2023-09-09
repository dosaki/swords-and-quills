const { Interactible } = require('../drawable');
const { Note } = require('../../utils/audio-utils');

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
    constructor(vertices, x, y, lineWidth, text, colour, onClick) {
        super();
        this._vertices = vertices.map(v => [v[0] + x, v[1] + y]);
        this.lineWidth = lineWidth || 1;
        this.x = this._vertices[0][0];
        this.y = this._vertices[0][1];
        this.compoundText = text ? [[text, 0, 0]] : [];
        this.textSize = 20;
        this.transformationOnDraw = null;
        this._help = [];
        this.disabled = false;
        this.textColour = '#fff';
        this.textOutline = '#000';
        this.forceShowHelp = false;
        this.classWithIcon = null;
        colour && this.changeColour(...colour);
        this.onClick = onClick ? onClick : () => { };
    }

    set text(text) {
        this.compoundText = [[text, 0, 0], ...this.compoundText];
    }

    get help() {
        return this._help;
    }
    set help(text) {
        this._help = Array.isArray(text) ? text : [text];
    }

    click(e) {
        if (this.disabled) {
            return;
        }
        Note.new('c', 2, 0.1).play(1);
        setTimeout(() => {
            Note.new('f#', 3, 0.1).play(0.9);
        }, 100);
        super.click(e);
    }

    hover(e) {
        if (this.disabled) {
            if (this.forceShowHelp) {
                window.tooltip.hoveredInteractible = this;
            }
            return;
        }
        super.hover(e);
        window.tooltip.hoveredInteractible = this;
    }

    mouseOut(e) {
        if (this.disabled) {
            if (this.forceShowHelp) {
                window.tooltip.hoveredInteractible = null;
            }
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
            ctx.strokeStyle = '#ffd700';
            ctx.filter = 'blur(8px)';
            ctx.lineWidth = this.lineWidth * 4;
            ctx.beginPath();
            ctx.moveTo(this.vertices[0][0], this.vertices[1][1]);
            this.vertices.slice(1)
                .forEach(([x, y]) => ctx.lineTo(x, y));
            ctx.closePath();
            ctx.stroke();
            ctx.filter = 'none';
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
        if (this.classWithIcon) {
            ctx.lineWidth = 1;
            ctx.globalAlpha = this.disabled ? 0.5 : 1;
            this.classWithIcon.draw(ctx, this.x + 14, this.y + 7, tooltip.region.owner, 5);
            ctx.globalAlpha = 1;
        } else {
            ctx.font = `${this.textSize}px Arial`;
            ctx.lineWidth = 3;
            ctx.fillStyle = this.textColour;
            ctx.strokeStyle = this.textOutline;
            this.compoundText.forEach(compoundTextProperties => {
                const [text, normalOffset, hoverOffset] = compoundTextProperties;
                const offset = this.isHovering ? hoverOffset : normalOffset;
                const textMetrics = ctx.measureText(text);
                ctx.strokeText(text, (offset + this.x + width * 0.5) - textMetrics.width * 0.5, (this.y + height * 0.5) + this.textSize * 0.4);
                ctx.fillText(text, (offset + this.x + width * 0.5) - textMetrics.width * 0.5, (this.y + height * 0.5) + this.textSize * 0.4);
            });
        }
        ctx.restore();
    }

    drawTooltip(ctx) {
        const { width, height } = this._calculateBBox();
        ctx.fillStyle = '#1d1d4ddd';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        const textMetrics = this.help.map((helpText, i) => {
            ctx.font = !i ? `16px Arial` : `14px Arial`;
            return ctx.measureText(Array.isArray(helpText) ? helpText[0] : helpText);
        });
        const maxWidth = Math.max(...textMetrics.map(tm => tm.width));
        ctx.fillRect(this.x + width, this.y - height / 2, maxWidth + 20, 36 + (20 * (textMetrics.length - 1)));
        ctx.strokeRect(this.x + width, this.y - height / 2, maxWidth + 20, 36 + (20 * (textMetrics.length - 1)));
        ctx.fillStyle = '#fff';
        this.help.forEach((helpText, i) => {
            ctx.font = !i ? `16px Arial` : `14px Arial`;
            if (Array.isArray(helpText)) {
                ctx.fillStyle = helpText[1];
                ctx.fillText(helpText[0], this.x + 10 + width, this.y + 24 - height / 2 + 20 * i);
                ctx.fillStyle = '#fff';
            } else {
                ctx.fillText(helpText, this.x + 10 + width, this.y + 24 - height / 2 + 20 * i);
            }
        });
    }

    intersectedBy(cursor) {
        const { x, y, width, height } = this._calculateBBox();
        const [cx, cy] = cursor;
        return cx >= x && cx <= x + width && cy >= y && cy <= y + height;
    }
}

module.exports = UiInteractible;