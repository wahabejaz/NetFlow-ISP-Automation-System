import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/db';
import { Activity, Lock, Mail, ArrowRight, Shield, ShieldCheck, Cpu, Sun, Moon } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await loginUser(email, password, role.toLowerCase());
      const formattedRole = response.role.charAt(0).toUpperCase() + response.role.slice(1);

      sessionStorage.setItem('authToken', response.token);
      sessionStorage.setItem('userEmail', response.user.email);
      sessionStorage.setItem('userRole', formattedRole);
      sessionStorage.setItem('userName', response.user.name);

      if (formattedRole === 'Admin') {
        navigate('/dashboard');
      } else if (formattedRole === 'Customer') {
        navigate('/customer-portal');
      } else {
        navigate('/technician');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred during login. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: isDarkMode ? '#090d16' : '#f8fafc', overflow: 'hidden', transition: 'background-color 0.3s ease' }}>
      
      {/* Left side banner - High-tech visual preview */}
      <div 
        style={{ 
          flex: 1.2, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          padding: '4rem', 
          color: isDarkMode ? 'white' : '#1e293b', 
          position: 'relative', 
          backgroundImage: `url('/login-bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRight: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
          transition: 'color 0.3s ease'
        }}
      >
        {/* Subtle Glass Overlay to ensure readability and contrast */}
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: isDarkMode 
              ? 'linear-gradient(to right, rgba(9,13,22,0.95) 0%, rgba(9,13,22,0.6) 100%)' 
              : 'linear-gradient(to right, rgba(248,250,252,0.95) 0%, rgba(248,250,252,0.6) 100%)', 
            zIndex: 1,
            transition: 'background 0.3s ease'
          }} 
        />
        
        {/* Logo Image integration */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center' }}>
          <img 
            src="/logo.png" 
            alt="NetFlow Logo" 
            style={{ 
              height: '42px', 
              objectFit: 'contain',
              filter: isDarkMode ? 'none' : 'brightness(0.15) contrast(1.2)'
            }} 
          />
        </div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '580px', margin: 'auto 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(13, 110, 253, 0.1)', border: '1px solid rgba(13, 110, 253, 0.2)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 600, color: '#0d6efd', marginBottom: '1.5rem' }}>
            <Cpu size={14} /> SYSTEM CORE ONLINE
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1, color: isDarkMode ? 'white' : '#0f172a' }}>
            Smart Internet.<br/>
            <span className="login-gradient-text-blue">Automated Management.</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: isDarkMode ? '#94a3b8' : '#475569', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            Experience next-generation fiber administration. Fully integrated with automated telemetry, instant ticketing resolution, and live customer routing.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { text: "Gemini AI Automation Platform", icon: <Cpu size={16} color="#0d6efd" /> },
              { text: "Live Fiber Network telemetry tracking", icon: <Activity size={16} color="#0d6efd" /> },
              { text: "Multi-Role Client Portal & Billing Systems", icon: <ShieldCheck size={16} color="#0d6efd" /> }
            ].map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)', 
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)', 
                  padding: '0.75rem 1.25rem', 
                  borderRadius: '10px',
                  width: 'fit-content',
                  transition: 'all 0.3s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(13, 110, 253, 0.08)';
                  e.currentTarget.style.transform = 'translateX(5px)';
                  e.currentTarget.style.borderColor = 'rgba(13, 110, 253, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                }}
              >
                {item.icon}
                <span style={{ fontSize: '0.9rem', color: isDarkMode ? '#cbd5e1' : '#334155', fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10, fontSize: '0.8rem', color: isDarkMode ? '#64748b' : '#94a3b8' }}>
          © 2026 NetFlow Technologies. All rights reserved.
        </div>
      </div>

      {/* Right side login form */}
      <div 
        style={{ 
          width: '500px', 
          backgroundColor: isDarkMode ? '#0b0f19' : '#ffffff', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          padding: '4rem 3rem',
          position: 'relative',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
          borderLeft: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
        }}
      >
        {/* Theme Toggle Button */}
        <button 
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isDarkMode ? '#fbbf24' : '#475569',
            transition: 'all 0.2s ease',
            zIndex: 20
          }}
          title="Toggle Light/Dark Theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Decorative background radial light orb */}
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,110,253,0.08) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 10 }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: isDarkMode ? 'white' : '#0f172a', marginBottom: '0.5rem' }}>Authentication Portal</h2>
            <p style={{ fontSize: '0.875rem', color: isDarkMode ? '#64748b' : '#475569' }}>Select your security role to establish connection</p>
          </div>

          {/* Glowing Tab bar */}
          <div style={{ display: 'flex', background: isDarkMode ? 'rgba(15, 23, 42, 0.8)' : '#f1f5f9', border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)', borderRadius: '30px', padding: '0.35rem', marginBottom: '2.5rem' }}>
            {['Customer', 'Admin', 'Technician'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={role === r ? "login-tab-active-blue" : ""}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  border: 'none',
                  borderRadius: '25px',
                  background: 'transparent',
                  color: role === r 
                    ? 'white' 
                    : (isDarkMode ? '#64748b' : '#475569'),
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Username/Email Input with Pre-appended Icon */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: isDarkMode ? '#94a3b8' : '#475569', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Credential Identifier</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color={isDarkMode ? '#475569' : '#94a3b8'} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
                <input 
                  type="email" 
                  placeholder="name@yourisp.com" 
                  className={isDarkMode ? "form-control login-input-dark" : "form-control login-input-light"} 
                  style={{ padding: '0.85rem 1rem 0.85rem 2.75rem', fontSize: '0.9rem', borderRadius: '10px' }} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            {/* Password Input with Pre-appended Icon */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ color: isDarkMode ? '#94a3b8' : '#475569', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 0 }}>Secure Password</label>
                <button type="button" style={{ background: 'none', border: 'none', color: '#0d6efd', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Forgot Key?</button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={isDarkMode ? '#475569' : '#94a3b8'} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className={isDarkMode ? "form-control login-input-dark" : "form-control login-input-light"} 
                  style={{ padding: '0.85rem 1rem 0.85rem 2.75rem', fontSize: '0.9rem', borderRadius: '10px' }} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            {error && (
              <div 
                style={{ 
                  color: isDarkMode ? '#fca5a5' : '#b91c1c', 
                  fontSize: '0.85rem', 
                  fontWeight: 500, 
                  background: isDarkMode ? 'rgba(239, 68, 68, 0.07)' : 'rgba(239, 68, 68, 0.05)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '10px', 
                  border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Shield size={16} color={isDarkMode ? '#fca5a5' : '#ef4444'} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'start', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input 
                type="checkbox" 
                id="remember" 
                style={{ 
                  accentColor: '#0d6efd', 
                  cursor: 'pointer', 
                  width: '15px', 
                  height: '15px',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }} 
              />
              <label htmlFor="remember" style={{ fontSize: '0.85rem', color: isDarkMode ? '#94a3b8' : '#475569', cursor: 'pointer', userSelect: 'none' }}>Maintain login state</label>
            </div>

            <button 
              type="submit" 
              className="btn login-btn-gradient-blue" 
              style={{ 
                padding: '0.85rem', 
                fontSize: '0.95rem', 
                fontWeight: 600,
                marginTop: '1.25rem', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              Access System <ArrowRight size={16} />
            </button>
            
          </form>

          {/* Visual TLS footer verification */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem', color: isDarkMode ? '#475569' : '#94a3b8', fontSize: '0.75rem' }}>
            <ShieldCheck size={14} color="#3b82f6" />
            <span>Connection secured by TLS 1.3 standard</span>
          </div>

        </div>
      </div>
      
    </div>
  );
}
