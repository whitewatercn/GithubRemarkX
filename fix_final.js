const fs = require('fs');
let code = fs.readFileSync('ghremark.js', 'utf8');

const targetFunc = "function showRemarkInLeftPannel";
const nextFunc = "function showRemarkInStarsTab";

const startIdx = code.indexOf(targetFunc);
const endIdx = code.indexOf(nextFunc);

const replacement = `function showRemarkInLeftPannel(userToken) {
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
        observer.observe(document.body, { childList: true, subtree: true });
        inject();
}

`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
fs.writeFileSync('ghremark.js', code);
