const { JSDOM } = require('jsdom');
const fs = require('fs');

const convert = (name) => {
    const svg = fs.readFileSync(`./scripts/${name}.svg`, 'utf8');
    const doc = new JSDOM(svg).window.document;
    const regionData = [...doc.querySelectorAll("path")].map(p => {
        const name = p.querySelector("title").innerHTML;
        return {
            "id": p.id,
            "name": name.split(" ")[0],
            "group": (name.split(", ")[1] || name.split(" ")[0]).split(" ")[0],
            "d": p.getAttribute("d")
        };
    });

    fs.writeFileSync(`./scripts/${name}.json`, JSON.stringify(regionData), 'utf8');
};

convert("british-isles");
convert("europe");