import os
import re

for root, _, files in os.walk('src/app'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                for i, line in enumerate(lines):
                    if '<Text' in line and '>' in line:
                        # Extract content between > and <
                        matches = re.findall(r'>([^<]+)<', line)
                        for match in matches:
                            stripped = match.strip()
                            if stripped and not stripped.startswith('{') and re.search(r'[a-zA-Z]', stripped):
                                print(f"{path}:{i+1}: {line.strip()}")
