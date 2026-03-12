const API_URL = 'https://functions.poehali.dev/30d9dba4-a499-4866-8ccc-ea7addf62b16';
const UPLOAD_RESUME_URL = 'https://functions.poehali.dev/369f37fd-9898-42bb-9c4c-3bf096f5da1b';

export interface Vacancy {
  id: number;
  company_id?: number;
  title: string;
  department: string;
  salary_display: string;
  requirements?: string;
  description?: string;
  status: 'active' | 'archived';
  reward_amount: number;
  payout_delay_days?: number;
  referral_token?: string;
  recommendations_count?: number;
  created_at: string;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  level: number;
  experience_points: number;
  total_recommendations: number;
  successful_hires: number;
  total_earnings: number;
  wallet_pending?: number;
  wallet_balance?: number;
  total_earned?: number;
  avatar_url?: string;
  email?: string;
  phone?: string;
  telegram?: string;
  vk?: string;
  is_admin?: boolean;
  is_fired?: boolean;
}

export interface Recommendation {
  id: number;
  vacancy_id: number;
  vacancy_title?: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  comment?: string;
  resume_url?: string;
  status: 'pending' | 'accepted' | 'rejected';
  reward_amount: number;
  recommended_by?: number;
  recommended_by_name?: string;
  created_at: string;
  accepted_at?: string;
  payout_delay_days?: number;
}

export interface CompanyStats {
  total_recommendations: number;
  accepted_candidates: number;
  total_bonuses: number;
  active_vacancies: number;
  total_employees: number;
}

export interface Company {
  id: number;
  name: string;
  employee_count: number;
  invite_token: string;
  logo_url?: string;
  description?: string;
  website?: string;
  industry?: string;
  inn?: string;
  telegram?: string;
  vk?: string;
  created_at: string;
  subscription_tier?: string;
  subscription_expires_at?: string;
}

export interface Wallet {
  wallet_balance: number;
  wallet_pending: number;
}

export interface WalletTransaction {
  id: number;
  amount: number;
  type: string;
  description?: string;
  created_at: string;
}

export interface PendingPayout {
  id: number;
  amount: number;
  unlock_date: string;
  status: string;
}

export interface WalletData {
  wallet: Wallet;
  transactions: WalletTransaction[];
  pending_payouts: PendingPayout[];
}

export interface Chat {
  id?: number;
  chat_id?: number;
  company_id: number;
  employee_id: number;
  last_message_at?: string;
  employee_name?: string;
  company_name?: string;
  position?: string;
  avatar_url?: string;
  unread_count: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  sender_id: number;
  sender_name?: string;
  sender_avatar?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const api = {
  async getVacancies(companyId: number = 1, status: string = 'active'): Promise<Vacancy[]> {
    const response = await fetch(`${API_URL}/?resource=vacancies&company_id=${companyId}&status=${status}`);
    if (!response.ok) throw new Error('Failed to fetch vacancies');
    return response.json();
  },

  async getVacancyById(vacancyId: number): Promise<Vacancy | null> {
    const response = await fetch(`${API_URL}/?resource=vacancies&vacancy_id=${vacancyId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data && data.id ? data : null;
  },

  async getVacancyByToken(token: string): Promise<Vacancy | null> {
    const response = await fetch(`${API_URL}/?resource=vacancies&referral_token=${token}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data && data.id ? data : null;
  },

  async createVacancy(data: Partial<Vacancy>): Promise<Vacancy> {
    const response = await fetch(`${API_URL}/?resource=vacancies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create vacancy');
    return response.json();
  },

  async updateVacancy(vacancyId: number, data: Partial<Vacancy>): Promise<Vacancy> {
    const response = await fetch(`${API_URL}/?resource=vacancies`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vacancyId, ...data })
    });
    if (!response.ok) throw new Error('Failed to update vacancy');
    return response.json();
  },

  async deleteVacancy(vacancyId: number): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/?resource=vacancies&id=${vacancyId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete vacancy');
    return response.json();
  },

  async getEmployees(companyId: number = 1): Promise<Employee[]> {
    const response = await fetch(`${API_URL}/?resource=employees&company_id=${companyId}`);
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
  },

  async getRecommendations(companyId: number = 1, status?: string, userId?: number): Promise<Recommendation[]> {
    let url = `${API_URL}/?resource=recommendations&company_id=${companyId}`;
    if (status) url += `&status=${status}`;
    if (userId) url += `&user_id=${userId}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch recommendations');
    return response.json();
  },

  async uploadResume(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    const response = await fetch(UPLOAD_RESUME_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_data: base64, file_name: file.name })
    });
    if (!response.ok) throw new Error('Failed to upload resume');
    const result = await response.json();
    return result.resume_url;
  },

  async createRecommendation(data: Partial<Recommendation>): Promise<Recommendation> {
    const response = await fetch(`${API_URL}/?resource=recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create recommendation');
    return response.json();
  },

  async updateRecommendationStatus(id: number, status: string): Promise<Recommendation> {
    const response = await fetch(`${API_URL}/?resource=recommendations&action=status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    if (!response.ok) throw new Error('Failed to update recommendation');
    return response.json();
  },

  async getStats(companyId: number = 1): Promise<CompanyStats> {
    const response = await fetch(`${API_URL}/?resource=stats&company_id=${companyId}`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async getCompany(companyId: number = 1): Promise<Company> {
    const response = await fetch(`${API_URL}/?resource=company&company_id=${companyId}`);
    if (!response.ok) throw new Error('Failed to fetch company');
    return response.json();
  },

  async getCompanyByToken(inviteToken: string): Promise<Company> {
    const response = await fetch(`${API_URL}/?resource=company&invite_token=${inviteToken}`);
    if (!response.ok) throw new Error('Failed to fetch company by token');
    return response.json();
  },

  async updateCompany(companyId: number, data: Partial<Company>): Promise<Company> {
    const response = await fetch(`${API_URL}/?resource=company`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, ...data })
    });
    if (!response.ok) throw new Error('Failed to update company');
    return response.json();
  },

  async registerEmployee(inviteToken: string, data: { email: string; first_name: string; last_name: string; position?: string; department?: string }): Promise<Employee> {
    const response = await fetch(`${API_URL}/?resource=employees&action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_token: inviteToken, ...data })
    });
    if (!response.ok) throw new Error('Failed to register employee');
    return response.json();
  },

  async updateEmployee(userId: number, data: Partial<Employee>): Promise<Employee> {
    const response = await fetch(`${API_URL}/?resource=employees`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...data })
    });
    if (!response.ok) throw new Error('Failed to update employee');
    return response.json();
  },

  async updateEmployeeRole(userId: number, _isHrManager?: boolean, isAdmin?: boolean): Promise<Employee> {
    const response = await fetch(`${API_URL}/?resource=employees&action=role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_admin: isAdmin })
    });
    if (!response.ok) throw new Error('Failed to update employee role');
    return response.json();
  },

  async updateEmployeeFired(userId: number, isFired: boolean): Promise<Employee> {
    const response = await fetch(`${API_URL}/?resource=employees&action=role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_fired: isFired })
    });
    if (!response.ok) throw new Error('Failed to update employee status');
    return response.json();
  },

  async deleteEmployee(authToken: string, userId: number): Promise<{ success: boolean; deleted: Employee }> {
    const response = await fetch(`${API_URL}/?resource=employees&user_id=${userId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to delete employee');
    return response.json();
  },

  async markMessagesRead(chatId: number, readerId: number): Promise<void> {
    await fetch(`${API_URL}/?resource=messages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, reader_id: readerId })
    });
  },

  async getWallet(userId: number): Promise<WalletData> {
    const response = await fetch(`${API_URL}/?resource=wallet&user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch wallet');
    return response.json();
  },

  async createChat(companyId: number, employeeId: number): Promise<Chat> {
    const response = await fetch(`${API_URL}/?resource=chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, employee_id: employeeId })
    });
    if (!response.ok) throw new Error('Failed to create chat');
    return response.json();
  },

  async getChats(userId: number, companyId?: number): Promise<Chat[]> {
    let url = `${API_URL}/?resource=chats&user_id=${userId}`;
    if (companyId) url += `&company_id=${companyId}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch chats');
    return response.json();
  },

  async sendMessage(chatId: number, senderId: number, message: string): Promise<ChatMessage> {
    const response = await fetch(`${API_URL}/?resource=messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, sender_id: senderId, message })
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async getMessages(chatId: number): Promise<ChatMessage[]> {
    const response = await fetch(`${API_URL}/?resource=messages&chat_id=${chatId}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  }
};