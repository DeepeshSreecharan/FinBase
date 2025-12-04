// src/lib/api.ts
class ApiService {
  baseURL: string;

  constructor() {
    // Try multiple environment variable names (Vite and Next.js)
    const viteUrl =
      // import.meta may be undefined in some runtimes, guard access
      typeof import.meta !== "undefined" && (import.meta as any).env
        ? (import.meta as any).env.VITE_API_URL || (import.meta as any).env.VITE_API
        : undefined;

    const nextUrl =
      typeof process !== "undefined" && process.env
        ? process.env.NEXT_PUBLIC_API
        : undefined;

    // priority: Vite env (if present) -> Next.js env -> fallback localhost
    let base = (viteUrl || nextUrl || "http://localhost:5000").trim();

    // remove trailing slashes
    base = base.replace(/\/+$/, "");

    // If the provided base DOES NOT contain '/api' anywhere, append '/api'
    if (!/\/api(\/|$)/.test(base)) {
      base = `${base}/api`;
    }

    this.baseURL = base;
  }

  // ------------------------
  // 🔑 Auth helpers
  // ------------------------
  private getToken() {
    try {
      return localStorage.getItem("cbiusertoken");
    } catch {
      return null;
    }
  }

  private getAuthHeaders() {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse(response: Response) {
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // not JSON — try text
      try {
        data = await response.text();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const message =
        (data && data.message) ||
        (typeof data === "string" ? data : null) ||
        `Request failed (${response.status})`;
      throw new Error(message);
    }

    return data;
  }

  // internal request helper: ensures proper URL and credentials
  private async request(
    path: string,
    options: RequestInit = {}
  ): Promise<any> {
    const cleanPath = path.replace(/^\/+/, ""); // remove leading slash if present
    const url = `${this.baseURL}/${cleanPath}`;

    // default fetch options
    const fetchOpts: RequestInit = {
      credentials: "include", // include cookies if backend uses them (safe)
      ...options,
    };

    const res = await fetch(url, fetchOpts);
    return this.handleResponse(res);
  }

  // ------------------------
  // 🔑 Auth APIs
  // ------------------------
  async register(data: { name: string; email: string; password: string }) {
    return this.request("auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request("auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request("auth/profile", {
      headers: this.getAuthHeaders(),
    });
  }

  async updateProfile(data: { name?: string; phone?: string; address?: string }) {
    return this.request("auth/profile/update", {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  // ------------------------
  // 🏦 Account APIs
  // ------------------------
  async getBalance() {
    return this.request("amount/balance", {
      headers: this.getAuthHeaders(),
    });
  }

  async addMoney(data: { amount: number; accountNumber: string }) {
    return this.request("amount/add", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async deductMoney(data: { amount: number; accountNumber: string }) {
    return this.request("amount/deduct", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
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
    const qObj = Object.entries(params).reduce((acc: any, [k, v]) => {
      if (v !== undefined && v !== "") acc[k] = String(v);
      return acc;
    }, {});
    const query = new URLSearchParams(qObj).toString();
    const path = query ? `transactions?${query}` : "transactions";
    return this.request(path, { headers: this.getAuthHeaders() });
  }

  // ------------------------
  // 💳 ATM Card APIs
  // ------------------------
  async getATMCards() {
    return this.request("atm", { headers: this.getAuthHeaders() });
  }

  async requestATMCard(data: { cardType: string; deliveryAddress: string }) {
    return this.request("atm/request", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async setATMPin(data: { cardId: string; pin: string; confirmPin: string }) {
    return this.request("atm/set-pin", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async toggleBlockCard(cardId: string, action: "block" | "unblock") {
    return this.request(`atm/${cardId}/${action}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });
  }

  // ------------------------
  // 🏦 FIXED DEPOSIT APIs
  // Backend path is /api/fd
  // ------------------------
  async getFDs() {
    return this.request("fd", { headers: this.getAuthHeaders() });
  }

  async createFD(data: { amount: number; tenure: number }) {
    return this.request("fd/create", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }

  async breakFD(fdId: string) {
    return this.request(`fd/${fdId}/break`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });
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
    return this.request("contact/submit", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
  }
}

const apiService = new ApiService();
export default apiService;
