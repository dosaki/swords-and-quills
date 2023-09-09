const { adjust } = require("../utils/colour");

class Drawable {
    /**
     * Must implement the methods:
     *  - draw(ctx)
     */

    constructor() {
        this._colour = "#aaaaaa";
        this._strokecolour = "#aaaaaa";

        //cache
        this._vertices = null;
    }

    get vertices() {
        if (!this._vertices) {
            this._vertices = this._verticesByShape();
        }
        return this._vertices;
    }

    get colour() {
        return this._colour;
    }

    get strokeColour() {
        return this._strokeColour;
    }

    _verticesByShape() { }

    changeColour(colour, strokeColour) {
        const fullColour = (colour||"#000").length === 4 ? `#${colour[1]}${colour[1]}${colour[2]}${colour[2]}${colour[3]}${colour[3]}` : colour;
        this._colour = fullColour;
        this._strokeColour = strokeColour || "#000000";
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = this._strokeColour;
        ctx.fillStyle = this.colour;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(...this.vertices[0][0]);
        this.vertices[0].slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}


class Interactible extends Drawable {
    /**
     * Must implement the methods:
     *  - draw(ctx)
     *  - intersects(cursor)
     *  - onHover(event, self)
     *  - onMouseOut(event, self)
     *  - onClick(event, self)
     *  - onUnClick(event, self)
     */

    constructor() {
        super();
        this.onHover = () => { };
        this.onMouseOut = () => { };
        this.onClick = () => { };
        this.onUnClick = () => { };

        this._hoverColour = "#fff";
        this._clickColour = "#000";
        this._strokehoverColour = "#fff";
        this._strokeclickColour = "#000";
        this.isHovering = false;
        this.isClicked = false;

        this.disabled = false;
    }

    get colour() {
        return this.isClicked ? this._clickColour : (this.isHovering ? this._hoverColour : this._colour);
    }

    get strokeColour() {
        return this.isClicked ? this._strokeClickColour : (this.isHovering ? this._strokeHoverColour : this._strokeColour);
    }

    changeColour(colour, strokeColour) {
        const fullColour = (colour||"#000").length === 4 ? `#${colour[1]}${colour[1]}${colour[2]}${colour[2]}${colour[3]}${colour[3]}` : colour;
        this._colour = fullColour;
        this._hoverColour = adjust(fullColour, 50);
        this._clickColour = adjust(fullColour, -50);
        this._strokeColour = strokeColour;
        this._strokeHoverColour = adjust(this._strokeColour, -50);
        this._strokeClickColour = adjust(this._strokeColour, 50);
    }

    hover(e) {
        if (this.disabled) {
            return;
        }
        this.onHover(e, this);
        if ((e || {}).runDefault !== false) {
            this.isHovering = true;
        }
    }

    mouseOut(e) {
        if (this.disabled) {
            return;
        }
        this.onMouseOut(e, this);
        if ((e || {}).runDefault !== false) {
            this.isHovering = false;
        }
    }

    click(e) {
        if (this.disabled) {
            return;
        }
        this.onClick(e, this);
        if ((e || {}).runDefault !== false) {
            this.isClicked = true;
        }
    }

    unClick(e) {
        if (this.disabled) {
            return;
        }
        this.onUnClick(e, this);
        if ((e || {}).runDefault !== false) {
            this.isClicked = false;
        }
    }
}

module.exports = {
    Drawable,
    Interactible
};