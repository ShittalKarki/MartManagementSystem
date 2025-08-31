import { ShieldCheck, Sparkles } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { register } from '../services/api';

type RegisterPageProps = {
  onRegistered: () => void;
};

export function RegisterPage({ onRegistered }: RegisterPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('P@ssw0rd!23');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await register({ fullName, email, password });
      onRegistered();
    } catch (registerError: any) {
      setError(registerError?.response?.data?.message ?? 'Unable to create the account right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen register-screen">
      <section className="login-hero green-hero">
        <div className="hero-logo">MS</div>
        <h1>Create a customer account</h1>
        <p>Register for the Mart online shop and view your orders and invoices.</p>
      </section>

      <section className="login-card panel">
        <div className="panel-header login-header">
          <div>
            <div className="eyebrow">New account</div>
            <h2>Register</h2>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Full Name</span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} type="text" placeholder="Customer name" required />
          </label>
          <label>
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="customer@example.com" required />
          </label>
          <label>
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" required />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="primary-btn full-width" type="submit" disabled={busy}>
            {busy ? 'Creating account...' : 'Create Account'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, color: 'var(--muted)' }}>
            <ShieldCheck size={16} style={{ marginRight: 8 }} />
            Secure JWT authentication
          </div>
        </form>
      </section>
    </div>
  );
}