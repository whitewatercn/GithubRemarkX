function updateRemark(userToken, username, remark) {
	webApi.updateRemark(userToken, username, remark, function (success) {
		if (success)
			showRemarks(userToken);
		else
			alert('更新失败！');
	});
}

function getRemark(userToken, username, callback) {
	webApi.getRemark(userToken, username, callback);
}


/**
 * 
 * page functions
 */

 function getGithubLoginUsername() {
	var doc = document.querySelector("meta[name='user-login']");
	if (doc && doc.content) return doc.content;
	doc = document.querySelector("meta[name='octolytics-dimension-user_login']");
	return doc == null ? null : doc.content;
}

function hasLoginFrame() {
	var loginBtn = document.querySelector('a[href^="/login"]');
	return loginBtn != null;
}

function getMasterOfPage(url) {
	var master = /github.com\/([^\/|^\?]+)/.exec(url);
	if (master !== null)
		master = master[1];
	return master;
}

function getCurrentTab() {
	var homepage = /github.com\/$/.exec(location.href);
	if (homepage !== null)
		return 'homepage';
	var tab = /[\?|\&]tab=([^\&]+)/.exec(location.href);
	if (tab !== null)
		tab = tab[1];
    if(/https:\/\/github.com\/orgs\/([\S\s]+)\/people/.exec(location.href))
        tab = 'orgs-people';
    if(/https:\/\/github.com\/orgs\/([\S\s]+)\/members/.exec(location.href))
        tab = 'orgs-members';
	return tab;
}

function insertAfter(newEl, targetEl) {
	var parentEl = targetEl.parentNode;
	if (parentEl.lastChild == targetEl) {
		parentEl.appendChild(newEl);
	} else {
		parentEl.insertBefore(newEl, targetEl.nextSibling);
	}
}

function generateRemarkSpan(className, userToken, username, remark){
    var span = document.createElement('span');
	span.className = className;
	span.textContent = '('+remark+')';
	span.title = '('+remark+')';
    span.addEventListener('dblclick', function (event) {
        console.log(event);
        const newRemark = changeRemarks(userToken, username, remark);
        if(newRemark!==remark){
            span.replaceWith(generateRemarkSpan(
                className,userToken, username,newRemark
            ));
        }
    }, false);
    return span;
}

function clearRemarkOfCurrentNode(div){
    if (!!div.querySelector('span.github-remarks'))
        div.removeChild(div.querySelector('span.github-remarks'));
}

/**
 * 
 * Show remark functions, adapted for each page
 */

function showRemarkInHomepage(userToken) {
	var news = document.querySelector("#dashboard");
	if (!news) news = document.body;
	
	var getUserList = function() {
		return document.querySelectorAll("a[data-hovercard-type='user'], a[data-hovercard-url*='/hovercards?user_id=']");
	};
	var userCount = getUserList().length;
	
	var observer = new MutationObserver(function (mutations, self) {
		var users = getUserList();
		if (userCount != users.length) {
			userCount = users.length;
			users.forEach(function (element) {
				if(element.querySelector('img') || element.childElementCount > 0 && !element.textContent.trim()) return; // skip avatar links
				clearRemarkOfCurrentNode(element.parentNode);
				var username = getMasterOfPage(element.href);
				if (!username) return;
				getRemark(userToken, username, function (remark) {
					var remarkEl = generateRemarkSpan('link-gray pl-1 github-remarks', userToken, username, remark);
					insertAfter(remarkEl, element);
				});
			}, this);
		}
	});
	observer.observe(news, { childList: true, subtree: true });
}

function showRemarkInLeftPannel(userToken) {
	var vcard = document.querySelector('.vcard-names'); //author in home page
	if (!!vcard) {
		if (vcard.childElementCount > 2)
			clearRemarkOfCurrentNode(vcard);
		var username = getMasterOfPage(location.href);
		getRemark(userToken, username, function (remark) {
			vcard.appendChild(generateRemarkSpan('vcard-username d-block github-remarks', userToken, username, remark));
		});
	}
}

function showRemarkInStarsTab(userToken) {
	var stars = document.querySelectorAll('h3 a[data-hovercard-type="repository"]'); //in star page
	if (stars !== null) {
		stars.forEach(function (element) {
			clearRemarkOfCurrentNode(element.parentNode);
			var textContainer = element.textContent.trim();
			var sIdx = textContainer.indexOf('/');
			if (sIdx > -1) {
				var username = textContainer.substring(0, sIdx).trim();
				getRemark(userToken, username, function (remark) {
					insertAfter(generateRemarkSpan('link-gray pl-1 github-remarks', userToken, username, remark), element);
				});
			}
		}, this);
	}
}

function showRemarkInFollowersTab(userToken) {
	var followers = document.querySelectorAll('a[data-hovercard-type="user"]');
	if (!!followers) {
		followers.forEach(function (element) {
			if (element.querySelector('img') || (element.childElementCount > 0 && !element.textContent.trim())) return;
			clearRemarkOfCurrentNode(element.parentNode);
			var username = getMasterOfPage(element.href);
			if(!username) return;
			getRemark(userToken, username, function (remark) {
				insertAfter(generateRemarkSpan('link-gray pl-1 github-remarks', userToken, username, remark), element);
			});
		}, this);
	}
}

function showRemarkInRepoStargazersPage(userToken) {
	var stargazers = document.querySelectorAll('h3 span a, h3 a[data-hovercard-type="user"]');
	if (!!stargazers) {
		stargazers.forEach(function (element) {
			clearRemarkOfCurrentNode(element.parentNode);
			var username = getMasterOfPage(element.href);
			if(!username) return;
			getRemark(userToken, username, function (remark) {
				var remarkEl = generateRemarkSpan('link-gray pl-1 github-remarks', userToken, username, remark)
				insertAfter(remarkEl, element);
			});
		}, this);
	}
}

function showRemarkInRepoDetailPage(userToken) {
	var author = document.querySelector('span.author > a, a.author'); //in a repo page
	if (!!author) {
		var username = getMasterOfPage(location.href);
		if(!username || username === 'login') return;
		getRemark(userToken, username, function (remark) {
			author.textContent = username + '(' + remark + ')';
		});
	}
	var repoDetail = /\/(stargazers|watchers)(\/you_know)?$/.exec(location.href);
	if (repoDetail !== null) {
		showRemarkInRepoStargazersPage(userToken);
	}
}

function showRemarkInOrgPeople(userToken){
	var users = document.querySelectorAll('a[data-hovercard-type="user"]');
	if(!!users){
		users.forEach(function (element) {
			if (element.querySelector('img') || (element.childElementCount > 0 && !element.textContent.trim())) return;
			clearRemarkOfCurrentNode(element.parentNode);
			var username = getMasterOfPage(element.href);
			if(!username) return;
			getRemark(userToken, username, function (remark) {
				insertAfter(generateRemarkSpan('link-gray pl-1 github-remarks', userToken, username, remark), element);
			});
		}, this)
	}
}

function showRemarkInOrgMembers(userToken){
	showRemarkInOrgPeople(userToken);
}

function changeRemarks(userToken, username, oldValue) {
	var newValue = window.prompt("请输入新备注", oldValue);
	if (newValue !== null && newValue !== oldValue) {
		updateRemark(userToken, username, newValue);
        return newValue;
	}
    return oldValue;
}

function showRemarks(userToken) {
	showRemarkInLeftPannel(userToken);
	var tab = getCurrentTab();
	switch (tab) {
		case 'homepage':
			showRemarkInHomepage(userToken);
			break;
		case 'repositories':
			break;
		case 'stars':
			showRemarkInStarsTab(userToken);
			break;
		case 'following':
		case 'followers':
			showRemarkInFollowersTab(userToken);
			break;
        case 'orgs-members':
            showRemarkInOrgMembers(userToken);
            break;
        case 'orgs-people':
            showRemarkInOrgPeople(userToken);
            break;
		default:
			showRemarkInRepoDetailPage(userToken);
			break;
	}
	console.log(tab,'Show remarks')
}


(function () {
	console.log('inject');
	var username = getGithubLoginUsername();
	if (username !== null && username != '') {
		showRemarks(username);
	} else if (hasLoginFrame()) {
		alert('你还未登陆github，请先登录你的github账户！');
	}
}());