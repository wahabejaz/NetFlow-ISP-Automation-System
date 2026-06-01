import { useState, useEffect } from 'react';
import { Download, FileText, Send, RefreshCw } from 'lucide-react';
import { getInvoices, updateInvoice, addInvoice, getCustomers } from '../services/db';
import type { Invoice, Customer } from '../services/db';

export default function BillingManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [printMode, setPrintMode] = useState<'none' | 'report' | 'single'>('none');

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Unpaid' | 'Overdue'>('All');

  // Interactive logs
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintMode('none');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const fetchInvoices = async () => {
    try {
      const data = await getInvoices();
      setInvoices(data);
      if (data.length > 0) {
        setSelectedInvoice(data[0]);
      } else {
        setSelectedInvoice(null);
      }
      const custData = await getCustomers();
      setCustomers(custData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleMarkAsPaid = async (inv: Invoice) => {
    if (!inv.id) return;
    try {
      await updateInvoice(inv.id, { status: 'Paid', method: 'Admin Verified Checkout' });
      fetchInvoices();
      alert("Invoice marked as paid!");
    } catch (err) {
      alert("Failed to mark invoice as paid.");
    }
  };

  const handleSendReminder = async () => {
    if (!selectedInvoice?.id) return;
    try {
      // Dev log: show which invoice id and payload are sent from the UI
      const isDev = typeof import.meta !== 'undefined' && Boolean((import.meta as any).env && (import.meta as any).env.DEV);
      if (isDev) console.log('[ui] Sending reminder for invoice id:', selectedInvoice.id, { sendEmail: true });
      await updateInvoice(selectedInvoice.id, { sendEmail: true });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to send invoice email.');
    }
  };

  const handleGenerateInvoices = async () => {
    try {
      // Fetch current active customers
      const customersList = await getCustomers();
      if (customersList.length === 0) {
        alert("No customers in database to bill!");
        return;
      }

      // Generate invoice for each active customer
      let count = 0;
      for (const cust of customersList) {
        if (cust.status !== 'Active') continue;

        // Check if customer already has a pending invoice this month (simulated)
        const duplicate = invoices.some(i => i.customerId === cust.id && i.period.includes('June 2026'));
        if (duplicate) continue;

        await addInvoice({
          invoiceNo: `INV-2026-${Math.floor(1000 + Math.random()*9000)}`,
          customerName: cust.fullName,
          customerId: cust.id || 'mock_id',
          period: 'June 01, 2026 - June 30, 2026',
          issued: 'June 01, 2026',
          due: 'June 10, 2026',
          amount: cust.bill || '2,200 PKR',
          status: 'Unpaid'
        });
        count++;
      }

      fetchInvoices();
      alert(`Successfully generated ${count} billing invoice(s) for active customers!`);
    } catch (err) {
      alert("Failed to run billing generation.");
    }
  };

  // Calculations
  const totalBilled = invoices.reduce((acc, curr) => acc + parseInt(curr.amount.replace(/[^0-9]/g, '') || '0'), 0);
  const collected = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + parseInt(curr.amount.replace(/[^0-9]/g, '') || '0'), 0);
  const overdue = invoices.filter(i => i.status === 'Overdue').reduce((acc, curr) => acc + parseInt(curr.amount.replace(/[^0-9]/g, '') || '0'), 0);

  // Filters logic
  const filteredInvoices = invoices.filter(i => {
    const matchesSearch = i.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || i.invoiceNo.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' ? true : i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedCustomer = selectedInvoice
    ? customers.find(c => c.id === selectedInvoice.customerId || c.fullName === selectedInvoice.customerName)
    : null;

  return (
    <>
      <div id="admin-billing-container" style={{ display: 'flex', gap: '1.5rem', height: '100%' }}>
      
      {/* Main List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Billing Management</h1>
           <button type="button" className="btn btn-outline" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }} onClick={fetchInvoices}>
             <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid #bae6fd', background: '#f0f9ff' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 600 }}>Total Billed</div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0369a1', marginTop: '0.5rem' }}>
              PKR {(totalBilled/1000).toFixed(1)}k
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid #bbf7d0', background: '#f0fdf4', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 600 }}>Collected</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#15803d', marginTop: '0.5rem' }}>
                PKR {(collected/1000).toFixed(1)}k
              </div>
            </div>
            <div style={{ background: '#22c55e', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid #fecaca', background: '#fef2f2', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 600 }}>Overdue</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#b91c1c', marginTop: '0.5rem' }}>
                PKR {(overdue/1000).toFixed(1)}k
              </div>
            </div>
            <div style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</div>
          </div>
        </div>

        {/* Filters and Table */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Status</label>
                <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                   <option value="All">All Invoices</option>
                   <option value="Paid">Paid</option>
                   <option value="Unpaid">Unpaid</option>
                   <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <input 
                type="text" 
                placeholder="Search name / invoice #" 
                className="form-control" 
                style={{ width: '250px' }} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => {
                  setPrintMode('report');
                  setTimeout(() => {
                    window.print();
                  }, 150);
                }}
              >
                <FileText size={16} /> Print Report
              </button>
              <button type="button" className="btn btn-primary" style={{ background: '#0f766e' }} onClick={handleGenerateInvoices}>Run Invoice Generation</button>
            </div>
          </div>

          <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Invoices List</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dark)' }}>
                <th style={{ padding: '1rem 0', fontWeight: 600 }}>Invoice #</th>
                <th style={{ padding: '1rem 0', fontWeight: 600 }}>Customer</th>
                <th style={{ padding: '1rem 0', fontWeight: 600 }}>Billing Period</th>
                <th style={{ padding: '1rem 0', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '1rem 0', fontWeight: 600 }}>Due Date</th>
                <th style={{ padding: '1rem 0', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem 0', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>Loading billing invoices...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>No bills matching active search.</td>
                </tr>
              ) : (
                filteredInvoices.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: selectedInvoice?.id === b.id ? '#f1f5f9' : 'transparent' }} onClick={() => setSelectedInvoice(b)}>
                    <td style={{ padding: '1rem 0', fontSize: '0.875rem', fontWeight: 600 }}>{b.invoiceNo}</td>
                    <td style={{ padding: '1rem 0', fontSize: '0.875rem', fontWeight: 500 }}>{b.customerName}</td>
                    <td style={{ padding: '1rem 0', fontSize: '0.875rem', color: 'var(--text-light)' }}>{b.period}</td>
                    <td style={{ padding: '1rem 0', fontSize: '0.875rem', fontWeight: 700 }}>{b.amount}</td>
                    <td style={{ padding: '1rem 0', fontSize: '0.875rem' }}>{b.due}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <span className={`badge ${b.status === 'Paid' ? 'badge-success' : b.status === 'Overdue' ? 'badge-danger' : 'badge-warning'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0' }}>
                      <button type="button" className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setSelectedInvoice(b)}>
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Panel: Invoice Preview Inspector */}
      {selectedInvoice && (
        <div className="glass-panel" style={{ width: '350px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc' }}>
          <h3 style={{ fontSize: '1.125rem', margin: 0, marginBottom: '0.5rem' }}>Invoice Preview</h3>
          
          <div style={{ background: 'white', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, color: '#0d9488' }}>NetFlow</div>
              <div style={{ textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-light)' }}>
                <div>Invoice # {selectedInvoice.invoiceNo}</div>
                <div>Issued: {selectedInvoice.issued}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 600 }}>Customer Name</div>
              <div>{selectedInvoice.customerName}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>ID: {selectedInvoice.customerId}</div>
            </div>
            
            <table style={{ width: '100%', fontSize: '0.75rem', marginBottom: '1rem', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
              <thead>
                <tr style={{ background: '#f9f9f9' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Item</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.5rem' }}>Broadband Service ({selectedInvoice.period.split(' - ')[0]})</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{selectedInvoice.amount}</td>
                </tr>
                <tr style={{ fontWeight: 700 }}>
                  <td style={{ padding: '0.5rem' }}>Grand Total</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{selectedInvoice.amount}</td>
                </tr>
              </tbody>
            </table>
            
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%) rotate(-15deg)', 
              color: selectedInvoice.status === 'Paid' ? '#22c55e' : selectedInvoice.status === 'Overdue' ? '#ef4444' : '#f59e0b', 
              border: `3px solid ${selectedInvoice.status === 'Paid' ? '#22c55e' : selectedInvoice.status === 'Overdue' ? '#ef4444' : '#f59e0b'}`, 
              padding: '0.25rem 1rem', 
              fontSize: '1.5rem', 
              fontWeight: 800, 
              borderRadius: '8px', 
              opacity: 0.8 
            }}>
              {selectedInvoice.status.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
            {selectedInvoice.status !== 'Paid' && (
                <button type="button" className="btn btn-primary" style={{ background: '#0f766e', width: '100%' }} onClick={() => handleMarkAsPaid(selectedInvoice)}>
                  Mark Invoice as Paid
                </button>
            )}
            <button
              type="button"
              className="btn btn-outline"
              style={{ display: 'flex', justifyContent: 'center', width: '100%', gap: '0.5rem', background: 'white' }}
              onClick={() => {
                setPrintMode('single');
                setTimeout(() => {
                  window.print();
                }, 150);
              }}
            >
              <Download size={16} /> Download PDF Invoice
            </button>
            
            {emailSent ? (
               <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center', margin: '0.5rem 0' }}>✓ Email sent to customer</span>
            ) : (
               <button type="button" className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center', width: '100%', gap: '0.5rem', background: 'white', color: '#16a34a', borderColor: '#16a34a' }} onClick={handleSendReminder}>
                 <Send size={16} /> Send Invoice Email
               </button>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Printable Invoice Receipt Block */}
      {printMode === 'single' && selectedInvoice && (
        <div id="printable-invoice" className="printable-invoice" style={{ fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f766e', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ color: '#0f766e', margin: 0, fontSize: '24px', fontWeight: 800 }}>NetFlow / MyISP</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>High-Speed Fiber Broadband Services</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>INVOICE / RECEIPT</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Invoice No: {selectedInvoice.invoiceNo}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', margin: '0 0 8px 0' }}>Billed To:</h3>
              <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>{selectedInvoice.customerName}</p>
              {selectedCustomer && (
                <>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Email: {selectedCustomer.email}</p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Area: {selectedCustomer.area}</p>
                  <p style={{ margin: '0', fontSize: '12px' }}>Status: {selectedCustomer.status}</p>
                </>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', margin: '0 0 8px 0' }}>Invoice Details:</h3>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}><strong>Billing Period:</strong> {selectedInvoice.period}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}><strong>Issue Date:</strong> {selectedInvoice.issued}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}><strong>Due Date:</strong> {selectedInvoice.due}</p>
              <p style={{ margin: '0', fontSize: '12px' }}><strong>Status:</strong> {selectedInvoice.status}</p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#64748b' }}>Description</th>
                <th style={{ padding: '8px 0', fontSize: '12px', textTransform: 'uppercase', color: '#64748b', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 0', fontSize: '14px' }}>
                  <strong>Fiber Broadband Service ({selectedCustomer?.packageId || 'Standard'} Plan)</strong>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Unlimited high-speed internet for billing period: {selectedInvoice.period}</div>
                </td>
                <td style={{ padding: '12px 0', fontSize: '14px', fontWeight: 700, textAlign: 'right' }}>{selectedInvoice.amount}</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 0', fontSize: '14px', fontWeight: 700, textAlign: 'right' }}>Total Amount:</td>
                <td style={{ padding: '12px 0', fontSize: '16px', fontWeight: 800, color: '#0f766e', textAlign: 'right' }}>{selectedInvoice.amount}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '1rem', marginTop: '4rem', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Thank you for choosing NetFlow / MyISP! For support, please contact billing@netflow.com</p>
          </div>
        </div>
      )}

      {/* Dynamic stylesheets for printing control */}
      {printMode === 'single' && (
        <style>{`
          @media screen {
            #printable-invoice {
              display: none !important;
            }
          }
          @media print {
            html, body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .sidebar, header, footer {
              display: none !important;
            }
            main.main-content {
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }
            #admin-billing-container {
              display: none !important;
            }
            #printable-invoice {
              display: block !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 20px !important;
              background: white !important;
              color: black !important;
            }
          }
        `}</style>
      )}

      {printMode === 'report' && (
        <style>{`
          @media print {
            html, body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .sidebar, header, footer, button, .btn, select, input {
              display: none !important;
            }
            main.main-content {
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }
            #admin-billing-container {
              display: block !important;
              width: 100% !important;
            }
            #admin-billing-container > div:first-child > div:nth-child(2) {
              display: none !important; /* Hide stats row */
            }
            #admin-billing-container > div:last-child {
              display: none !important; /* Hide preview side panel */
            }
          }
        `}</style>
      )}

    </>
  );
}
