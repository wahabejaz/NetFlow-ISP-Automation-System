import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Loader2 } from 'lucide-react';
import { getCustomers, addTicket, analyzeComplaint } from '../../services/db';
import type { Customer } from '../../services/db';

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [lastAnalyzedText, setLastAnalyzedText] = useState('');
  
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const email = sessionStorage.getItem('userEmail');
        const list = await getCustomers();
        const match = list.find(c => c.email.toLowerCase() === (email || '').toLowerCase());
        if (match) setCustomer(match);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCustomer();
  }, []);

  const triggerAiAnalysis = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length <= 10) return;
    if (trimmed === lastAnalyzedText.trim()) return;

    setLastAnalyzedText(trimmed);
    setIsAnalyzing(true);
    setAiResult(null);

    try {
      const result = await analyzeComplaint(trimmed);
      setAiResult({
        category: result.category || 'Speed Issue',
        priority: result.priority || 'Medium',
        fix: result.action || 'Power cycle your ONT device and wait 3 minutes.'
      });
    } catch (err) {
      console.error("AI analysis error:", err);
      // Fallback heuristics
      let category = 'Speed Issue';
      let priority = 'Medium';
      let fix = 'Power cycle your ONT device and wait 3 minutes.';

      const descLower = trimmed.toLowerCase();
      if (descLower.includes('bill') || descLower.includes('payment') || descLower.includes('charge')) {
        category = 'Billing Dispute';
        priority = 'Low';
        fix = 'Our billing team will review your credit transaction invoice manually.';
      } else if (descLower.includes('no internet') || descLower.includes('red light') || descLower.includes('los')) {
        category = 'Area Outage';
        priority = 'Urgent';
        fix = 'Core optical link signal loss detected. A tech is inspecting the splitter cabinet.';
      } else if (descLower.includes('disconnect') || descLower.includes('drop') || descLower.includes('wifi')) {
        category = 'ONT Router';
        priority = 'Medium';
        fix = 'WiFi channel interference detected. Try changing to 5Ghz channel band.';
      }
      setAiResult({ category, priority, fix });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerAiAnalysis(description);
    }
  };

  // Debounced auto-analysis
  useEffect(() => {
    const trimmed = description.trim();
    if (trimmed.length > 10) {
      const timer = setTimeout(() => {
        triggerAiAnalysis(description);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setIsAnalyzing(false);
      setAiResult(null);
      setLastAnalyzedText('');
    }
  }, [description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.length <= 10) return;
    try {
      const ticketNo = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      await addTicket({
        ticketNo,
        customerId: customer?.id || 'guest_id',
        customerName: customer?.fullName || 'Guest User',
        category: aiResult?.category || 'General Help',
        priority: aiResult?.priority || 'Low',
        description,
        status: 'Submitted',
        createdAt: new Date().toISOString(),
        notes: [
          {
            author: 'AI Analyzer',
            text: `Automatically assigned category: ${aiResult?.category || 'General Help'}. Suggested fix: ${aiResult?.fix || 'Check router power cable.'}`,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          }
        ]
      });

      alert('Complaint ticket submitted successfully.');
      navigate('/customer-portal');
    } catch (err) {
      alert('Failed to submit ticket.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Submit a Complaint</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>Our AI assistant will automatically categorize and prioritize your issue.</p>

      <div className="glass-panel" style={{ padding: '2rem', background: 'white' }}>
        
        {/* Step 1 */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Step 1: Describe Your Issue</h2>
            <textarea 
              className="form-control" 
              rows={5} 
              placeholder="Describe your internet problem in detail... e.g. My internet has been disconnecting every 30 minutes since yesterday evening."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ resize: 'none' }}
              required
            />
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
              {description.length}/500
            </div>
          </div>

          {/* AI Analysis Box */}
          {(isAnalyzing || aiResult) && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', marginBottom: '2rem' }}>
              {isAnalyzing ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-dark)', fontWeight: 600 }}>
                  <span>AI Diagnostics inspecting link...</span>
                  <Loader2 className="animate-spin" size={20} color="#0d9488" />
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#0d9488' }}>AI Auto-Priority Classifier:</div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-dark)', fontSize: '0.875rem' }}>
                    <li><strong>Category:</strong> {aiResult.category}</li>
                    <li><strong>Urgency Priority:</strong> <span style={{ color: aiResult.priority === 'Urgent' ? '#ef4444' : '#d97706', fontWeight: 700 }}>{aiResult.priority}</span></li>
                    <li><strong>Self-Service Fix:</strong> {aiResult.fix}</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 2 */}
          <div style={{ opacity: description.length > 10 && !isAnalyzing ? 1 : 0.5, pointerEvents: description.length > 10 && !isAnalyzing ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Step 2: Additional Info</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-light)', position: 'relative', top: '8px', left: '12px', background: 'white', padding: '0 4px', zIndex: 1 }}>Issue since when?</label>
              <select className="form-control" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="2-3 days">2–3 days ago</option>
                <option value="1 week+">More than a week</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" /> Affects all devices
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" /> Only WiFi drops
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" /> High peak hours only
              </label>
            </div>

            <button type="button" className="btn btn-outline" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
              <UploadCloud size={16} /> Attach router screenshot / traceroute (optional)
            </button>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', background: '#0f766e' }}>
              Submit Dispatch Ticket
            </button>
          </div>
        </form>

      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <a href="/customer-portal/chat" style={{ color: '#0f766e', fontWeight: 600, textDecoration: 'none' }}>Need instant help? Chat with our AI support agent &rarr;</a>
      </div>
    </div>
  );
}
