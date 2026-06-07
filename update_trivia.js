const fs = require('fs');
const path = require('path');

const triviaPath = path.join(__dirname, 'src', 'data', 'trivia.json');
const trivia = JSON.parse(fs.readFileSync(triviaPath, 'utf8'));

const translations = [
  {
    question_bn: "কুরআনে কোন নবীর নাম সবচেয়ে বেশি উল্লেখ করা হয়েছে?",
    options_bn: ["নবী মুহাম্মদ (সা.)", "নবী মুসা (আ.)", "নবী ঈসা (আ.)", "নবী ইব্রাহিম (আ.)"],
    explanation_bn: "নবী মুসা (আ.) এর নাম কুরআনে ১৩৬ বার উল্লেখ করা হয়েছে।"
  },
  {
    question_bn: "কোন সূরাটি বিসমিল্লাহ দিয়ে শুরু হয় না?",
    options_bn: ["সূরা বাকারা", "সূরা তাওবা", "সূরা ফাতিহা", "সূরা ইয়াসিন"],
    explanation_bn: "সূরা তাওবা হলো কুরআনের একমাত্র সূরা যা বিসমিল্লাহ দিয়ে শুরু হয় না।"
  },
  {
    question_bn: "কুরআনের সবচেয়ে দীর্ঘ সূরা কোনটি?",
    options_bn: ["সূরা কাহফ", "সূরা আলে-ইমরান", "সূরা বাকারা", "সূরা নিসা"],
    explanation_bn: "সূরা বাকারা হলো ২৮৬ আয়াত বিশিষ্ট দীর্ঘতম সূরা।"
  },
  {
    question_bn: "নবী মুহাম্মদ (সা.) এর পর সর্বপ্রথম কে ইসলাম গ্রহণ করেন?",
    options_bn: ["আবু বকর (রা.)", "আলী (রা.)", "খাদিজা (রা.)", "জায়েদ ইবনে হারিথা (রা.)"],
    explanation_bn: "তাঁর স্ত্রী খাদিজা (রা.) সর্বপ্রথম ইসলাম গ্রহণ করেছিলেন।"
  },
  {
    question_bn: "সম্পূর্ণ কুরআন নাযিল হতে কত বছর সময় লেগেছিল?",
    options_bn: ["১০ বছর", "২৩ বছর", "৩০ বছর", "৪০ বছর"],
    explanation_bn: "কুরআন নাযিল হতে আনুমানিক ২৩ বছর সময় লেগেছিল।"
  },
  {
    question_bn: "কুরআন প্রথম কোন মাসে অবতীর্ণ হয়?",
    options_bn: ["মুহররম", "রজব", "রমজান", "জিলহজ"],
    explanation_bn: "কদর রাতে রমজান মাসে কুরআন প্রথম অবতীর্ণ হয়।"
  },
  {
    question_bn: "নবীর কাছে ওহী নিয়ে আসতেন কোন ফেরেশতা?",
    options_bn: ["মিকাইল", "ইসরাফিল", "আজরাইল", "জিবরাইল (আ.)"],
    explanation_bn: "জিবরাইল (আ.) ছিলেন ওহী বহনের ফেরেশতা।"
  },
  {
    question_bn: "কোন নবীকে তিমি মাছ গিলে ফেলেছিল?",
    options_bn: ["নবী ইউনুস (আ.)", "নবী নূহ (আ.)", "নবী ইউসুফ (আ.)", "নবী আইয়ুব (আ.)"],
    explanation_bn: "নবী ইউনুস (আ.) কে একটি বিশাল মাছ/তিমি গিলে ফেলেছিল।"
  },
  {
    question_bn: "কুরআনের সবচেয়ে ছোট সূরা কোনটি?",
    options_bn: ["সূরা ইখলাস", "সূরা কাউসার", "সূরা আসর", "সূরা নাস"],
    explanation_bn: "সূরা কাউসার হলো সবচেয়ে ছোট সূরা, এতে মাত্র ৩টি আয়াত রয়েছে।"
  },
  {
    question_bn: "ইসলামী ক্যালেন্ডারের প্রথম মাস কোনটি?",
    options_bn: ["রমজান", "সফর", "মুহররম", "শাওয়াল"],
    explanation_bn: "মুহররম হলো ইসলামী চন্দ্র ক্যালেন্ডারের প্রথম মাস।"
  }
];

trivia.forEach((q, index) => {
  if(translations[index]) {
    q.question_bn = translations[index].question_bn;
    q.options_bn = translations[index].options_bn;
    q.explanation_bn = translations[index].explanation_bn;
  }
});

fs.writeFileSync(triviaPath, JSON.stringify(trivia, null, 2));
console.log('Trivia translated.');
