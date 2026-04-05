import sys

with open("ghremark.js", "r") as f:
    content = f.read()

# Replace the showRemarkInLeftPannel function body
start_str = "function showRemarkInLeftPannel(userToken) {"
end_str = "function showRemarkInStarsTab(userToken) {"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

new_func = """function showRemarkInLeftPannel(userToken) {
        var inject = function () {
                var targetElement = document.querySelector('.js-profile-editable-area');
                if (!targetElement) targetElement = document.querySelector('.js-profile-editable-replace .user-following-container');
                if (!targetElement) targetElement = document.querySelector('.vcard-names');
                if (!targetElement) return;

                var username = getMasterOfPage(location.href);
                if (!username) return;

                // Create a temporary placeholder to prevent multiple API calls while loading
                var existing = document.querySelector('.github-profile-remark-box');
                if (existing) {
                        if (existing.dataset.username === username) return;
                        // URL changed, username changed: clean up previous ones
                        var all_old = document.querySelectorAll('.github-profile-remark-box, .github-profile-name-remark');
                        all_old.forEach(function(e) { e.remove(); });
                }

                // Lock guard
                var box = document.createElement('div');
                box.className = 'github-profile-remark-box';
                box.dataset.username = username;
                box.style.display = 'none';
                document.body.appendChild(box);

                getRemark(userToken, username, function (remark) {
                        var currentUsername = getMasterOfPage(location.href);
                        if (currentUsername !== username) {
                                box.remove();
                                return;
                        }

                        // Remove placeholders and any existing inputs globally
                        var existings = document.querySelectorAll('.github-profile-remark-box');
                        existings.forEach(function(el) { el.remove(); });

                        var remarkDiv = document.createElement('div');
                        remarkDiv.className = 'github-profile-remark-box';
                        remarkDiv.dataset.username = username;
                        remarkDiv.style.marginTop = '16px';
                        remarkDiv.style.marginBottom = '16px';

                        var inputBox = document.createElement('input');
                        inputBox.type = 'text';
                        inputBox.className = 'form-control width-full';
                        inputBox.placeholder = '在此添加备注... (Enter保存)';
                        inputBox.value = (remark && remark !== 'no remark') ? remark : '';
                        inputBox.style.width = '100%';
                        inputBox.style.padding = '5px 12px';
                        inputBox.style.fontSize = '14px';
                        inputBox.style.lineHeight = '20px';
                        inputBox.style.color = '#24292e';
                        inputBox.style.backgroundColor = '#fafbfc';
                        inputBox.style.border = '1px solid #e1e4e8';
                        inputBox.style.borderRadius = '6px';
                        inputBox.style.outline = 'none';

                        insertAfter(remarkDiv, targetElement);
                        remarkDiv.appendChild(inputBox);

                        // Inject red text next to .p-name
                        var nameElement = document.querySelector('.vcard-names .p-name');
                        if (!nameElement) nameElement = document.querySelector('.vcard-names');
                        if (nameElement) {
                                var oldNameRemark = document.querySelector('.github-profile-name-remark');
                                if (oldNameRemark) oldNameRemark.remove();

                                if (remark && remark !== 'no remark') {
                                        var nameRemarkSpan = document.createElement('span');
                                        nameRemarkSpan.className = 'github-profile-name-remark';
                                        nameRemarkSpan.style.color = 'red';
                                        nameRemarkSpan.style.marginLeft = '8px';
                                        nameRemarkSpan.style.fontSize = '20px';
                                        nameRemarkSpan.style.verticalAlign = 'middle';
                                        nameRemarkSpan.textContent = '（备注：' + remark + '）';
                                        
                                        // Allow double-click edit on the display name as well!
                                        nameRemarkSpan.addEventListener('dblclick', function(e) {
                                                e.preventDefault();
                                                var newRemark = changeRemarks(userToken, username, remark);
                                                if (newRemark && newRemark !== remark) {
                                                        nameRemarkSpan.textContent = '（备注：' + newRemark + '）';
                                                        inputBox.value = newRemark;
                                                        remark = newRemark;
                                                }
                                        });

                                        nameElement.parentNode.insertBefore(nameRemarkSpan, nameElement.nextSibling);
                                }
                        }

                        inputBox.addEventListener('change', function(e) {
                                var newRemark = e.target.value;
                                if (newRemark !== remark) {
                                        updateRemark(userToken, username, newRemark);
                                        remark = newRemark || 'no remark';
                                        var span = document.querySelector('.github-profile-name-remark');
                                        if (span) {
                                                span.textContent = '（备注：' + remark + '）';
                                        } else if (nameElement && remark) {
                                                // Create it if it didn't exist before
                                                var newSpan = document.createElement('span');
                                                newSpan.className = 'github-profile-name-remark';
                                                newSpan.style.color = 'red';
                                                newSpan.style.marginLeft = '8px';
                                                newSpan.style.fontSize = '20px';
                                                newSpan.style.verticalAlign = 'middle';
                                                newSpan.textContent = '（备注：' + remark + '）';
                                                nameElement.parentNode.insertBefore(newSpan, nameElement.nextSibling);
                                        }
                                }
                        });
                });
        };

        var observer = new MutationObserver(inject);
        observer.observe(document.body, { childList: true, subtree: true });
        inject();
}

"""

content = content[:start_idx] + new_func + content[end_idx:]

with open("ghremark.js", "w") as f:
    f.write(content)
