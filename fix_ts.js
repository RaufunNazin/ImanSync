const fs = require('fs');
const path = require('path');

// 1. Fix quran.tsx
const quranPath = path.join(__dirname, 'src', 'app', '(tabs)', 'quran.tsx');
let quran = fs.readFileSync(quranPath, 'utf8');
// remove CheckCircle2
quran = quran.replace(', CheckCircle2 } from', ' } from');
quran = quran.replace('<CheckCircle2 size={18} color="#FFF" />', '<CheckCircle size={18} color="#FFF" />');
// remove animatedCardStyle and bannerTranslateY not used or fix them
// Actually the issue says animatedCardStyle is declared but never read.
// And audioOffset is used but not declared.
quran = quran.replace('const animatedCardStyle = {\n    transform: [\n      {\n        translateY: scrollY.interpolate({\n          inputRange: [0, 100],\n          outputRange: [0, audioStore.currentSurahId ? -70 : 0],\n          extrapolate: \'clamp\',\n        })\n      }\n    ]\n  };', 'const audioOffset = scrollY.interpolate({ inputRange: [0, 100], outputRange: [0, audioStore.currentSurahId ? -70 : 0], extrapolate: \'clamp\' });');
fs.writeFileSync(quranPath, quran);

// 2. Fix dua-bookmarks.tsx
const duaPath = path.join(__dirname, 'src', 'app', 'dua-bookmarks.tsx');
let dua = fs.readFileSync(duaPath, 'utf8');
dua = dua.replace(', Plus, FolderPlus', ', FolderPlus');
fs.writeFileSync(duaPath, dua);

// 3. Fix trivia.tsx
const triviaPath = path.join(__dirname, 'src', 'app', 'trivia.tsx');
let trivia = fs.readFileSync(triviaPath, 'utf8');
trivia = trivia.replace('import { BlurView } from \'expo-blur\';\n', '');
trivia = trivia.replace(', FadeInDown, FadeOutDown }', ', FadeInDown }');
trivia = trivia.replace('fadeOut autoStart delay={200}', 'fadeOut autoStart');
fs.writeFileSync(triviaPath, trivia);

// 4. Fix downloadStore.ts
const storePath = path.join(__dirname, 'src', 'store', 'downloadStore.ts');
let store = fs.readFileSync(storePath, 'utf8');
store = store.replace('FileSystem.documentDirectory', '(FileSystem as any).documentDirectory');
fs.writeFileSync(storePath, store);

console.log('Fixed TS errors');
