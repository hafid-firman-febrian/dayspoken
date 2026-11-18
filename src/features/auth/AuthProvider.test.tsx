import { act, render, screen } from '@testing-library/react-native';
import type { Session } from '@supabase/supabase-js';
import { Text } from 'react-native';

import type { AppSupabaseClient } from '@/lib/supabase';

import { AuthProvider } from './AuthProvider';
import { useSession } from './hooks/useSession';

const SESSION = { access_token: 'access', user: { id: 'user-1' } } as unknown as Session;

type Listener = (event: string, session: Session | null) => void;

function fakeClient(getSession: () => Promise<{ data: { session: Session | null } }>) {
  let listener: Listener | undefined;
  const unsubscribe = jest.fn();
  const auth = {
    onAuthStateChange: jest.fn((callback: Listener) => {
      listener = callback;
      return { data: { subscription: { unsubscribe } } };
    }),
    getSession: jest.fn(getSession),
  };
  return {
    client: { auth } as unknown as AppSupabaseClient,
    emit: (event: string, session: Session | null) => act(async () => listener?.(event, session)),
    unsubscribe,
    auth,
  };
}

const read = (session: Session | null) => () => Promise.resolve({ data: { session } });

function Probe() {
  const { status, session } = useSession();
  return <Text testID="state">{`${status}:${session?.user.id ?? 'none'}`}</Text>;
}

const renderProvider = (client?: AppSupabaseClient) =>
  render(
    <AuthProvider client={client}>
      <Probe />
    </AuthProvider>,
  );

const state = () => screen.getByTestId('state').props.children;

describe('AuthProvider', () => {
  it('is loading until the saved session has been read', async () => {
    let finish!: (value: { data: { session: Session | null } }) => void;
    const { client } = fakeClient(() => new Promise((resolve) => (finish = resolve)));

    await renderProvider(client);
    expect(state()).toBe('loading:none');

    await act(async () => finish({ data: { session: SESSION } }));
    expect(state()).toBe('signed-in:user-1');
  });

  it('is signed in when a session was saved', async () => {
    const { client } = fakeClient(read(SESSION));
    await renderProvider(client);
    expect(state()).toBe('signed-in:user-1');
  });

  it('is signed out when nothing was saved', async () => {
    const { client } = fakeClient(read(null));
    await renderProvider(client);
    expect(state()).toBe('signed-out:none');
  });

  it('is signed out, not stuck loading, when reading the session fails', async () => {
    const { client } = fakeClient(() => Promise.reject(new Error('storage broke')));
    await renderProvider(client);
    expect(state()).toBe('signed-out:none');
  });

  it('is signed out when no backend is configured', async () => {
    // No client given and no Supabase variable set in the tests: getSupabase() throws.
    await renderProvider();
    expect(state()).toBe('signed-out:none');
  });

  it('follows a sign-in and a sign-out', async () => {
    const { client, emit } = fakeClient(read(null));
    await renderProvider(client);

    await emit('SIGNED_IN', SESSION);
    expect(state()).toBe('signed-in:user-1');

    await emit('SIGNED_OUT', null);
    expect(state()).toBe('signed-out:none');
  });

  it('follows a session that ends on its own, for example a revoked refresh token', async () => {
    const { client, emit } = fakeClient(read(SESSION));
    await renderProvider(client);
    expect(state()).toBe('signed-in:user-1');

    await emit('SIGNED_OUT', null);
    expect(state()).toBe('signed-out:none');
  });

  it('lets a newer event win over a slower read of the saved session', async () => {
    let finish!: (value: { data: { session: Session | null } }) => void;
    const { client, emit } = fakeClient(() => new Promise((resolve) => (finish = resolve)));
    await renderProvider(client);

    await emit('SIGNED_OUT', null);
    await act(async () => finish({ data: { session: SESSION } })); // stale read arrives late

    expect(state()).toBe('signed-out:none');
  });

  it('stops listening when it unmounts, and does not update after that', async () => {
    const { client, emit, unsubscribe } = fakeClient(read(null));
    const view = await renderProvider(client);

    await view.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await emit('SIGNED_IN', SESSION);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});

describe('useSession', () => {
  it('says what is wrong when used outside an AuthProvider', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(render(<Probe />)).rejects.toThrow(
      'useSession must be used inside an AuthProvider',
    );
    error.mockRestore();
  });
});
