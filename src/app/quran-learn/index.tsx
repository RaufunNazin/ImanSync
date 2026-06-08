import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { QURAN_CURRICULUM } from '@/data/quran-curriculum';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookOpen, CheckCircle, ChevronRight } from 'lucide-react-native';

export default function LearnQuranHubScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    // Load progress
    AsyncStorage.getItem('imansync_learn_progress').then(val => {
      if (val) {
        try {
          setCompletedLessons(JSON.parse(val));
        } catch(e){}
      }
    });
  }, []);

  const handleLessonPress = (lesson: any) => {
    if (lesson.type === 'practice') {
      router.push(`/quran-learn/practice?surahId=${lesson.surahId}&ayahId=${lesson.ayahId}`);
    } else {
      router.push(`/quran-learn/lesson/${lesson.id}`);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={t('learn.title')} 
        titleAr={t('learn.titleAr')} 
        showBack 
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        {QURAN_CURRICULUM.map((chapter) => (
          <View key={chapter.id} style={styles.chapterSection}>
            <View style={styles.chapterHeader}>
              <Text style={[styles.chapterTitle, { color: colors.text }]}>{t(chapter.titleKey)}</Text>
              <Text style={[styles.chapterDesc, { color: colors.textSecondary }]}>{t(chapter.descKey)}</Text>
            </View>
            
            <View style={styles.lessonsContainer}>
              {chapter.lessons.map((lesson, lessonIndex) => {
                const isCompleted = completedLessons.includes(lesson.id);
                
                return (
                  <TouchableOpacity 
                    key={lesson.id}
                    onPress={() => handleLessonPress(lesson)}
                    style={styles.lessonWrapper}
                  >
                    {/* Vertical Timeline Line */}
                    {lessonIndex !== chapter.lessons.length - 1 && (
                      <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                    )}
                    
                    <View style={styles.lessonRow}>
                      <View style={[
                        styles.timelineDot, 
                        { backgroundColor: isCompleted ? colors.highlight : colors.backgroundElement, borderColor: isCompleted ? colors.highlight : colors.border }
                      ]}>
                        {isCompleted && <CheckCircle size={16} color={colors.background} />}
                      </View>
                      
                      <BlurView 
                        intensity={40} 
                        tint={colors.glassTint as any} 
                        style={[styles.lessonCard, { borderColor: isCompleted ? colors.highlight + '50' : colors.border }]}
                      >
                        <View style={styles.lessonInfo}>
                          <Text style={[styles.lessonTitle, { color: colors.text }]}>
                            {t(lesson.titleKey)}
                          </Text>
                          <View style={styles.lessonMeta}>
                            <BookOpen size={14} color={colors.accent} />
                            <Text style={[styles.lessonMetaText, { color: colors.textSecondary }]}>
                              {lesson.type === 'grid' ? 'Interactive' : 'Practice'}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={[styles.startBtn, { backgroundColor: colors.accent + '20' }]}>
                          <ChevronRight size={20} color={colors.accent} />
                        </View>
                      </BlurView>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 40,
  },
  chapterSection: {
    marginBottom: 0,
  },
  chapterHeader: {
    marginBottom: Spacing.four,
  },
  chapterTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  chapterDesc: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    lineHeight: 20,
  },
  lessonsContainer: {
    marginLeft: 8,
  },
  lessonWrapper: {
    position: 'relative',
    marginBottom: Spacing.four,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 30,
    bottom: -Spacing.four,
    width: 2,
    zIndex: 0,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    zIndex: 1,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    marginBottom: 6,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lessonMetaText: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
  },
  startBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
