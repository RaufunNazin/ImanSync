const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/(tabs)/settings.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\{ paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' \}Text/g, "{ fontFamily: Fonts.outfit, color: '#FFF', fontSize: 16, fontWeight: '500' }");
content = content.replace(/\[\{ fontFamily: Fonts\.outfit, color: '#FFF', fontSize: 16, fontWeight: '500' \}, \{ color: colors\.textSecondary \}\]/g, "{ fontFamily: Fonts.outfit, fontSize: 16, fontWeight: '500', color: colors.textSecondary }");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed settings.tsx');
