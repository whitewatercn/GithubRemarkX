const fs = require('fs');
let code = fs.readFileSync('background/handlers.js', 'utf8');

let newCode = code.replace(/    if \(message\.method === 'restoreBackup'\) \{[\s\S]*?    if \(message\.method === 'testWebDav'\) \{/,
`    if (message.method === 'restoreBackup') {
        chrome.storage.local.get(['webdavUrl', 'webdavUser', 'webdavPass'], function(res) {
            let urls = getDavUrls(res.webdavUrl);
            let headers = getAuthHeaders(res.webdavUser, res.webdavPass);
            fetch(urls.dir + message.file, {
                method: 'GET',
                headers: headers,
                cache: 'no-store'
            })
            .then(r => r.json())
            .then(data => {
                if (data && data.remarks && typeof data.remarks === 'object' && ("webdavUrl" in data)) {
                    data = data.remarks;
                }
                setSyncRemarks(data, function() {
                    sendResponse({success: true, count: Object.keys(data).length});
                });
            })
            .catch(e => {
                sendResponse({success: false, error: e.toString()});
            });
        });
        return true;
    }

    if (message.method === 'testWebDav') {`);

fs.writeFileSync('background/handlers.js', newCode);
