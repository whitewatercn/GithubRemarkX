(function () {
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
                        alert("请先填写完整的 WebDAV URL、账号和密码");
                        return;
                }

                var status = document.querySelector('#testStatus');
                status.textContent = '测试中...';
                status.style.color = '#31708f';
                status.style.display = 'inline';

                chrome.runtime.sendMessage({
                        method: 'testWebDav',
                        url: url,
                        user: user,
                        pass: pass
                }, function(response) {
                        if (response.success) {
                                status.textContent = '连接成功！';
                                status.style.color = '#3c763d';
                        } else {
                                status.textContent = '连接失败: ' + (response.error || '未知错误');
                                status.style.color = '#a94442';
                        }
                });
        };


document.querySelector('#exportBtn').onclick = function () {
                var config = {
                        webdavUrl: document.querySelector('#webdavUrl').value,
                        webdavUser: document.querySelector('#webdavUser').value,
                        webdavPass: document.querySelector('#webdavPass').value
                };

                chrome.runtime.sendMessage({ method: 'getAllRemarks' }, function(response) {
                        config.remarks = response.remarks || {};
                        var jsonStr = JSON.stringify(config, null, 2);
                        var blob = new Blob([jsonStr], { type: "application/json" });
                        var url = URL.createObjectURL(blob);
                        var a = document.createElement('a');
                        a.href = url;
                        a.download = "github_remark_config.json";
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
                                        
                                        if (config.remarks && Object.keys(config.remarks).length > 0) {
                                            chrome.runtime.sendMessage({
                                                method: 'updateAllRemarks',
                                                remarks: config.remarks
                                            }, function(res) {
                                                if(res.success) {
                                                    alert('✅ 配置及 ' + Object.keys(config.remarks).length + ' 条备注导入成功！');
                                                } else {
                                                    alert('✅ 配置导入成功，但备注同步失败: ' + res.error);
                                                }
                                            });
                                        } else {
                                            alert('✅ 配置导入成功！(无备注数据)');
                                        }
                                } else {
                                        alert('❌ 导入失败，请检查是否为正确的 JSON 配置文件！');
                                }
                        } catch (err) {
                                alert('❌ 解析失败: ' + err.message);
                        }
                };
                reader.readAsText(file);
                e.target.value = '';
        };

})();

