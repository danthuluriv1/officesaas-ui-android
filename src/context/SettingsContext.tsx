import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsContextType = {
  fontScale: number;
  setFontScale: (scale: number) => void;
};

export const SettingsContext = createContext<SettingsContextType>({
  fontScale: 1,
  setFontScale: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState(1);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('app_font_scale').then(val => {
      if (val) {
        setFontScaleState(parseFloat(val));
      }
      setIsReady(true);
    });
  }, []);

  const setFontScale = async (scale: number) => {
    setFontScaleState(scale);
    await AsyncStorage.setItem('app_font_scale', scale.toString());
  };

  return (
    <SettingsContext.Provider value={{ fontScale, setFontScale }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
