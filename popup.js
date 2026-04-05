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

	document.getElementById('openOptions').onclick = function() {
		if (chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		} else {
			window.open(chrome.runtime.getURL('options.html'));
		}
	};

	document.getElementById('uploadWebdav').onclick = function() {
		chrome.runtime.sendMessage({ method: 'getAllRemarks' }, function(response) {
			var remarks = response.remarks || {};
			chrome.runtime.sendMessage({ method: 'updateAllRemarks', remarks: remarks }, function(res) {
				if (res && res.success) {
					alert(I18N.getMessage('uploadSuccess'));
				} else {
					alert(I18N.getMessage('uploadFailed', [res ? (res.error && res.error.startsWith('uploadFailedStatus|') ? I18N.getMessage('uploadFailedStatus', [res.error.split('|')[1]]) : (res.error === 'notConfigured' ? I18N.getMessage('notConfigured') : (res.error ? res.error : I18N.getMessage('unknownError')))) : I18N.getMessage('unknownError')]));
				}
			});
		});
	};

	document.getElementById('downloadWebdav').onclick = function() {
		chrome.runtime.sendMessage({ method: 'listWebDavFiles' }, function(response) {
			if (response && response.success && response.files && response.files.length > 0) {
				document.querySelector('.nav').style.display = 'none';
				var view = document.getElementById('restoreView');
				if (!view) {
					view = document.createElement('div');
					view.id = 'restoreView';
					view.style.padding = '10px';
					view.innerHTML = '<select id="backupSelect" style="width:100%; margin-bottom:10px;"></select><br><button id="btnRestore" class="btn btn-primary btn-sm">' + I18N.getMessage('restoreBackupLabel') + '</button> <button id="btnCancel" class="btn btn-default btn-sm">' + I18N.getMessage('cancelBtn') + '</button>';
					document.body.appendChild(view);
					
					document.getElementById('btnCancel').onclick = function() {
						view.style.display = 'none';
						document.querySelector('.nav').style.display = 'block';
					};
					
					document.getElementById('btnRestore').onclick = function() {
						var file = document.getElementById('backupSelect').value;
						if (!file) return;
						chrome.runtime.sendMessage({ method: 'restoreBackup', file: file }, function(res) {
							if (res && res.success) {
								alert(I18N.getMessage('restoreSuccess', [res.count]));
								view.style.display = 'none';
								document.querySelector('.nav').style.display = 'block';
							} else {
								alert(I18N.getMessage('restoreFailed', [res ? res.error : '']));
							}
						});
					};
				}
				
				var select = document.getElementById('backupSelect');
				select.innerHTML = '';
				response.files.forEach(function(f) {
					var opt = document.createElement('option');
					opt.value = f;
					opt.textContent = f;
					select.appendChild(opt);
				});
				
				view.style.display = 'block';
			} else {
				alert(I18N.getMessage('backupNotFound', [(response && response.error) ? response.error : '']));
			}
		});
	};

	document.getElementById('exportLocal').onclick = function() {
		chrome.runtime.sendMessage({ method: 'getAllRemarks' }, function(response) {
			var remarks = response.remarks || {};
			var blob = new Blob([JSON.stringify(remarks, null, 2)], { type: 'application/json' });
			var url = URL.createObjectURL(blob);
			var a = document.createElement('a');
			a.href = url;
			a.download = 'github_remarks_export.json';
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
				chrome.runtime.sendMessage({ method: 'updateAllRemarks', remarks: data }, function(res) {
					if (res && res.success) {
						alert(I18N.getMessage('importUploadSuccess', [Object.keys(data).length]));
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
