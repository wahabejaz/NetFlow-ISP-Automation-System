import { useState, useEffect } from 'react';
import { Check, X, Trash2, Plus, RefreshCw } from 'lucide-react';
import { getPackages, addPackage, deletePackage, getCustomers, updatePackage } from '../services/db';
import type { Package, Customer } from '../services/db';

export default function PackageManagement() {
  const [pkgs, setPkgs] = useState<Package[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newName, setNewName] = useState('');
  const [newSpeed, setNewSpeed] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [popular, setPopular] = useState(false);

  const fetchPackages = async () => {
    try {
      const data = await getPackages();
      setPkgs(data);
      // fetch customers to compute usage stats
      try {
        const custs = await getCustomers();
        setCustomers(custs);
      } catch (err) {
        console.error('Failed to fetch customers for package stats', err);
        setCustomers([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSpeed || !newPrice) return;
    try {
      const formattedPrice = newPrice.includes('PKR') ? newPrice : `${newPrice} PKR`;
      const formattedSpeed = newSpeed.toLowerCase().includes('mbps') ? newSpeed : `${newSpeed} Mbps`;
      
      await addPackage({
        name: newName,
        speed: formattedSpeed,
        price: formattedPrice,
        popular
      });
      
      setNewName('');
      setNewSpeed('');
      setNewPrice('');
      setPopular(false);
      fetchPackages();
      alert('Package added successfully!');
    } catch (err) {
      alert('Failed to add package.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this package?")) {
      try {
        await deletePackage(id);
        fetchPackages();
      } catch (err) {
        alert('Failed to delete package.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Internet Packages</h1>
        <button className="btn btn-outline" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }} onClick={fetchPackages}>
           <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
        {loading ? (
          <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>Loading packages...</div>
        ) : pkgs.length === 0 ? (
          <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No packages defined yet.</div>
        ) : (
          pkgs.map((pkg) => {
            const usageCount = customers.filter(c => (c.packageId || '').toString().toLowerCase() === pkg.name.toLowerCase()).length;
            const activeCustomers = customers.filter(c => c.status === 'Active').length;
            const hasStaticIP = pkg.name.toLowerCase() === 'premium' || parseInt(pkg.speed) >= 50;
            const features = ['Unlimited Data', '24/7 support'];
            if (hasStaticIP) features.push('Static IP Included');
            const missingFeatures = hasStaticIP ? [] : ['Static IP'];
            const colors = ['#e0f2fe', '#ede9fe', '#f3e8ff'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            return (
              <div key={pkg.id} className="glass-panel" style={{ 
                position: 'relative', 
                overflow: 'hidden', 
                border: pkg.popular ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                transform: pkg.popular ? 'scale(1.02)' : 'none',
                zIndex: pkg.popular ? 10 : 1
              }}>
                {pkg.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '-30px',
                    background: '#f59e0b',
                    color: 'white',
                    padding: '0.25rem 2.5rem',
                    transform: 'rotate(45deg)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    Most Popular
                  </div>
                )}
                
                <div style={{ background: randomColor, padding: '1.5rem', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>{pkg.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                     <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{pkg.speed}</div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{pkg.price}<span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-light)' }}>/month</span></div>
                </div>

                <div style={{ padding: '2rem 1.5rem', paddingBottom: '3.25rem', position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {features.map((f, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Check size={18} color="var(--primary-color)" />
                        <span style={{ fontSize: '0.875rem' }}>{f}</span>
                      </div>
                    ))}
                    {missingFeatures.map((f, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-light)' }}>
                        <X size={18} color="var(--text-light)" />
                        <span style={{ fontSize: '0.875rem', textDecoration: 'line-through' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Active customers: <strong style={{ color: 'var(--text)' }}>{activeCustomers}</strong></div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Using this package: <strong style={{ color: 'var(--text)' }}>{usageCount}</strong></div>
                    </div>
                    <div style={{ position: 'absolute', right: '1rem', bottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button className="btn" style={{ flex: '0 0 auto', background: '#6b7280', color: 'white', borderColor: '#6b7280', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }} onClick={async () => {
                        // simple edit flow using prompts to preserve existing UI style
                        const newName = window.prompt('New package name:', pkg.name);
                        if (newName === null) return;
                        const newSpeed = window.prompt('Speed (e.g. 100 Mbps):', pkg.speed);
                        if (newSpeed === null) return;
                        const newPrice = window.prompt('Monthly price (e.g. 5,000 PKR):', pkg.price);
                        if (newPrice === null) return;
                        const markPopular = window.confirm('Mark as most popular? (OK = Yes, Cancel = No)');
                        try {
                         await updatePackage(pkg.id!, { name: newName.trim(), speed: newSpeed.trim(), price: newPrice.trim(), popular: markPopular });
                         fetchPackages();
                         alert('Package updated successfully');
                        } catch (err) {
                         console.error(err);
                         alert('Failed to update package');
                        }
                      }}><Trash2 size={16} style={{ display: 'none' }} /> Edit</button>
                      <button
                        className="btn btn-outline"
                        aria-label="Deactivate package"
                        title="Deactivate"
                        style={{
                          flex: '0 0 auto',
                          color: 'var(--danger)',
                          background: 'white',
                          borderColor: 'var(--danger)',
                          padding: '0.35rem',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                          borderRadius: '6px'
                        }}
                        onClick={() => handleDelete(pkg.id!)}
                      >
                        <Trash2 size={16} style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Package Form */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Add New Package</h3>
        
        <form onSubmit={handleAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
             <div>
               <label className="form-label">Package Name</label>
               <input type="text" className="form-control" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Ultra Fiber" required />
             </div>
             <div>
               <label className="form-label">Speed (Mbps)</label>
               <input type="text" className="form-control" value={newSpeed} onChange={(e) => setNewSpeed(e.target.value)} placeholder="e.g. 100 Mbps" required />
             </div>
             <div>
               <label className="form-label">Monthly Price (PKR)</label>
               <input type="text" className="form-control" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="e.g. 5,000 PKR" required />
             </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#0f766e' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Mark as Most Popular plan</span>
             </label>
             <button type="submit" className="btn btn-primary" style={{ background: '#0f766e' }}><Plus size={16} /> Add Package</button>
          </div>
        </form>
      </div>
    </div>
  );
}
