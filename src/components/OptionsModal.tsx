import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import AppModal from './AppModal';

import { Check, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Fonts, useThemeColors, useActiveColor } from '@/constants/theme';

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
  enableSearch?: boolean;
  customContent?: React.ReactNode;
}

export default function OptionsModal({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  enableSearch = false,
  customContent,
}: OptionsModalProps) {
  const activeColor = useActiveColor();
  const colors = useThemeColors();
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
    <AppModal visible={visible} onClose={onClose} title={title} scrollable={false}>
      <View style={{ paddingTop: 8 }}>

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
              {customContent ? (
                customContent
              ) : (
                <ScrollView style={styles.list} contentContainerStyle={[styles.listContent, { gap: 24 }]}>
                  {filteredOptions.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('noResults', { defaultValue: 'No results found' })}
                  </Text>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = selectedValue === opt.id;
                    return (
                      <TouchableOpacity activeOpacity={1}
                        key={opt.id}
                        style={styles.optionRow}
                        onPress={() => {
                          onSelect(opt.id);
                          onClose();
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            { color: isSelected ? activeColor : colors.text },
                            isSelected && { fontWeight: '600' }
                          ]}
                        >
                          {opt.name}
                        </Text>
                        {isSelected && <Check size={20} color={activeColor} />}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
              )}
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },  searchContainer: {
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
  listContent: {},
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
