import re

with open('ghremark.js', 'r') as f:
    content = f.read()

old_func = """\
        var inject = function () {
                var vcard = document.querySelector('.vcard-names');
                if (!vcard) return;
                var username = getMasterOfPage(location.href);
                if (!username) return;

                var existing = vcard.parentNode.querySelector('.github-profile-remark');
                if (existing) {
                        if (existing.dataset.username === username) return;
                        existing.remove(); // URL changed, username changed
                }

                getRemark(userToken, username, function (remark) {
                        var currentUsername = getMasterOfPage(location.href);
                        if (currentUsername !== username) return;

                        var existing2 = vcard.parentNode.querySelector('.github-profile-remark');
                        if (existing2 && existing2.dataset.username === username) return;
                        if (existing2) existing2.remove();\
"""

new_func = """\
        var inject = function () {
                var targetElement = document.querySelector('.js-profile-editable-replace .user-following-container');
                if (!targetElement) targetElement = document.querySelector('.vcard-names');
                if (!targetElement) return;
                
                var parentContainer = targetElement.parentNode;
                var username = getMasterOfPage(location.href);
                if (!username) return;

                var existing = parentContainer.querySelector('.github-profile-remark');
                if (existing) {
                        if (existing.dataset.username === username) return;
                        existing.remove(); // URL changed, username changed
                }

                getRemark(userToken, username, function (remark) {
                        var currentUsername = getMasterOfPage(location.href);
                        if (currentUsername !== username) return;

                        var existing2 = parentContainer.querySelector('.github-profile-remark');
                        if (existing2 && existing2.dataset.username === username) return;
                        if (existing2) existing2.remove();\
"""

content = content.replace(old_func, new_func)
content = content.replace("insertAfter(remarkDiv, vcard);", "insertAfter(remarkDiv, targetElement);")

with open('ghremark.js', 'w') as f:
    f.write(content)
