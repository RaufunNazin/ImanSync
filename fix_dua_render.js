const fs = require('fs');
const path = require('path');

const fixDuaSettingsRender = (file) => {
  let content = fs.readFileSync(file, 'utf8');

  // match the entire renderSettingsModal function
  // it starts with `const renderSettingsModal = () => (`
  // it ends with `  );`
  const regex = /const renderSettingsModal = \(\) => \([\s\S]*?\n  \);/g;
  
  const newFunc = `const renderSettingsModal = () => (
    <AppModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} title={t('duaSettings.title')}>
      <View style={{ gap: Spacing.four }}>
        <Text style={[{ fontFamily: Fonts.outfit, fontSize: 14, marginBottom: 8, marginTop: 16 }, { color: colors.textSecondary }]}>{t('duaSettings.textSizes')}</Text>
        
        {renderSizeControl(t('duaSettings.arabicFont'), settings.arabicFontSize, v => updateSetting('arabicFontSize', v))}
        {renderSizeControl(t('duaSettings.translationFont'), settings.translationFontSize, v => updateSetting('translationFontSize', v))}
        {renderSizeControl(t('duaSettings.translitFont'), settings.translitFontSize, v => updateSetting('translitFontSize', v))}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[{ fontFamily: Fonts.outfit, fontSize: 14, marginBottom: 8, marginTop: 16 }, { color: colors.textSecondary }]}>{t('duaSettings.translations')}</Text>
        {renderToggle(t('duaSettings.enTrans'), settings.showEnTrans, v => updateSetting('showEnTrans', v))}
        {renderToggle(t('duaSettings.bnTrans'), settings.showBnTrans, v => updateSetting('showBnTrans', v))}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[{ fontFamily: Fonts.outfit, fontSize: 14, marginBottom: 8, marginTop: 16 }, { color: colors.textSecondary }]}>{t('duaSettings.transliterations')}</Text>
        {renderToggle(t('duaSettings.enTranslit'), settings.showEnTranslit, v => updateSetting('showEnTranslit', v))}
      </View>
    </AppModal>
  );`;

  content = content.replace(regex, newFunc);
  fs.writeFileSync(file, content, 'utf8');
}

fixDuaSettingsRender(path.join(__dirname, 'src/app/dua-detail.tsx'));
fixDuaSettingsRender(path.join(__dirname, 'src/app/my-dua-detail/[id].tsx'));

console.log('Fixed renderSettingsModal');
