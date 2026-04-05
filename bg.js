
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
                sendResponse({error: "未配置WebDAV"});
                return;
            }
            fetch(res.webdavUrl, {
                method: 'GET',
                headers: _getAuthHeaders(res.webdavUser, res.webdavPass),
                cache: 'no-store'
            })
            .then(function(r) { return r.status === 404 ? {} : r.json(); })
            .catch(function() { return _remarksCache || {}; })
            .then(function(data) {
                data[message.username] = message.remark;
                return fetch(res.webdavUrl, {
                    method: 'PUT',
                    headers: _getAuthHeaders(res.webdavUser, res.webdavPass),
                    body: JSON.stringify(data, null, 2)
                }).then(function(putRes) {
                    if (putRes.ok) {
                        _remarksCache = data;
                        sendResponse({success: true});
                    } else {
                        sendResponse({error: "上传失败 " + putRes.status});
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
            fetch(res.webdavUrl, {
                method: 'GET',
                headers: _getAuthHeaders(res.webdavUser, res.webdavPass),
                cache: 'no-store'
            })
            .then(function(r) { return r.status === 404 ? {} : r.json(); })
            .then(function(data) {
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
            fetch(res.webdavUrl, {
                method: 'GET',
                headers: _getAuthHeaders(res.webdavUser, res.webdavPass),
                cache: 'no-store'
            })
            .then(function(r) { return r.status === 404 ? {} : r.json(); })
            .then(function(data) {
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
                sendResponse({success: false, error: '未配置WebDAV'});
                return;
            }
            fetch(res.webdavUrl, {
                method: 'PUT',
                headers: _getAuthHeaders(res.webdavUser, res.webdavPass),
                body: JSON.stringify(message.remarks, null, 2)
            })
            .then(function(putRes) {
                if (putRes.ok) {
                    _remarksCache = message.remarks;
                    sendResponse({success: true});
                } else {
                    sendResponse({success: false, error: '上传失败 ' + putRes.status});
                }
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

