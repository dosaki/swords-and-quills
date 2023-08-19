const { JSDOM } = require('jsdom');
const fs = require('fs');

const extractD = (filePath) => {
    const svg = fs.readFileSync(filePath, 'utf8');
    const doc = new JSDOM(svg).window.document;
    const svgPaths = [...doc.querySelectorAll("path")].map(p => p.getAttribute("d"));

    fs.writeFileSync(`${filePath}.json`, JSON.stringify(svgPaths), 'utf8');
};

extractD(process.argv[2])