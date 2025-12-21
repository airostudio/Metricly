// Employer Dashboard
class Dashboard {
    constructor() {
        this.currentView = 'overview';
        this.tests = [];
        this.candidates = [];
        this.analytics = null;
        this.init();
    }

    async init() {
        // Check authentication
        if (!api.token) {
            window.location.href = '/employer/login.html';
            return;
        }

        this.setupEventListeners();
        await this.loadData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Create test button
        document.getElementById('createTestBtn').addEventListener('click', () => {
            document.getElementById('createTestModal').classList.add('active');
        });

        document.getElementById('cancelCreateTest').addEventListener('click', () => {
            document.getElementById('createTestModal').classList.remove('active');
        });

        // Create test form
        document.getElementById('createTestForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTest(e.target);
        });

        // Invite candidate form
        document.getElementById('inviteCandidateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.inviteCandidate(e.target);
        });

        document.getElementById('cancelInvite').addEventListener('click', () => {
            document.getElementById('inviteCandidateModal').classList.remove('active');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/employer/login.html';
        });
    }

    async loadData() {
        try {
            // Load analytics
            this.analytics = await api.request('/analytics/dashboard');
            this.updateOverview();

            // Load tests
            const testsResult = await api.request('/tests');
            this.tests = testsResult.tests;
            this.updateTestsView();

            // Load candidates (would be implemented)
            // this.candidates = await api.request('/candidates');
        } catch (error) {
            console.error('Failed to load data:', error);
            alert('Failed to load dashboard data');
        }
    }

    switchView(viewName) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update active view
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');

        // Update title
        const titles = {
            overview: 'Overview',
            tests: 'Tests',
            candidates: 'Candidates',
            results: 'Results',
            settings: 'Settings'
        };
        document.getElementById('viewTitle').textContent = titles[viewName];

        this.currentView = viewName;
    }

    updateOverview() {
        if (!this.analytics) return;

        const overview = this.analytics.analytics.overview;

        document.getElementById('totalTests').textContent = overview.totalAssessments;
        document.getElementById('totalCandidates').textContent = overview.totalAssessments;
        document.getElementById('completedAssessments').textContent = overview.completed;
        document.getElementById('avgScore').textContent = `${overview.avgScore}%`;

        // Update recent activity table
        const tbody = document.querySelector('#recentActivityTable tbody');
        tbody.innerHTML = '';

        this.analytics.analytics.recentActivity.forEach(activity => {
            const row = document.createElement('tr');
            const candidate = activity.candidate || {};
            const test = activity.test || {};

            row.innerHTML = `
                <td>${candidate.firstName || ''} ${candidate.lastName || ''}</td>
                <td>${test.title || 'N/A'}</td>
                <td><span class="status-badge ${activity.status}">${activity.status}</span></td>
                <td>${activity.score !== undefined ? activity.score + '%' : 'N/A'}</td>
                <td>${new Date(activity.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary" onclick="dashboard.viewResult('${activity.id}')">View</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateTestsView() {
        const tbody = document.querySelector('#testsTable tbody');
        tbody.innerHTML = '';

        if (this.tests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 32px;">No tests yet. Create your first test!</td></tr>';
            return;
        }

        this.tests.forEach(test => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${test.title}</strong></td>
                <td>${test.questions?.length || 0}</td>
                <td><span class="status-badge ${test.status}">${test.status}</span></td>
                <td>${test.stats?.totalAttempts || 0}</td>
                <td>${test.stats?.averageScore || 0}%</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary" onclick="dashboard.inviteToTest('${test._id}')">Invite</button>
                        <button class="btn btn-secondary" onclick="dashboard.editTest('${test._id}')">Edit</button>
                        <button class="btn btn-secondary" onclick="dashboard.viewTestResults('${test._id}')">Results</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async createTest(form) {
        const formData = new FormData(form);
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            config: {
                totalQuestions: parseInt(formData.get('totalQuestions')),
                questionTimeLimit: parseInt(formData.get('questionTimeLimit')) * 60,
                enableAIDetection: formData.get('enableAIDetection') === 'on',
                strictMode: formData.get('strictMode') === 'on'
            },
            questions: [], // Would need to add questions
            status: 'draft'
        };

        try {
            const result = await api.request('/tests', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            alert('Test created successfully!');
            document.getElementById('createTestModal').classList.remove('active');
            form.reset();
            await this.loadData();
        } catch (error) {
            alert('Failed to create test: ' + error.message);
        }
    }

    inviteToTest(testId) {
        document.getElementById('inviteTestId').value = testId;
        document.getElementById('inviteCandidateModal').classList.add('active');
    }

    async inviteCandidate(form) {
        const formData = new FormData(form);
        const testId = formData.get('testId');

        const data = {
            email: formData.get('email'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            expiresInDays: parseInt(formData.get('expiresInDays'))
        };

        try {
            const result = await api.request(`/tests/${testId}/invite`, {
                method: 'POST',
                body: JSON.stringify(data)
            });

            alert('Candidate invited successfully!\n\nInvitation details:\n' +
                  `Email: ${data.email}\n` +
                  `Assessment ID: ${result.assessment.id}\n\n` +
                  'The candidate has been sent their access code via email.');

            document.getElementById('inviteCandidateModal').classList.remove('active');
            form.reset();
        } catch (error) {
            alert('Failed to invite candidate: ' + error.message);
        }
    }

    editTest(testId) {
        alert('Edit test feature coming soon!');
    }

    viewTestResults(testId) {
        this.switchView('results');
        // Load results for this test
    }

    viewResult(assessmentId) {
        window.open(`/employer/result.html?id=${assessmentId}`, '_blank');
    }
}

// Initialize dashboard
const dashboard = new Dashboard();
