import { createContext, useContext } from 'react';

// True inside a BottomSheet. A TextField there must use the sheet's own text input, so the
// sheet can move up above the keyboard. Internal to src/ui.
export const InsideBottomSheetContext = createContext(false);

export function useInsideBottomSheet(): boolean {
  return useContext(InsideBottomSheetContext);
}
