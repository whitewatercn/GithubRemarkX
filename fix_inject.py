import sys

with open("ghremark.js", "r") as f:
    content = f.read()

new_func = """
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
        var windowObserver = new MutationObserver(inject);
        windowObserver.observe(document.body, { childList: true, subtree: true });
        inject();
}

"""

content = content.replace("function generateRemarkSpan", new_func + "function generateRemarkSpan")

content = content.replace("showRemarkInLeftPannel(userToken);", "showRemarkInLeftPannel(userToken);\n\tshowRemarkGlobally(userToken);")

with open("ghremark.js", "w") as f:
    f.write(content)
