"use client";

import { createContext, useContext } from "react";

/** Interrupteurs d'affichage (lib/features.ts) lus par les composants navigateur. */
export interface ClientFeatures {
  score: boolean;
  accounts: boolean;
}

const Context = createContext<ClientFeatures>({ score: false, accounts: false });

export function FeaturesProvider({
  children,
  ...value
}: ClientFeatures & { children: React.ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useFeatures = () => useContext(Context);
