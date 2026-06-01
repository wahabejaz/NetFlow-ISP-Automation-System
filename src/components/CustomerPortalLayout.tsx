import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Package, Receipt, Edit3, MessageSquare, LogOut, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCustomers } from '../services/db';
import Avatar from './Avatar';

const navItems = [
  { name: 'Home', path: '/customer-portal', icon: Home, exact: true },
  { name: 'My Package', path: '/customer-portal/package', icon: Package },
  { name: 'Bills', path: '/customer-portal/bills', icon: Receipt },
  { name: 'Submit Complaint', path: '/customer-portal/complaint', icon: Edit3 },
  { name: 'Chat Support', path: '/customer-portal/chat', icon: MessageSquare },
  { name: 'Logout', path: '/login', icon: LogOut },
];

export default function CustomerPortalLayout() {
  const location = useLocation();
  const [customerName, setCustomerName] = useState(() => sessionStorage.getItem('userName') || '');
  const [customerPhoto, setCustomerPhoto] = useState(() => sessionStorage.getItem('userPhoto') || '');

  useEffect(() => {
    const email = sessionStorage.getItem('userEmail');
    if (email) {
      getCustomers().then(customers => {
        const match = customers.find(c => c.email.toLowerCase() === email.toLowerCase());
        if (match) {
          setCustomerName(match.fullName);
          sessionStorage.setItem('userName', match.fullName);
          if (match.photo && typeof match.photo === 'string') {
            setCustomerPhoto(match.photo);
            sessionStorage.setItem('userPhoto', match.photo);
          } else {
            setCustomerPhoto('');
            sessionStorage.removeItem('userPhoto');
          }
        } else {
          setCustomerName('Customer');
        }
      }).catch(err => {
        console.error(err);
        setCustomerName('Customer');
      });
    } else {
      setCustomerName('Customer');
    }
  }, []);

  const displayName = customerName || 'Customer';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top Navbar */}
      <header style={{ background: '#0f766e', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
             MyISP
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, alignSelf: 'flex-end', paddingBottom: '0.25rem' }}>Customer Portal</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Bell size={20} style={{ cursor: 'pointer' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 500 }}>{displayName}</span>
            <Avatar src={customerPhoto} name={displayName} size={36} />
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{ width: '250px', background: 'white', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '1.5rem 0' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path 
                : location.pathname.startsWith(item.path);
              const Icon = item.icon;
              
              if (item.name === 'Logout') {
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      sessionStorage.clear();
                      window.location.href = '/login';
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      background: 'transparent',
                      width: '100%',
                      textAlign: 'left',
                      color: 'var(--danger)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginTop: '2rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Icon size={18} />
                    {item.name}
                  </button>
                );
              }
              
              return (
                <Link 
                  key={item.name} 
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    textDecoration: 'none',
                    color: isActive ? 'white' : 'var(--text-dark)',
                    backgroundColor: isActive ? '#0f766e' : 'transparent',
                    borderRight: isActive ? '4px solid #064e3b' : '4px solid transparent',
                    fontWeight: isActive ? 500 : 400,
                    transition: 'all 0.2s ease',
                    marginTop: item.name === 'Logout' ? '2rem' : '0'
                  }}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
