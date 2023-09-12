const UiInteractible = require('./ui-interactible');

class ResourcesBar {
    constructor() {
        this.currentDate = new Date('1200-01-01 00:00');
        this.dateString = this.currentDate.toISOString().split('T')[0];
        this.currentSpeed = 1;
        this.timeButtons = [
            new UiInteractible([[0, 0], [25, 0], [25, 25], [0, 25]], 0, 0, 2, '⏸', ['#1d1d4d', '#ffd700']),
            new UiInteractible([[0, 0], [25, 0], [25, 25], [0, 25]], 30, 0, 2, '⏵', ['#1d1d4d', '#ffd700']),
            new UiInteractible([[0, 0], [25, 0], [25, 25], [0, 25]], 60, 0, 2, '⏭', ['#1d1d4d', '#ffd700'])
        ];
        this.timeButtons[0].isSelected = true;
        this.timeButtons[0].onClick = () => {
            this.timeButtons.forEach(b => b.isSelected = false);
            this.timeButtons[0].isSelected = true;
            this.currentSpeed = 0;
        };
        this.timeButtons[1].onClick = () => {
            this.timeButtons.forEach(b => b.isSelected = false);
            this.timeButtons[1].isSelected = true;
            this.currentSpeed = 1;
        };
        this.timeButtons[2].onClick = () => {
            this.timeButtons.forEach(b => b.isSelected = false);
            this.timeButtons[2].isSelected = true;
            this.currentSpeed = 0.2;
        };
        window.uiShapes = [...this.timeButtons, ...window.uiShapes];
    }

    nextWeek() {
        this.currentDate = new Date((7 * 24 * 60 * 60 * 1000) + this.currentDate.getTime());
        this.dateString = this.currentDate.toISOString().split('T')[0];
    }

    draw(ctx) {
        // Bar
        ctx.save();
        ctx.lineWidth = 10;

        ctx.strokeStyle = '#0008';
        ctx.filter = 'blur(4px)';
        ctx.strokeRect(2, -2, cui.width - 4, 40);
        ctx.filter = 'none';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#18243d';
        ctx.strokeStyle = this.currentSpeed ? '#ffd700' : '#ff0000';
        ctx.fillRect(0, 0, cui.width, 40);
        ctx.strokeRect(2, -2, cui.width - 4, 40);


        // Name
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        const name = !window.player ? 'Select your Nation' : window.player.name !== window.player.country ? `${window.player.name} of ${window.player.country}` : window.player.country;
        ctx.fillText(name, 130, 20);
        ctx.strokeStyle = '#fff';


        // Resources
        if (window.player) {
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.fillText(`${window.player.resources.gold}🟡  ${window.player.resources.food}🍖`, window.innerWidth / 2, 20);
            ctx.strokeStyle = '#fff';
        }


        // Date
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText(this.dateString, cui.width - 410, 20);
        ctx.translate(cui.width - 410, 25);
        const transform = ctx.getTransform();
        this.timeButtons.forEach(b => {
            b.transformationOnDraw = transform;
            b.changeColour(b.isSelected ? '#2d2dfd' : '#1d1d4d', '#ffd700');
            b.draw(ctx);
        });
        ctx.translate(-1 * (cui.width - 410), -25);


        // Score
        ctx.lineWidth = 2;
        ctx.fillStyle = '#18243d';
        ctx.strokeStyle = this.currentSpeed ? '#ffd700' : '#ff0000';
        ctx.fillRect(cui.width - 315, -2, 300, 120);
        ctx.strokeRect(cui.width - 315, -2, 300, 120);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText(`Nation Power:`, cui.width - 310, 20);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cui.width - 310, 22);
        ctx.lineTo(cui.width - 20, 22);
        ctx.stroke();
        ctx.font = '15px Arial';
        const sortedPlayers = window.players?.sort((a, b) => b.allianceScore - a.allianceScore);
        const place = sortedPlayers?.indexOf(window.player);
        const start = Math.max(0, place - 1);
        const surrounding = sortedPlayers?.slice(start, !start ? 4 : start + 3);
        surrounding.forEach((p, i) => {
            const paddedPlace = `${start + 1 + i}`.padStart(`${window.players.length}`.length, ' ');
            ctx.fillStyle = p.colour;
            ctx.strokeStyle = p.strokeColour;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cui.width - 300, 18 + 20 * (i + 1), 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.fillText(`${paddedPlace}. ${p.name} (${p.allianceScore})`, cui.width - 290, 23 + 20 * (i + 1));
        });

        ctx.restore();
    }
}

module.exports = ResourcesBar;