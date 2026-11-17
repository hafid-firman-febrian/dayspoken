import { createContext, useContext } from 'react';

export type TextTone = 'foreground' | 'muted' | 'accent' | 'on-primary';

// The tone a Text uses when it is not given one. A hero Card provides 'on-primary', so text
// on the primary color is white without each Text asking for it.
export const TextToneContext = createContext<TextTone>('foreground');

export function useDefaultTextTone(): TextTone {
  return useContext(TextToneContext);
}
