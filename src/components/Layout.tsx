import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Receipt, 
  AlertCircle, 
  Wrench, 
  Activity, 
  FileText, 
  Bot, 
  Settings,
  LogOut
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Packages', path: '/packages', icon: Package },
  { name: 'Billing', path: '/billing', icon: Receipt },
  { name: 'Complaints', path: '/complaints', icon: AlertCircle },
  { name: 'Technicians', path: '/technicians', icon: Wrench },
  { name: 'Network Monitor', path: '/network', icon: Activity },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'AI Assistant', path: '/ai-assistant', icon: Bot },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar" style={{ padding: '1rem 0', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 32, height: 32, background: 'var(--primary-color)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>N</div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-dark)' }}>NetFlow</span>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 1rem' }}>
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: isActive ? 'white' : 'var(--text-light)',
                    backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ padding: '0 1rem', marginTop: 'auto' }}>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--danger)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--danger-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          {/* Header search and profile could go here */}
          <div style={{ position: 'relative', width: '300px' }}>
             <input type="text" placeholder="Search..." className="form-control" style={{ paddingLeft: '2.5rem', borderRadius: '20px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Users size={20} />
             </div>
             <div>
               <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Admin User</div>
             </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
