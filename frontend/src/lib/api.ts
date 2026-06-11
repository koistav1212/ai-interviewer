const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RECRUITER' | 'CANDIDATE';
}

export interface AuthResponse {
  token: string;
  user: User;
}

// LocalStorage helpers
export const tokenStorage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('talentiq_token');
  },
  setToken: (token: string) => {
    localStorage.setItem('talentiq_token', token);
  },
  clearToken: () => {
    localStorage.removeItem('talentiq_token');
  },
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('talentiq_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
  setUser: (user: User) => {
    localStorage.setItem('talentiq_user', JSON.stringify(user));
  },
  clearUser: () => {
    localStorage.removeItem('talentiq_user');
  },
  logout: () => {
    localStorage.removeItem('talentiq_token');
    localStorage.removeItem('talentiq_user');
  }
};

// Authenticated fetch wrapper
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  const token = tokenStorage.getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error?.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// API methods
export const api = {
  auth: {
    signup: (data: any): Promise<AuthResponse> => apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any): Promise<AuthResponse> => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    profile: (): Promise<User> => apiFetch('/auth/profile'),
  },
  jobs: {
    create: (data: any) => apiFetch('/jobs/create', { method: 'POST', body: JSON.stringify(data) }),
    uploadJD: (file: File) => {
      const formData = new FormData();
      formData.append('jdFile', file);
      return apiFetch('/jobs/upload-jd', { method: 'POST', body: formData });
    },
    getMyJobs: () => apiFetch('/jobs/my-jobs'),
    getDetails: (id: string) => apiFetch(`/jobs/${id}`),
    shortlist: (applicationId: string) => apiFetch(`/jobs/${applicationId}/shortlist`, { method: 'POST' }),
    scheduleInterview: (applicationId: string, data: { scheduledTime: string; meetingLink?: string }) => 
      apiFetch(`/jobs/${applicationId}/schedule-interview`, { method: 'POST', body: JSON.stringify(data) }),
    getRecruiterDashboard: () => apiFetch('/dashboard/recruiter'),
  },
  candidate: {
    updateProfile: (data: { resumeUrl?: string; resumeText: string; skills?: any; experienceYears?: number }) => 
      apiFetch('/candidate/profile', { method: 'POST', body: JSON.stringify(data) }),
    uploadResume: (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      return apiFetch('/candidate/upload-resume', { method: 'POST', body: formData });
    },
    getDashboard: () => apiFetch('/candidate/dashboard'),
    getActiveJobs: () => apiFetch('/candidate/jobs'),
    apply: (jobId: string) => apiFetch(`/candidate/jobs/${jobId}/apply`, { method: 'POST' }),
  },
  applications: {
    getMy: () => apiFetch('/applications/my'),
    getRecruiterApplications: () => apiFetch('/applications/recruiter'),
    getByJob: (jobId: string) => apiFetch(`/applications/job/${jobId}`),
    getDetails: (id: string) => apiFetch(`/applications/${id}`),
    updateStatus: (id: string, status: string) => apiFetch(`/applications/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  },
  interviews: {
    create: (data: any) => apiFetch('/interviews/create', { method: 'POST', body: JSON.stringify(data) }),
    getDetails: (id: string) => apiFetch(`/interviews/${id}`),
    getCandidate: () => apiFetch('/interviews/candidate'),
    getRecruiter: () => apiFetch('/interviews/recruiter'),
    start: (id: string, data: { duration: number }) => 
      apiFetch(`/interviews/${id}/start`, { method: 'POST', body: JSON.stringify(data) }),
    submitScore: (id: string, data: { technicalScore: number; communicationScore: number; leadershipScore: number; businessAcumenScore: number; feedback?: string }) => 
      apiFetch(`/interviews/${id}/score`, { method: 'POST', body: JSON.stringify(data) }),
    startSession: (id: string) => 
      apiFetch(`/interviews/${id}/start-session`, { method: 'POST' }),
    submitAnswer: (id: string, answer: string) => 
      apiFetch(`/interviews/${id}/answer`, { method: 'POST', body: JSON.stringify({ answer }) }),
    finalizeSession: (id: string) => 
      apiFetch(`/interviews/${id}/finalize`, { method: 'POST' }),
  },
  reports: {
    getCandidateReport: (applicationId: string) => apiFetch(`/reports/candidate/${applicationId}`),
    getJobReport: (jobId: string) => apiFetch(`/reports/job/${jobId}`),
    getDashboard: () => apiFetch('/reports/dashboard'),
    generate: (applicationId: string) => apiFetch('/reports/generate', { method: 'POST', body: JSON.stringify({ applicationId }) }),
  }
};
