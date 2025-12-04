// src/lib/api.ts
class ApiService {
  baseURL: string;

  constructor() {
    // Read env from Vite (import.meta.env) or Next (process.env)
    const viteEnv =
      typeof import.meta !== "undefined" && (import.meta as any).env
        ? (import.meta as any).env.VITE_API_URL ||
          (import.meta as any).env.VITE_API ||
          undefined
        : undefined;

    const nextEnv =
      typeof process !== "undefined" && process.env
        ? process.env.NEXT_PUBLIC_API
        : undefined;

    // Priority: Vite -> Next -> localhost
    let base = (viteEnv || nextEnv || "http://localhost:5000").trim();

    // remove trailing slashes
    base = base.replace(/\/+$/, "");

    // ensure the base ends with /api
    if (!/\/api(\/|$)/.test(base)) {
      base = `${base}/api`;
    }

    this.baseURL = base;
     console.info('[ApiService] baseURL =', this.baseURL); // uncomment for one-time debug
  }

  // ------------------------
  // Auth helpers
  // ------------------------
  private getToken(): string | null {
    try {
      return localStorage.getItem("cbiusertoken");
    } catch {
      return null;
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse(response: Response) {
    let data: any = null;
    try {
      data = await response.json();
    } catch {
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

  // internal request helper: builds URL, merges headers and options
  private async request(path: string, options: RequestInit = {}) {
    const cleanPath = path.replace(/^\/+/, "");
    const url = `${this.baseURL}/${cleanPath}`;

    // merge headers: explicit options.headers -> auth headers -> default content-type if body present
    const optHeaders = (options.headers || {}) as Record<string, string>;
    const authHeaders = this.getAuthHeaders();

    const mergedHeaders: Record<string, string> = {
      ...(authHeaders || {}),
      ...optHeaders,
    };

    // ensure Content-Type for JSON bodies unless already set
    if (
      options.body !== undefined &&
      !Object.keys(mergedHeaders).some((h) =>
        h.toLowerCase().startsWith("content-type")
      )
    ) {
      mergedHeaders["Content-Type"] = "application/json";
    }

    const fetchOpts: RequestInit = {
      credentials: "include",
      ...options,
      headers: mergedHeaders,
    };

    const res = await fetch(url, fetchOpts);
    return this.handleResponse(res);
  }

  // ------------------------
  // Auth APIs
  // ------------------------
  async register(data: { name: string; email: string; password: string }) {
    return this.request("auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request("auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request("auth/profile", {});
  }

  async updateProfile(data: { name?: string; phone?: string; address?: string }) {
    return this.request("auth/profile/update", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ------------------------
  // Account APIs
  // ------------------------
  async getBalance() {
    return this.request("amount/balance", {});
  }

  async addMoney(data: { amount: number; accountNumber: string }) {
    return this.request("amount/add", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deductMoney(data: { amount: number; accountNumber: string }) {
    return this.request("amount/deduct", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ------------------------
  // Transactions
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
    return this.request(path, {});
  }

  // ------------------------
  // ATM Card APIs
  // ------------------------
  async getATMCards() {
    return this.request("atm", {});
  }

  async requestATMCard(data: { cardType: string; deliveryAddress: string }) {
    return this.request("atm/request", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async setATMPin(data: { cardId: string; pin: string; confirmPin: string }) {
    return this.request("atm/set-pin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async toggleBlockCard(cardId: string, action: "block" | "unblock") {
    return this.request(`atm/${cardId}/${action}`, {
      method: "POST",
    });
  }

  // ------------------------
  // Fixed Deposits
  // ------------------------
  async getFDs() {
    return this.request("fd", {});
  }

  async createFD(data: { amount: number; tenure: number }) {
    return this.request("fd/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async breakFD(fdId: string) {
    return this.request(`fd/${fdId}/break`, {
      method: "POST",
    });
  }

  // ------------------------
  // Contact
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
      body: JSON.stringify(data),
    });
  }
}

const apiService = new ApiService();
export default apiService;
