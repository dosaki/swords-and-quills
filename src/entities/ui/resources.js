class ResourcesBar {
    constructor() {
        this.currentDate = new Date("1200-01-01 00:00");
        this.dateString = this.currentDate.toISOString().split('T')[0];
    }

    nextDay() {
        this.currentDate = new Date((24 * 60 * 60 * 1000) + this.currentDate.getTime());
        this.dateString = this.currentDate.toISOString().split('T')[0];
    }

    draw(ctx) {
        // Bar
        ctx.save();
        ctx.lineWidth = 10;

        ctx.strokeStyle = "#0008";
        ctx.filter = "blur(4px)";
        ctx.strokeRect(2, -2, cui.width - 4, 40);
        ctx.filter = "none";
        ctx.lineWidth = 2;
        ctx.fillStyle = "#18243d";
        ctx.strokeStyle = "#ffd700";
        ctx.fillRect(0, 0, cui.width, 40);
        ctx.strokeRect(2, -2, cui.width - 4, 40);


        // Name
        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        const name = !window.player ? 'Select your Nation' : window.player.name !== window.player.country ? `${window.player.name} of ${window.player.country}` : window.player.country;
        ctx.fillText(name, 130, 20);
        ctx.strokeStyle = "#fff";


        // Resources
        if (window.player) {
            ctx.fillStyle = "#fff";
            ctx.font = "16px Arial";
            ctx.fillText(`${window.player.resources.gold}🟡  ${window.player.resources.food}🍖`, window.innerWidth / 2, 20);
            ctx.strokeStyle = "#fff";
        }


        // Date
        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.fillText(this.dateString, cui.width - 310, 20);


        // Score
        ctx.lineWidth = 2;
        ctx.fillStyle = "#18243d";
        ctx.strokeStyle = "#ffd700";
        ctx.fillRect(cui.width - 215, -2, 200, 120);
        ctx.strokeRect(cui.width - 215, -2, 200, 120);

        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.fillText(`Scores:`, cui.width - 210, 20);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cui.width - 210, 22);
        ctx.lineTo(cui.width - 20, 22);
        ctx.stroke();
        ctx.font = "15px Arial";
        const sortedPlayers = window.players?.sort((a, b) => b.allianceScore - a.allianceScore);
        const place = sortedPlayers?.indexOf(window.player);
        const start = Math.max(0, place - 1);
        const surrounding = sortedPlayers?.slice(start, !start ? 4 : start + 3);
        surrounding.forEach((p, i) => {
            const paddedPlace = `${start + 1 + i}`.padStart(`${window.players.length}`.length, " ");
            ctx.fillStyle = p.colour;
            ctx.strokeStyle = p.strokeColour;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cui.width - 200, 18 + 20 * (i + 1), 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#fff";
            ctx.lineWidth = 1;
            ctx.fillText(`${paddedPlace}. ${p.name} (${p.allianceScore})`, cui.width - 190, 23 + 20 * (i + 1));
        });

        ctx.restore();
    }
}

module.exports = ResourcesBar;