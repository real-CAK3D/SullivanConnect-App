
import { AppStateProvider } from '../store/AppStateContext';
import React from 'react';

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}
