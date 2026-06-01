import { useState, Fragment } from 'react';
import { ArrowRight, Tag, AlertTriangle, Lightbulb, Clock } from 'lucide-react';
import { analyzeComplaint } from '../services/db';

export default function AIAnalyzer() {
  const [complaintText, setComplaintText] = useState('My WiFi disconnects every 10 minutes especially at night. I have restarted the router multiple times but the issue keeps coming back.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const [analysisResult, setAnalysisResult] = useState({
    category: 'Router Instability',
    confidence: '87%',
    priority: 'Medium Priority',
    color: '#f59e0b',
    action: 'Verify wireless signal congestion, check router firmware updates.',
    resolutionTime: '2-4 hours | Assign field technician'
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError('');
    try {
      const result = await analyzeComplaint(complaintText);

      setAnalysisResult({
        category: result.category || 'Analysis Failed',
        confidence: result.confidence || '0%',
        priority: result.priority || 'Review Manually',
        color: result.color || '#f59e0b',
        action: result.action || 'Please review the complaint manually.',
        resolutionTime: result.resolutionTime || 'Pending'
      });
    } catch (error) {
      console.error('AI Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'AI service unavailable.');
      setAnalysisResult({
        category: 'API Error',
        confidence: '0%',
        priority: 'High Priority',
        color: '#ef4444',
        action: 'AI Service Unavailable. Please ensure the backend is running and Gemini is configured.',
        resolutionTime: 'Immediate Manual Review'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const matrix = [
    [10.5, 0.0, 0.0, 0.0, 0.0],
    [8.3, 18.3, 0.4, 5.5, 0.0],
    [0.0, 7.4, 19.3, 8.0, 2.4],
    [0.0, 0.0, 5.8, 19.7, 0.0],
    [0.0, 6.4, 0.0, 3.0, 17.5]
  ];
  const categories = ['Speed', 'Router', 'Outage', 'Billing', 'Install'];

  const getShade = (val: number) => {
    if (val === 0) return '#f3e8ff';
    if (val < 5) return '#d8b4fe';
    if (val < 10) return '#a855f7';
    if (val < 15) return '#7e22ce';
    return '#4c1d95';
  };

  return (
    <div style={{ background: '#1e1b4b', minHeight: 'calc(100vh - 80px)', margin: '-1.5rem', padding: '2rem', color: 'white' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', gap: '1rem', position: 'relative' }}>
        <div style={{ background: '#6d28d9', padding: '0.5rem', borderRadius: '8px' }}>🤖</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>AI Complaint Analyzer</h1>
        <div style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          🤖 NLP Model Active
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        
        {/* Left Side: Workbench */}
        <div style={{ background: 'white', color: 'var(--text-dark)', borderRadius: '12px', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>AI Analysis Workbench</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Complaint Text Input</label>
            <textarea 
              className="form-control" 
              rows={4} 
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              style={{ resize: 'none', background: '#f8fafc' }}
            />
          </div>

          <button 
            className="btn" 
            style={{ width: '100%', background: '#6d28d9', color: 'white', padding: '1rem', fontSize: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Running neural network inference...' : <>Analyze with AI <ArrowRight size={18} /></>}
          </button>

          {error && (
            <div style={{ color: '#b91c1c', background: '#fee2e2', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {!isAnalyzing && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', background: '#f8fafc' }}>
                 <div style={{ display: 'flex', gap: '0.5rem', color: '#6d28d9', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                   <Tag size={16} /> Classified Category
                 </div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>{analysisResult.category}</div>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                   <span>Confidence metric</span> <span>{analysisResult.confidence}</span>
                 </div>
                 <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: analysisResult.confidence, height: '100%', background: '#6d28d9' }}></div>
                 </div>
              </div>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', background: '#f8fafc' }}>
                 <div style={{ display: 'flex', gap: '0.5rem', color: analysisResult.color, fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                   <AlertTriangle size={16} /> Assigned Urgency
                 </div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>{analysisResult.priority}</div>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                   <span>Priority classification</span>
                 </div>
                 <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '80%', height: '100%', background: analysisResult.color }}></div>
                 </div>
              </div>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', background: '#f8fafc' }}>
                 <div style={{ display: 'flex', gap: '0.5rem', color: '#eab308', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                   <Lightbulb size={16} /> Suggested Action
                 </div>
                 <div style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.4 }}>
                   {analysisResult.action}
                 </div>
              </div>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', background: '#f8fafc' }}>
                 <div style={{ display: 'flex', gap: '0.5rem', color: '#4338ca', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                   <Clock size={16} /> Est. Resolution Target
                 </div>
                 <div style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.4 }}>
                   {analysisResult.resolutionTime}
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Performance */}
        <div style={{ background: 'white', color: 'var(--text-dark)', borderRadius: '12px', padding: '2rem' }}>
           <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem', fontWeight: 700 }}>AI Model Performance</h2>
           
           <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <div style={{ width: 140, height: 140, borderRadius: '50%', border: '12px solid #a855f7', borderRightColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-45deg)' }}>
                 <div style={{ fontSize: '2rem', fontWeight: 700, transform: 'rotate(45deg)' }}>91.4%</div>
              </div>
           </div>

           <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
             <div><strong>Training data corpus:</strong> 12,400 complaints</div>
             <div><strong>Categories trained:</strong> 5 (Speed, Router, Outage, Billing, Installation)</div>
             <div><strong>Last model run:</strong> 3 days ago</div>
           </div>

           {/* Heatmap Simulation */}
           <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(5, 1fr)', gap: '2px', textAlign: 'center', fontSize: '0.7rem' }}>
                 <div></div>
                 {categories.map((c, i) => <div key={i}>{c}</div>)}
                 
                 {categories.map((c, i) => (
                   <Fragment key={i}>
                     <div style={{ textAlign: 'right', paddingRight: '0.5rem', alignSelf: 'center' }}>{c}</div>
                     {matrix[i].map((val, j) => (
                       <div key={j} style={{ background: getShade(val), color: val > 10 ? 'white' : 'var(--text-dark)', padding: '0.5rem', borderRadius: '2px' }}>
                         {val.toFixed(1)}
                       </div>
                     ))}
                   </Fragment>
                 ))}
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
