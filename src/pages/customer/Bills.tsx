import { useState, useEffect } from 'react';
import { CreditCard, Download, CheckCircle, RefreshCw } from 'lucide-react';
import { getCustomers, getInvoices, updateInvoice } from '../../services/db';
import type { Customer, Invoice } from '../../services/db';

export default function Bills() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Pay Modal State
  const [payModal, setPayModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);

  const fetchBillingLedger = async () => {
    try {
      const email = sessionStorage.getItem('userEmail');
      const customers = await getCustomers();
      const match = customers.find(c => c.email.toLowerCase() === (email || '').toLowerCase());
      
      if (match) {
        setCustomer(match);
        const data = await getInvoices();
        const userInvoices = data.filter(i => i.customerId === match.id);
        setInvoices(userInvoices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingLedger();
  }, []);

  const openPayModal = (invoice: Invoice) => {
    setPayingInvoice(invoice);
    setPayModal(true);
  };

  const handlePay = async () => {
    if (!payingInvoice || !payingInvoice.id) return;
    try {
      await updateInvoice(payingInvoice.id, {
        status: 'Paid',
        method: 'Stripe Credit Checkout'
      });
      
      setPaymentSuccess(true);
      setTimeout(() => {
        setPayModal(false);
        setPaymentSuccess(false);
        setPayingInvoice(null);
        fetchBillingLedger();
      }, 2000);
    } catch (err) {
      alert("Payment transaction failed.");
    }
  };

  // Calculations
  const unpaidSum = invoices
    .filter(i => i.status !== 'Paid')
    .reduce((sum, curr) => sum + parseInt(curr.amount.replace(/[^0-9]/g, '') || '0'), 0);

  return (
    <div id="bills-page-container" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Billing & Invoices</h1>
        <p style={{ color: 'var(--text-light)', margin: 0 }}>View your outstanding balance, billing history, and pay invoices online.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}><RefreshCw className="animate-spin" /> Probing billing ledger...</div>
      ) : (
        <>
          {/* Balance Summary Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
             <div className="glass-panel" style={{ padding: '1.75rem', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Current Outstanding Balance</div>
                   <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0', color: unpaidSum > 0 ? '#ef4444' : 'var(--text-dark)' }}>
                     PKR {unpaidSum.toLocaleString()}
                   </div>
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Next invoice will generate on **June 1, 2026**</div>
                </div>
                <div style={{ 
                  background: unpaidSum > 0 ? '#fef2f2' : '#f0fdf4', 
                  color: unpaidSum > 0 ? '#ef4444' : '#16a34a', 
                  border: `1px solid ${unpaidSum > 0 ? '#fca5a5' : '#bbf7d0'}`, 
                  padding: '0.5rem 1rem', 
                  borderRadius: '20px', 
                  fontWeight: 600, 
                  fontSize: '0.875rem' 
                }}>
                   {unpaidSum > 0 ? '⚠ Payment Required' : '✓ Account Up to Date'}
                </div>
             </div>

             <div className="glass-panel" style={{ padding: '1.75rem', background: 'white', display: 'flex', flexDirection: 'column', justifySelf: 'stretch', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>Stored Billing Method</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>
                   <CreditCard size={20} color="#0f766e" /> Visa ending in 4242 (Active)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>Self-check or automated invoice clearance.</div>
             </div>
          </div>

          {/* Billing Ledger */}
          <div className="glass-panel" style={{ padding: '0', background: 'white', overflowX: 'auto' }}>
             <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '1.1rem' }}>Invoice History</div>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
               <thead>
                 <tr style={{ background: '#f8fafc', color: 'var(--text-dark)', borderBottom: '1px solid var(--border-color)' }}>
                   <th style={{ padding: '1rem' }}>Invoice ID</th>
                   <th style={{ padding: '1rem' }}>Billing Period</th>
                   <th style={{ padding: '1rem' }}>Issued Date</th>
                   <th style={{ padding: '1rem' }}>Due Date</th>
                   <th style={{ padding: '1rem' }}>Amount</th>
                   <th style={{ padding: '1rem' }}>Status</th>
                   <th style={{ padding: '1rem' }}>Action</th>
                 </tr>
               </thead>
               <tbody>
                 {invoices.length === 0 ? (
                   <tr>
                     <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>No invoice records available for your profile.</td>
                   </tr>
                 ) : (
                   invoices.map((inv) => (
                     <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                       <td style={{ padding: '1rem', fontWeight: 600 }}>{inv.invoiceNo}</td>
                       <td style={{ padding: '1rem', color: 'var(--text-light)' }}>{inv.period}</td>
                       <td style={{ padding: '1rem' }}>{inv.issued}</td>
                       <td style={{ padding: '1rem' }}>{inv.due}</td>
                       <td style={{ padding: '1rem', fontWeight: 700 }}>{inv.amount}</td>
                       <td style={{ padding: '1rem' }}>
                          <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-danger'}`} style={{ border: `1px solid ${inv.status === 'Paid' ? '#86efac' : '#fca5a5'}`, background: 'transparent' }}>
                            {inv.status}
                          </span>
                       </td>
                       <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                             {inv.status !== 'Paid' && (
                               <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: '#0f766e' }} onClick={() => openPayModal(inv)}>Pay Now</button>
                             )}
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} 
                                onClick={() => {
                                  setSelectedInvoiceForPrint(inv);
                                  setTimeout(() => {
                                    window.print();
                                  }, 150);
                                }}
                              >
                                 <Download size={12} /> Print
                              </button>
                          </div>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
          </div>
        </>
      )}

      {/* Pay Modal Backdrop */}
      {payModal && payingInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '2rem', background: 'white', position: 'relative' }}>
             <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>Pay Invoice {payingInvoice.invoiceNo}</h3>
             
             {paymentSuccess ? (
               <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
                  <div style={{ fontWeight: 700, color: '#166534', fontSize: '1.1rem' }}>Payment Successful!</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>Your invoice status has been updated.</div>
               </div>
             ) : (
               <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                     <span>Amount Due:</span>
                     <strong>{payingInvoice.amount}</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                      <div>
                         <label className="form-label" style={{ fontSize: '0.75rem' }}>Cardholder Name</label>
                         <input type="text" className="form-control" defaultValue={customer?.fullName || sessionStorage.getItem('userName') || 'Valued Subscriber'} />
                      </div>
                     <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Card Details</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                           <input type="text" className="form-control" placeholder="4242 4242 4242 4242" style={{ flex: 2 }} />
                           <input type="text" className="form-control" placeholder="MM/YY" style={{ flex: 1 }} />
                           <input type="text" className="form-control" placeholder="CVC" style={{ flex: 1 }} />
                        </div>
                     </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                     <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setPayModal(false)}>Cancel</button>
                     <button className="btn btn-primary" style={{ flex: 1, background: '#0f766e' }} onClick={handlePay}>Confirm Payment</button>
                  </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Printable Invoice Receipt Block */}
      {selectedInvoiceForPrint && (
        <div id="printable-invoice" className="printable-invoice" style={{ fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f766e', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ color: '#0f766e', margin: 0, fontSize: '24px', fontWeight: 800 }}>MyISP</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>High-Speed Fiber Broadband Services</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>INVOICE / RECEIPT</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Invoice No: {selectedInvoiceForPrint.invoiceNo}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', margin: '0 0 8px 0' }}>Billed To:</h3>
              <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>{customer?.fullName || sessionStorage.getItem('userName') || 'Valued Subscriber'}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Email: {customer?.email || sessionStorage.getItem('userEmail')}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>Area: {customer?.area || 'DHA'}</p>
              <p style={{ margin: '0', fontSize: '12px' }}>Status: {customer?.status || 'Active'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', margin: '0 0 8px 0' }}>Invoice Details:</h3>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}><strong>Billing Period:</strong> {selectedInvoiceForPrint.period}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}><strong>Issue Date:</strong> {selectedInvoiceForPrint.issued}</p>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}><strong>Due Date:</strong> {selectedInvoiceForPrint.due}</p>
              <p style={{ margin: '0', fontSize: '12px' }}><strong>Status:</strong> {selectedInvoiceForPrint.status}</p>
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
                  <strong>Fiber Broadband Service ({customer?.packageId || 'Standard'} Plan)</strong>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Unlimited high-speed internet for billing period: {selectedInvoiceForPrint.period}</div>
                </td>
                <td style={{ padding: '12px 0', fontSize: '14px', fontWeight: 700, textAlign: 'right' }}>{selectedInvoiceForPrint.amount}</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 0', fontSize: '14px', fontWeight: 700, textAlign: 'right' }}>Total Amount:</td>
                <td style={{ padding: '12px 0', fontSize: '16px', fontWeight: 800, color: '#0f766e', textAlign: 'right' }}>{selectedInvoiceForPrint.amount}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '1rem', marginTop: '4rem', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Thank you for choosing MyISP! For any queries, please visit the customer support desk or contact support@myisp.com</p>
          </div>
        </div>
      )}

      {/* CSS Styling for Screen vs Print */}
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
          header, aside, footer {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          #bills-page-container > *:not(#printable-invoice) {
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

    </div>
  );
}
