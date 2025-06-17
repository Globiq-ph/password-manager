const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(outputDir, 'teams-package.zip'));
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
    console.log(`Teams app package created: ${archive.pointer()} total bytes`);
});

archive.on('error', function(err) {
    throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add the manifest.json file
archive.file(path.join(__dirname, '..', 'manifest.json'), { name: 'manifest.json' });

// Add the icon files
archive.file(path.join(__dirname, '..', 'icons', 'color.png'), { name: 'color.png' });
archive.file(path.join(__dirname, '..', 'icons', 'outline.png'), { name: 'outline.png' });

// Finalize the archive
archive.finalize();
