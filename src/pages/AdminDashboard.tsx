import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDashboardSummary } from '../services/db';

const fallbackColors = ['#3b82f6', '#0ea5e9', '#ef4444', '#10b981', '#8b5cf6'];

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getDashboardSummary>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    const loadSummary = async () => {
      try {
        const data = await getDashboardSummary();
        if (alive) {
          setSummary(data);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard summary.');
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      alive = false;
    };
  }, []);

  const revenueData = summary?.monthlyRevenue?.length
    ? summary.monthlyRevenue
    : [{ label: 'No data', value: 0 }];

  const complaintData = summary?.complaintCategories?.length
    ? summary.complaintCategories.map((item, index) => ({
        name: item.category,
        value: item.count,
        color: fallbackColors[index % fallbackColors.length],
      }))
    : [{ name: 'No data', value: 1, color: '#cbd5e1' }];

  const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {loading && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem' }}>
          Loading dashboard data...
        </div>
      )}

      {error && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {summary && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: 600 }}>Total Customers</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '0.5rem' }}>{summary.totalCustomers}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem', fontWeight: 600 }}>+{summary.newThisMonth} this month</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: 600 }}>Active Packages</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '0.5rem' }}>{summary.activePackages}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem', fontWeight: 600 }}>Live package catalog</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: 600 }}>Unpaid Bills</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '0.5rem' }}>{summary.unpaidBills}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.5rem', fontWeight: 600 }}>Visit billing tab to review</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: 600 }}>Open Complaints</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '0.5rem' }}>{summary.openComplaints}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.5rem', fontWeight: 600 }}>AI and staff follow-up</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Monthly Revenue (PKR)</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-light)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-light)' }} />
                    <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="value" stroke="var(--primary-color)" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Complaint Categories</h3>
              <div style={{ height: '250px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={complaintData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {complaintData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Recent Complaints</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-light)' }}>
                    <th style={{ padding: '0.75rem 0', fontWeight: 600 }}>ID</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 600 }}>Issue</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 600 }}>AI Priority</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentComplaints.map((complaint) => (
                    <tr key={complaint.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 0', fontSize: '0.875rem' }}>{complaint.ticketNo}</td>
                      <td style={{ padding: '1rem 0', fontSize: '0.875rem', fontWeight: 500 }}>{complaint.customerName}</td>
                      <td style={{ padding: '1rem 0', fontSize: '0.875rem' }}>{complaint.category}</td>
                      <td style={{ padding: '1rem 0' }}>
                        <span className={`badge ${complaint.priority === 'Urgent' ? 'badge-danger' : complaint.priority === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                          {complaint.priority}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0', fontSize: '0.875rem' }}>{complaint.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Technician Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {summary.technicianStatus.map((tech) => (
                  <div key={tech.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-dark)' }}>
                        {tech.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tech.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{tech.activeJob}</div>
                      </div>
                    </div>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: tech.status === 'Available' ? 'var(--success)' : 'var(--danger)' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
