import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('is 1 for identical colors', () => {
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('does not depend on argument order', () => {
    expect(contrastRatio('#6E6460', '#F8F6F5')).toBeCloseTo(
      contrastRatio('#F8F6F5', '#6E6460'),
      10,
    );
  });

  it('matches the known ratio of muted text on the light background', () => {
    expect(contrastRatio('#6E6460', '#F8F6F5')).toBeCloseTo(5.33, 2);
  });

  it('accepts lowercase hex', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('rejects values that are not 6-digit hex colors', () => {
    expect(() => contrastRatio('red', '#FFFFFF')).toThrow(/hex/i);
    expect(() => contrastRatio('#FFF', '#FFFFFF')).toThrow(/hex/i);
  });
});
