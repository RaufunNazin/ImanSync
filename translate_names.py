import json
import urllib.request

try:
    from googletrans import Translator
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "googletrans==4.0.0-rc1"])
    from googletrans import Translator

def translate_to_bn():
    with open('names_en.json', 'r') as f:
        data = json.load(f)

    translator = Translator()
    
    # Translate all english meanings
    meanings = [item['meaning'] for item in data]
    transliterations = [item['english'] for item in data]
    
    # Batch translate 
    print("Translating meanings...")
    bn_meanings = []
    for m in meanings:
        try:
            bn_meanings.append(translator.translate(m, dest='bn').text)
        except:
            bn_meanings.append(m)
            
    print("Translating transliterations...")
    bn_trans = []
    for t in transliterations:
        try:
            bn_trans.append(translator.translate(t, dest='bn').text)
        except:
            bn_trans.append(t)

    for i, item in enumerate(data):
        item['meaning'] = bn_meanings[i]
        item['english'] = bn_trans[i]
        
    with open('names_bn.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Saved names_bn.json")

translate_to_bn()
