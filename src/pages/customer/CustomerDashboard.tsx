import { useState, useEffect } from 'react';
import { Wifi, CreditCard, ChevronRight, Activity, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCustomers, getInvoices } from '../../services/db';
import type { Customer, Invoice } from '../../services/db';

export default function CustomerDashboard() {
  const [speedTestActive, setSpeedTestActive] = useState(false);
  const [speed, setSpeed] = useState({ down: 24.8, up: 12.2, ping: 14 });
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [latestInvoice, setLatestInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomerInfo = async () => {
    try {
      const email = sessionStorage.getItem('userEmail');
      const customers = await getCustomers();
      const match = customers.find(c => c.email.toLowerCase() === (email || '').toLowerCase());
      
      if (match) {
        setCustomer(match);
        const invoices = await getInvoices();
        const userInvoices = invoices.filter(i => i.customerId === match.id);
        if (userInvoices.length > 0) {
          // Sort or pick first
          setLatestInvoice(userInvoices[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerInfo();
  }, []);

  const runSpeedTest = () => {
    setSpeedTestActive(true);
    setSpeed({ down: 0, up: 0, ping: 0 });
    setTimeout(() => {
      const interval = setInterval(() => {
        setSpeed({
          down: parseFloat((15 + Math.random() * 10).toFixed(1)),
          up: parseFloat((5 + Math.random() * 8).toFixed(1)),
          ping: Math.floor(10 + Math.random() * 10)
        });
      }, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        setSpeed({ down: 25.1, up: 12.4, ping: 12 });
        setSpeedTestActive(false);
      }, 3000);
    }, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', color: 'white', padding: '2rem' }}>
         <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
           Welcome back, {loading ? '...' : (customer ? customer.fullName.split(' ')[0] : 'Valued Subscriber')}!
         </h1>
         <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem', color: 'white' }}>
           Your fiber broadband connection in <strong>{customer ? customer.area : 'Gulberg III'}</strong> is {customer?.status === 'Active' ? 'fully operational' : 'limited/restricted'}. No area fiber cuts detected.
         </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
         
         {/* Connection Status & Speed Test */}
         <div className="glass-panel" style={{ padding: '1.5rem', background: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18} color="#0f766e" /> Local Link Diagnostic</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
               <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>Download Speed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f766e' }}>{speed.down} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Mbps</span></div>
               </div>
               <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>Upload Speed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f766e' }}>{speed.up} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Mbps</span></div>
               </div>
               <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>Ping Response</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f766e' }}>{speed.ping} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>ms</span></div>
               </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.75rem', background: '#0f766e' }}
              onClick={runSpeedTest}
              disabled={speedTestActive}
            >
               {speedTestActive ? 'Probing router connection...' : 'Start Speed Latency Test'}
            </button>
         </div>

         {/* Package Summary & Bill */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.5rem', borderRadius: '6px' }}><Wifi size={20} /></div>
                  <div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Active Service Package</div>
                     <div style={{ fontWeight: 700, fontSize: '0.95rem', textTransform: 'capitalize' }}>
                       {customer ? `${customer.packageId} Plan` : 'Broadband Tier'}
                     </div>
                  </div>
               </div>
               <Link to="/customer-portal/package" style={{ color: '#0f766e' }}><ChevronRight size={20} /></Link>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: '#eff6ff', color: '#2563eb', padding: '0.5rem', borderRadius: '6px' }}><CreditCard size={20} /></div>
                  <div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Current Month Bill</div>
                     <div style={{ fontWeight: 700, fontSize: '0.95rem', color: latestInvoice?.status === 'Paid' ? '#16a34a' : '#ef4444' }}>
                       {latestInvoice ? `${latestInvoice.status} (${latestInvoice.amount})` : 'Paid (June Invoice)'}
                     </div>
                  </div>
               </div>
               <Link to="/customer-portal/bills" style={{ color: '#0f766e' }}><ChevronRight size={20} /></Link>
            </div>
         </div>

      </div>

      {/* Announcements */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'white' }}>
         <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bell size={18} color="#0f766e" /> Network Notices</h3>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ borderLeft: '4px solid #3b82f6', padding: '0.5rem 1rem', background: '#eff6ff', borderRadius: '0 8px 8px 0' }}>
               <div style={{ fontWeight: 600, color: '#1e40af' }}>Scheduled Maintenance Alert — GPON Core Gateway</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>June 12th | 02:00 AM to 04:00 AM (2 hours downtime expected)</div>
            </div>
            <div style={{ borderLeft: '4px solid #10b981', padding: '0.5rem 1rem', background: '#f0fdf4', borderRadius: '0 8px 8px 0' }}>
               <div style={{ fontWeight: 600, color: '#15803d' }}>Optic Fiber splitter nodes optimized</div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>Increased general uptime threshold and reduced latency across all blocks in DHA & Gulberg sectors.</div>
            </div>
         </div>
      </div>

    </div>
  );
}
