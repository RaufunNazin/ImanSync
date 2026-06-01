import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Check, Search, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Fonts } from '@/constants/theme';

interface OptionItem {
  id: string | number;
  name: string;
}

interface OptionsModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: OptionItem[];
  selectedValue: string | number | null;
  onSelect: (id: string | number) => void;
  colors: any;
  enableSearch?: boolean;
}

export default function OptionsModal({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  colors,
  enableSearch = false,
}: OptionsModalProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!enableSearch || !searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(query));
  }, [options, searchQuery, enableSearch]);

  // Reset search when modal opens
  React.useEffect(() => {
    if (visible) {
      setSearchQuery('');
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 24, marginTop: 24 }} />
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              {enableSearch && (
                <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Search size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder={t('search', { defaultValue: 'Search...' })}
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              )}

              {/* Options List */}
              <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {filteredOptions.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('noResults', { defaultValue: 'No results found' })}
                  </Text>
                ) : (
                  filteredOptions.map((opt, index) => {
                    const isSelected = selectedValue === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.optionRow,
                          index < filteredOptions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                        ]}
                        onPress={() => {
                          onSelect(opt.id);
                          onClose();
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            { color: isSelected ? colors.highlight : colors.text },
                            isSelected && { fontWeight: '600' }
                          ]}
                        >
                          {opt.name}
                        </Text>
                        {isSelected && <Check size={20} color={colors.highlight} />}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderTopWidth: 1,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontWeight: '600',
    fontSize: 18,
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: Fonts.outfit,
    fontSize: 15,
  },
  list: {
    maxHeight: 400,
  },
  listContent: {
    paddingBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  optionText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
  emptyText: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
});
