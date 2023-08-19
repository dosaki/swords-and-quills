const { JSDOM } = require('jsdom');
const fs = require('fs');

const convert = (name) => {
    const templateColour = "#33c95b";
    const svg = fs.readFileSync(`./scripts/${name}.svg`, 'utf8');
    const doc = new JSDOM(svg).window.document;
    const paths = Object.fromEntries([...doc.querySelectorAll("path")].map(p => {
        const style = p.getAttribute("style").split(";");
        const fill = style.find(s => s.includes("fill")).split(":")[1].replace(templateColour, "-").replace("none", null);
        const stroke = style.find(s => s.includes("stroke")).split(":")[1].replace(templateColour, "-").replace("none", null);
        return [p.getAttribute("d"), [fill, stroke]];
    }));

    fs.writeFileSync(`./scripts/${name}.json`, JSON.stringify(paths, null, 2), 'utf8');
};

convert("knight");
convert("ambassador");