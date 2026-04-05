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


function showRemarkGlobally(userToken) {
        var inject = function () {
                var users = document.querySelectorAll('a[data-hovercard-type="user"], a.commit-author, a.author');
                users.forEach(function (element) {
                        if (element.querySelector('img') || (element.childElementCount > 0 && !element.textContent.trim())) return;
                        if (element.closest('.github-profile-remark')) return;
                        if (element.nextElementSibling && element.nextElementSibling.classList.contains('github-remarks')) return;
                        if (element.dataset.remarkChecked) return;
                        element.dataset.remarkChecked = 'true';

                        var username = getMasterOfPage(element.href);
                        if (!username || username === 'login') return;

                        getRemark(userToken, username, function (remark) {
                                if (!remark || remark === 'no remark') return;
                                if (element.nextElementSibling && element.nextElementSibling.classList.contains('github-remarks')) return;
                                
                                var remarkEl = document.createElement('span');
                                remarkEl.className = 'github-remarks-global github-remarks';
                                remarkEl.style.color = 'red';
                                remarkEl.style.marginLeft = '4px';
                                remarkEl.style.fontWeight = 'bold';
                                remarkEl.textContent = '（备注：' + remark + '）';
                                remarkEl.title = '（备注：' + remark + '）';

                                remarkEl.addEventListener('dblclick', function (event) {
                                        event.preventDefault();
                                        var newRemark = changeRemarks(userToken, username, remark);
                                        if (newRemark && newRemark !== remark) {
                                                remarkEl.textContent = '（备注：' + newRemark + '）';
                                                remarkEl.title = '（备注：' + newRemark + '）';
                                                remark = newRemark;
                                        }
                                }, false);

                                insertAfter(remarkEl, element);
                        });
                });
        };
        if(window.globalRemarkObserver) window.globalRemarkObserver.disconnect();
	window.globalRemarkObserver = new MutationObserver(inject);
        window.globalRemarkObserver.observe(document.documentElement, { childList: true, subtree: true });
        inject();
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
        var inject = function () {
                var targetElement = document.querySelector('.vcard-username');
                if (!targetElement) return;

                var username = getMasterOfPage(location.href);
                if (!username) return;

                if (targetElement.dataset.remarkChecked === username) return;
                targetElement.dataset.remarkChecked = username;

                getRemark(userToken, username, function (remark) {
                        var currentUsername = getMasterOfPage(location.href);
                        if (currentUsername !== username) return;

                        var old = document.querySelectorAll('.github-profile-remark-container');
                        old.forEach(function(el) { el.remove(); });

                        var container = document.createElement('span');
                        container.className = 'github-profile-remark-container';
                        container.dataset.username = username;
                        container.style.marginLeft = '8px';
                        container.style.display = 'inline-block';
                        container.style.verticalAlign = 'middle';

                        if (remark && remark !== 'no remark') {
                                var nameRemarkSpan = document.createElement('span');
                                nameRemarkSpan.className = 'github-profile-name-remark';
                                nameRemarkSpan.style.color = '#d73a49';
                                nameRemarkSpan.style.fontSize = '16px';
                                nameRemarkSpan.style.fontWeight = 'bold';
                                nameRemarkSpan.textContent = '（备注：' + remark + '）';
                                nameRemarkSpan.title = '双击修改备注';
                                nameRemarkSpan.style.cursor = 'pointer';

                                nameRemarkSpan.addEventListener('dblclick', function(e) {
                                        e.preventDefault();
                                        var newRemark = changeRemarks(userToken, username, remark);
                                        if (newRemark && newRemark !== remark) {
                                                nameRemarkSpan.textContent = '（备注：' + newRemark + '）';
                                                remark = newRemark;
                                        }
                                });

                                container.appendChild(nameRemarkSpan);
                        } else {
                                var inputBox = document.createElement('input');
                                inputBox.type = 'text';
                                inputBox.className = 'form-control github-profile-remark-box';
                                inputBox.placeholder = '在此添加备注... (Enter保存)';
                                inputBox.style.width = '180px';
                                inputBox.style.padding = '2px 8px';
                                inputBox.style.fontSize = '12px';
                                inputBox.style.lineHeight = '18px';
                                inputBox.style.color = '#24292e';
                                inputBox.style.backgroundColor = '#fafbfc';
                                inputBox.style.border = '1px solid #e1e4e8';
                                inputBox.style.borderRadius = '6px';
                                inputBox.style.outline = 'none';

                                inputBox.addEventListener('change', function(e) {
                                        var newRemark = e.target.value;
                                        if (newRemark && newRemark.trim() !== '') {
                                                updateRemark(userToken, username, newRemark);
                                                
                                                inputBox.remove();
                                                var n = document.createElement('span');
                                                n.className = 'github-profile-name-remark';
                                                n.style.color = '#d73a49';
                                                n.style.fontSize = '16px';
                                                n.style.fontWeight = 'bold';
                                                n.textContent = '（备注：' + newRemark + '）';
                                                n.title = '双击修改备注';
                                                n.style.cursor = 'pointer';
                                                n.addEventListener('dblclick', function(e) {
                                                        e.preventDefault();
                                                        var r = changeRemarks(userToken, username, newRemark);
                                                        if (r && r !== newRemark) {
                                                                n.textContent = '（备注：' + r + '）';
                                                                newRemark = r;
                                                        }
                                                });
                                                container.appendChild(n);
                                        }
                                });
                                container.appendChild(inputBox);
                        }

                        targetElement.appendChild(container);
                });
        };

        var observer = new MutationObserver(inject);
        observer.observe(document.documentElement, { childList: true, subtree: true });
        inject();
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
	showRemarkGlobally(userToken);
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