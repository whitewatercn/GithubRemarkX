const fs = require('fs');
let code = fs.readFileSync('background/handlers.js', 'utf8');

let newCode = code.replace(/    if \(message\.method === 'updateAllRemarks'\) \{[\s\S]*?    if \(message\.method === 'listWebDavFiles'\) \{/,
`    if (message.method === 'updateAllRemarks') {
        chrome.storage.local.get(['webdavUrl', 'webdavUser', 'webdavPass'], function(res) {
            let uploadRemarks = message.remarks || {};
            setSyncRemarks(uploadRemarks, function() {
                if (!res.webdavUrl || !res.webdavUser) {
                    sendResponse({success: false, error: 'notConfigured'});
                    return;
                }
                
                let urls = getDavUrls(res.webdavUrl);
                let headers = getAuthHeaders(res.webdavUser, res.webdavPass);
                let d = new Date();
                let pad = n => n < 10 ? '0'+n : n;
                let ts = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + '-' + pad(d.getMinutes());
                let backupFile = urls.dir + ts + '-backup.json';
                
                ensureDavFolder(urls, headers).then(() => {
                    return fetch(backupFile, {
                        method: 'PUT',
                        headers: headers,
                        body: JSON.stringify(uploadRemarks, null, 2)
                    });
                })
                .then(putRes => {
                    if (putRes.ok) {
                        sendResponse({success: true});
                    } else {
                        sendResponse({success: false, error: 'uploadFailedStatus|' + putRes.status});
                    }
                })
                .catch(e => {
                    sendResponse({success: false, error: e.toString()});
                });
            });
        });
        return true;
    }

    if (message.method === 'listWebDavFiles') {`);

fs.writeFileSync('background/handlers.js', newCode);
