const fs = require('fs');
const file = '/Users/srizon/Documents/DeenJourney/src/components/add-dua-modal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
content = content.replace(
  "import { Fonts, Spacing } from '@/constants/theme';",
  "import { Fonts, Spacing } from '@/constants/theme';\nimport { useActiveColor } from '@/hooks/useActiveColor';"
);

// 2. Add activeColor
content = content.replace(
  "  const { t, i18n } = useTranslation();",
  "  const { t, i18n } = useTranslation();\n  const activeColor = useActiveColor();"
);

// 3. Update inputs
content = content.replace(/backgroundColor: colors\.card, borderColor: colors\.border/g, "backgroundColor: colors.textSecondary + '08', borderColor: colors.textSecondary + '20'");

// 4. Update Tabs
const oldTabs = `              <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity activeOpacity={1}
                  style={[styles.tabBtn, activeTab === 'en' && { backgroundColor: colors.accent }]}
                  onPress={() => setActiveTab('en')}
                >
                  <Text style={[styles.tabText, { color: activeTab === 'en' ? '#FFF' : colors.textSecondary }]}>{t('quranSettings.enTrans', { defaultValue: 'English' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={1}
                  style={[styles.tabBtn, activeTab === 'bn' && { backgroundColor: colors.accent }]}
                  onPress={() => setActiveTab('bn')}
                >
                  <Text style={[styles.tabText, { color: activeTab === 'bn' ? '#FFF' : colors.textSecondary }]}>{t('quranSettings.bnTrans', { defaultValue: 'Bangla' })}</Text>
                </TouchableOpacity>
              </View>`;

const newTabs = `              <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
                <TouchableOpacity activeOpacity={1}
                  style={[styles.tabBtn, activeTab === 'en' && { borderBottomWidth: 2, borderBottomColor: activeColor }]}
                  onPress={() => setActiveTab('en')}
                >
                  <Text style={[styles.tabText, { color: activeTab === 'en' ? activeColor : colors.textSecondary }]}>{t('quranSettings.enTrans', { defaultValue: 'English' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={1}
                  style={[styles.tabBtn, activeTab === 'bn' && { borderBottomWidth: 2, borderBottomColor: activeColor }]}
                  onPress={() => setActiveTab('bn')}
                >
                  <Text style={[styles.tabText, { color: activeTab === 'bn' ? activeColor : colors.textSecondary }]}>{t('quranSettings.bnTrans', { defaultValue: 'Bangla' })}</Text>
                </TouchableOpacity>
              </View>`;
content = content.replace(oldTabs, newTabs);

// 5. Replace colors.accent with activeColor except where it shouldn't be
// But looking closely, all colors.accent inside the AddDuaModal body should be activeColor.
// Wait, I need to make sure I don't replace inside the file if there's any other context. But there isn't.
// Wait, one of the tabs also had colors.accent, but we replaced the whole block.
content = content.replace(/colors\.accent/g, "activeColor");

// 6. Update tabContainer style
content = content.replace(
  "  tabContainer: {\n    flexDirection: 'row',\n    borderRadius: 8,\n    borderWidth: 1,\n    padding: 4,\n    marginBottom: Spacing.four,\n  },",
  "  tabsContainer: {\n    flexDirection: 'row',\n    marginBottom: Spacing.four,\n    borderBottomWidth: 1,\n  },"
);

// 7. Update tabBtn style
content = content.replace(
  "  tabBtn: {\n    flex: 1,\n    paddingVertical: 10,\n    borderRadius: 6,\n    alignItems: 'center',\n    justifyContent: 'center',\n  },",
  "  tabBtn: {\n    flex: 1,\n    paddingBottom: Spacing.two,\n    alignItems: 'center',\n    justifyContent: 'center',\n  },"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Done');
