import React from 'react';
import { Text } from 'react-native';

interface CountUpTextProps {
  value: number;
  duration?: number;
  style?: any;
  formatter?: (n: number) => string;
}

/**
 * Animates a number from its previous value to `value` when `value` changes.
 * JS-driven rAF approach for universal platform support.
 */
export default function CountUpText({
  value,
  duration = 600,
  style,
  formatter = (n) => String(Math.round(n)),
}: CountUpTextProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const frameRef = React.useRef<number | null>(null);
  const startTimeRef = React.useRef<number | null>(null);
  const fromRef = React.useRef(0);

  React.useEffect(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    const from = displayValue;
    const to = value;
    fromRef.current = from;
    startTimeRef.current = null;

    function easeOut(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(timestamp: number) {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const current = from + (to - from) * easeOut(progress);
      setDisplayValue(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(to);
      }
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return <Text style={style}>{formatter(displayValue)}</Text>;
}
