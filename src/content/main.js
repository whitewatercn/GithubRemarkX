(async function () {
	console.log('inject');
    await I18N.init();
	var username = getGithubLoginUsername();
	if (username !== null && username != '') {
		showRemarks(username);
	} else if (hasLoginFrame()) {
		alert(I18N.getMessage('notLoggedIn'));
	}
}());
