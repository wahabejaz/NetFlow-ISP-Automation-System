import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Server, Activity, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { getCustomers, getAreas } from '../services/db';

const initialNodes = [
  { id: 1, name: 'Lahore Central Gateway', status: 'Healthy', load: '64%', ping: '12ms', ip: '192.168.10.1' },
  { id: 2, name: 'Gulberg III Hub Node', status: 'Healthy', load: '78%', ping: '14ms', ip: '192.168.12.5' },
  { id: 3, name: 'DHA Phase 4 Ring', status: 'Healthy', load: '45%', ping: '18ms', ip: '192.168.15.12' },
  { id: 4, name: 'Johar Town Sector A Node', status: 'Healthy', load: '89%', ping: '22ms', ip: '192.168.22.4' },
  { id: 5, name: 'Bahria Town Sub-hub', status: 'Warning', load: '94%', ping: '84ms', ip: '192.168.45.2' },
];

export default function NetworkMonitor() {
  const [nodes, setNodes] = useState(initialNodes);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [activeONTCount, setActiveONTCount] = useState(12); // fallback if empty

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const list = await getCustomers();
        const activeCount = list.filter(c => c.status === 'Active').length;
        if (activeCount > 0) {
          setActiveONTCount(activeCount);
        }
        try {
          const areasResp = await getAreas();
          const areas = areasResp.areas || [];

          // Generate nodes from top areas if available
          if (areas.length > 0) {
            const generated = areas.slice(0, 5).map((a, idx) => ({
              id: idx + 1,
              name: `${a} Hub Node`,
              status: 'Healthy',
              load: `${50 + (idx * 8)}%`,
              ping: `${10 + (idx * 2)}ms`,
              ip: `192.168.${10 + idx}.1`
            }));
            setNodes(prev => generated.concat(prev.slice(generated.length)));
          }
        } catch (err) {
          // ignore area fetch errors
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  // Simulate real-time bandwidth traffic fluctuations
  useEffect(() => {
    const data = [];
    for (let i = 24; i >= 0; i--) {
      data.push({
        time: `${i}h ago`,
        upload: 1.2 + Math.random() * 0.5,
        download: 3.5 + Math.random() * 1.5,
      });
    }
    setTrafficData(data);

    const interval = setInterval(() => {
      setTrafficData(prev => {
        const next = [...prev.slice(1)];
        next.push({
          time: 'Now',
          upload: 1.2 + Math.random() * 0.5,
          download: 3.5 + Math.random() * 1.5,
        });
        return next;
      });

      // Randomly update ping/load for visualization
      setNodes(prev => prev.map(node => {
        if (node.id === 5) return node; // Keep warning node static
        const newLoad = Math.min(100, Math.max(10, parseInt(node.load) + Math.floor(Math.random() * 11) - 5));
        const newPing = Math.min(150, Math.max(5, parseInt(node.ping) + Math.floor(Math.random() * 7) - 3));
        return {
          ...node,
          load: `${newLoad}%`,
          ping: `${newPing}ms`
        };
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>ISP Telemetry & Health</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Network Monitor</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.5rem 1rem', borderRadius: '20px', color: '#065f46', fontSize: '0.875rem', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          All Main Core Gateways Operational
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
         <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ background: '#ecfdf5', color: '#10b981', padding: '0.75rem', borderRadius: '8px' }}><CheckCircle size={24} /></div>
           <div>
             <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Global Uptime (24h)</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>99.98%</div>
           </div>
         </div>

         <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '0.75rem', borderRadius: '8px' }}><Activity size={24} /></div>
           <div>
             <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Current Network Load</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>4.82 Gbps</div>
           </div>
         </div>

         <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ background: '#f5f3ff', color: '#8b5cf6', padding: '0.75rem', borderRadius: '8px' }}><Users size={24} /></div>
           <div>
             <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Active Connected ONT</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeONTCount} Users</div>
           </div>
         </div>

         <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ background: '#fffbeb', color: '#d97706', padding: '0.75rem', borderRadius: '8px' }}><AlertTriangle size={24} /></div>
           <div>
             <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Active Incidents</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>1 Warning</div>
           </div>
         </div>
      </div>

      {/* Network Bandwidth Chart */}
      <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700 }}>Live Bandwidth Load (Upload/Download)</h3>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 12, height: 12, background: '#3b82f6', borderRadius: '2px', display: 'inline-block' }}></span> Download</span>
             <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 12, height: 12, background: '#10b981', borderRadius: '2px', display: 'inline-block' }}></span> Upload</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <AreaChart data={trafficData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => val.toFixed(1) + 'G'} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="download" stroke="#3b82f6" fill="#dbeafe" strokeWidth={2} />
            <Area type="monotone" dataKey="upload" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Nodes Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        
        {/* Hub / Gateway list */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', fontWeight: 700 }}>Core Hub Nodes Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {nodes.map((node) => (
                <div key={node.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#fafafa' }}>
                   <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ background: node.status === 'Healthy' ? '#d1fae5' : '#fef3c7', color: node.status === 'Healthy' ? '#10b981' : '#d97706', padding: '0.5rem', borderRadius: '6px' }}>
                         <Server size={20} />
                      </div>
                      <div>
                         <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{node.name}</div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>IP: {node.ip}</div>
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', fontSize: '0.875rem' }}>
                      <div>
                         <span style={{ color: 'var(--text-light)', marginRight: '4px' }}>Load:</span>
                         <strong>{node.load}</strong>
                      </div>
                      <div>
                         <span style={{ color: 'var(--text-light)', marginRight: '4px' }}>Ping:</span>
                         <strong style={{ color: parseInt(node.ping) > 50 ? '#dc2626' : 'inherit' }}>{node.ping}</strong>
                      </div>
                      <span className={`badge ${node.status === 'Healthy' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
                        {node.status}
                      </span>
                   </div>
                </div>
              ))}
          </div>
        </div>

        {/* Live System Alerts Logger */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', fontWeight: 700 }}>System Incidents Log</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
             <div style={{ borderLeft: '4px solid #f59e0b', padding: '0.5rem 1rem', background: '#fffbeb', borderRadius: '0 8px 8px 0' }}>
                <div style={{ fontWeight: 600, color: '#b45309' }}>High Latency Warning — Bahria Town Sub-hub</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>Triggered 18 mins ago | Action: Rerouting fiber link</div>
             </div>
             
             <div style={{ borderLeft: '4px solid #10b981', padding: '0.5rem 1rem', background: '#f0fdf4', borderRadius: '0 8px 8px 0' }}>
                <div style={{ fontWeight: 600, color: '#15803d' }}>Scheduled Maintenance Completed — DHA Central Ring</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>Closed 2 hours ago | Duration: 45 mins</div>
             </div>

             <div style={{ borderLeft: '4px solid #10b981', padding: '0.5rem 1rem', background: '#f0fdf4', borderRadius: '0 8px 8px 0' }}>
                <div style={{ fontWeight: 600, color: '#15803d' }}>Node Reset Done — Gulberg III Hub Node</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>Closed 6 hours ago | Restored ping to 14ms</div>
             </div>
          </div>
        </div>

      </div>

    </div>
  );
}
