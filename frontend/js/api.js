// API Client
class API {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders()
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication
    async candidateAccess(email, accessCode, assessmentId) {
        return this.request('/auth/candidate/access', {
            method: 'POST',
            body: JSON.stringify({ email, accessCode, assessmentId })
        });
    }

    // Assessment
    async startAssessment(assessmentId, consents) {
        return this.request(`/assessments/${assessmentId}/start`, {
            method: 'POST',
            body: JSON.stringify(consents)
        });
    }

    async submitAnswer(assessmentId, data) {
        return this.request(`/assessments/${assessmentId}/submit-answer`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async skipQuestion(assessmentId, questionId) {
        return this.request(`/assessments/${assessmentId}/skip-question`, {
            method: 'POST',
            body: JSON.stringify({ questionId })
        });
    }

    async reportViolation(assessmentId, type, details) {
        return this.request(`/assessments/${assessmentId}/security-violation`, {
            method: 'POST',
            body: JSON.stringify({ type, details })
        });
    }

    async completeAssessment(assessmentId) {
        return this.request(`/assessments/${assessmentId}/complete`, {
            method: 'POST'
        });
    }

    async getAssessment(assessmentId) {
        return this.request(`/assessments/${assessmentId}`);
    }
}

const api = new API();
