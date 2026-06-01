import { useState, useEffect } from 'react';
import { Wifi, Info, CheckCircle2, ArrowUpRight, X, RefreshCw } from 'lucide-react';
import { getCustomers, updateCustomer, getPackages } from '../../services/db';
import type { Customer, Package } from '../../services/db';

export default function MyPackage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  // Upgrade Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState('');

  const features = [
    '24/7 Fiber Link Monitoring',
    'Dual-band Gigabit Smart Router',
    'Unlimited Monthly Bandwidth (Fair Usage Policy applies)',
    '1 Concurrent Connection session',
    'Free Optical Fiber Maintenance support',
  ];

  const fetchDetails = async () => {
    try {
      const email = sessionStorage.getItem('userEmail');
      const customers = await getCustomers();
      const match = customers.find(c => c.email.toLowerCase() === (email || '').toLowerCase());
      if (match) {
        setCustomer(match);
        setSelectedPkgId(match.packageId);
      }
      
      const pkgs = await getPackages();
      setPackages(pkgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !customer.id || !selectedPkgId) return;
    try {
      const selectedPkg = packages.find(p => p.id === selectedPkgId || p.name.toLowerCase() === selectedPkgId.toLowerCase());
      const newBill = selectedPkg?.price || customer.bill;
      
      await updateCustomer(customer.id, {
        packageId: selectedPkgId,
        bill: newBill
      });

      setModalOpen(false);
      fetchDetails();
      alert(`Successfully changed your subscription to ${selectedPkgId}!`);
    } catch (err) {
      alert("Failed to upgrade subscription.");
    }
  };

  // Find active package details
  const activePkg = packages.find(p => p.id === customer?.packageId || p.name.toLowerCase() === customer?.packageId?.toLowerCase());

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>My Subscription Package</h1>
        <p style={{ color: 'var(--text-light)', margin: 0 }}>Review active broadband features, usage summary, and billing cycles.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}><RefreshCw className="animate-spin" /> Loading Package Details...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          
          {/* Active Package Details */}
          <div className="glass-panel" style={{ padding: '2rem', background: 'white' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f0fdf4', color: '#0d9488', padding: '0.75rem', borderRadius: '8px' }}><Wifi size={28} /></div>
              <div>
                <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#0d9488', letterSpacing: '0.5px' }}>Active Plan</div>
                <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800, textTransform: 'capitalize' }}>
                  {activePkg ? `${activePkg.name} (${activePkg.speed})` : `${customer?.packageId} Plan`}
                </h2>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1.25rem 0', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-light)' }}>Monthly Subscription Fee:</span>
                  <strong>{customer ? customer.bill : 'PKR 2,200/mo'}</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-light)' }}>Next Billing Renewal Date:</span>
                  <strong>June 5th, 2026</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-light)' }}>Status:</span>
                  <span className="badge badge-success" style={{ background: 'transparent', border: '1px solid #86efac' }}>Active</span>
               </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 700 }}>Package Features</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               {features.map((feat, i) => (
                 <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                    <CheckCircle2 size={16} color="#0d9488" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{feat}</span>
                 </li>
               ))}
            </ul>
          </div>

          {/* Data Usage & Upgrades */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             {/* Data Usage Card */}
             <div className="glass-panel" style={{ padding: '1.5rem', background: 'white' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 700 }}>Data Usage (This Month)</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                   <span>Used: <strong>214 GB</strong></span>
                   <span style={{ color: 'var(--text-light)' }}>Total Cap: Unlimited</span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                   <div style={{ width: '38%', height: '100%', background: '#0d9488' }}></div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-light)', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                   <Info size={14} /> FUP resets on the 5th of every month.
                </div>
             </div>

             {/* Change Plan Card */}
             <div className="glass-panel" style={{ padding: '1.5rem', background: 'white' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 700 }}>Upgrade or Modify Plan</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '1.5rem' }}>Upgrade your connection tier in one click using your live subscription details.</p>
                
                <button className="btn btn-primary" style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', background: '#0f766e' }} onClick={() => setModalOpen(true)}>
                   Upgrade Package Plan <ArrowUpRight size={16} />
                </button>
             </div>
          </div>

        </div>
      )}

      {/* Upgrade Plan Modal Popup */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '2rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Choose Broadband Plan</h3>
               <X size={20} style={{ cursor: 'pointer', color: 'var(--text-light)' }} onClick={() => setModalOpen(false)} />
            </div>

            <form onSubmit={handleUpgrade} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
               <div>
                  <label className="form-label">Select Package</label>
                  <select 
                    className="form-control" 
                    value={selectedPkgId} 
                    onChange={(e) => setSelectedPkgId(e.target.value)}
                    style={{ background: '#f8fafc' }}
                  >
                     {packages.map(p => (
                       <option key={p.id} value={p.id || p.name.toLowerCase()}>{p.name} — {p.speed} ({p.price}/mo)</option>
                     ))}
                  </select>
               </div>

               <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#0d9488' }}>Confirm Upgrade</button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
