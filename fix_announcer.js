const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/SystemAnnouncer.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';",
  "import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';\nimport AppModal from './AppModal';"
);

// 1. Update Ready Modal
const oldUpdate = `      {/* Update Ready Modal */}
      <Modal visible={updateReady} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.card, themeStyles.cardShadow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: activeColor + '15' }]}>
              <RefreshCw size={24} color={activeColor} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t('system.updateReadyTitle', 'Update Ready!')}</Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>
              {t('system.updateReadyDesc', 'A new version of the app has been downloaded. Restart the app to apply the new features.')}
            </Text>
            <TouchableOpacity activeOpacity={1} style={[styles.btn, { backgroundColor: activeColor }]} onPress={handleRestart}>
              <Text style={styles.btnText}>{t('system.restartNow', 'Restart Now')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>`;

const newUpdate = `      {/* Update Ready Modal */}
      <AppModal visible={updateReady} onClose={() => {}} hideClose scrollable={false}>
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.iconWrap, { backgroundColor: activeColor + '15' }]}>
            <RefreshCw size={32} color={activeColor} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('system.updateReadyTitle', 'Update Ready!')}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            {t('system.updateReadyDesc', 'A new version of the app has been downloaded. Restart the app to apply the new features.')}
          </Text>
          <TouchableOpacity activeOpacity={1} style={[styles.btn, { backgroundColor: activeColor }]} onPress={handleRestart}>
            <Text style={styles.btnText}>{t('system.restartNow', 'Restart Now')}</Text>
          </TouchableOpacity>
        </View>
      </AppModal>`;

content = content.replace(oldUpdate, newUpdate);

// 2. Changelog Modal
const oldChangelog = `      {/* Changelog Modal */}
      <Modal visible={!!changelog && !updateReady} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={dismissChangelog}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.card, themeStyles.cardShadow, { backgroundColor: colors.background, borderColor: colors.border, maxHeight: '80%' }]}>
                <TouchableOpacity activeOpacity={1} style={[styles.closeBtn, { backgroundColor: colors.backgroundElement }]} onPress={dismissChangelog}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                
                <View style={[styles.iconWrap, { backgroundColor: activeColor + '20' }]}>
                  <Info size={32} color={activeColor} />
                </View>
                
                <Text style={[styles.title, { color: colors.text }]}>{t('system.whatsNew', "What's New")}</Text>
                <Text style={[styles.versionTag, { color: colors.textSecondary }]}>v{changelog?.version}</Text>

                <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%', marginTop: Spacing.four }}>
                  {changelog && getLocalizedText(changelog).map((line: string, i: number) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} />
                      <Text style={[styles.bulletText, { color: colors.text }]}>{line}</Text>
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity activeOpacity={1} style={[styles.btn, { backgroundColor: activeColor, width: '100%', marginTop: Spacing.two }]} onPress={dismissChangelog}>
                  <Text style={styles.btnText}>{t('system.awesome', 'Awesome!')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>`;

const newChangelog = `      {/* Changelog Modal */}
      <AppModal visible={!!changelog && !updateReady} onClose={dismissChangelog} scrollable={false}>
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.iconWrap, { backgroundColor: activeColor + '20' }]}>
            <Info size={32} color={activeColor} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('system.whatsNew', "What's New")}</Text>
          <Text style={[styles.versionTag, { color: colors.textSecondary }]}>v{changelog?.version}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%', marginTop: 24, maxHeight: 300 }}>
          {changelog && getLocalizedText(changelog).map((line, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} />
              <Text style={[styles.bulletText, { color: colors.text }]}>{line}</Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity activeOpacity={1} style={[styles.btn, { backgroundColor: activeColor, width: '100%', marginTop: 24 }]} onPress={dismissChangelog}>
          <Text style={styles.btnText}>{t('system.awesome', 'Awesome!')}</Text>
        </TouchableOpacity>
      </AppModal>`;

content = content.replace(oldChangelog, newChangelog);

// 3. Notification Modal
const oldNotification = `      {/* Notification Modal */}
      <Modal visible={!!notification && !updateReady && !changelog} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={dismissNotification}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.card, themeStyles.cardShadow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[styles.iconWrap, { backgroundColor: activeColor + '15' }]}>
                  <Bell size={24} color={activeColor} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>{t('system.notification', 'Notice')}</Text>
                <Text style={[styles.desc, { color: colors.text, textAlign: 'center', fontSize: 16 }]}>
                  {notification && getLocalizedText(notification)}
                </Text>
                <TouchableOpacity activeOpacity={1} style={[styles.btn, { backgroundColor: activeColor, width: '100%', marginTop: Spacing.two }]} onPress={dismissNotification}>
                  <Text style={styles.btnText}>{t('system.gotIt', 'Got It')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>`;

const newNotification = `      {/* Notification Modal */}
      <AppModal visible={!!notification && !updateReady && !changelog} onClose={dismissNotification} scrollable={false}>
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.iconWrap, { backgroundColor: activeColor + '15' }]}>
            <Bell size={32} color={activeColor} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('system.notification', 'Notice')}</Text>
          <Text style={[styles.desc, { color: colors.text, textAlign: 'center', fontSize: 16, marginTop: 12 }]}>
            {notification && getLocalizedText(notification)}
          </Text>
          <TouchableOpacity activeOpacity={1} style={[styles.btn, { backgroundColor: activeColor, width: '100%', marginTop: 24 }]} onPress={dismissNotification}>
            <Text style={styles.btnText}>{t('system.gotIt', 'Got It')}</Text>
          </TouchableOpacity>
        </View>
      </AppModal>`;

content = content.replace(oldNotification, newNotification);

// Clean up styles
content = content.replace(/  overlay: \{[\s\S]*?  \},/, "");
content = content.replace(/  card: \{[\s\S]*?  \},/, "");
content = content.replace(/  closeBtn: \{[\s\S]*?  \},/, "");

fs.writeFileSync(file, content, 'utf8');
console.log('SystemAnnouncer fixed');
