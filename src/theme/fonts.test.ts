import { GEIST_FONTS } from './fonts';
import { fontFamily } from './tokens';

describe('GEIST_FONTS', () => {
  it('registers exactly the families named in the typography tokens', () => {
    expect(Object.keys(GEIST_FONTS).sort()).toEqual(Object.values(fontFamily).sort());
  });

  it('has a font file for every family', () => {
    for (const source of Object.values(GEIST_FONTS)) {
      expect(source).toBeTruthy();
    }
  });
});
