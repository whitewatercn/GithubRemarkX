
var GithubRemark = function (initParams) {
	var _started = false,
		_watchUrls = ['github.com'];

	Object.defineProperties(this, {
		'isStart': { set: function (value) { _started = value; _valueUpdateTime = Date.now(); }, get: function () { return _started; } }
	});

	var _insertFunc = function (tabId, changeInfo, tab) {
		// Do nothing, we use content_scripts in manifest.json now.
	}

	this.start = function () {
		if (_started == true) return;
		chrome.tabs.onUpdated.addListener(_insertFunc);
		chrome.storage.local.set({ recordStatus: "on" });
		_started = true;
	};

	this.stop = function () {
		if (_started == false) return;
		chrome.tabs.onUpdated.removeListener(_insertFunc);
		chrome.storage.local.set({ recordStatus: "off" });
		_started = false;
	};
}

var gr = new GithubRemark();

var _remarksCache = null;

function _getDavUrls(base) {
    if (!base) return { dir: '', file: '' };
    
    base = base.trim().replace(/\/+$/, '');
    
    var dirPath, fileUrl;
    if (base.endsWith('.json') || base.endsWith('.txt')) {
        var lastSlash = base.lastIndexOf('/');
        dirPath = lastSlash !== -1 ? base.substring(0, lastSlash + 1) : base + '/';
        fileUrl = base;
    } else {
        if (!base.toLowerCase().endsWith('githubremarkx')) {
            base += '/githubremarkX';
        }
        dirPath = base + '/';
        var d = new Date();
        var pad = function(n) { return n < 10 ? '0' + n : n; };
        var dateStr = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + '-' + pad(d.getMinutes());
        fileUrl = dirPath + dateStr + '-backup.json';
    }
    
    return {
        dir: dirPath,
        file: fileUrl
    };
}

function _ensureDavFolder(urls, headers) {
    return fetch(urls.dir, { method: 'MKCOL', headers: headers })
        .then(function(res) { return res; })
        .catch(function() { return {}; }); // Ignore error
}

function _getAuthHeaders(user, pass) {
    return {
        'Authorization': 'Basic ' + btoa(user + ':' + pass),
        'Content-Type': 'application/json'
    };
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
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
        chrome.storage.local.get(['webdavUrl', 'webdavUser', 'webdavPass'], function(res) {
            if (!res.webdavUrl || !res.webdavUser) {
                sendResponse({error: "notConfigured"});
                return;
            }
            var urls = _getDavUrls(res.webdavUrl);
            var headers = _getAuthHeaders(res.webdavUser, res.webdavPass);
            fetch(urls.file, {
                method: 'GET',
                headers: headers,
                cache: 'no-store'
            })
            .then(function(r) { return r.status === 404 ? {} : r.json(); })
            .catch(function() { return _remarksCache || {}; })
            .then(function(data) {
                if (data && data.remarks && typeof data.remarks === 'object' && ("webdavUrl" in data)) {
                    data = data.remarks;
                }
                data[message.username] = message.remark;
                return _ensureDavFolder(urls, headers).then(function() {
                    return fetch(urls.file, {
                        method: 'PUT',
                        headers: headers,
                        body: JSON.stringify(data, null, 2)
                    });
                }).then(function(putRes) {
                    if (putRes.ok) {
                        _remarksCache = data;
                        sendResponse({success: true});
                    } else {
                        sendResponse({error: "uploadFailedStatus|" + putRes.status});
                    }
                });
            })
            .catch(function(e) {
                sendResponse({error: e.toString()});
            });
        });
        return true; 
    }
    
    if (message.method === 'getRemark') {
        if (_remarksCache) {
            sendResponse({remark: _remarksCache[message.username]});
            return true;
        }
        chrome.storage.local.get(['webdavUrl', 'webdavUser', 'webdavPass'], function(res) {
            if (!res.webdavUrl || !res.webdavUser) {
                sendResponse({remark: null});
                return;
            }
            var urls = _getDavUrls(res.webdavUrl);
            fetch(urls.file, {
                method: 'GET',
                headers: _getAuthHeaders(res.webdavUser, res.webdavPass),
                cache: 'no-store'
            })
            .then(function(r) { return r.status === 404 ? {} : r.json(); })
            .then(function(data) {
                if (data && data.remarks && typeof data.remarks === 'object' && ("webdavUrl" in data)) {
                    data = data.remarks;
                }
                _remarksCache = data || {};
                sendResponse({remark: _remarksCache[message.username]});
            })
            .catch(function(e) {
                sendResponse({remark: null});
            });
        });
        return true; 
    }

    if (message.method === 'getAllRemarks') {
        chrome.storage.local.get(['webdavUrl', 'webdavUser', 'webdavPass'], function(res) {
            if (!res.webdavUrl || !res.webdavUser) {
                sendResponse({remarks: _remarksCache || {}});
                return;
            }
            var urls = _getDavUrls(res.webdavUrl);
            fetch(urls.file, {
                method: 'GET',
                headers: _getAuthHeaders(res.webdavUser, res.webdavPass),
                cache: 'no-store'
            })
            .then(function(r) { return r.status === 404 ? {} : r.json(); })
            .then(function(data) {
                if (data && data.remarks && typeof data.remarks === 'object' && ("webdavUrl" in data)) {
                    data = data.remarks;
                }
                _remarksCache = data || {};
                sendResponse({remarks: _remarksCache});
            })
            .catch(function(e) {
                sendResponse({remarks: _remarksCache || {}});
            });
        });
        return true;
    }

    if (message.method === 'updateAllRemarks') {
        chrome.storage.local.get(['webdavUrl', 'webdavUser', 'webdavPass'], function(res) {
            if (!res.webdavUrl || !res.webdavUser) {
                sendResponse({success: false, error: 'notConfigured'});
                return;
            }
            var urls = _getDavUrls(res.webdavUrl);
            var headers = _getAuthHeaders(res.webdavUser, res.webdavPass);
            var d = new Date();
            var pad = function(n) { return n < 10 ? '0'+n : n; };
            var ts = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + '-' + pad(d.getMinutes());
            var backupFile = urls.dir + ts + '-backup.json';
            
            _ensureDavFolder(urls, headers).then(function() {
                return fetch(backupFile, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(message.remarks, null, 2)
                });
            })
            .then(function(putRes) {
                if (putRes.ok) {
                    _remarksCache = message.remarks;
                    return fetch(urls.file, {
                        method: 'PUT',
                        headers: headers,
                        body: JSON.stringify(message.remarks, null, 2)
                    }).then(function() {
                        sendResponse({success: true});
                    });
                } else {
                    sendResponse({success: false, error: 'uploadFailedStatus|' + putRes.status});
                }
            })
            .catch(function(e) {
                sendResponse({success: false, error: e.toString()});
            });
        });
        return true;
    }

    if (message.method === 'listWebDavFiles') {
        chrome.storage.local.get(['webdavUrl', 'webdavUser', 'webdavPass'], function(res) {
            var urls = _getDavUrls(res.webdavUrl);
            var headers = _getAuthHeaders(res.webdavUser, res.webdavPass);
            headers['Depth'] = '1';
            fetch(urls.dir, {
                method: 'PROPFIND',
                headers: headers
            })
            .then(function(r) { return r.text(); })
            .then(function(text) {
                var files = [];
                var regex = /<([^:>]+:)?displayname>([^<]+\\.json)<\/\\1displayname>/gi;
                var match;
                while ((match = regex.exec(text)) !== null) {
                    files.push(match[2]);
                }
                if (files.length === 0) {
                    var hrefReg = /<([^:>]+:)?href>([^<]+\\.json)<\/\\1href>/gi;
                    while ((match = hrefReg.exec(text)) !== null) {
                        var parts = match[2].split('/');
                        files.push(decodeURIComponent(parts[parts.length - 1]));
                    }
                }
                files = [...new Set(files)].sort().reverse();
                sendResponse({success: true, files: files});
            })
            .catch(function(err) {
                sendResponse({success: false, error: err.toString()});
            });
        });
        return true;
    }

    if (message.method === 'restoreBackup') {
        chrome.storage.local.get(['webdavUrl', 'webdavUser', 'webdavPass'], function(res) {
            var urls = _getDavUrls(res.webdavUrl);
            var headers = _getAuthHeaders(res.webdavUser, res.webdavPass);
            fetch(urls.dir + message.file, {
                method: 'GET',
                headers: headers,
                cache: 'no-store'
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data && data.remarks && typeof data.remarks === 'object' && ("webdavUrl" in data)) {
                    data = data.remarks;
                }
                _remarksCache = data;
                return fetch(urls.file, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(data, null, 2)
                }).then(function() {
                    sendResponse({success: true, count: Object.keys(data).length});
                });
            })
            .catch(function(e) {
                sendResponse({success: false, error: e.toString()});
            });
        });
        return true;
    }

    if (message.method === 'testWebDav') {
        var headers = {
            'Authorization': 'Basic ' + btoa(message.user + ':' + message.pass),
            'Content-Type': 'application/json'
        };
        fetch(message.url, {
            method: 'GET',
            headers: headers,
            cache: 'no-store'
        })
        .then(function(res) {
            if (res.ok || res.status === 404) {
                sendResponse({success: true});
            } else {
                sendResponse({success: false, error: 'HTTP ' + res.status});
            }
        })
        .catch(function(err) {
            sendResponse({success: false, error: err.toString()});
        });
        return true;
    }
});

gr.start();

