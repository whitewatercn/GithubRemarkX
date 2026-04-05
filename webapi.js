var webApi = {
    updateRemark: function(userToken, username, remark, callback) {
        chrome.runtime.sendMessage({
            method: 'updateRemark',
            username: username,
            remark: remark
        }, function(response) {
            if (!response || response.error) {
                alert('WebDAV 同步失败: ' + response.error);
                if (callback) callback(false);
            } else {
                if (callback) callback(response && response.success);
            }
        });
    },

    getRemark: function(userToken, username, callback) {
        chrome.runtime.sendMessage({
            method: 'getRemark',
            username: username
        }, function(response) {
            if (callback) callback((response && response.remark) || 'no remark');
        });
    }
};
