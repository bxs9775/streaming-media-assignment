// require/import file system module
const fs = require('fs');
// require/import path module
const path = require('path');

const getParty = (request, response) => {
  const file = path.resolve(__dirname, '../client/party.mp4');

  fs.stat(file, (err, stats) => {
    // If there is an error add the error to the response and return.
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    let { range } = request.headers;

    // Sets range to 0- if none is specified.
    if (!range) {
      range = 'bytes=0-';
    }

    // Parse range.
    const positions = range.replace(/bytes=/, '').split('-');

    let start = parseInt(positions[0], 10);

    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

    if (start > end) {
      start = end - 1;
    }

    const chunksize = (end - start) + 1;

    response.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });

    const stream = fs.createReadStream(file, { start, end });

    // Once the stream is open, start piping it to the response.
    stream.on('open', () => {
      stream.pipe(response);
    });

    // If there is an error, add it to the response and end the response.
    stream.on('error', (streamErr) => {
      response.end(streamErr);
    });

    return stream;
  });
};

module.exports.getParty = getParty;
