import { screen } from '@testing-library/react-native';

import { Text } from './Text';
import { TextToneContext } from './text-tone-context';
import { renderWithProviders, SCHEMES } from './test-utils';

describe.each(SCHEMES)('Text (%s mode)', (scheme) => {
  it('renders its content', async () => {
    await renderWithProviders(<Text>Hello</Text>, { scheme });
    expect(screen.getByText('Hello')).toBeOnTheScreen();
  });

  it.each(['display', 'title', 'heading'] as const)(
    'announces the %s style as a header',
    async (variant) => {
      await renderWithProviders(<Text variant={variant}>Heading text</Text>, { scheme });
      expect(screen.getByRole('header', { name: 'Heading text' })).toBeOnTheScreen();
    },
  );

  it.each(['body', 'reading', 'caption', 'caption-sm'] as const)(
    'does not announce the %s style as a header',
    async (variant) => {
      await renderWithProviders(<Text variant={variant}>Plain text</Text>, { scheme });
      expect(screen.queryByRole('header')).toBeNull();
    },
  );
});

describe('Text styles', () => {
  it('defaults to the body style in the foreground tone', async () => {
    await renderWithProviders(<Text>Hello</Text>);
    const { className } = screen.getByText('Hello').props;
    expect(className).toContain('text-body');
    expect(className).toContain('font-geist');
    expect(className).toContain('text-foreground');
  });

  it.each([
    ['display', 'font-geist-bold', 'text-display'],
    ['title', 'font-geist-semibold', 'text-title'],
    ['heading', 'font-geist-semibold', 'text-heading'],
    ['body', 'font-geist', 'text-body'],
    ['reading', 'font-geist', 'text-reading'],
    ['caption', 'font-geist-medium', 'text-caption'],
    ['caption-sm', 'font-geist-medium', 'text-caption-sm'],
  ] as const)('maps the %s style to %s and %s', async (variant, family, size) => {
    await renderWithProviders(<Text variant={variant}>Styled</Text>);
    const { className } = screen.getByText('Styled').props;
    expect(className.split(' ')).toEqual(expect.arrayContaining([family, size]));
  });

  it.each([
    ['muted', 'text-muted'],
    ['accent', 'text-accent'],
    ['on-primary', 'text-on-primary'],
    ['foreground', 'text-foreground'],
  ] as const)('maps the %s tone to %s', async (tone, expected) => {
    await renderWithProviders(<Text tone={tone}>Toned</Text>);
    expect(screen.getByText('Toned').props.className.split(' ')).toContain(expected);
  });

  it('adds extra class names', async () => {
    await renderWithProviders(<Text className="mt-2">Extra</Text>);
    expect(screen.getByText('Extra').props.className.split(' ')).toContain('mt-2');
  });
});

describe('Text tone inside a hero card', () => {
  it('defaults to on-primary when the surrounding tone is on-primary', async () => {
    await renderWithProviders(
      <TextToneContext.Provider value="on-primary">
        <Text>On the card</Text>
      </TextToneContext.Provider>,
    );
    expect(screen.getByText('On the card').props.className.split(' ')).toContain('text-on-primary');
  });

  it('lets an explicit tone win over the surrounding tone', async () => {
    await renderWithProviders(
      <TextToneContext.Provider value="on-primary">
        <Text tone="muted">Muted on the card</Text>
      </TextToneContext.Provider>,
    );
    const classes = screen.getByText('Muted on the card').props.className.split(' ');
    expect(classes).toContain('text-muted');
    expect(classes).not.toContain('text-on-primary');
  });
});

describe('Text accessibility and scaling', () => {
  it('caps the font scale of display and title at 1.4', async () => {
    await renderWithProviders(
      <>
        <Text variant="display">Display</Text>
        <Text variant="title">Title</Text>
      </>,
    );
    expect(screen.getByText('Display').props.maxFontSizeMultiplier).toBe(1.4);
    expect(screen.getByText('Title').props.maxFontSizeMultiplier).toBe(1.4);
  });

  it('lets body text scale fully with the system font size', async () => {
    await renderWithProviders(<Text>Body</Text>);
    const { maxFontSizeMultiplier, allowFontScaling } = screen.getByText('Body').props;
    expect(maxFontSizeMultiplier).toBeUndefined();
    expect(allowFontScaling).not.toBe(false);
  });

  it('keeps a role the caller sets', async () => {
    await renderWithProviders(
      <Text variant="title" accessibilityRole="button">
        Tap me
      </Text>,
    );
    expect(screen.getByRole('button', { name: 'Tap me' })).toBeOnTheScreen();
    expect(screen.queryByRole('header')).toBeNull();
  });
});
