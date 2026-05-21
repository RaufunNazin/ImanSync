import json
import urllib.request

# We will fetch a bengali quran metadata file to get surah names.
# Alternatively, I can just define the 114 names in Bengali directly.
surah_names_bn = [
    "আল-ফাতিহা", "আল-বাকারাহ", "আলে-ইমরান", "আন-নিসা", "আল-মায়িদাহ", "আল-আনআম", "আল-আরাফ", "আল-আনফাল", "আত-তাওবাহ", "ইউনুস",
    "হুদ", "ইউসুফ", "আর-রাদ", "ইব্রাহীম", "আল-হিজর", "আন-নাহল", "বনী-ইসরাঈল", "আল-কাহফ", "মারইয়াম", "ত্বাহা",
    "আল-আম্বিয়া", "আল-হাজ্জ", "আল-মুমিনুন", "আন-নূর", "আল-ফুরকান", "আশ-শুআরা", "আন-নামল", "আল-কাসাস", "আল-আনকাবুত", "আর-রূম",
    "লুকমান", "আস-সাজদাহ", "আল-আহযাব", "সাবা", "ফাতির", "ইয়াসীন", "আস-সাফফাত", "ছোয়াদ", "আয-যুমার", "আল-মুমিন",
    "হা-মীম আস-সাজদাহ", "আশ-শূরা", "আয-যুখরুফ", "আদ-দুখান", "আল-জাসিয়াহ", "আল-আহক্বাফ", "মুহাম্মদ", "আল-ফাতাহ", "আল-হুজুরাত", "ক্বাফ",
    "আয-যারিয়াত", "আত্ব তূর", "আন-নাজম", "আল-কামার", "আর-রহমান", "আল-ওয়াকিয়াহ", "আল-হাদীদ", "আল-মুজাদিলাহ", "আল-হাশর", "আল-মুমতাহিনাহ",
    "আস-সাফ", "আল-জুমুআহ", "আল-মুনাফিকুন", "আত-তাগাবুন", "আত-তালাক", "আত-তাহরীম", "আল-মুলক", "আল-ক্বলম", "আল-হাক্কাহ", "আল-মাআরিজ",
    "নূহ", "আল-জ্বিন", "আল-মুযযাম্মিল", "আল-মুদ্দাসসির", "আল-ক্বিয়ামাহ", "আদ-দাহর", "আল-মুরসালাত", "আন-নাবা", "আন-নাযিয়াত", "আবাসা",
    "আত-তাকভীর", "আল-ইনফিতার", "আল-মুতাপ্পিফীন", "আল-ইনশিকাক", "আল-বুরূজ", "আত-তারিক", "আল-আলা", "আল-গাশিয়াহ", "আল-ফজর", "আল-বালাদ",
    "আশ-শামস", "আল-লাইল", "আদ-দোহা", "আল-ইনশিরাহ", "আত-তীন", "আল-আলাক", "আল-কদর", "আল-বাইয়্যিনাহ", "আল-যিলযাল", "আল-আদিয়াত",
    "আল-ক্বারিয়াহ", "আত-তাকাসুর", "আল-আসর", "আল-হুমাযাহ", "আল-ফীল", "কুরাইশ", "আল-মাউন", "আল-কাউসার", "আল-কাফিরুন", "আন-নাসর",
    "লাহাব", "আল-ইখলাস", "আল-ফালাক", "আন-নাস"
]

with open('./src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
    en = json.load(f)
with open('./src/i18n/locales/bn.json', 'r', encoding='utf-8') as f:
    bn = json.load(f)

# Update Surah names
en["surahNames"] = {str(i+1): "" for i in range(114)}
bn["surahNames"] = {str(i+1): name for i, name in enumerate(surah_names_bn)}

# Update revelation types
en["quran"] = en.get("quran", {})
bn["quran"] = bn.get("quran", {})

en["quran"]["Meccan"] = "Meccan"
en["quran"]["Medinan"] = "Medinan"
bn["quran"]["Meccan"] = "মাক্কী"
bn["quran"]["Medinan"] = "মাদানী"

# Modernize UI Translations in Bengali
bn["home"]["titleEn"] = "হোম"
bn["quran"]["titleEn"] = "আল-কুরআন"
bn["tracker"]["titleEn"] = "দ্বীন ট্র্যাকার"
bn["dua"]["titleEn"] = "দোয়া ও জিকির"
bn["settings"]["titleEn"] = "সেটিংস"

bn["home"]["quickActions"] = "কুইক অ্যাকশন"
bn["home"]["qibla"] = "কিবলা দিক"
bn["home"]["names"] = "আল্লাহর ৯৯ নাম"
bn["home"]["duas"] = "দোয়া"
bn["home"]["specialTimes"] = "বিশেষ সময়"

bn["tracker"]["checklist"] = "দৈনন্দিন চেকলিস্ট"
bn["tracker"]["progress"] = "আজকের অগ্রগতি"
bn["tracker"]["tasksCompleted"] = "{{total}} টির মধ্যে {{count}} টি কাজ সম্পন্ন"
bn["tracker"]["trackingCons"] = "আপনার ধারাবাহিকতা রেকর্ড করা হচ্ছে"

bn["dua"]["categories"] = "দোয়ার শ্রেণিবিভাগ"
bn["dua"]["morning"] = "সকালের দোয়া"
bn["dua"]["evening"] = "সন্ধ্যার দোয়া"
bn["dua"]["protection"] = "নিরাপত্তার দোয়া"
bn["dua"]["travel"] = "ভ্রমণের দোয়া"
bn["dua"]["zikr"] = "জিকির ও তাসবীহ"
bn["dua"]["tasbeehCounter"] = "তাসবীহ কাউন্টার"
bn["dua"]["tap"] = "গণনা করতে ট্যাপ করুন"
bn["dua"]["completed"] = "আলহামদুলিল্লাহ, সম্পন্ন!"
bn["dua"]["reset"] = "রিসেট করুন"

with open('./src/i18n/locales/en.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, indent=2, ensure_ascii=False)
with open('./src/i18n/locales/bn.json', 'w', encoding='utf-8') as f:
    json.dump(bn, f, indent=2, ensure_ascii=False)

print("Dictionaries updated successfully!")
