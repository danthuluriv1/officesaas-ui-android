import { create } from 'zustand';
import { OfficeProfile } from '../api/officeService';

interface OfficeStoreState {
  officeProfile: OfficeProfile | null;
  isEditing: boolean;
  setOfficeProfile: (profile: OfficeProfile | null) => void;
  setIsEditing: (isEditing: boolean | ((prev: boolean) => boolean)) => void;
}

export const useOfficeStore = create<OfficeStoreState>((set) => ({
  officeProfile: null,
  isEditing: false,
  setOfficeProfile: (profile) => set({ officeProfile: profile }),
  setIsEditing: (isEditing) => set((state) => ({ 
    isEditing: typeof isEditing === 'function' ? isEditing(state.isEditing) : isEditing 
  })),
}));
