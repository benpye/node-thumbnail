const imagemagick = require('imagemagick-native');
const fs = require('fs-extra');
const tmp = require('tmp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

function getImagemagickThumbnail(srcPath, width, height, cb) {
    tmp.file((err, outPath, fd, cleanCb) => {
        if (err) throw err;

        fs.write(fd, imagemagick.convert({
            srcData: fs.readFileSync(srcPath),
            width: width,
            height: height,
            resizeStyle: 'aspectfill',
            gravity: 'Center',
            format: 'PNG'
        }));

        cb(outPath);
    });
}

function getFFmpegThumbnail(srcPath, width, height, cb) {
    tmp.tmpName((err, outPath) => {
        if(err) throw err;

        // FFmpeg uses ext to determine output format
        outPath = outPath + '.png';

        var command = ffmpeg(srcPath)
            .videoFilters('thumbnail')
            .videoFilters(`scale=${width}x${height}`)
            .frames(1)
            .output(outPath.toString())
            .on('end', () => {cb(outPath);})
            .run();
    });
}

function getThumbnail(srcPath, width, height, cb) {
    switch(path.extname(srcPath))
    {
        case '.jpg':
        case '.jpeg':
        case '.pdf':
        case '.png':
            getImagemagickThumbnail(srcPath, width, height, cb);
            break;
        case '.mp4':
            getFFmpegThumbnail(srcPath, width, height, cb);
            break;
        default:
            throw 'Unsupported file extension';
    }
}

function doTest(ext) {
    getThumbnail(`test.${ext}`, 128, 128, function (fn) {
        fs.copy(fn, `test_out/${ext}_thumb.png`);
    })
}

doTest('jpg');
doTest('pdf');
doTest('png');
doTest('mp4');
