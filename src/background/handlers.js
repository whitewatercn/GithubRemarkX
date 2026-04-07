import { gr } from './core.js';

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

    if (message.method === 'updateRemark') {
        let key = 'rmk_' + message.username;
        chrome.storage.sync.set({[key]: message.remark}, function() {
            sendResponse({success: true});
        });
        return true; 
    }
    
    if (message.method === 'getRemark') {
        let key = 'rmk_' + message.username;
        chrome.storage.sync.get([key], function(data) {
            let val = data[key];
            if (val === undefined) {
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
        let uploadRemarks = message.remarks || {};
        setSyncRemarks(uploadRemarks, function() {
            sendResponse({success: true});
        });
        return true;
    }

    return false;
}
