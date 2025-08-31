import { ShieldCheck, Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { login } from '../services/api';

type LoginPageProps = {
  onSignedIn: () => void;
};

export function LoginPage({ onSignedIn }: LoginPageProps) {
  const [email, setEmail] = useState('admin@mart.local');
  const [password, setPassword] = useState('P@ssw0rd!23');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await login({ email, password, rememberMe: true });
      onSignedIn();
    } catch (loginError: any) {
      setError(loginError?.response?.data?.message ?? 'Unable to sign in right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <section className="login-hero purple-hero">
        <div className="hero-logo">GG</div>
        <h1>Welcome Back!</h1>
        <p>Sign in with your customer, staff, or admin account.</p>
      </section>

      <section className="login-card panel">
        <div className="panel-header login-header">
          <div>
            <div className="eyebrow">Secure access</div>
            <h2>Sign In</h2>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="admin@mart.local" />
          </label>
          <label>
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="primary-btn full-width" type="submit" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', margin: '14px 0', color: 'var(--muted)' }}>OR CONTINUE WITH</div>
          <button type="button" className="google-btn full-width" onClick={() => { /* future oauth */ }}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" className="google-logo" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fillRule="evenodd">
                <path d="M17.64 9.2c0-.62-.06-1.21-.17-1.79H9v3.39h4.84c-.21 1.14-.83 2.1-1.78 2.75v2.29h2.88c1.69-1.56 2.66-3.86 2.66-6.64z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.88-2.29c-.8.54-1.83.86-3.08.86-2.37 0-4.38-1.6-5.1-3.75H1.02v2.35C2.5 15.88 5.53 18 9 18z" fill="#34A853"/>
                <path d="M3.9 10.65c-.18-.54-.28-1.12-.28-1.65s.1-1.11.28-1.65V4.99H1.02A9 9 0 000 9c0 1.48.36 2.88 1.02 4.01l2.88-2.36z" fill="#FBBC05"/>
                <path d="M9 3.58c1.32 0 2.5.45 3.43 1.33l2.57-2.57C13.47.94 11.43 0 9 0 5.53 0 2.5 2.12 1.02 4.99l2.88 2.36C4.62 5.18 6.63 3.58 9 3.58z" fill="#EA4335"/>
              </g>
            </svg>
            <span>Sign in with Google</span>
          </button>

        </form>
      </section>
    </div>
  );
}
