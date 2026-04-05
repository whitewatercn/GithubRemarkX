function updateRemark(userToken, username, remark) {
	chrome.runtime.sendMessage({
		method: 'updateRemark',
		username: username,
		remark: remark
	}, function(response) {
		if (!response || response.error) {
			alert('WebDAV 同步失败: ' + response.error);
			alert(I18N.getMessage('updateFailed'));
		} else {
			if (response && response.success) {
				showRemarks(userToken);
			} else {
				alert(I18N.getMessage('updateFailed'));
			}
		}
	});
}

function getRemark(userToken, username, callback) {
	chrome.runtime.sendMessage({
		method: 'getRemark',
		username: username
	}, function(response) {
		if (callback) callback((response && response.remark) || 'no remark');
	});
}
