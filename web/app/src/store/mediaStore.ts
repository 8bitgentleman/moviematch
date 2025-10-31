import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Filters, FilterValue, Library } from '../../../../types/moviematch';

interface MediaState {
  availableFilters?: Filters;
  filterValues: Record<string, FilterValue[]>;
  libraries: Library[];
  librariesLoading: boolean;
  librariesError?: string;

  // Actions
  setAvailableFilters: (filters: Filters) => void;
  setFilterValues: (key: string, values: FilterValue[]) => void;
  requestLibraries: () => void;
  setLibraries: (libraries: Library[]) => void;
  setLibrariesError: (error: string) => void;
}

export const useMediaStore = create<MediaState>()(
  devtools(
    (set) => ({
      // Initial state
      availableFilters: undefined,
      filterValues: {},
      libraries: [],
      librariesLoading: false,
      librariesError: undefined,

      // Actions
      setAvailableFilters: (filters) => {
        set({ availableFilters: filters });
      },

      setFilterValues: (key, values) => {
        set((state) => ({
          filterValues: {
            ...state.filterValues,
            [key]: values,
          },
        }));
      },

      requestLibraries: () => {
        set({ librariesLoading: true, librariesError: undefined });
      },

      setLibraries: (libraries) => {
        set({
          libraries,
          librariesLoading: false,
          librariesError: undefined,
        });
      },

      setLibrariesError: (error) => {
        set({
          libraries: [],
          librariesLoading: false,
          librariesError: error,
        });
      },
    }),
    { name: 'MediaStore' }
  )
);
