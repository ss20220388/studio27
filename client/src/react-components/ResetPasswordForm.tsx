import React, { useState, useEffect } from 'react';

const ResetPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    const e = params.get('email');

    if (!t || !e) {
      setInvalidLink(true);
    } else {
      setToken(t);
      setEmail(e);
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (!newPassword || !confirmPassword) {
      setError('Oba polja su obavezna');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Lozinke se ne podudaraju');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://api.studio27.rs/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          newPassword,
          confirmPassword
        }),
        credentials: 'include'
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setMessage('Lozinka uspešno resetovana! Preusmeravamo vas na stranicu za prijavu...');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setError(data.error || 'Greška pri resetovanju lozinke');
      }
    } catch (err) {
      setError('Greška pri konekciji sa serverom');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (invalidLink) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center'
          }}
        >
          <h2 style={{ color: '#d32f2f', marginBottom: '20px' }}>Neispravan Link</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Link za resetovanje lozinke nije validan. Molimo pokušajte ponovo.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              backgroundColor: '#007bff',
              color: 'white',
              padding: '10px 30px',
              textDecoration: 'none',
              borderRadius: '5px',
              marginTop: '20px'
            }}
          >
            Nazad na početnu stranicu
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%'
        }}
      >
        <h2 style={{ color: '#333', marginBottom: '10px', textAlign: 'center' }}>
          Resetuj Lozinku
        </h2>
        <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', marginBottom: '30px' }}>
          Unesite vašu novu lozinku
        </p>

        {message && (
          <div
            style={{
              backgroundColor: success ? '#d4edda' : '#f8d7da',
              color: success ? '#155724' : '#721c24',
              padding: '12px',
              borderRadius: '5px',
              marginBottom: '20px',
              fontSize: '14px'
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: '5px',
              marginBottom: '20px',
              fontSize: '14px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              Nova Lozinka
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Unesite novu lozinku"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#333',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              Potvrdi Lozinku
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Potvrdi novu lozinku"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => {
              if (!loading) e.target.style.backgroundColor = '#0056b3';
            }}
            onMouseOut={(e) => {
              if (!loading) e.target.style.backgroundColor = '#007bff';
            }}
          >
            {loading ? 'Procesiranje...' : 'Resetuj Lozinku'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '14px',
            color: '#666'
          }}
        >
          Već imate lozinku?{' '}
          <a href="/" style={{ color: '#007bff', textDecoration: 'none' }}>
            Prijavite se
          </a>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
