(async function () {
    await I18N.init();

    var btnToggleLang = document.getElementById('toggleLang');
    if (btnToggleLang) {
        btnToggleLang.onclick = function() {
            var newLang = I18N.currentLocale === 'zh_CN' ? 'en' : 'zh_CN';
            I18N.setLocale(newLang);
        }
    }

	chrome.storage.local.get(['webdavUrl', 'webdavUser', 'webdavPass'], function(result) {
		if (result.webdavUrl) document.querySelector('#webdavUrl').value = result.webdavUrl;
		if (result.webdavUser) document.querySelector('#webdavUser').value = result.webdavUser;
		if (result.webdavPass) document.querySelector('#webdavPass').value = result.webdavPass;
	});

	document.querySelector('#save').onclick = function () {
		var url = document.querySelector('#webdavUrl').value;
		var user = document.querySelector('#webdavUser').value;
		var pass = document.querySelector('#webdavPass').value;
		
		chrome.storage.local.set({
			webdavUrl: url,
			webdavUser: user,
			webdavPass: pass
		}, function() {
			var status = document.querySelector('#saveStatus');
			status.style.display = 'inline';
			setTimeout(function() { status.style.display = 'none'; }, 2000);
		});
	};


        document.querySelector('#testConn').onclick = function () {
                var url = document.querySelector('#webdavUrl').value;
                var user = document.querySelector('#webdavUser').value;
                var pass = document.querySelector('#webdavPass').value;

                if (!url || !user || !pass) {
                        alert(I18N.getMessage('fillCompleteInfo'));
                        return;
                }

                var status = document.querySelector('#testStatus');
                status.textContent = I18N.getMessage('testingConn');
                status.style.color = '#31708f';
                status.style.display = 'inline';

                chrome.runtime.sendMessage({
                        method: 'testWebDav',
                        url: url,
                        user: user,
                        pass: pass
                }, function(response) {
                        if (response.success) {
                                status.textContent = I18N.getMessage('connSuccess');
                                status.style.color = '#3c763d';
                        } else {
                                status.textContent = I18N.getMessage('connFailed', [(response.error || I18N.getMessage('unknownError'))]);
                                status.style.color = '#a94442';
                        }
                });
        };


document.querySelector('#exportBtn').onclick = function () {
                chrome.runtime.sendMessage({ method: 'getAllRemarks' }, function(response) {
                        var exportData = response.remarks || {};
                        var jsonStr = JSON.stringify(exportData, null, 2);
                        var blob = new Blob([jsonStr], { type: "application/json" });
                        var url = URL.createObjectURL(blob);
                        var a = document.createElement('a');
                        a.href = url;
                        var d = new Date();
                        var pad = function(n) { return n < 10 ? '0' + n : n; };
                        var dateStr = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + '-' + pad(d.getMinutes());
                        a.download = dateStr + "-backup.json";
                        a.click();
                        URL.revokeObjectURL(url);
                });
        };

        document.querySelector('#importBtn').onclick = function () {
                document.querySelector('#importFile').click();
        };

        document.querySelector('#importFile').onchange = function (e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function (e) {
                        try {
                                var config = JSON.parse(e.target.result);
                                if (config.webdavUrl || config.webdavUser) {
                                        document.querySelector('#webdavUrl').value = config.webdavUrl || '';
                                        document.querySelector('#webdavUser').value = config.webdavUser || '';
                                        document.querySelector('#webdavPass').value = config.webdavPass || '';
                                        document.querySelector('#save').click();
                                }
                                
                                var remarksData = config.remarks ? config.remarks : config;
                                if (remarksData === config) {
                                        delete remarksData.webdavUrl;
                                        delete remarksData.webdavUser;
                                        delete remarksData.webdavPass;
                                }

                                if (Object.keys(remarksData).length > 0) {
                                    chrome.runtime.sendMessage({
                                        method: 'updateAllRemarks',
                                        remarks: remarksData
                                    }, function(res) {
                                        if(res && res.success) {
                                            alert(I18N.getMessage('importAllSuccess', [Object.keys(remarksData).length]));
                                        } else {
                                            alert(I18N.getMessage('importConfigSuccessUploadFailed', [res.error && res.error.startsWith('uploadFailedStatus|') ? I18N.getMessage('uploadFailedStatus', [res.error.split('|')[1]]) : (res.error === 'notConfigured' ? I18N.getMessage('notConfigured') : res.error)]));
                                        }
                                    });
                                } else {
                                    alert(I18N.getMessage('importConfigSuccessNoData'));
                                }
                        } catch (err) {
                                alert(I18N.getMessage('parseFailed', [err.message]));
                        }
                };
                reader.readAsText(file);
                e.target.value = '';
        };

})();
