import React from 'react';
import { Text } from 'react-native';
import { TajweedColors } from '@/constants/tajweed';

const tajweedRegex = /<rule class=(.*?)>(.*?)<\/rule>|([^<]+)/g;

export const parseTajweed = (
  htmlString: string, 
  defaultStyle: any
) => {
  if (!htmlString) return null;
  
  const parts: React.ReactNode[] = [];
  let match;
  let key = 0;

  const cleanClass = (cls: string) => cls.replace(/["']/g, '').trim();

  while ((match = tajweedRegex.exec(htmlString)) !== null) {
    if (match[1] && match[2]) {
      // Rule match
      const ruleClass = cleanClass(match[1]);
      const color = TajweedColors[ruleClass];
      
      parts.push(
        <Text key={key++} style={[defaultStyle, color ? { color } : {}]}>
          {match[2]}
        </Text>
      );
    } else if (match[3]) {
      // Normal text
      parts.push(
        <Text key={key++} style={defaultStyle}>
          {match[3]}
        </Text>
      );
    }
  }

  return parts;
};
