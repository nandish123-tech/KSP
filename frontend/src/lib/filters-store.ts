import { create } from "zustand";

export type GlobalFilters = {
  years: number[];
  districts: string[];
  crimeGroups: string[];
  firStages: string[];
};

type State = GlobalFilters & {
  set: (patch: Partial<GlobalFilters>) => void;
  reset: () => void;
};

const initial: GlobalFilters = {
  years: [],
  districts: [],
  crimeGroups: [],
  firStages: [],
};

export const useFilters = create<State>((set) => ({
  ...initial,
  set: (patch) => set((s) => ({ ...s, ...patch })),
  reset: () => set(() => ({ ...initial })),
}));
