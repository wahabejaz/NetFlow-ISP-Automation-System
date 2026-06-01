import { useState, useEffect } from 'react';
import { Search, Plus, Star, MapPin, Phone, Award, ShieldAlert, Eye, Trash2, X, Save, RefreshCw } from 'lucide-react';
import { getTechnicians, addTechnician, updateTechnician, deleteTechnician, getAreas } from '../services/db';
import type { Technician } from '../services/db';
import { formatPhone, validatePhone, validateEmail, validatePasswordStrength } from '../utils/validation';

export default function Technicians() {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Add Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newArea, setNewArea] = useState('');
  const [areaOptions, setAreaOptions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editPassword, setEditPassword] = useState('');

  const fetchTechs = async () => {
    try {
      const data = await getTechnicians();
      setTechs(data);
      if (data.length > 0) {
        setSelectedTech(data[0]);
      } else {
        setSelectedTech(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechs();
  }, []);

  useEffect(() => {
    const loadAreas = async () => {
      try {
        const areaResp = await getAreas();
        setAreaOptions(areaResp.areas || []);
        if (!newArea && areaResp.areas && areaResp.areas.length > 0) {
          setNewArea(areaResp.areas[0]);
        }
      } catch (err) {
        console.error('Failed to load areas for technicians', err);
      }
    };
    loadAreas();
  }, []);

  const getAddErrors = () => {
    const errs: Record<string, string> = {};
    if (!newName.trim()) errs.name = 'Full name is required.';
    else if (newName.trim().length < 3) errs.name = 'Name must be at least 3 characters.';
    
    if (!newPhone.trim()) errs.phone = 'Phone number is required.';
    else if (!validatePhone(newPhone)) errs.phone = 'Phone number must match Pakistani standard format 03XX-XXXXXXX.';
    
    if (!newEmail.trim()) errs.email = 'Email address is required.';
    else if (!validateEmail(newEmail)) errs.email = 'Invalid email address.';
    
    if (!newPassword.trim()) errs.password = 'Account password is required.';
    else {
      const check = validatePasswordStrength(newPassword);
      if (!check.isValid) errs.password = check.message || 'Weak password.';
    }
    
    if (!newArea.trim()) errs.area = 'Assigned area is required.';
    return errs;
  };

  const handleBlur = (field: string) => {
    const errs = getAddErrors();
    setErrors(prev => ({
      ...prev,
      [field]: errs[field] || ''
    }));
  };

  const handleAddChange = (field: string, val: string) => {
    if (field === 'name') setNewName(val);
    else if (field === 'phone') setNewPhone(formatPhone(val));
    else if (field === 'email') setNewEmail(val);
    else if (field === 'password') setNewPassword(val);
    else if (field === 'area') setNewArea(val);
    
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const fieldErrorStyle = (field: string) => {
    return errors[field] ? { borderColor: '#dc2626', boxShadow: '0 0 0 3px rgba(220,38,38,0.06)' } : {};
  };

  const editFieldErrorStyle = (field: string) => {
    return editErrors[field] ? { borderColor: '#dc2626', boxShadow: '0 0 0 3px rgba(220,38,38,0.06)' } : {};
  };

  const getEditErrors = () => {
    const errs: Record<string, string> = {};
    if (!editingTech) return errs;
    
    if (!editingTech.name.trim()) errs.name = 'Full name is required.';
    else if (editingTech.name.trim().length < 3) errs.name = 'Name must be at least 3 characters.';
    
    if (!editingTech.phone.trim()) errs.phone = 'Phone number is required.';
    else if (!validatePhone(editingTech.phone)) errs.phone = 'Phone number must match Pakistani standard format 03XX-XXXXXXX.';
    
    if (!editingTech.email.trim()) errs.email = 'Email address is required.';
    else if (!validateEmail(editingTech.email)) errs.email = 'Invalid email address.';
    
    if (editPassword.trim()) {
      const check = validatePasswordStrength(editPassword);
      if (!check.isValid) errs.password = check.message || 'Weak password.';
    }
    
    if (!editingTech.area.trim()) errs.area = 'Assigned area is required.';
    return errs;
  };

  const handleEditBlur = (field: string) => {
    const errs = getEditErrors();
    setEditErrors(prev => ({
      ...prev,
      [field]: errs[field] || ''
    }));
  };

  const handleEditChange = (field: string, val: string) => {
    if (!editingTech) return;
    
    let finalVal = val;
    if (field === 'phone') {
      finalVal = formatPhone(val);
    }
    
    setEditingTech(prev => prev ? ({ ...prev, [field]: finalVal }) : null);
    
    setEditErrors(prev => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const handleEditPasswordChange = (val: string) => {
    setEditPassword(val);
    setEditErrors(prev => {
      const copy = { ...prev };
      if (!val.trim()) {
        delete copy.password;
      } else {
        const check = validatePasswordStrength(val);
        copy.password = check.isValid ? '' : (check.message || 'Weak password.');
      }
      return copy;
    });
  };

  const handleAddTech = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = getAddErrors();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    try {
      await addTechnician({
        name: newName,
        phone: newPhone,
        email: newEmail,
        area: newArea,
        status: 'Available',
        rating: 5.0,
        jobsCompleted: 0,
        activeJob: 'None',
        password: newPassword
      });
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewPassword('');
      setErrors({});
      setAddModalOpen(false);
      fetchTechs();
      alert('Technician added successfully!');
    } catch (err: any) {
      const msg = err.message || 'Failed to add technician.';
      if (msg.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: msg }));
      } else if (msg.toLowerCase().includes('phone')) {
        setErrors(prev => ({ ...prev, phone: msg }));
      } else {
        alert(msg);
      }
    }
  };

  const openEditModal = (tech: Technician, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTech({ ...tech });
    setEditErrors({});
    setEditPassword('');
    setEditModalOpen(true);
  };

  const handleUpdateTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTech || !editingTech.id) return;
    
    const errs = getEditErrors();
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }
    
    try {
      await updateTechnician(editingTech.id, {
        name: editingTech.name,
        phone: editingTech.phone,
        email: editingTech.email,
        area: editingTech.area,
        status: editingTech.status,
        password: editPassword.trim() ? editPassword : undefined
      });
      setEditModalOpen(false);
      setEditingTech(null);
      setEditPassword('');
      setEditErrors({});
      fetchTechs();
      alert('Technician details updated successfully!');
    } catch (err: any) {
      const msg = err.message || 'Failed to update technician details.';
      if (msg.toLowerCase().includes('email')) {
        setEditErrors(prev => ({ ...prev, email: msg }));
      } else if (msg.toLowerCase().includes('phone')) {
        setEditErrors(prev => ({ ...prev, phone: msg }));
      } else {
        alert(msg);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this technician?")) {
      try {
        await deleteTechnician(id);
        fetchTechs();
      } catch (err) {
        alert('Failed to delete technician.');
      }
    }
  };

  const filteredTechs = techs.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%' }}>
      
      {/* Main List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Technical Operations</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Field Technicians</h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input 
                type="text" 
                placeholder="Search by name or area" 
                className="form-control" 
                style={{ paddingLeft: '2.5rem' }} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn" style={{ background: '#0d9488', color: 'white' }} onClick={() => setAddModalOpen(true)}><Plus size={16} /> Add Technician</button>
            <button className="btn btn-outline" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }} onClick={fetchTechs}>
               <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>Total Staff</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{techs.length}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>Available</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{techs.filter(t => t.status === 'Available').length}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>Active / Busy</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{techs.filter(t => t.status === 'Busy').length}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>Average Rating</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
               <Star size={18} fill="#f59e0b" /> 4.7
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: 'var(--text-dark)' }}>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Technician</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Contact Number</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Assigned Area</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Rating</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Jobs Done</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>Loading dispatchers...</td>
                </tr>
              ) : filteredTechs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>No technicians registered.</td>
                </tr>
              ) : (
                filteredTechs.map((tech) => (
                  <tr 
                    key={tech.id} 
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: selectedTech?.id === tech.id ? '#f1f5f9' : 'transparent' }} 
                    onClick={() => setSelectedTech(tech)}
                  >
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0f766e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                        {tech.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tech.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{tech.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{tech.phone}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}><MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> {tech.area}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <Star size={14} fill="#f59e0b" color="#f59e0b" /> {tech.rating}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{tech.jobsCompleted}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${tech.status === 'Available' ? 'badge-success' : 'badge-danger'}`} style={{ border: `1px solid ${tech.status === 'Available' ? '#86efac' : '#fca5a5'}`, background: 'transparent' }}>
                        {tech.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-light)' }}>
                        <Eye size={18} style={{ cursor: 'pointer' }} onClick={() => setSelectedTech(tech)} />
                        <Trash2 size={18} style={{ cursor: 'pointer' }} onClick={() => handleDelete(tech.id!)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Panel Inspector */}
      {selectedTech && (
        <div className="glass-panel" style={{ width: '320px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Operator Profile</h3>
            <X size={20} style={{ cursor: 'pointer', color: 'var(--text-light)' }} onClick={() => setSelectedTech(null)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
             <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#0f766e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 600, marginBottom: '1rem' }}>
               {selectedTech.name.split(' ').map((n: string) => n[0]).join('')}
             </div>
             <h4 style={{ margin: 0, fontSize: '1.125rem' }}>{selectedTech.name}</h4>
             <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
               <Phone size={12} /> {selectedTech.phone}
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span style={{ color: 'var(--text-light)' }}>Current Area:</span>
               <strong>{selectedTech.area}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span style={{ color: 'var(--text-light)' }}>Email:</span>
               <strong>{selectedTech.email}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <span style={{ color: 'var(--text-light)' }}>Status:</span>
               <span className={`badge ${selectedTech.status === 'Available' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
                 {selectedTech.status}
               </span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
             <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <Award size={16} color="#f59e0b" /> Operations Performance
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
               <span>Jobs Completed:</span> <strong>{selectedTech.jobsCompleted}</strong>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
               <span>Customer Rating:</span> <strong>{selectedTech.rating} / 5.0</strong>
             </div>
          </div>

          <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '2rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem', display: 'flex', gap: '0.25rem', alignItems: 'center', color: '#dc2626' }}>
                 <ShieldAlert size={16} /> Current Active Assignment
              </div>
              <div style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 500 }}>
                 {selectedTech.activeJob}
              </div>
           </div>

           <button 
             className="btn" 
             style={{ background: '#0d9488', color: 'white', width: '100%', marginTop: 'auto' }}
             onClick={(e) => openEditModal(selectedTech, e)}
           >
             Edit Details
           </button>
        </div>
      )}

      {/* Add Technician Modal */}
      {addModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '2rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Add Field Operator</h3>
               <X size={20} style={{ cursor: 'pointer', color: 'var(--text-light)' }} onClick={() => setAddModalOpen(false)} />
            </div>

            <form onSubmit={handleAddTech} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" value={newName} onChange={(e) => handleAddChange('name', e.target.value)} onBlur={() => handleBlur('name')} placeholder="e.g. Asif Raza" style={{ ...(fieldErrorStyle('name')) }} required />
                  {errors.name && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.name}</div>}
               </div>
               <div>
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-control" value={newPhone} onChange={(e) => handleAddChange('phone', e.target.value)} onBlur={() => handleBlur('phone')} placeholder="e.g. 0300-1234567" style={{ ...(fieldErrorStyle('phone')) }} required />
                  {errors.phone && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.phone}</div>}
               </div>
               <div>
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" value={newEmail} onChange={(e) => handleAddChange('email', e.target.value)} onBlur={() => handleBlur('email')} placeholder="e.g. asif@netflow.com" style={{ ...(fieldErrorStyle('email')) }} required />
                  {errors.email && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.email}</div>}
               </div>
               <div>
                  <label className="form-label">Account Password</label>
                  <input type="text" className="form-control" value={newPassword} onChange={(e) => handleAddChange('password', e.target.value)} onBlur={() => handleBlur('password')} placeholder="Set login password" style={{ ...(fieldErrorStyle('password')) }} required />
                  {errors.password && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.password}</div>}
               </div>
               <div>
                  <label className="form-label">Assigned Sector Area</label>
                  <input
                    type="text"
                    className="form-control"
                    list="technician-area-list"
                    value={newArea}
                    onChange={(e) => handleAddChange('area', e.target.value)}
                    onBlur={() => handleBlur('area')}
                    placeholder="Type or choose an area"
                    style={{ ...(fieldErrorStyle('area')) }}
                    required
                  />
                  <datalist id="technician-area-list">
                    {areaOptions.map((area) => (
                      <option key={area} value={area} />
                    ))}
                  </datalist>
                  {errors.area && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.area}</div>}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                    Choose an existing area or enter a custom sector.
                  </div>
               </div>

               <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setAddModalOpen(false)}>Cancel</button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={Object.values(errors).some(err => !!err)}
                    style={{ 
                      flex: 1, 
                      background: Object.values(errors).some(err => !!err) ? '#cbd5e1' : '#0d9488', 
                      display: 'flex', 
                      gap: '0.25rem', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      cursor: Object.values(errors).some(err => !!err) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Save size={16} /> Save operator
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Technician Dialog Modal */}
      {editModalOpen && editingTech && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '450px', padding: '2rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Edit Field Operator Profile</h3>
               <X size={20} style={{ cursor: 'pointer', color: 'var(--text-light)' }} onClick={() => setEditModalOpen(false)} />
            </div>

            <form onSubmit={handleUpdateTech} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" value={editingTech.name} onChange={(e) => handleEditChange('name', e.target.value)} onBlur={() => handleEditBlur('name')} style={{ ...(editFieldErrorStyle('name')) }} required />
                  {editErrors.name && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{editErrors.name}</div>}
               </div>
               <div>
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-control" value={editingTech.phone} onChange={(e) => handleEditChange('phone', e.target.value)} onBlur={() => handleEditBlur('phone')} style={{ ...(editFieldErrorStyle('phone')) }} required />
                  {editErrors.phone && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{editErrors.phone}</div>}
               </div>
               <div>
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" value={editingTech.email} onChange={(e) => handleEditChange('email', e.target.value)} onBlur={() => handleEditBlur('email')} style={{ ...(editFieldErrorStyle('email')) }} required />
                  {editErrors.email && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{editErrors.email}</div>}
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div>
                    <label className="form-label">Assigned Sector Area</label>
                    <input
                      type="text"
                      className="form-control"
                      list="edit-technician-area-list"
                      value={editingTech.area}
                      onChange={(e) => handleEditChange('area', e.target.value)}
                      onBlur={() => handleEditBlur('area')}
                      style={{ ...(editFieldErrorStyle('area')) }}
                      required
                    />
                    <datalist id="edit-technician-area-list">
                      {areaOptions.map((area) => (
                        <option key={area} value={area} />
                      ))}
                    </datalist>
                    {editErrors.area && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{editErrors.area}</div>}
                 </div>
                 <div>
                    <label className="form-label">Operational Status</label>
                    <select className="form-control" value={editingTech.status} onChange={(e) => handleEditChange('status', e.target.value)}>
                       <option value="Available">Available</option>
                       <option value="Busy">Busy</option>
                       <option value="Offline">Offline</option>
                    </select>
                 </div>
               </div>

               <div>
                  <label className="form-label">New Password (Optional)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editPassword} 
                    onChange={(e) => handleEditPasswordChange(e.target.value)} 
                    placeholder="Leave blank to keep current password" 
                  />
                  {editErrors.password && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{editErrors.password}</div>}
               </div>

               <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditModalOpen(false)}>Cancel</button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={Object.values(editErrors).some(err => !!err)}
                    style={{ 
                      flex: 1, 
                      background: Object.values(editErrors).some(err => !!err) ? '#cbd5e1' : '#0d9488', 
                      display: 'flex', 
                      gap: '0.25rem', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      cursor: Object.values(editErrors).some(err => !!err) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Save size={16} /> Save Changes
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
