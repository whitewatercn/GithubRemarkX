import { gr } from './core.js';
import { 
    getRemarksCache, 
    setRemarksCache, 
    getDavUrls, 
    ensureDavFolder, 
    getAuthHeaders 
} from './webdav.js';

export function handleMessage(message, sender, sendResponse) {
    if (message.method === 'start') {
        gr.start();
        sendResponse({ status: gr.isStart });
        return false;
    }
    
    if (message.method === 'stop') {
        gr.stop();
        sendResponse({ status: gr.isStart });
        return false;
    }

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

    if (message.method === 'updateRemark') {
        let key = 'rmk_' + message.username;
        chrome.storage.sync.set({[key]: message.remark}, function() {
            // Also clean up local just to keep it in sync mentally, or rely on sync
            sendResponse({success: true});
        });
        return true; 
    }
    
    if (message.method === 'getRemark') {
        let key = 'rmk_' + message.username;
        chrome.storage.sync.get([key], function(data) {
            let val = data[key];
            if (val === undefined) {
                // fallback to local for migration
                chrome.storage.local.get({remarks: {}}, function(localData) {
                    if (localData.remarks && localData.remarks[message.username]) {
                        sendResponse({remark: localData.remarks[message.username]});
                    } else {
                        sendResponse({remark: null});
                    }
                });
            } else {
                sendResponse({remark: val});
            }
        });
        return true; 
    }

    if (message.method === 'getAllRemarks') {
        getSyncRemarks(function(remarks) {
            chrome.storage.local.get(['remarks', 'migratedToSync'], function(localData) {
                if (localData.remarks && Object.keys(localData.remarks).length > 0 && !localData.migratedToSync) {
                    let toMigrate = localData.remarks;
                    if (Object.keys(remarks).length === 0) {
                        setSyncRemarks(toMigrate, function() {
                            chrome.storage.local.set({migratedToSync: true});
                            sendResponse({remarks: toMigrate});
                        });
                        return;
                    } else {
                        chrome.storage.local.set({migratedToSync: true});
                    }
                }
                sendResponse({remarks: remarks});
            });
        });
        return true;
    }

    if (message.method === 'updateAllRemarks') {
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

    if (message.method === 'listWebDavFiles') {
        chrome.storage.local.get(['webdavUrl', 'webdavUser', 'webdavPass'], function(res) {
            let urls = getDavUrls(res.webdavUrl);
            let headers = getAuthHeaders(res.webdavUser, res.webdavPass);
            headers['Depth'] = '1';
            fetch(urls.dir, {
                method: 'PROPFIND',
                headers: headers
            })
            .then(r => r.text())
            .then(text => {
                let files = [];
                let regex = /<([^:>]+:)?displayname>([^<]+\\.json)<\/\\1displayname>/gi;
                let match;
                while ((match = regex.exec(text)) !== null) {
                    files.push(match[2]);
                }
                if (files.length === 0) {
                    let hrefReg = /<([^:>]+:)?href>([^<]+\\.json)<\/\\1href>/gi;
                    while ((match = hrefReg.exec(text)) !== null) {
                        let parts = match[2].split('/');
                        files.push(decodeURIComponent(parts[parts.length - 1]));
                    }
                }
                files = [...new Set(files)].sort().reverse();
                sendResponse({success: true, files: files});
            })
            .catch(err => {
                sendResponse({success: false, error: err.toString()});
            });
        });
        return true;
    }

    if (message.method === 'restoreBackup') {
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

    if (message.method === 'testWebDav') {
        let headers = {
            'Authorization': 'Basic ' + btoa(message.user + ':' + message.pass),
            'Content-Type': 'application/json'
        };
        fetch(message.url, {
            method: 'GET',
            headers: headers,
            cache: 'no-store'
        })
        .then(res => {
            if (res.ok || res.status === 404) {
                sendResponse({success: true});
            } else {
                sendResponse({success: false, error: 'HTTP ' + res.status});
            }
        })
        .catch(err => {
            sendResponse({success: false, error: err.toString()});
        });
        return true;
    }

    return false;
}
