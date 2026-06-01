import { useState, useEffect } from 'react';
import { Lightbulb, Send, User, Check, RefreshCw } from 'lucide-react';
import { getTickets, updateTicket, getTechnicians, draftReply } from '../services/db';
import type { Ticket, Technician } from '../services/db';

export default function Complaints() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrafting, setIsDrafting] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<'All' | 'Urgent' | 'Open' | 'In Progress' | 'Resolved'>('All');
  
  // Assign state
  const [selectedTechEmail, setSelectedTechEmail] = useState('');
  
  // Note state
  const [noteText, setNoteText] = useState('');

  const fetchData = async () => {
    try {
      const ticketData = await getTickets();
      const techData = await getTechnicians();
      setTickets(ticketData);
      setTechs(techData);

      // Re-assign selected ticket if it changed
      if (ticketData.length > 0) {
        if (selectedTicket) {
          const fresh = ticketData.find(t => t.id === selectedTicket.id);
          setSelectedTicket(fresh || ticketData[0]);
        } else {
          setSelectedTicket(ticketData[0]);
        }
      } else {
        setSelectedTicket(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedTicket || !selectedTicket.id || !selectedTechEmail) return;

    const assignedTech = techs.find((tech) => tech.email === selectedTechEmail);

    try {
      await updateTicket(selectedTicket.id, {
        assignedTechnician: selectedTechEmail,
        status: 'Assigned'
      });
      setSelectedTechEmail('');
      fetchData();
      alert(`Ticket assigned to ${assignedTech?.name ?? selectedTechEmail}!`);
    } catch (err) {
      alert("Failed to assign technician.");
    }
  };

  const handleStatusUpdate = async (status: Ticket['status']) => {
    if (!selectedTicket || !selectedTicket.id) return;
    try {
      await updateTicket(selectedTicket.id, { status });
      fetchData();
    } catch (err) {
      alert("Failed to update ticket status.");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !selectedTicket.id || !noteText) return;
    try {
      const currentNotes = selectedTicket.notes || [];
      const updatedNotes = [
        ...currentNotes,
        {
          author: 'Admin Dispatcher',
          text: noteText,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      ];

      await updateTicket(selectedTicket.id, { notes: updatedNotes });
      setNoteText('');
      fetchData();
    } catch (err) {
      alert("Failed to add note.");
    }
  };

  const handleDraftReply = async () => {
    if (!selectedTicket || !selectedTicket.id) return;
    setIsDrafting(true);
    try {
      const response = await draftReply(selectedTicket.id);
      if (response && response.reply) {
        setNoteText(response.reply);
      }
    } catch (err: any) {
      alert("Failed to draft AI reply: " + (err.message || 'Error occurred'));
    } finally {
      setIsDrafting(false);
    }
  };

  // Filtering
  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Urgent') return t.priority === 'Urgent';
    if (activeTab === 'Open') return t.status === 'Submitted' || t.status === 'AI Analyzed' || t.status === 'Assigned';
    if (activeTab === 'In Progress') return t.status === 'In Progress';
    if (activeTab === 'Resolved') return t.status === 'Resolved';
    return true;
  });

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%' }}>
      
      {/* List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            Complaints Queue <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>({tickets.filter(t => t.status !== 'Resolved').length} open)</span>
          </h1>
          <button className="btn btn-outline" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }} onClick={fetchData}>
             <RefreshCw size={16} /> Refresh
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', paddingBottom: '0.5rem', fontSize: '0.875rem' }}>
          {(['All', 'Urgent', 'Open', 'In Progress', 'Resolved'] as const).map(tab => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                fontWeight: activeTab === tab ? 600 : 400, 
                borderBottom: activeTab === tab ? '2px solid var(--text-dark)' : 'none', 
                paddingBottom: '0.5rem', 
                marginBottom: '-0.6rem',
                cursor: 'pointer',
                color: tab === 'Urgent' ? 'var(--danger)' : activeTab === tab ? 'var(--text-dark)' : 'var(--text-light)'
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Complaints Listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No tickets in this tab collection.</div>
          ) : (
            filteredTickets.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedTicket(c)}
                className="glass-panel" 
                style={{ 
                  padding: '0', 
                  display: 'flex', 
                  cursor: 'pointer',
                  border: selectedTicket?.id === c.id ? '2px solid #0f766e' : '1px solid var(--border-color)',
                  overflow: 'hidden',
                  background: selectedTicket?.id === c.id ? '#f0fdf4' : 'white'
                }}
              >
                <div style={{ width: '8px', background: c.priority === 'Urgent' ? 'var(--danger)' : c.priority === 'Medium' ? '#f59e0b' : '#10b981' }}></div>
                <div style={{ padding: '1rem', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 2 }}>
                     <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                       <User size={20} />
                     </div>
                     <div>
                       <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Ticket #{c.ticketNo}</div>
                       <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.customerName}</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{c.description}</div>
                     </div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>Priority</div>
                    <span className={`badge ${c.priority === 'Urgent' ? 'badge-danger' : c.priority === 'Medium' ? 'badge-warning' : 'badge-success'}`}>{c.priority}</span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>Category</div>
                    <span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-dark)' }}>{c.category}</span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', flex: 1, textAlign: 'right' }}>
                    Status: <strong>{c.status}</strong>
                    {c.assignedTechnician && <div style={{ fontSize: '0.65rem', color: '#0d9488', marginTop: '0.25rem' }}>Assigned: {c.assignedTechnician}</div>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ticket Details Panel */}
      {selectedTicket && (
        <div className="glass-panel" style={{ width: '450px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', margin: 0, marginBottom: '0.25rem' }}>Ticket #{selectedTicket.ticketNo}</h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)' }}>
              Customer: <strong>{selectedTicket.customerName}</strong>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0f766e, #0d9488)', borderRadius: '12px', padding: '1.25rem', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>
               <Lightbulb size={18} /> AI Diagnostic Recommendation
            </div>
            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div><span style={{ opacity: 0.85 }}>Category:</span> {selectedTicket.category}</div>
              <div><span style={{ opacity: 0.85 }}>Priority:</span> {selectedTicket.priority}</div>
              <div><span style={{ opacity: 0.85 }}>Diagnostic Checklist:</span> Ping gateway IP, verify optical link power dbm values. Suggest ONT restart.</div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-dark)', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-light)' }}>Complaint Description:</div>
            "{selectedTicket.description}"
          </div>

          {/* Technician Assignment */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Field Technician Dispatch</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                className="form-control" 
                value={selectedTechEmail} 
                onChange={(e) => setSelectedTechEmail(e.target.value)}
                style={{ flex: 1, background: 'white' }}
              >
                <option value="">Select a technician...</option>
                {techs.map(t => (
                  <option key={t.id} value={t.email}>{t.name} ({t.area} - {t.status})</option>
                ))}
              </select>
              <button className="btn" style={{ background: '#0f766e', color: 'white' }} onClick={handleAssign}>Assign</button>
            </div>
          </div>

          {/* Timeline workflow & Add Note */}
          <div style={{ display: 'flex', gap: '1rem', flex: 1, borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
             
             {/* Dynamic Status Switcher */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem', width: '150px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Ticket Status</div>
                {(['Submitted', 'AI Analyzed', 'Assigned', 'In Progress', 'Resolved'] as const).map((st) => {
                  const isActive = selectedTicket.status === st;
                  return (
                    <button
                      key={st}
                      onClick={() => handleStatusUpdate(st)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        color: isActive ? '#0f766e' : 'var(--text-light)',
                        fontWeight: isActive ? 700 : 400,
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      {isActive ? <Check size={12} color="#0f766e" /> : '○'} {st}
                    </button>
                  );
                })}
             </div>
             
             {/* Notes timeline logs */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Notes Log</label>
               <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem', background: '#fafafa', maxHeight: '100px', fontSize: '0.75rem' }}>
                  {selectedTicket.notes && selectedTicket.notes.length > 0 ? (
                    selectedTicket.notes.map((n, i) => (
                      <div key={i} style={{ borderBottom: '1px solid #eee', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>
                         <span style={{ fontWeight: 600, color: '#0f766e' }}>{n.author}</span> <span style={{ color: 'var(--text-light)', fontSize: '0.65rem' }}>({n.date})</span>: {n.text}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-light)' }}>No notes logs on this ticket.</div>
                  )}
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                 <button 
                   type="button"
                   className="btn" 
                   onClick={handleDraftReply}
                   disabled={isDrafting}
                   style={{ background: '#f8fafc', color: '#6d28d9', border: '1px solid #c4b5fd', fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                 >
                   ✨ {isDrafting ? 'Drafting...' : 'Draft AI Reply'}
                 </button>
               </div>
               
               <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                 <input 
                   type="text" 
                   className="form-control" 
                   value={noteText}
                   onChange={(e) => setNoteText(e.target.value)}
                   placeholder="Add a new update note..." 
                   style={{ fontSize: '0.8rem', padding: '0.35rem' }} 
                   required
                 />
                 <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', background: '#0f766e' }}>
                   <Send size={12} />
                 </button>
               </form>
             </div>

          </div>

        </div>
      )}
    </div>
  );
}
