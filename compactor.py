import re

def compact_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Very basic comment removal for Python (#) and JS/TS (//)
    # Be careful with string contents! For simplicity we will just remove empty lines and leading/trailing whitespace where safe, or just empty lines.
    
    lines = content.split('\n')
    compacted = []
    for line in lines:
        stripped = line.strip()
        if not stripped: continue
        if filepath.endswith('.py') and stripped.startswith('#'): continue
        if filepath.endswith('.tsx') and stripped.startswith('//'): continue
        compacted.append(line)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(compacted))

if __name__ == '__main__':
    compact_file('backend/main.py')
    compact_file('src/App.tsx')
    print("Compacted files!")
