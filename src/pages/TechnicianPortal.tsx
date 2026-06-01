import { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  RefreshCw,
  Wrench,
  Activity,
  LogOut,
  Bell,
  Cpu,
  Wifi,
  MapPin,
  Search,
  Compass,
  AlertTriangle,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';
import { getTickets, updateTicket } from '../services/db';
import type { Ticket } from '../services/db';

export default function TechnicianPortal() {
  const [status, setStatus] = useState('Available');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolutionText, setResolutionText] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Navigation & Workspace states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'diagnostics' | 'map' | 'performance'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Assigned' | 'In Progress' | 'Resolved'>('All');

  // Diagnostic states
  const [probeSplitter, setProbeSplitter] = useState('Splitter 4A');
  const [probePort, setProbePort] = useState('Port 3');
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<any>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const allTickets = await getTickets();
      setTickets(allTickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleStartJob = async (ticketId: string) => {
    try {
      await updateTicket(ticketId, {
        status: 'In Progress'
      });
      fetchJobs();
      alert('Job started! Status updated to In Progress.');
    } catch (err) {
      alert('Failed to start job.');
    }
  };

  const handleCompleteJob = async (ticket: Ticket) => {
    if (!ticket.id) return;
    try {
      const currentNotes = ticket.notes || [];
      const updatedNotes = [
        ...currentNotes,
        {
          author: 'Usman Tariq (Technician)',
          text: resolutionText || 'Resolved onsite fiber link drop issue.',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      ];

      await updateTicket(ticket.id, {
        status: 'Resolved',
        notes: updatedNotes
      });
      
      setResolutionText('');
      setSelectedTicketId(null);
      fetchJobs();
      alert('Job marked as Completed and resolved successfully!');
    } catch (err) {
      alert('Failed to resolve ticket.');
    }
  };

  // Calculations
  const completedCount = tickets.filter(t => t.status === 'Resolved').length;
  const pendingCount = tickets.filter(t => t.status !== 'Resolved').length;

  const filteredTickets = tickets.filter(t => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      t.customerName.toLowerCase().includes(searchLower) || 
      t.ticketNo.toLowerCase().includes(searchLower) ||
      t.description.toLowerCase().includes(searchLower) ||
      t.category.toLowerCase().includes(searchLower);
    
    if (filterStatus === 'All') return matchesSearch;
    if (filterStatus === 'Assigned') return matchesSearch && (t.status === 'Submitted' || t.status === 'AI Analyzed' || t.status === 'Assigned');
    return matchesSearch && t.status === filterStatus;
  });

  // Signal probe simulator
  const runSignalProbe = () => {
    setProbing(true);
    setProbeResult(null);
    setTimeout(() => {
      setProbing(false);
      setProbeResult({
        status: 'Connected',
        attenuation: parseFloat((-18.5 - Math.random() * 8).toFixed(2)),
        rxPower: parseFloat((-19.0 - Math.random() * 6).toFixed(2)),
        txPower: '+2.4 dBm',
        distance: parseFloat((0.8 + Math.random() * 2.5).toFixed(2)),
        framing: 'GEM Frame Lock Valid',
        laserStatus: 'Optimal (1310nm / 1490nm)'
      });
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', color: '#1e293b', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', background: '#090d16', color: '#f8fafc', display: 'flex', flexDirection: 'column', padding: '1.5rem 0', boxShadow: '4px 0 15px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: 'white', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            <Wrench size={18} />
          </div>
          <div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.5px', background: 'linear-gradient(to right, #0d9488, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyISP Console</span>
            <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>Technician Operations</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1rem' }}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activeTab === 'dashboard' ? 'rgba(13, 148, 136, 0.15)' : 'transparent',
              color: activeTab === 'dashboard' ? '#2dd4bf' : '#94a3b8',
              fontWeight: activeTab === 'dashboard' ? 600 : 500,
              textAlign: 'left', transition: 'all 0.2s ease'
            }}
          >
            <Activity size={18} />
            Active Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('diagnostics')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activeTab === 'diagnostics' ? 'rgba(13, 148, 136, 0.15)' : 'transparent',
              color: activeTab === 'diagnostics' ? '#2dd4bf' : '#94a3b8',
              fontWeight: activeTab === 'diagnostics' ? 600 : 500,
              textAlign: 'left', transition: 'all 0.2s ease'
            }}
          >
            <Cpu size={18} />
            GPON Area Diagnostics
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activeTab === 'map' ? 'rgba(13, 148, 136, 0.15)' : 'transparent',
              color: activeTab === 'map' ? '#2dd4bf' : '#94a3b8',
              fontWeight: activeTab === 'map' ? 600 : 500,
              textAlign: 'left', transition: 'all 0.2s ease'
            }}
          >
            <Compass size={18} />
            DHA Splice Map
          </button>
          <button 
            onClick={() => setActiveTab('performance')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activeTab === 'performance' ? 'rgba(13, 148, 136, 0.15)' : 'transparent',
              color: activeTab === 'performance' ? '#2dd4bf' : '#94a3b8',
              fontWeight: activeTab === 'performance' ? 600 : 500,
              textAlign: 'left', transition: 'all 0.2s ease'
            }}
          >
            <Award size={18} />
            SLA & Performance
          </button>
        </nav>

        <div style={{ padding: '0 1rem', marginTop: 'auto' }}>
          <button 
            onClick={() => {
              sessionStorage.clear();
              window.location.href = '/login';
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none',
              backgroundColor: 'transparent', color: '#f43f5e', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut size={18} />
            Logout Portal
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        
        {/* Top Navbar */}
        <header style={{ background: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>DHA Sector Operations Desk</h1>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
              Welcome, <strong>Usman Tariq</strong> | Area Dispatch: <strong>DHA Sector, Lahore</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Status Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f1f5f9', padding: '0.35rem 0.5rem', borderRadius: '30px' }}>
              <button 
                onClick={() => setStatus('Available')}
                style={{
                  border: 'none', borderRadius: '20px', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', transition: 'all 0.2s ease',
                  background: status === 'Available' ? '#10b981' : 'transparent',
                  color: status === 'Available' ? 'white' : '#64748b',
                  boxShadow: status === 'Available' ? '0 2px 8px rgba(16,185,129,0.3)' : 'none'
                }}
              >
                ● Available
              </button>
              <button 
                onClick={() => setStatus('Busy')}
                style={{
                  border: 'none', borderRadius: '20px', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', transition: 'all 0.2s ease',
                  background: status === 'Busy' ? '#ef4444' : 'transparent',
                  color: status === 'Busy' ? 'white' : '#64748b',
                  boxShadow: status === 'Busy' ? '0 2px 8px rgba(239,68,68,0.3)' : 'none'
                }}
              >
                ■ Busy
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '1.5rem' }}>
              <Bell size={20} style={{ color: '#64748b', cursor: 'pointer' }} onClick={() => alert('No active network alerts in DHA sector.')} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0f766e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  UT
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Panels */}
        <main style={{ padding: '2rem', flex: 1 }}>
          
          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              
              {/* Left Side: Tasks and Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Modern Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ background: '#eff6ff', color: '#3b82f6', borderRadius: '10px', padding: '0.65rem' }}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Jobs Assigned</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>{tickets.length}</div>
                    </div>
                  </div>

                  <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ background: '#f0fdf4', color: '#10b981', borderRadius: '10px', padding: '0.65rem' }}>
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Completed</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>{completedCount}</div>
                    </div>
                  </div>

                  <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ background: '#fef2f2', color: '#ef4444', borderRadius: '10px', padding: '0.65rem' }}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Pending Jobs</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444', marginTop: '2px' }}>{pendingCount}</div>
                    </div>
                  </div>

                  <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ background: '#fffbeb', color: '#d97706', borderRadius: '10px', padding: '0.65rem' }}>
                      <Award size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CSAT Rating</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706', marginTop: '2px' }}>4.9 <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/ 5</span></div>
                    </div>
                  </div>
                </div>

                {/* Filter and Tasks Workspace */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
                      {(['All', 'Assigned', 'In Progress', 'Resolved'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setFilterStatus(tab)}
                          style={{
                            border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s ease',
                            background: filterStatus === tab ? 'white' : 'transparent',
                            color: filterStatus === tab ? '#0f766e' : '#64748b',
                            boxShadow: filterStatus === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                          }}
                        >
                          {tab === 'Assigned' ? 'Queue (New)' : tab}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                          type="text"
                          placeholder="Search task/customer..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{
                            padding: '0.45rem 1rem 0.45rem 2.25rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '220px', outline: 'none'
                          }}
                        />
                      </div>
                      <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '0.45rem 0.75rem' }} onClick={fetchJobs}>
                        <RefreshCw size={14} /> Refresh
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                      <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 1rem' }} />
                      Loading jobs list...
                    </div>
                  ) : filteredTickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed #e2e8f0', borderRadius: '12px', color: '#64748b' }}>
                      No active jobs matched your filter.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {filteredTickets.map(job => (
                        <div 
                          key={job.id} 
                          style={{
                            border: job.status === 'In Progress' ? '1px solid #0d9488' : '1px solid #e2e8f0',
                            background: job.status === 'In Progress' ? '#f0fdfa' : 'white',
                            borderRadius: '12px', padding: '1.25rem', transition: 'all 0.2s ease', position: 'relative',
                            boxShadow: job.status === 'In Progress' ? '0 4px 12px rgba(13,148,136,0.05)' : 'none'
                          }}
                        >
                          {/* Card Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#090d16' }}>{job.ticketNo}</span>
                              <span style={{
                                fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '20px', fontWeight: 600,
                                background: job.status === 'Resolved' ? '#dcfce7' : job.status === 'In Progress' ? '#ccfbf1' : '#fef3c7',
                                color: job.status === 'Resolved' ? '#166534' : job.status === 'In Progress' ? '#0f766e' : '#92400e'
                              }}>
                                {job.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {job.createdAt || 'Today'}
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '1rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                            <div>
                              <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer</div>
                              <div style={{ fontWeight: 600, marginTop: '2px', color: '#334155' }}>{job.customerName}</div>
                            </div>
                            <div>
                              <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Assigned Location</div>
                              <div style={{ marginTop: '2px', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={14} color="#0f766e" /> DHA Phase 4, Block J, Lahore
                              </div>
                            </div>
                            <div>
                              <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Priority / Category</div>
                              <div style={{ marginTop: '2px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{
                                  fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600,
                                  background: job.priority === 'Urgent' ? '#fee2e2' : '#fef3c7',
                                  color: job.priority === 'Urgent' ? '#991b1b' : '#92400e'
                                }}>
                                  {job.priority}
                                </span>
                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{job.category}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ borderTop: '1px solid rgba(226,232,240,0.6)', paddingTop: '1rem' }}>
                            <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', background: 'rgba(248,250,252,0.6)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }}>
                              <strong>Incident Log:</strong> {job.description}
                            </div>

                            {job.status === 'Resolved' ? (
                              job.notes && job.notes.length > 0 && (
                                <div style={{ fontSize: '0.8rem', background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', color: '#166534', border: '1px solid #bbf7d0' }}>
                                  <strong>Resolution Closeout Note:</strong> {job.notes[job.notes.length - 1].text}
                                </div>
                              )
                            ) : (
                              selectedTicketId === job.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                   <textarea 
                                     className="form-control" 
                                     rows={3} 
                                     placeholder="Enter resolution notes, splice measurements, or field observations..." 
                                     value={resolutionText}
                                     onChange={(e) => setResolutionText(e.target.value)}
                                     style={{ fontSize: '0.85rem' }}
                                   />
                                   <div style={{ display: 'flex', gap: '0.75rem' }}>
                                      <button className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => setSelectedTicketId(null)}>Cancel</button>
                                      <button className="btn btn-primary" style={{ flex: 2, padding: '0.5rem', fontSize: '0.8rem', background: '#10b981' }} onClick={() => handleCompleteJob(job)}>Submit Resolution</button>
                                   </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                  <button 
                                    className="btn btn-outline" 
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} 
                                    onClick={() => {
                                      setActiveTab('map');
                                      alert('Plotting route directions to DHA Phase 4 splitters on sector map.');
                                    }}
                                  >
                                    <Navigation size={14} /> Navigate on Map
                                  </button>
                                  {job.status === 'In Progress' ? (
                                    <button 
                                      className="btn" 
                                      style={{ flex: 2, padding: '0.5rem', fontSize: '0.8rem', background: '#10b981', color: 'white', fontWeight: 600 }} 
                                      onClick={() => setSelectedTicketId(job.id || null)}
                                    >
                                      Close Ticket (Resolve)
                                    </button>
                                  ) : (
                                    <button 
                                      className="btn" 
                                      style={{ flex: 2, padding: '0.5rem', fontSize: '0.8rem', background: '#d97706', color: 'white', fontWeight: 600 }} 
                                      onClick={() => handleStartJob(job.id || '')}
                                    >
                                      Dispatch / Start Job
                                    </button>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Side: Network Health Monitor & Signal Prober */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* GPON Splitter Health Check */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={16} color="#0f766e" /> Splitter Telemetry (DHA)
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <strong>GPON Splitter 4A</strong>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>Normal (-19.5 dBm)</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '85%', height: '100%', background: '#10b981' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                        <span>Capacity: 14/16 Ports</span>
                        <span>Loss: 0.1dB</span>
                      </div>
                    </div>

                    <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <strong>GPON Splitter 4B</strong>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>High Loss (-28.2 dBm)</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '40%', height: '100%', background: '#f59e0b' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                        <span>Capacity: 16/16 Ports</span>
                        <span>Check for bend/pinch</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <strong>GPON Splitter 4C</strong>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>Normal (-18.1 dBm)</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '92%', height: '100%', background: '#10b981' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                        <span>Capacity: 8/16 Ports</span>
                        <span>Spares: 8</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instant Signal Prober */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wifi size={16} color="#0f766e" /> Quick Optical Prober
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                    Trigger real-time telemetry check on active customer splitter drops.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Target Splitter Node</label>
                      <select className="form-control" value={probeSplitter} onChange={(e) => setProbeSplitter(e.target.value)} style={{ fontSize: '0.8rem' }}>
                        <option value="Splitter 4A">Splitter 4A (DHA Phase 4 Sec A)</option>
                        <option value="Splitter 4B">Splitter 4B (DHA Phase 4 Sec B)</option>
                        <option value="Splitter 4C">Splitter 4C (DHA Phase 4 Sec C)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Splitter Distribution Port</label>
                      <select className="form-control" value={probePort} onChange={(e) => setProbePort(e.target.value)} style={{ fontSize: '0.8rem' }}>
                        {Array.from({ length: 16 }).map((_, i) => (
                          <option key={i} value={`Port ${i+1}`}>Port {i+1}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', background: '#0f766e', fontSize: '0.8rem', padding: '0.6rem' }} 
                    onClick={runSignalProbe}
                    disabled={probing}
                  >
                    {probing ? 'Sending Light Probes...' : 'Probe Optical Link'}
                  </button>

                  {probing && (
                    <div style={{ textAlign: 'center', margin: '1rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      <RefreshCw className="animate-spin" size={16} style={{ margin: '0 auto 0.5rem' }} />
                      Injecting OTDR Signal test...
                    </div>
                  )}

                  {probeResult && (
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '1.25rem', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 700, color: '#0f766e', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} color="#10b981" /> Telemetry Log Success
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>OTDR Result:</span>
                          <strong>{probeResult.status}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Attenuation:</span>
                          <strong style={{ color: probeResult.attenuation < -25 ? '#ef4444' : '#10b981' }}>{probeResult.attenuation} dB</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>RX Power Level:</span>
                          <strong>{probeResult.rxPower} dBm</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Fiber Distance:</span>
                          <span>{probeResult.distance} km</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                          {probeResult.framing} | {probeResult.laserStatus}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Fiber GPON Diagnostic Analyzer</h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Deploy diagnostic tests to verify attenuation, splitters loss, and segment fault distance.</p>
                </div>
                <button className="btn btn-primary" style={{ background: '#0f766e' }} onClick={runSignalProbe} disabled={probing}>
                  {probing ? 'Analyzing...' : 'Run Global Sector Sweep'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Splicing Attenuation Metrics (Normal Range: -15dBm to -25dBm)</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', color: '#64748b', fontSize: '0.75rem' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Component</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Signal Level</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Loss (dB)</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>DHA Core Optical Line Terminal (OLT)</td>
                        <td style={{ padding: '0.75rem' }}>+2.5 dBm</td>
                        <td style={{ padding: '0.75rem' }}>0.0 dB</td>
                        <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 600 }}>Active</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>Feeder Fiber Core Link (OLT to GPON 4)</td>
                        <td style={{ padding: '0.75rem' }}>-3.2 dBm</td>
                        <td style={{ padding: '0.75rem' }}>0.8 dB</td>
                        <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 600 }}>Good</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>GPON Splitter 4A (1:16 Block J)</td>
                        <td style={{ padding: '0.75rem' }}>-19.5 dBm</td>
                        <td style={{ padding: '0.75rem' }}>14.2 dB</td>
                        <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 600 }}>Healthy</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>GPON Splitter 4B (1:16 Block Y)</td>
                        <td style={{ padding: '0.75rem', color: '#ef4444' }}>-28.2 dBm</td>
                        <td style={{ padding: '0.75rem', color: '#ef4444' }}>21.8 dB</td>
                        <td style={{ padding: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Attenuation Fault</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>GPON Splitter 4C (1:16 Block G)</td>
                        <td style={{ padding: '0.75rem' }}>-18.1 dBm</td>
                        <td style={{ padding: '0.75rem' }}>13.9 dB</td>
                        <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 600 }}>Healthy</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ marginTop: '2rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <AlertTriangle size={24} color="#d97706" />
                    <div style={{ fontSize: '0.8rem' }}>
                      <strong>High attenuation alert:</strong> Splitter 4B exhibits signal degradation exceeding -27dBm. This usually indicates a micro-bend or pinch in the distribution fiber trunk. Review the physical splice closure located in Block Y street cabinets.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Launch Fiber OTDR Test</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Wavelength Filter</span>
                      <strong>Single-mode 1310 / 1550 nm</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Pulse Width Range</span>
                      <strong>10 ns (Short Range Distribution)</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Active Diagnostics Status</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                        Receiver Module Operational
                      </div>
                    </div>

                    <button 
                      className="btn" 
                      style={{ background: '#090d16', color: 'white', fontSize: '0.8rem', padding: '0.6rem', marginTop: '1rem' }} 
                      onClick={() => alert('Starting Optical Time Domain Reflectometer sweep. Telemetry results pushed to logs.')}
                    >
                      Trigger OTDR Sweep (30s)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>DHA Phase 4 Splitters Map</h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Shows the layout of GPON splitters, splice cabinets, and client connection routes in DHA sector.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span> Normal</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span> Attenuation warning</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span> Fiber Cut</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                
                {/* SVG Map Canvas */}
                <div style={{ background: '#090d16', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyItems: 'center', height: '400px', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 600 350">
                    {/* Fiber Paths */}
                    <path d="M 50 175 L 180 175" stroke="#38bdf8" strokeWidth="3" strokeDasharray="5,5" />
                    <path d="M 180 175 L 300 80" stroke="#10b981" strokeWidth="2" />
                    <path d="M 180 175 L 300 175" stroke="#f59e0b" strokeWidth="2.5" />
                    <path d="M 180 175 L 300 270" stroke="#10b981" strokeWidth="2" />
                    
                    {/* Core Exchange node */}
                    <circle cx="50" cy="175" r="12" fill="#0d9488" />
                    <text x="35" y="152" fill="white" fontSize="10" fontWeight="bold">DHA OLT Gateway</text>

                    {/* Intermediate splice closure */}
                    <rect x="165" y="160" width="30" height="30" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                    <text x="145" y="150" fill="#e2e8f0" fontSize="9">Splice Box 4</text>

                    {/* Splitter 4A (Green) */}
                    <circle cx="300" cy="80" r="10" fill="#10b981" cursor="pointer" onClick={() => alert('Splitter 4A: Normal. Load: 14/16. Status: Healthy.')} />
                    <text x="318" y="84" fill="white" fontSize="10">Splitter 4A (Sector A)</text>

                    {/* Splitter 4B (Amber) */}
                    <circle cx="300" cy="175" r="10" fill="#f59e0b" cursor="pointer" onClick={() => alert('Splitter 4B: High Attenuation. Load: 16/16. Status: Check trunk splice.')} />
                    <text x="318" y="179" fill="white" fontSize="10" fontWeight="bold">Splitter 4B (Sector B) *Alert</text>

                    {/* Splitter 4C (Green) */}
                    <circle cx="300" cy="270" r="10" fill="#10b981" cursor="pointer" onClick={() => alert('Splitter 4C: Normal. Load: 8/16. Status: Healthy.')} />
                    <text x="318" y="274" fill="white" fontSize="10">Splitter 4C (Sector C)</text>

                    {/* Customer Drop Lines */}
                    <line x1="300" y1="80" x2="380" y2="50" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="300" y1="80" x2="380" y2="100" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="300" y1="270" x2="380" y2="240" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="300" y1="270" x2="380" y2="300" stroke="#cbd5e1" strokeWidth="1" />
                  </svg>
                  
                  <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                    *Click on Splitter nodes to inspect physical site details.
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Active Dispatch Area</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Assigned Sector:</span>
                      <strong style={{ display: 'block', marginTop: '2px' }}>DHA Phase 4, Lahore</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Active Incidents:</span>
                      <strong style={{ display: 'block', marginTop: '2px', color: '#ef4444' }}>1 Signal Degradation (Splitter 4B)</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>GPS Coordinates:</span>
                      <span style={{ display: 'block', marginTop: '2px', fontFamily: 'monospace' }}>31.4725° N, 74.3986° E</span>
                    </div>

                    <button 
                      className="btn btn-outline" 
                      style={{ marginTop: '1rem', width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                      onClick={() => alert('Offline map packet downloaded to mobile terminal cache.')}
                    >
                      Download Offline Sector Map
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>SLA & Performance Dashboard</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Track weekly SLA targets, completion ratings, and team leaderboard positions.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>SLA Target Response Time</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f766e', marginTop: '4px' }}>98.4%</div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                    <TrendingUp size={12} /> +1.2% this week
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Average Incident Resolution</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f766e', marginTop: '4px' }}>38 mins</div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                    <TrendingUp size={12} /> -5 mins checkouts
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Total Weekly Closed Tasks</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f766e', marginTop: '4px' }}>24 Jobs</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    Target: 20 Jobs Closed
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>DHA Sector Team Leaderboard (This Month)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 800, color: '#0f766e' }}>#1</span>
                        <strong>Usman Tariq (You)</strong>
                      </div>
                      <span style={{ color: '#0d9488', fontWeight: 700 }}>98.4% SLA (24 Resolved)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 800, color: '#64748b' }}>#2</span>
                        <span>Faisal Khan</span>
                      </div>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>96.1% SLA (21 Resolved)</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 800, color: '#64748b' }}>#3</span>
                        <span>Amir Raza</span>
                      </div>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>94.2% SLA (18 Resolved)</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Earned Badges</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '0.35rem 0.65rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '20px' }}>
                      <Zap size={12} /> Fibre Master
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '0.35rem 0.65rem', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '20px' }}>
                      <Award size={12} /> SLA Champion
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '0.35rem 0.65rem', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '20px' }}>
                      <CheckCircle2 size={12} /> Quick Responder
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
