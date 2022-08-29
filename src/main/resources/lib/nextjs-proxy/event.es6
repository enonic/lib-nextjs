const eventLib = require('/lib/xp/event');
const httpClientLib = require('/lib/http-client');
const {getFrontendServerUrl, getFrontendServerToken} = require('./connection-config');

exports.subscribe = function (siteName) {
    log.info('Subscribing to content update events for [' + siteName + ']...');

    const sitePath = `/content/${siteName}`;

    eventLib.listener({
        type: 'node.updated',
        localOnly: false,
        callback: function (event) {
            log.debug('Got event: ' + JSON.stringify(event));

            for (let i = 0; i < event.data.nodes.length; i++) {
                const node = event.data.nodes[i];

                if (node.path.startsWith(sitePath)) {
                    postRevalidateRequest(node.path.replace(sitePath, ''));
                }
            }
        }
    });
}

function postRevalidateRequest(path) {
    if (!path || path.trim().length === 0) {
        path = '/';
    }
    const response = httpClientLib.request({
        method: 'GET',
        url: getFrontendServerUrl() + '/api/revalidate',
        // contentType: 'text/html',
        connectionTimeout: 5000,
        readTimeout: 5000,
        queryParams: {
            path: path,
            token: getFrontendServerToken(),
        },
        followRedirects: false,
    });
    if (response.status !== 200) {
        log.warning(`Revalidate request for path '${path}' status: ${response.status}`);
    }
}
