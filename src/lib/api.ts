// src/lib/api.ts
class ApiService {
  baseURL: string;

  constructor() {
    // Allow environment override (Vite)
    this.baseURL =
      (import.meta.env && (import.meta.env as any).VITE_API_URL) ||
      "http://localhost:5000/api";
  }

  // ------------------------
  // 🔑 Auth helpers
  // ------------------------
  private getToken() {
    return localStorage.getItem("cbiusertoken");
  }

  private getAuthHeaders() {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse(response: Response) {
    // First try to parse JSON safely
    let data: any = null;

    try {
      data = await response.json();
    } catch {
      // If response isn't JSON (HTML, error page, empty), fallback to text
      data = await response.text().catch(() => null);
    }

    // If status is NOT ok → throw a readable error
    if (!response.ok) {
      const message =
        (data && data.message) ||
        (typeof data === "string" ? data : null) ||
        `Request failed (${response.status})`;

      throw new Error(message);
    }

    return data;
  }

  // ------------------------
  // 🔑 Auth APIs
  // ------------------------
  async register(data: { name: string; email: string; password: string }) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async login(data: { email: string; password: string }) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getProfile() {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateProfile(data: { name?: string; phone?: string; address?: string }) {
    const response = await fetch(`${this.baseURL}/auth/profile/update`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // ------------------------
  // 🏦 Account APIs
  // ------------------------
  async getBalance() {
    const response = await fetch(`${this.baseURL}/amount/balance`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async addMoney(data: { amount: number; accountNumber: string }) {
    const response = await fetch(`${this.baseURL}/amount/add`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async deductMoney(data: { amount: number; accountNumber: string }) {
    const response = await fetch(`${this.baseURL}/amount/deduct`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // ------------------------
  // 💳 Transaction APIs
  // ------------------------
  async getTransactions(params: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    const query = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== "") acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    );

    const response = await fetch(
      `${this.baseURL}/transactions?${query.toString()}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }

  // ------------------------
  // 💳 ATM Card APIs
  // ------------------------
  async getATMCards() {
    const response = await fetch(`${this.baseURL}/atm`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async requestATMCard(data: { cardType: string; deliveryAddress: string }) {
    const response = await fetch(`${this.baseURL}/atm/request`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async setATMPin(data: { cardId: string; pin: string; confirmPin: string }) {
    const response = await fetch(`${this.baseURL}/atm/set-pin`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async toggleBlockCard(cardId: string, action: "block" | "unblock") {
    const response = await fetch(`${this.baseURL}/atm/${cardId}/${action}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // ------------------------
  // 🏦 FIXED DEPOSIT APIs (FIXED!!)
  // Backend path is /api/fd
  // ------------------------

  async getFDs() {
    const response = await fetch(`${this.baseURL}/fd`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createFD(data: { amount: number; tenure: number }) {
    const response = await fetch(`${this.baseURL}/fd/create`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async breakFD(fdId: string) {
    const response = await fetch(`${this.baseURL}/fd/${fdId}/break`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // ------------------------
  // 📩 Contact
  // ------------------------
async submitContact(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  const response = await fetch(`${this.baseURL}/contact/submit`, {
    method: "POST",
    headers: this.getAuthHeaders(), // public route but OK to send auth header if present
    body: JSON.stringify(data),
  });
  return this.handleResponse(response);
}}
const apiService = new ApiService();
export default apiService;
