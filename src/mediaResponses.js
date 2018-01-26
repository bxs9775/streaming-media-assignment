// require/import file system module
const fs = require('fs');
// require/import path module
const path = require('path');

// Gets the start position and end position for streaming.
// request = the request from the server
// total = the total duration of the file
// returns: a positions object containing the time locations to start and end streaming
const getPositions = (request, total) => {
  let { range } = request.headers;

  // Sets range to 0- if none is specified.
  if (!range) {
    range = 'bytes=0-';
  }

  // Parse range.
  const positions = range.replace(/bytes=/, '').split('-');

  const start = parseInt(positions[0], 10);

  const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

  return {
    start,
    end,
  };
};

// Streams the file and pipes the data to the response.
// file = the path to the file we want to load
// response = an object the server uses to return a response
// positions = the end positions of the time interval we want to stream
// total = the total duration of the file
// fileType = the type of media we expect the file to be
const streamToResponse = (file, response, positions, total, fileType) => {
  const chunksize = (positions.end - positions.start) + 1;

  response.writeHead(206, {
    'Content-Range': `bytes ${positions.start}-${positions.end}/${total}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunksize,
    'Content-Type': fileType,
  });

  const stream = fs.createReadStream(file, positions);

  // Once the stream is open, start piping it to the response.
  stream.on('open', () => {
    stream.pipe(response);
  });

  // If there is an error, add it to the response and end the response.
  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });

  return stream;
};

// Loads audio or video content by streaming data from a file
// request = the request from the server
// response = an object the server uses to return a response
// filePath = the path to the file we want to load
// fileType = the type of media we expect the file to be
const streamFile = (request, response, filePath, fileType) => {
  const file = path.resolve(__dirname, filePath);

  fs.stat(file, (err, stats) => {
    // If there is an error add the error to the response and return.
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    const total = stats.size;

    const positions = getPositions(request, total);

    return streamToResponse(file, response, positions, total, fileType);
  });
};

// Streams the video file 'party.mp4'
// request = the request from the server
// response = an object the server uses to return a response
const getParty = (request, response) => {
  streamFile(request, response, '../client/party.mp4', 'video/mp4');
};

// Streams the audio file 'bling.mp3'
// request = the request from the server
// response = an object the server uses to return a response
const getBling = (request, response) => {
  streamFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

// Streams the vidio file 'bird.mp4'
// request = the request from the server
// response = an object the server uses to return a response
const getBird = (request, response) => {
  streamFile(request, response, '../client/bird.mp4', 'video/mp4');
};

// export modules
module.exports.getParty = getParty;
module.exports.getBling = getBling;
module.exports.getBird = getBird;
