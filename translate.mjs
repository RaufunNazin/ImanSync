import { translate } from '@vitalets/google-translate-api';
import fs from 'fs';

const namesEn = JSON.parse(fs.readFileSync('names_en.json', 'utf8'));
const out = [];

async function run() {
  for (const item of namesEn) {
    try {
      const resMeaning = await translate(item.meaning, { to: 'bn' });
      const resEnglish = await translate(item.english, { to: 'bn' });
      out.push({
        ...item,
        meaning: resMeaning.text,
        english: resEnglish.text
      });
      console.log(`Translated ${item.id}`);
    } catch (e) {
      out.push(item);
      console.log(`Failed ${item.id}`);
    }
  }
  fs.writeFileSync('names_bn.json', JSON.stringify(out, null, 2));
}
run();
