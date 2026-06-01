import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CustomerManagement from './pages/CustomerManagement';
import PackageManagement from './pages/PackageManagement';
import TechnicianPortal from './pages/TechnicianPortal';
import BillingManagement from './pages/BillingManagement';
import Complaints from './pages/Complaints';
import AddCustomer from './pages/AddCustomer';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AIAnalyzer from './pages/AIAnalyzer';
import Technicians from './pages/Technicians';
import NetworkMonitor from './pages/NetworkMonitor';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

import CustomerPortalLayout from './components/CustomerPortalLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import MyPackage from './pages/customer/MyPackage';
import Bills from './pages/customer/Bills';
import SubmitComplaint from './pages/customer/SubmitComplaint';
import ChatSupport from './pages/customer/ChatSupport';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes with Layout */}
        <Route path="/" element={<ProtectedRoute allowedRole="Admin"><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="customers/add" element={<AddCustomer />} />
          <Route path="packages" element={<PackageManagement />} />
          <Route path="billing" element={<BillingManagement />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="technicians" element={<Technicians />} />
          <Route path="network" element={<NetworkMonitor />} />
          <Route path="reports" element={<AnalyticsDashboard />} />
          <Route path="ai-assistant" element={<AIAnalyzer />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Customer Portal */}
        <Route path="/customer-portal" element={<ProtectedRoute allowedRole="Customer"><CustomerPortalLayout /></ProtectedRoute>}>
          <Route index element={<CustomerDashboard />} />
          <Route path="package" element={<MyPackage />} />
          <Route path="bills" element={<Bills />} />
          <Route path="complaint" element={<SubmitComplaint />} />
          <Route path="chat" element={<ChatSupport />} />
        </Route>

        {/* Technician Portal (Separate Layout/No Layout) */}
        <Route path="/technician" element={<ProtectedRoute allowedRole="Technician"><TechnicianPortal /></ProtectedRoute>} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
