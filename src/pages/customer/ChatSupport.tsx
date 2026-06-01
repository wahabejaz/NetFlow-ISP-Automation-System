import { useState, useEffect, useRef } from 'react';
import { Send, Cpu, Wrench, CheckCircle, Sparkles } from 'lucide-react';
import { getCustomers, addTicket, chatWithAI } from '../../services/db';
import type { Customer, Ticket } from '../../services/db';

export default function ChatSupport() {
  const [input, setInput] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<any[]>([
    { id: 1, sender: 'bot', text: "Hello! I'm your NetFlow AI Assistant. 🤖\n\nI can help you troubleshoot internet issues, check billing info, or automatically file a technical complaint ticket for our technicians. How can I help you today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch customer info on load
    const fetchCustomer = async () => {
      try {
        const email = sessionStorage.getItem('userEmail');
        const customers = await getCustomers();
        const match = customers.find(c => c.email.toLowerCase() === (email || '').toLowerCase());
        if (match) {
          setCustomer(match);
        }
      } catch (err) {
        console.error("Error fetching customer info for chat:", err);
      }
    };
    fetchCustomer();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessageText = input.trim();
    const userMsg = { id: Date.now(), sender: 'user', text: userMessageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const chatHistory = messages
      .slice(-8)
      .map(m => `${m.sender === 'user' ? 'Customer' : 'AI Assistant'}: ${m.text}`)
      .join('\n');

    try {
      const prompt = `You are NetFlow AI, the automated virtual assistant for NetFlow Broadband Ltd. (ISP).
Your goal is to assist customers with their internet service issues.
Customer Account Info:
- Name: ${customer?.fullName || 'John Name'}
- Active Plan: ${customer?.packageId || 'Standard'}
- Current Status: ${customer?.status || 'Active'}
- Billing Fee: ${customer?.bill || '2,200 PKR'}
- Support Phone: +92 42 111-638-356

CRITICAL INSTRUCTIONS:
1. Guide the customer on troubleshooting, but ALWAYS offer to file a complaint if they are experiencing an issue.
2. If the customer explicitly asks to file a complaint, open a ticket, or if they describe ANY internet issue (e.g. slow speed, not working, outage), you MUST output a 'draftTicket' object. Do NOT make them troubleshoot first if they just want to file a complaint.
3. If 'draftTicket' is provided, it must be a valid JSON object. If no issue is present and it's a general greeting, 'draftTicket' can be null.

Conversation History:
${chatHistory}
Customer (current message): "${userMessageText}"

Return the response EXACTLY as a JSON object with these keys:
- "reply": "Your markdown-formatted text response to the user."
- "draftTicket": A JSON object if a support ticket is recommended (which should be most of the time an issue is mentioned), otherwise null. If provided, it must contain:
  - "category": "Speed Issue" | "Router Instability" | "Billing Dispute" | "Outage" | "Hardware Fault"
  - "priority": "Low" | "Medium" | "Urgent"
  - "description": "Concise 1-sentence description of the issue."`;

      const result = await chatWithAI(prompt);

      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now() + 1, 
          sender: 'bot', 
          text: result.reply,
          draftTicket: result.draftTicket || null,
          ticketSubmitted: false
        }
      ]);
    } catch (error) {
      console.error("Gemini chatbot error:", error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "I apologize, but I am currently having connection issues. Please check back in a moment or contact our helpline directly."
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileTicket = async (msgId: number, draft: any) => {
    try {
      const newTicket: Ticket = {
        ticketNo: '',
        customerName: customer?.fullName || 'John Name',
        customerId: customer?.id || 'seeded_customer_id',
        description: draft.description,
        category: draft.category,
        priority: draft.priority,
        status: 'Submitted',
        createdAt: new Date().toISOString(),
        notes: [{ author: 'AI Assistant', text: 'Ticket automatically generated via AI Chat Support session.', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }]
      };

      const createdTicket = await addTicket(newTicket);
      const actualTicketNo = createdTicket.ticketNo || "CMP-" + Math.floor(Math.random() * 9000 + 1000);
      
      // Update message state to show ticket submitted
      setMessages(prev => prev.map(msg => {
        if (msg.id === msgId) {
          return {
            ...msg,
            ticketSubmitted: true,
            submittedNo: actualTicketNo
          };
        }
        return msg;
      }));

      // Add a success message from bot
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'bot',
          text: `Success! Complaint ticket **#${actualTicketNo}** has been registered in the support queue. Our network dispatchers have been notified and a field technician will be assigned shortly. You can track this in the complaints queue!`
        }
      ]);
    } catch (err) {
      alert("Failed to submit ticket: " + err);
    }
  };

  const handleQuickTopic = (topic: string) => {
    setInput(topic);
  };

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', margin: '-2rem', overflow: 'hidden' }}>
      
      {/* Sidebar for Chat */}
      <div style={{ width: '300px', background: '#f8fafc', padding: '1.5rem', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Sparkles size={18} color="#0d9488" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-dark)' }}>Quick Assist Topics</h3>
        </div>
        {['My internet is running very slow', 'Check outstanding bill balance', 'How do I restart ONT router', 'Upgrade my connection speed', 'Filing a general complaint'].map(topic => (
          <button 
            key={topic} 
            className="btn btn-outline" 
            style={{ 
              justifyContent: 'flex-start', 
              padding: '0.75rem 1rem', 
              borderRadius: '12px', 
              fontSize: '0.8rem',
              fontWeight: 500,
              background: 'white',
              textAlign: 'left',
              lineHeight: 1.3
            }} 
            onClick={() => handleQuickTopic(topic)}
          >
            {topic}
          </button>
        ))}
        
        <div style={{ marginTop: 'auto', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px', fontSize: '0.75rem', color: '#166534' }}>
          <strong>Groq AI Engine active.</strong> Chatbot has read-write context of your active customer subscription database.
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
        {/* Chat Header */}
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <span style={{ background: '#0d9488', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem' }}>🤖</span>
            <div>
              <div style={{ fontSize: '0.95rem' }}>NetFlow AI virtual assistant</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span> Live Cognitive Inference Active
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#fafafa' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', gap: '0.75rem', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
              
              {msg.sender === 'bot' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: '4px' }}>
                  AI
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ 
                  background: msg.sender === 'user' ? '#e2e8f0' : '#0f172a', 
                  color: msg.sender === 'user' ? 'var(--text-dark)' : '#f1f5f9', 
                  padding: '0.85rem 1.2rem', 
                  borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  boxShadow: msg.sender === 'user' ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-line'
                }}>
                  {msg.text}
                </div>

                {/* AI Automated Ticket Drafting Prompt Card */}
                {msg.sender === 'bot' && msg.draftTicket && (
                  <div style={{ 
                    border: '1px solid #bae6fd', 
                    background: '#f0f9ff', 
                    borderRadius: '12px', 
                    padding: '1rem', 
                    marginTop: '0.5rem',
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 10px rgba(3,105,161,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0369a1', fontWeight: 700, marginBottom: '0.5rem' }}>
                      <Cpu size={16} /> AI System Diagnostics recommendation:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem', color: '#334155' }}>
                      <div><strong>Category:</strong> {msg.draftTicket.category}</div>
                      <div><strong>Priority:</strong> {msg.draftTicket.priority}</div>
                      <div><strong>Description:</strong> {msg.draftTicket.description}</div>
                    </div>
                    {msg.ticketSubmitted ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 600 }}>
                        <CheckCircle size={16} color="#22c55e" />
                        <span>Registered as Ticket #{msg.submittedNo}</span>
                      </div>
                    ) : (
                      <button 
                        className="btn" 
                        onClick={() => handleFileTicket(msg.id, msg.draftTicket)}
                        style={{ 
                          width: '100%', 
                          background: '#0ea5e9', 
                          color: 'white', 
                          fontWeight: 600, 
                          fontSize: '0.8rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Wrench size={14} /> Auto-Submit Ticket to Tech Queue
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          ))}

          {isTyping && (
            <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                ...
              </div>
              <div style={{ background: '#f1f5f9', color: '#64748b', padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="animate-pulse">NetFlow AI is compiling network parameters...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'white' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder={isTyping ? "Please wait..." : "Ask AI about speed, billing, restarting ONT..."} 
              className="form-control" 
              style={{ borderRadius: '24px', padding: '0.85rem 1.5rem', background: '#f8fafc', border: '1px solid #cbd5e1' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit" 
              className="btn" 
              style={{ 
                borderRadius: '50%', 
                width: 46, 
                height: 46, 
                padding: 0, 
                background: '#0d9488', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(13, 148, 136, 0.2)'
              }}
              disabled={isTyping || !input.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

