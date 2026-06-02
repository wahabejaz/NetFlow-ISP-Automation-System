const API_ENV = import.meta.env.VITE_API_URL || "";
const API_BASE = (() => {
  // In development without a VITE_API_URL, use the relative `/api` path.
  if (!API_ENV) return "/api";
  // Normalize: remove trailing slashes and ensure the `/api` prefix is present.
  let url = API_ENV.replace(/\/+$/, "");
  if (!url.endsWith("/api")) url = `${url}/api`;
  return url;
})();

export interface Customer {
  id?: string;
  fullName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  photo?: string | File | null;
  houseNo: string;
  street: string;
  area: string;
  city: string;
  zipCode: string;
  coordinates?: string;
  packageId: string;
  status: "Active" | "Inactive";
  bill: string;
  password?: string;
}

export interface Package {
  id?: string;
  name: string;
  speed: string;
  price: string;
  popular?: boolean;
}

export interface Invoice {
  id?: string;
  invoiceNo: string;
  customerName: string;
  customerId: string;
  period: string;
  issued: string;
  due: string;
  amount: string;
  status: "Paid" | "Unpaid" | "Overdue";
  method?: string;
}

export interface Ticket {
  id?: string;
  ticketNo: string;
  customerName: string;
  customerId: string;
  description: string;
  category: string;
  priority: "Low" | "Medium" | "Urgent";
  status: "Submitted" | "AI Analyzed" | "Assigned" | "In Progress" | "Resolved";
  assignedTechnician?: string;
  createdAt: string;
  notes: Array<{ author: string; text: string; date: string }>;
}

export interface Technician {
  id?: string;
  name: string;
  phone: string;
  area: string;
  status: "Available" | "Busy";
  rating: number;
  jobsCompleted: number;
  activeJob: string;
  email: string;
  password?: string;
}

export interface SystemSettings {
  ispName: string;
  supportPhone: string;
  supportEmail: string;
  currency: string;
  taxRate: string;
  lateFee: string;
  billingDay: string;
  aiModel: string;
  apiKey: string;
  autoPrioritize: boolean;
}

export interface AIAnalysisResult {
  category: string;
  confidence: string;
  priority: string;
  color: string;
  action: string;
  resolutionTime: string;
}

export interface DashboardSummary {
  totalCustomers: number;
  newThisMonth: number;
  activeCustomers: number;
  totalRevenue: number;
  openComplaints: number;
  paidBills: number;
  unpaidBills: number;
  activePackages: number;
  monthlyRevenue: Array<{ label: string; value: number }>;
  complaintCategories: Array<{ category: string; count: number }>;
  recentComplaints: Ticket[];
  technicianStatus: Technician[];
}

interface LoginResponse {
  token: string;
  role: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

function getAuthToken(): string | null {
  return sessionStorage.getItem("authToken");
}

function getHeaders(includeJson = true): HeadersInit {
  const headers = new Headers();
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }
  if (includeJson) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const mergedHeaders = new Headers(getHeaders(!(options.body instanceof FormData)));
  if (options.headers) {
    const extraHeaders = new Headers(options.headers);
    extraHeaders.forEach((value, key) => mergedHeaders.set(key, value));
  }

  const fullUrl = `${API_BASE}${path}`;

  // Dev-only logging to help capture failing UI requests (safe in production — gated by Vite's DEV flag)
  const isDev = typeof import.meta !== 'undefined' && Boolean((import.meta as any).env && (import.meta as any).env.DEV);
  if (isDev) {
    try {
      console.groupCollapsed(`[api] ${options.method || 'GET'} ${fullUrl}`);
      console.log('Request headers:', Object.fromEntries((mergedHeaders as Headers).entries()));
      if (options.body instanceof FormData) {
        const entries: Record<string, any> = {};
        (options.body as FormData).forEach((v, k) => { entries[k] = v; });
        console.log('Request body (FormData):', entries);
      } else if (options.body) {
        try { console.log('Request body:', JSON.parse(String(options.body))); } catch { console.log('Request body (raw):', options.body); }
      }
      console.groupEnd();
    } catch {
      /* ignore logging failures */
    }
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers: mergedHeaders,
    });
  } catch (fetchErr) {
    if (isDev) console.error('[api] Fetch failed', fetchErr, { url: fullUrl, method: options.method || 'GET' });
    throw fetchErr;
  }

  const text = await response.text();
  if (isDev) {
    try { console.groupCollapsed(`[api] response ${response.status} ${fullUrl}`); } catch {}
    try { console.log('Response headers:', Object.fromEntries((response.headers as Headers).entries())); } catch {}
    console.log('Response text:', text);
    try { console.groupEnd(); } catch {}
  }

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail = typeof data === 'object' && data !== null && 'detail' in data
      ? String((data as { detail?: unknown }).detail)
      : typeof data === 'string'
        ? data
        : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  return (data ?? null) as T;
}

export async function loginUser(email: string, password: string, role?: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
}

export async function getCurrentUser(): Promise<{ id: number; email: string; name: string; role: string }> {
  return request<{ id: number; email: string; name: string; role: string }>('/auth/me/');
}

export async function getCustomers(): Promise<Customer[]> {
  return request<Customer[]>("/customers/");
}

export async function addCustomer(cust: Customer): Promise<string> {
  const payload = new FormData();
  payload.append("fullName", cust.fullName);
  payload.append("fatherName", cust.fatherName);
  payload.append("cnic", cust.cnic);
  payload.append("phone", cust.phone);
  payload.append("email", cust.email);
  payload.append("dob", cust.dob);
  payload.append("gender", cust.gender);
  payload.append("area", cust.area);
  payload.append("city", cust.city);
  payload.append("street", cust.street);
  payload.append("packageId", cust.packageId);
  payload.append("status", cust.status);
  if (cust.password) {
    payload.append("password", cust.password);
  }
  if (cust.photo instanceof File) {
    payload.append("photo", cust.photo);
  }

  const created = await request<Customer>("/customers/", {
    method: "POST",
    body: payload,
  });
  return created.id || "";
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  const payload = new FormData();
  if (updates.fullName) payload.append("fullName", updates.fullName);
  if (updates.fatherName) payload.append("fatherName", updates.fatherName);
  if (updates.cnic) payload.append("cnic", updates.cnic);
  if (updates.phone) payload.append("phone", updates.phone);
  if (updates.email) payload.append("email", updates.email);
  if (updates.dob) payload.append("dob", updates.dob);
  if (updates.gender) payload.append("gender", updates.gender);
  if (updates.area) payload.append("area", updates.area);
  if (updates.city) payload.append("city", updates.city);
  if (updates.packageId) payload.append("packageId", updates.packageId);
  if (updates.status) payload.append("status", updates.status);
  if (updates.photo instanceof File) {
    payload.append("photo", updates.photo);
  }

  await request<void>(`/customers/${id}/`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await request<void>(`/customers/${id}/`, { method: "DELETE" });
}

export async function getPackages(): Promise<Package[]> {
  return request<Package[]>("/packages/");
}

export async function addPackage(pkg: Package): Promise<string> {
  const created = await request<Package>("/packages/", {
    method: "POST",
    body: JSON.stringify({
      name: pkg.name,
      speed: pkg.speed,
      price: pkg.price,
      popular: pkg.popular,
    }),
  });
  return created.id || "";
}

export async function deletePackage(id: string): Promise<void> {
  await request<void>(`/packages/${id}/`, { method: "DELETE" });
}

export async function updatePackage(id: string, pkg: Partial<Package>): Promise<Package> {
  const payload: any = {};
  if (pkg.name) payload.name = pkg.name;
  if (pkg.speed) payload.speed = pkg.speed;
  if (pkg.price) payload.price = pkg.price;
  if (typeof pkg.popular !== 'undefined') payload.popular = pkg.popular;

  return request<Package>(`/packages/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
export async function getInvoices(): Promise<Invoice[]> {
  return request<Invoice[]>("/invoices/");
}

export async function addInvoice(inv: Invoice): Promise<string> {
  const created = await request<Invoice>("/invoices/", {
    method: "POST",
    body: JSON.stringify({
      customerId: inv.customerId,
      invoiceNo: inv.invoiceNo,
      amount: inv.amount,
      status: inv.status,
    }),
  });
  return created.id || "";
}

export interface InvoiceUpdateResponse extends Invoice {
  emailSent?: boolean;
  emailError?: string;
}

export async function updateInvoice(id: string, updates: Partial<Invoice> & { sendEmail?: boolean }): Promise<InvoiceUpdateResponse> {
  const payload: any = {
    status: updates.status,
    method: updates.method,
  };
  if (updates.sendEmail) {
    payload.sendEmail = true;
  }

  if (!id) {
    throw new Error('updateInvoice called with empty id');
  }

  return request<InvoiceUpdateResponse>(`/invoices/${encodeURIComponent(String(id))}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getTickets(): Promise<Ticket[]> {
  return request<Ticket[]>("/tickets/");
}

export async function addTicket(ticket: Ticket): Promise<Ticket> {
  return request<Ticket>("/tickets/", {
    method: "POST",
    body: JSON.stringify({
      description: ticket.description,
      issueSince: ticket.createdAt,
      category: ticket.category,
      priority: ticket.priority,
      notes: ticket.notes,
      status: ticket.status,
    }),
  });
}

export async function updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
  await request<void>(`/tickets/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({
      status: updates.status,
      assignedTechnician: updates.assignedTechnician,
      notes: updates.notes,
    }),
  });
}

export async function getTechnicians(): Promise<Technician[]> {
  return request<Technician[]>("/technicians/");
}

export async function addTechnician(tech: Technician): Promise<string> {
  const created = await request<Technician>("/technicians/", {
    method: "POST",
    body: JSON.stringify({
      name: tech.name,
      phone: tech.phone,
      area: tech.area,
      email: tech.email,
      password: tech.password,
    }),
  });
  return created.id || "";
}

export async function deleteTechnician(id: string): Promise<void> {
  await request<void>(`/technicians/${id}/`, { method: "DELETE" });
}

export async function updateTechnician(id: string, updates: Partial<Technician>): Promise<void> {
  await request<void>(`/technicians/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({
      name: updates.name,
      phone: updates.phone,
      area: updates.area,
      email: updates.email,
      status: updates.status,
      password: updates.password,
    }),
  });
}

export async function getAreas(): Promise<{ areas: string[]; cities: string[] }> {
  return request<{ areas: string[]; cities: string[] }>('/areas/');
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    return await request<SystemSettings>("/settings/");
  } catch {
    return {
      ispName: "NetFlow Broadband Ltd.",
      supportPhone: "+92 42 111-638-356",
      supportEmail: "support@netflow.com.pk",
      currency: "PKR",
      taxRate: "16",
      lateFee: "200",
      billingDay: "5",
      aiModel: "gemini-1.5-flash",
      apiKey: "••••••••••••••••••••••••••••••••",
      autoPrioritize: true,
    };
  }
}

export async function updateSystemSettings(updates: SystemSettings): Promise<void> {
  await request<void>("/settings/", {
    method: "PUT",
    body: JSON.stringify({
      ispName: updates.ispName,
      supportPhone: updates.supportPhone,
      supportEmail: updates.supportEmail,
      currency: updates.currency,
      taxRate: updates.taxRate,
      lateFee: updates.lateFee,
      billingDay: updates.billingDay,
      aiModel: updates.aiModel,
      apiKey: updates.apiKey,
      autoPrioritize: updates.autoPrioritize,
    }),
  });
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>("/dashboard/summary/");
}

export async function analyzeComplaint(text: string): Promise<AIAnalysisResult> {
  return request<AIAnalysisResult>("/ai/analyze/", {
    method: "POST",
    body: JSON.stringify({ complaintText: text }),
  });
}

export async function draftReply(ticketId: string): Promise<{ reply: string }> {
  return request<{ reply: string }>("/ai/draft-reply/", {
    method: "POST",
    body: JSON.stringify({ ticketId }),
  });
}

export async function chatWithAI(prompt: string): Promise<{ reply: string; draftTicket: any }> {
  return request<{ reply: string; draftTicket: any }>("/ai/chat/", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

export async function seedDatabase(): Promise<void> {
  if (!sessionStorage.getItem('authToken')) {
    return;
  }

  if (sessionStorage.getItem('userRole') !== 'Admin') {
    return;
  }

  await request<{ status: string }>('/bootstrap/', { method: 'POST' });
}
