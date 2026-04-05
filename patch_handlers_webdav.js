const fs = require('fs');
let code = fs.readFileSync('background/handlers.js', 'utf8');

// remove all WebDAV related imports and logic from handlers.js
code = code.replace(/import \{ \n\s*getRemarksCache,\n\s*setRemarksCache,\n\s*getDavUrls,\n\s*ensureDavFolder,\n\s*getAuthHeaders\n\} from '\.\/webdav\.js';/, 
`let _remarksCache = null;
function getRemarksCache() { return _remarksCache; }
function setRemarksCache(val) { _remarksCache = val; }

function getSyncRemarks(callback) {
    chrome.storage.sync.get(null, function(data) {
        let remarks = {};
        for (let k in data) {
            if (k.startsWith('rmk_')) {
                remarks[k.substring(4)] = data[k];
            }
        }
        callback(remarks);
    });
}

function setSyncRemarks(remarks, callback) {
    chrome.storage.sync.get(null, function(oldData) {
        let removeKeys = [];
        for (let k in oldData) {
            if (k.startsWith('rmk_')) {
                removeKeys.push(k);
            }
        }
        chrome.storage.sync.remove(removeKeys, function() {
            let newData = {};
            for (let u in remarks) {
                newData['rmk_' + u] = remarks[u];
            }
            chrome.storage.sync.set(newData, function() {
                if (callback) callback();
            });
        });
    });
}
`);

// remove old getSyncRemarks and setSyncRemarks which was previously injected
code = code.replace(/function getSyncRemarks\(callback\) \{[\s\S]*?\}\n\nfunction setSyncRemarks\(remarks, callback\) \{[\s\S]*?\}\n/, '');

// Clean up updateAllRemarks entirely, along with listWebDavFiles, restoreBackup, testWebDav
code = code.replace(/    if \(message\.method === 'updateAllRemarks'\) \{[\s\S]*?    return false;\n\}/, 
`    if (message.method === 'updateAllRemarks') {
        let uploadRemarks = message.remarks || {};
        setSyncRemarks(uploadRemarks, function() {
            sendResponse({success: true});
        });
        return true;
    }

    return false;
}`);

fs.writeFileSync('background/handlers.js', code);
