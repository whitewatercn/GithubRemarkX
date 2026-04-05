import re

with open("bg.js", "r", encoding="utf-8") as f:
    text = f.read()

# We want to replace all chrome.runtime.onMessage.addListener with ONE combined listener.

lines = text.split('\n')
new_lines = []
for line in lines:
    if "chrome.runtime.onMessage.addListener(" in line:
        pass

