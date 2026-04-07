//init
document.addEventListener('DOMContentLoaded', async function () {
	await I18N.init();

	var btnToggleLang = document.getElementById('toggleLang');
	if (btnToggleLang) {
		btnToggleLang.onclick = function() {
			var newLang = I18N.currentLocale === 'zh_CN' ? 'en' : 'zh_CN';
			I18N.setLocale(newLang);
		}
	}

	document.getElementById('exportLocal').onclick = function() {
		chrome.runtime.sendMessage({ method: 'getAllRemarks' }, function(response) {
			var exportData = response.remarks || {};
			var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
			var url = URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.href = url;
			var d = new Date();
			var pad = function(n) { return n < 10 ? '0' + n : n; };
			var dateStr = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + '-' + pad(d.getMinutes());
			a.download = dateStr + '-backup.json';
			a.click();
			URL.revokeObjectURL(url);
		});
	};

	var fileInput = document.getElementById('fileInput');
	document.getElementById('importLocal').onclick = function() {
		fileInput.click();
	};

	fileInput.addEventListener('change', function(e) {
		var file = e.target.files[0];
		if (!file) return;

		var reader = new FileReader();
		reader.onload = function(evt) {
			try {
				var data = JSON.parse(evt.target.result);
				var remarksToUpdate = data.remarks ? data.remarks : data;
				if (data.webdavUrl || data.webdavUser) {
					chrome.storage.local.set({
						webdavUrl: data.webdavUrl || '',
						webdavUser: data.webdavUser || '',
						webdavPass: data.webdavPass || ''
					});
				}
				if (remarksToUpdate === data) {
					delete remarksToUpdate.webdavUrl;
					delete remarksToUpdate.webdavUser;
					delete remarksToUpdate.webdavPass;
				}
				chrome.runtime.sendMessage({ method: 'updateAllRemarks', remarks: remarksToUpdate }, function(res) {
					if (res && res.success) {
						alert(I18N.getMessage('importUploadSuccess', [Object.keys(remarksToUpdate).length]));
					} else {
						alert(I18N.getMessage('importSuccessUploadFailed', [res ? (res.error && res.error.startsWith('uploadFailedStatus|') ? I18N.getMessage('uploadFailedStatus', [res.error.split('|')[1]]) : (res.error === 'notConfigured' ? I18N.getMessage('notConfigured') : (res.error ? res.error : I18N.getMessage('unknownError')))) : I18N.getMessage('unknownError')]));
					}
					fileInput.value = '';
				});
			} catch (err) {
				alert(I18N.getMessage('jsonFormatError'));
			}
		};
		reader.readAsText(file);
	});
});
