import { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  CreditCard, 
  Cpu, 
  Shield, 
  Save, 
  RefreshCw,
  Users,
  Plus,
  Trash2,
  Edit,
  Github,
  Linkedin,
  Globe,
  Mail,
  X
} from 'lucide-react';
import { getSystemSettings, updateSystemSettings } from '../services/db';
import type { SystemSettings } from '../services/db';
import { developers as initialDevelopers } from '../data/developers';
import type { Developer } from '../data/developers';
import Avatar from '../components/Avatar';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Development Team states
  const [team, setTeam] = useState<Developer[]>(initialDevelopers);
  const [teamAddModalOpen, setTeamAddModalOpen] = useState(false);
  const [teamEditModalOpen, setTeamEditModalOpen] = useState(false);
  const [editingDev, setEditingDev] = useState<Developer | null>(null);
  const [teamSaveSuccess, setTeamSaveSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const formFirstFieldRef = useRef<HTMLInputElement | null>(null);

  // Form fields for Add/Edit
  const [devName, setDevName] = useState('');
  const [devRole, setDevRole] = useState('');
  const [devAvatar, setDevAvatar] = useState('');
  const [devBio, setDevBio] = useState('');
  const [devGithub, setDevGithub] = useState('');
  const [devLinkedin, setDevLinkedin] = useState('');
  const [devPortfolio, setDevPortfolio] = useState('');
  const [devEmail, setDevEmail] = useState('');
  const [devErrors, setDevErrors] = useState<Record<string, string>>({});

  const validateDevForm = () => {
    const errs: Record<string, string> = {};
    if (!devName.trim()) errs.name = 'Name is required.';
    if (!devRole.trim()) errs.role = 'Role is required.';
    if (devEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(devEmail)) {
      errs.email = 'Invalid email address.';
    }
    setDevErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const openAddModal = () => {
    setDevName('');
    setDevRole('');
    setDevAvatar('');
    setDevBio('');
    setDevGithub('');
    setDevLinkedin('');
    setDevPortfolio('');
    setDevEmail('');
    setDevErrors({});
    setEditingDev(null);
    setDeleteConfirmId(null);
    setTeamEditModalOpen(false);
    setTeamAddModalOpen(true);
  };

  const handleAddDeveloper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDevForm()) return;
    const newDev: Developer = {
      id: Date.now().toString(),
      name: devName,
      role: devRole,
      avatar: devAvatar,
      bio: devBio,
      github: devGithub,
      linkedin: devLinkedin,
      portfolio: devPortfolio,
      email: devEmail
    };
    setTeam([...team, newDev]);
    setTeamAddModalOpen(false);
  };

  const openEditModal = (dev: Developer) => {
    setEditingDev(dev);
    setDevName(dev.name);
    setDevRole(dev.role);
    setDevAvatar(dev.avatar || '');
    setDevBio(dev.bio || '');
    setDevGithub(dev.github || '');
    setDevLinkedin(dev.linkedin || '');
    setDevPortfolio(dev.portfolio || '');
    setDevEmail(dev.email || '');
    setDevErrors({});
    setTeamAddModalOpen(false);
    setDeleteConfirmId(null);
    setTeamEditModalOpen(true);
  };

  const handleEditDeveloper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDev || !validateDevForm()) return;
    const updatedTeam = team.map(d => {
      if (d.id === editingDev.id) {
        return {
          ...d,
          name: devName,
          role: devRole,
          avatar: devAvatar,
          bio: devBio,
          github: devGithub,
          linkedin: devLinkedin,
          portfolio: devPortfolio,
          email: devEmail
        };
      }
      return d;
    });
    setTeam(updatedTeam);
    setTeamEditModalOpen(false);
    setEditingDev(null);
  };

  const handleDeleteDeveloper = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteDeveloper = () => {
    if (!deleteConfirmId) return;
    setTeam(team.filter((d) => d.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  const cancelDeleteDeveloper = () => {
    setDeleteConfirmId(null);
  };

  const [config, setConfig] = useState<SystemSettings>({
    ispName: 'NetFlow Broadband Ltd.',
    supportPhone: '+92 42 111-638-356',
    supportEmail: 'support@netflow.com.pk',
    currency: 'PKR',
    taxRate: '16',
    lateFee: '200',
    billingDay: '5',
    aiModel: 'llama-3.1-8b-instant',
    apiKey: '••••••••••••••••••••••••••••••••',
    autoPrioritize: true,
  });

  const fetchSettings = async () => {
    try {
      const dbConfig = await getSystemSettings();
      setConfig(dbConfig);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (teamAddModalOpen || teamEditModalOpen) {
      formFirstFieldRef.current?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (teamAddModalOpen) {
          setTeamAddModalOpen(false);
        }
        if (teamEditModalOpen) {
          setTeamEditModalOpen(false);
          setEditingDev(null);
        }
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
        }
      }
    };

    if (teamAddModalOpen || teamEditModalOpen || deleteConfirmId) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [teamAddModalOpen, teamEditModalOpen, deleteConfirmId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'team') {
      console.log('Development Team Saved Config:', team);
      setTeamSaveSuccess(true);
      setTimeout(() => setTeamSaveSuccess(false), 3000);
      return;
    }
    try {
      await updateSystemSettings(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings.');
    }
  };

  const tabs = [
    { id: 'general', name: 'General Settings', icon: <SettingsIcon size={18} /> },
    { id: 'billing', name: 'Billing & Invoices', icon: <CreditCard size={18} /> },
    { id: 'ai', name: 'AI NLP Settings', icon: <Cpu size={18} /> },
    { id: 'security', name: 'System Access & Roles', icon: <Shield size={18} /> },
    { id: 'team', name: 'Development Team', icon: <Users size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', height: '100%' }}>
      
      {/* Sidebar Tabs */}
      <div style={{ width: '100%', maxWidth: '240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
         <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Settings</h1>
         {tabs.map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             style={{
               display: 'flex',
               alignItems: 'center',
               gap: '0.75rem',
               padding: '0.85rem 1rem',
               borderRadius: '8px',
               border: '1px solid transparent',
               background: activeTab === tab.id ? '#0f766e' : 'white',
               color: activeTab === tab.id ? 'white' : 'var(--text-dark)',
               fontWeight: activeTab === tab.id ? 600 : 500,
               cursor: 'pointer',
               boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
               textAlign: 'left',
               transition: 'all 0.2s'
             }}
           >
             {tab.icon}
             {tab.name}
           </button>
         ))}
      </div>

      {/* Main Settings Card */}
      <div className="glass-panel" style={{ flex: 1, minWidth: 0, padding: '2.5rem', background: 'white' }}>
         {loading ? (
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: 'var(--text-light)' }}>
              <RefreshCw size={18} className="animate-spin" /> Loading ISP Parameters...
           </div>
         ) : (
           <form onSubmit={handleSave} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              
              {activeTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>General ISP Details</h2>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                     <div>
                       <label className="form-label">ISP Registered Brand Name</label>
                       <input type="text" className="form-control" value={config.ispName} onChange={(e) => setConfig({...config, ispName: e.target.value})} style={{ background: '#f8fafc' }} required />
                     </div>
                     <div>
                       <label className="form-label">Operations HQ Area</label>
                       <input type="text" className="form-control" value="DHA Phase 4, Lahore" disabled />
                     </div>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                     <div>
                       <label className="form-label">Customer Support Hotline</label>
                       <input type="text" className="form-control" value={config.supportPhone} onChange={(e) => setConfig({...config, supportPhone: e.target.value})} style={{ background: '#f8fafc' }} required />
                     </div>
                     <div>
                       <label className="form-label">System Notification Email</label>
                       <input type="email" className="form-control" value={config.supportEmail} onChange={(e) => setConfig({...config, supportEmail: e.target.value})} style={{ background: '#f8fafc' }} required />
                     </div>
                   </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Billing Parameters</h2>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                     <div>
                       <label className="form-label">Sales Tax / GST (%)</label>
                       <input type="text" className="form-control" value={config.taxRate} onChange={(e) => setConfig({...config, taxRate: e.target.value})} style={{ background: '#f8fafc' }} required />
                     </div>
                     <div>
                       <label className="form-label">Late Payment Penalty (PKR)</label>
                       <input type="text" className="form-control" value={config.lateFee} onChange={(e) => setConfig({...config, lateFee: e.target.value})} style={{ background: '#f8fafc' }} required />
                     </div>
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                     <div>
                       <label className="form-label">Monthly Invoice Generation Day</label>
                       <select className="form-control" value={config.billingDay} onChange={(e) => setConfig({...config, billingDay: e.target.value})} style={{ background: '#f8fafc' }}>
                          <option value="1">1st of Month</option>
                          <option value="5">5th of Month</option>
                          <option value="10">10th of Month</option>
                       </select>
                     </div>
                     <div>
                       <label className="form-label">Base Transaction Currency</label>
                       <input type="text" className="form-control" value={config.currency} disabled />
                     </div>
                   </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>LLM AI Integration</h2>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                     <div>
                       <label className="form-label">NLP Model Architecture</label>
                       <select className="form-control" value={config.aiModel} onChange={(e) => setConfig({...config, aiModel: e.target.value})} style={{ background: '#f8fafc' }}>
                          <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fast)</option>
                          <option value="llama-3.3-70b-versatile">Llama 3.3 70B (High Quality)</option>
                          <option value="qwen/qwen3-32b">Qwen 3 32B (Advanced)</option>
                       </select>
                     </div>
                     <div>
                       <label className="form-label">Developer API Endpoint Key</label>
                       <input type="password" className="form-control" value={config.apiKey} onChange={(e) => setConfig({...config, apiKey: e.target.value})} style={{ background: '#f8fafc' }} required />
                     </div>
                   </div>

                   <div>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#f8fafc' }}>
                        <input 
                          type="checkbox" 
                          checked={config.autoPrioritize} 
                          onChange={(e) => setConfig({...config, autoPrioritize: e.target.checked})}
                          style={{ width: '18px', height: '18px', accentColor: '#0f766e' }}
                        />
                        <div>
                           <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Enable AI Ticket Auto-Prioritization</div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.1rem' }}>Automatically sets priority (Low/Medium/Urgent) on customer complaint text classification.</div>
                        </div>
                     </label>
                   </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Team Access & Control</h2>
                   
                   <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
                         <span>User Profile</span>
                         <span>Assigned Role</span>
                         <span>System Privileges</span>
                      </div>
                      {[
                        { name: 'Admin Manager', role: 'Superadmin', priv: 'Full Settings & DB Writes' },
                        { name: 'Sohail Butt', role: 'Support Agent', priv: 'Tickets Read/Write, Invoices Read' },
                        { name: 'Imran Malik', role: 'Dispatcher', priv: 'Technician Assignment Only' },
                      ].map((user, i) => (
                        <div key={i} style={{ padding: '0.75rem 1rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', fontSize: '0.85rem', borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none' }}>
                           <span style={{ fontWeight: 500 }}>{user.name}</span>
                           <span className="badge" style={{ background: '#f1f5f9', color: '#475569', alignSelf: 'center', justifySelf: 'start', fontSize: '0.75rem' }}>{user.role}</span>
                           <span style={{ color: 'var(--text-light)' }}>{user.priv}</span>
                        </div>
                      ))}
                    </div>
                 </div>
               )}

               {activeTab === 'team' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Header Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                       <div>
                          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#111827' }}>Development Team</h2>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.35rem', maxWidth: '600px', lineHeight: '1.4', marginBottom: 0 }}>
                             Manage the engineering team responsible for ISP automation, platform reliability, and future API integrations.
                          </p>
                       </div>
                       <button
                         type="button"
                         className="btn btn-primary"
                         style={{ background: '#2563eb', display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.625rem 1.25rem', borderRadius: '8px', cursor: 'pointer', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem' }}
                         onClick={openAddModal}
                       >
                          <Plus size={16} /> Add Developer
                       </button>
                    </div>

                    {/* Developer Cards Grid */}
                    {team.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {team.map((dev) => (
                          <div key={dev.id} style={{ 
                           padding: '1.75rem', 
                           display: 'flex', 
                           flexDirection: 'column', 
                           background: '#ffffff', 
                           borderRadius: '16px', 
                           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0, 0, 0, 0.04)',
                           transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                         }}>
                           
                           {/* Card Header (Avatar + Info + Actions) */}
                           <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                             <Avatar src={dev.avatar} name={dev.name} size={56} />
                             <div style={{ flex: 1, minWidth: 0 }}>
                               <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dev.name}</h3>
                               <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', fontWeight: 500, lineHeight: 1.2, marginTop: '2px', wordBreak: 'break-word' }}>{dev.role}</p>
                             </div>
                             
                             {/* Vertical Action Buttons Stacked on Right */}
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'flex-start' }}>
                               <button
                                 type="button"
                                 onClick={() => openEditModal(dev)}
                                 style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                 title="Edit Developer"
                               >
                                 <Edit size={16} />
                               </button>
                               <button
                                 type="button"
                                 onClick={() => handleDeleteDeveloper(dev.id)}
                                 style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                 title="Delete Developer"
                               >
                                 <Trash2 size={16} />
                               </button>
                             </div>
                           </div>

                           {/* Card Body (Bio) */}
                           <p style={{ margin: 0, fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.5', marginTop: '1.25rem', marginBottom: '1.25rem', minHeight: '4.5em' }}>
                             {dev.bio || "No bio provided."}
                           </p>

                           {/* Card Footer (Social Links 2x2 Grid) */}
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto' }}>
                             {dev.github && (
                               <a href={dev.github.startsWith('http') ? dev.github : `https://${dev.github}`} target="_blank" rel="noopener noreferrer" 
                                 style={{ 
                                   display: 'flex', 
                                   alignItems: 'center', 
                                   gap: '0.5rem', 
                                   padding: '0.625rem 0.75rem', 
                                   background: '#f8fafc', 
                                   border: '1px solid #e2e8f0', 
                                   borderRadius: '8px', 
                                   color: '#374151', 
                                   fontSize: '0.85rem', 
                                   fontWeight: 500, 
                                   textDecoration: 'none',
                                   transition: 'all 0.15s ease'
                                 }}
                                 onMouseEnter={(e) => {
                                   e.currentTarget.style.background = '#f1f5f9';
                                   e.currentTarget.style.borderColor = '#cbd5e1';
                                 }}
                                 onMouseLeave={(e) => {
                                   e.currentTarget.style.background = '#f8fafc';
                                   e.currentTarget.style.borderColor = '#e2e8f0';
                                 }}
                               >
                                 <Github size={16} style={{ color: '#475569' }} />
                                 <span>GitHub</span>
                               </a>
                             )}
                             
                             {dev.linkedin && (
                               <a href={dev.linkedin.startsWith('http') ? dev.linkedin : `https://${dev.linkedin}`} target="_blank" rel="noopener noreferrer" 
                                 style={{ 
                                   display: 'flex', 
                                   alignItems: 'center', 
                                   gap: '0.5rem', 
                                   padding: '0.625rem 0.75rem', 
                                   background: '#f8fafc', 
                                   border: '1px solid #e2e8f0', 
                                   borderRadius: '8px', 
                                   color: '#374151', 
                                   fontSize: '0.85rem', 
                                   fontWeight: 500, 
                                   textDecoration: 'none',
                                   transition: 'all 0.15s ease'
                                 }}
                                 onMouseEnter={(e) => {
                                   e.currentTarget.style.background = '#f1f5f9';
                                   e.currentTarget.style.borderColor = '#cbd5e1';
                                 }}
                                 onMouseLeave={(e) => {
                                   e.currentTarget.style.background = '#f8fafc';
                                   e.currentTarget.style.borderColor = '#e2e8f0';
                                 }}
                               >
                                 <Linkedin size={16} style={{ color: '#0077b5' }} />
                                 <span>LinkedIn</span>
                               </a>
                             )}

                             {dev.portfolio && (
                               <a href={dev.portfolio.startsWith('http') ? dev.portfolio : `https://${dev.portfolio}`} target="_blank" rel="noopener noreferrer" 
                                 style={{ 
                                   display: 'flex', 
                                   alignItems: 'center', 
                                   gap: '0.5rem', 
                                   padding: '0.625rem 0.75rem', 
                                   background: '#f8fafc', 
                                   border: '1px solid #e2e8f0', 
                                   borderRadius: '8px', 
                                   color: '#374151', 
                                   fontSize: '0.85rem', 
                                   fontWeight: 500, 
                                   textDecoration: 'none',
                                   transition: 'all 0.15s ease'
                                 }}
                                 onMouseEnter={(e) => {
                                   e.currentTarget.style.background = '#f1f5f9';
                                   e.currentTarget.style.borderColor = '#cbd5e1';
                                 }}
                                 onMouseLeave={(e) => {
                                   e.currentTarget.style.background = '#f8fafc';
                                   e.currentTarget.style.borderColor = '#e2e8f0';
                                 }}
                               >
                                 <Globe size={16} style={{ color: '#0ea5e9' }} />
                                 <span>Portfolio</span>
                               </a>
                             )}

                             {dev.email && (
                               <a
                                 href={`mailto:${dev.email}?subject=${encodeURIComponent('Regarding your role at ISP System')}&body=${encodeURIComponent(`Hello ${dev.name},\r\n\r\n`)}`}
                                 style={{ 
                                   display: 'flex', 
                                   alignItems: 'center', 
                                   gap: '0.5rem', 
                                   padding: '0.625rem 0.75rem', 
                                   background: '#f8fafc', 
                                   border: '1px solid #e2e8f0', 
                                   borderRadius: '8px', 
                                   color: '#374151', 
                                   fontSize: '0.85rem', 
                                   fontWeight: 500, 
                                   textDecoration: 'none',
                                   transition: 'all 0.15s ease'
                                 }}
                                 onMouseEnter={(e) => {
                                   e.currentTarget.style.background = '#f1f5f9';
                                   e.currentTarget.style.borderColor = '#cbd5e1';
                                 }}
                                 onMouseLeave={(e) => {
                                   e.currentTarget.style.background = '#f8fafc';
                                   e.currentTarget.style.borderColor = '#e2e8f0';
                                 }}
                               >
                                 <Mail size={16} style={{ color: '#e11d48' }} />
                                 <span>Email</span>
                               </a>
                             )}
                           </div>

                         </div>
                       ))}
                     </div>
                   ) : (
                     <div style={{ padding: '2rem', border: '1px dashed #d1d5db', borderRadius: '16px', marginBottom: '2rem', color: '#6b7280', textAlign: 'center' }}>
                       <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>No team members have been added yet.</p>
                       <p style={{ margin: '0.75rem 0 0', lineHeight: 1.6 }}>Click “Add Developer” to create the first profile and keep your Development Team roster easy to manage.</p>
                     </div>
                   )}
                 </div>
               )}

              {/* Bottom Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                 {saveSuccess && (
                   <span style={{ color: '#10b981', fontWeight: 600, alignSelf: 'center', fontSize: '0.875rem' }}>✓ System parameters updated!</span>
                 )}
                 {teamSaveSuccess && activeTab === 'team' && (
                   <span style={{ color: '#10b981', fontWeight: 600, alignSelf: 'center', fontSize: '0.875rem' }}>✓ Development team configuration saved.</span>
                 )}
                 <button type="submit" className="btn btn-primary" style={{ background: '#0f766e', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Save size={16} /> Save Configuration
                 </button>
              </div>

           </form>
          )}
      </div>

      {/* Add Developer Modal */}
      {teamAddModalOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="add-dev-title" onClick={(e) => e.currentTarget === e.target && setTeamAddModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '450px', padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h3 id="add-dev-title" style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Add Developer</h3>
               <button type="button" aria-label="Close add developer dialog" style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-light)' }} onClick={() => setTeamAddModalOpen(false)}>
                 <X size={20} />
               </button>
            </div>

            <form onSubmit={handleAddDeveloper} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                  <label className="form-label">Full Name</label>
                  <input ref={formFirstFieldRef} type="text" className="form-control" value={devName} onChange={(e) => setDevName(e.target.value)} placeholder="e.g. Zarar Malik" required aria-invalid={!!devErrors.name} aria-describedby={devErrors.name ? 'add-dev-name-error' : undefined} />
                  {devErrors.name && <div id="add-dev-name-error" style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{devErrors.name}</div>}
               </div>
               <div>
                  <label className="form-label">Role</label>
                  <input type="text" className="form-control" value={devRole} onChange={(e) => setDevRole(e.target.value)} placeholder="e.g. Full Stack Developer" required aria-invalid={!!devErrors.role} aria-describedby={devErrors.role ? 'add-dev-role-error' : undefined} />
                  {devErrors.role && <div id="add-dev-role-error" style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{devErrors.role}</div>}
               </div>
               <div>
                  <label className="form-label">Avatar URL</label>
                  <input type="text" className="form-control" value={devAvatar} onChange={(e) => setDevAvatar(e.target.value)} placeholder="https://example.com/avatar.jpg" />
               </div>
               <div>
                  <label className="form-label">Bio</label>
                  <textarea className="form-control" value={devBio} onChange={(e) => setDevBio(e.target.value)} placeholder="Tell us about this developer..." style={{ minHeight: '80px', resize: 'vertical' }} />
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                     <label className="form-label">GitHub Profile</label>
                     <input type="text" className="form-control" value={devGithub} onChange={(e) => setDevGithub(e.target.value)} placeholder="github.com/username" />
                  </div>
                  <div>
                     <label className="form-label">LinkedIn Profile</label>
                     <input type="text" className="form-control" value={devLinkedin} onChange={(e) => setDevLinkedin(e.target.value)} placeholder="linkedin.com/in/username" />
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                     <label className="form-label">Portfolio Website</label>
                     <input type="text" className="form-control" value={devPortfolio} onChange={(e) => setDevPortfolio(e.target.value)} placeholder="portfolio.com" />
                  </div>
                  <div>
                     <label className="form-label">Email Address</label>
                     <input type="email" className="form-control" value={devEmail} onChange={(e) => setDevEmail(e.target.value)} placeholder="developer@email.com" />
                     {devErrors.email && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{devErrors.email}</div>}
                  </div>
               </div>

               <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setTeamAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#0f766e' }}>
                     Save Developer
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Developer Modal */}
      {teamEditModalOpen && editingDev && (
        <div role="dialog" aria-modal="true" aria-labelledby="edit-dev-title" onClick={(e) => {
            if (e.currentTarget === e.target) {
              setTeamEditModalOpen(false);
              setEditingDev(null);
            }
          }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '450px', padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h3 id="edit-dev-title" style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Edit Developer</h3>
               <button type="button" aria-label="Close edit developer dialog" style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-light)' }} onClick={() => {
                 setTeamEditModalOpen(false);
                 setEditingDev(null);
               }}>
                 <X size={20} />
               </button>
            </div>

            <form onSubmit={handleEditDeveloper} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" value={devName} onChange={(e) => setDevName(e.target.value)} required aria-invalid={!!devErrors.name} aria-describedby={devErrors.name ? 'edit-dev-name-error' : undefined} />
                  {devErrors.name && <div id="edit-dev-name-error" style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{devErrors.name}</div>}
               </div>
               <div>
                  <label className="form-label">Role</label>
                  <input type="text" className="form-control" value={devRole} onChange={(e) => setDevRole(e.target.value)} required aria-invalid={!!devErrors.role} aria-describedby={devErrors.role ? 'edit-dev-role-error' : undefined} />
                  {devErrors.role && <div id="edit-dev-role-error" style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{devErrors.role}</div>}
               </div>
               <div>
                  <label className="form-label">Avatar URL</label>
                  <input type="text" className="form-control" value={devAvatar} onChange={(e) => setDevAvatar(e.target.value)} />
               </div>
               <div>
                  <label className="form-label">Bio</label>
                  <textarea className="form-control" value={devBio} onChange={(e) => setDevBio(e.target.value)} style={{ minHeight: '80px', resize: 'vertical' }} />
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                     <label className="form-label">GitHub Profile</label>
                     <input type="text" className="form-control" value={devGithub} onChange={(e) => setDevGithub(e.target.value)} />
                  </div>
                  <div>
                     <label className="form-label">LinkedIn Profile</label>
                     <input type="text" className="form-control" value={devLinkedin} onChange={(e) => setDevLinkedin(e.target.value)} />
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                     <label className="form-label">Portfolio Website</label>
                     <input type="text" className="form-control" value={devPortfolio} onChange={(e) => setDevPortfolio(e.target.value)} />
                  </div>
                  <div>
                     <label className="form-label">Email Address</label>
                     <input type="email" className="form-control" value={devEmail} onChange={(e) => setDevEmail(e.target.value)} />
                     {devErrors.email && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{devErrors.email}</div>}
                  </div>
               </div>

               <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
                    setTeamEditModalOpen(false);
                    setEditingDev(null);
                  }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#0f766e' }}>
                     Save Changes
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-dev-confirm-title" onClick={(e) => e.currentTarget === e.target && cancelDeleteDeveloper()} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '420px', padding: '1.75rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.12)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 id="delete-dev-confirm-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Delete Developer?</h3>
              <p style={{ margin: '0.75rem 0 0', color: '#6b7280', lineHeight: 1.5 }}>This action cannot be undone. The developer profile will be removed from the team roster.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={cancelDeleteDeveloper}>Cancel</button>
              <button type="button" className="btn btn-primary" style={{ flex: 1, background: '#dc2626', borderColor: '#dc2626' }} onClick={confirmDeleteDeveloper}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
