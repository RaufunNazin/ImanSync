const fs = require('fs');

// 1. settings.tsx
let f1 = 'src/app/(tabs)/settings.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
if (!c1.includes('card: {')) {
  c1 = c1.replace(/const styles = StyleSheet\.create\(\{/, "const styles = StyleSheet.create({\n  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },");
  fs.writeFileSync(f1, c1, 'utf8');
}

// 2. juz/[id].tsx
let f2 = 'src/app/juz/[id].tsx';
let c2 = fs.readFileSync(f2, 'utf8');
if (!c2.includes('import AppModal')) {
  c2 = "import AppModal from '@/components/AppModal';\n" + c2;
  fs.writeFileSync(f2, c2, 'utf8');
}

console.log('Done');
