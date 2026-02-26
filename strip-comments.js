const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.ts')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

function stripComments(content) {
    let result = content.replace(/\/\*[\s\S]*?\*\//g, '');
    const lines = result.split(/\r?\n/);
    const processedLines = lines.map(line => {
        if (line.includes('//') && !line.includes('://')) {
            return line.split('//')[0].trimEnd();
        }
        if (line.includes('//')) {
            const commentIdx = line.lastIndexOf('//');
            const urlIdx = line.indexOf('://');
            if (commentIdx > urlIdx + 1) {
                return line.substring(0, commentIdx).trimEnd();
            }
        }
        return line;
    });
    return processedLines.join('\n');
}

const targetDir = process.argv[2];
const files = getAllFiles(targetDir);
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const stripped = stripComments(content);
    fs.writeFileSync(file, stripped, 'utf8');
});
