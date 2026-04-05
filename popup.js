function startRecord() {
	chrome.runtime.sendMessage({ method: "start" }, function (response) {
		if (response.status) {
			chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
			chrome.action.setBadgeText({ text: 'on' });
		}
	})
}

function stopRecord() {
	chrome.runtime.sendMessage({ method: "stop" }, function (response) {
		if (!response.status) {
			chrome.action.setBadgeText({ text: '' });
		}
	})

}


//init
(function () {
	document.getElementById('startRecord').onclick = startRecord;
	document.getElementById('stopRecord').onclick = stopRecord;
	document.getElementById('openOptions').onclick = function() {
		if (chrome.runtime.openOptionsPage) {
			chrome.runtime.openOptionsPage();
		} else {
			window.open(chrome.runtime.getURL('options.html'));
		}
	};
})();
