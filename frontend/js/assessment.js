// Assessment Manager
class AssessmentManager {
    constructor(assessmentData, questions) {
        this.assessmentId = assessmentData.id;
        this.config = assessmentData.config;
        this.questions = questions;
        this.currentQuestionIndex = 0;
        this.answers = new Map();
        this.completedQuestions = new Set();

        // Update global config
        CONFIG.totalQuestions = questions.length;
        CONFIG.questionTimeLimit = this.config.questionTimeLimit;
        CONFIG.totalTimeLimit = this.config.totalTimeLimit;
        CONFIG.enableAIDetection = this.config.enableAIDetection;
        CONFIG.strictMode = this.config.strictMode;

        this.initialize();
    }

    initialize() {
        // Initialize components
        window.timerManager = new TimerManager(this.config);
        window.editorManager = new EditorManager();
        window.securityMonitor = new SecurityMonitor(this.assessmentId);

        // Initialize Socket.IO
        this.initializeSocket();

        // Setup event listeners
        this.setupEventListeners();

        // Render UI
        this.renderQuestionNav();
        this.loadQuestion(0);

        // Start timers
        window.timerManager.startTotal();

        // Show assessment container
        document.getElementById('authModal').classList.remove('active');
        document.getElementById('assessmentContainer').style.display = 'block';
    }

    initializeSocket() {
        window.socket = io(CONFIG.SOCKET_URL);

        window.socket.on('connect', () => {
            console.log('Socket connected');
            window.socket.emit('join-assessment', this.assessmentId);
        });

        window.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }

    setupEventListeners() {
        document.getElementById('skipBtn').addEventListener('click', () => this.skipQuestion());
        document.getElementById('submitBtn').addEventListener('click', () => this.submitAnswer());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('completeBtn').addEventListener('click', () => this.completeAssessment());
        document.getElementById('resetBtn').addEventListener('click', () => window.editorManager.reset());
        document.getElementById('warningConfirm').addEventListener('click', closeWarning);
    }

    renderQuestionNav() {
        const nav = document.getElementById('questionNav');
        nav.innerHTML = '';

        this.questions.forEach((question, index) => {
            const navItem = document.createElement('div');
            navItem.className = 'nav-item';

            if (index === this.currentQuestionIndex) {
                navItem.classList.add('active');
            }

            if (this.completedQuestions.has(index)) {
                const answer = this.answers.get(index);
                if (answer.skipped) {
                    navItem.classList.add('skipped');
                } else {
                    navItem.classList.add('completed');
                }
            }

            navItem.textContent = `Q${index + 1}: ${question.title}`;
            navItem.addEventListener('click', () => this.loadQuestion(index));

            nav.appendChild(navItem);
        });

        this.updateProgress();
    }

    loadQuestion(index) {
        if (index < 0 || index >= this.questions.length) return;

        this.currentQuestionIndex = index;
        const question = this.questions[index];

        // Update UI
        document.getElementById('questionTitle').textContent = question.title;
        document.getElementById('questionDescription').textContent = question.description;
        document.getElementById('languageDisplay').textContent = question.language.toUpperCase();

        // Update difficulty badge
        const badge = document.getElementById('difficultyBadge');
        badge.className = `difficulty-badge ${question.difficulty}`;
        badge.textContent = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);

        // Load code editor
        window.editorManager.loadTemplate(question.template);

        // Reset buttons
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('testResults').style.display = 'none';

        // Show complete button on last question if answered
        if (index === this.questions.length - 1 && this.completedQuestions.has(index)) {
            document.getElementById('completeBtn').style.display = 'inline-block';
        } else {
            document.getElementById('completeBtn').style.display = 'none';
        }

        // Start question timer
        window.timerManager.startQuestion();

        // Update navigation
        this.renderQuestionNav();
    }

    async submitAnswer() {
        const question = this.questions[this.currentQuestionIndex];
        const code = window.editorManager.getCode();
        const typingMetrics = window.editorManager.getTypingMetrics();

        try {
            const result = await api.submitAnswer(this.assessmentId, {
                questionId: question.id,
                code,
                timeSpent: window.timerManager.getQuestionTime(),
                timeToFirstKey: window.timerManager.getFirstKeyTime(),
                typingMetrics
            });

            // Display results
            this.displayTestResults(result);

            // Store answer
            this.answers.set(this.currentQuestionIndex, {
                code,
                passed: result.passed,
                skipped: false
            });

            this.completedQuestions.add(this.currentQuestionIndex);

            // Update UI
            document.getElementById('submitBtn').disabled = true;
            if (this.currentQuestionIndex < this.questions.length - 1) {
                document.getElementById('nextBtn').style.display = 'inline-block';
            } else {
                document.getElementById('completeBtn').style.display = 'inline-block';
            }

            this.renderQuestionNav();

            // Send progress update via socket
            if (window.socket && window.socket.connected) {
                window.socket.emit('progress-update', {
                    assessmentId: this.assessmentId,
                    questionIndex: this.currentQuestionIndex,
                    passed: result.passed
                });
            }

            // Warn about AI detection
            if (result.aiSuspicionScore > 70) {
                showWarning(`High AI detection score (${result.aiSuspicionScore}/100). Please ensure you're writing code yourself.`);
            }
        } catch (error) {
            alert('Failed to submit answer: ' + error.message);
        }
    }

    displayTestResults(result) {
        const output = document.getElementById('testOutput');
        output.innerHTML = '';

        result.testResults.forEach((test, index) => {
            const testDiv = document.createElement('div');
            testDiv.className = `test-result ${test.passed ? 'passed' : 'failed'}`;

            const header = document.createElement('div');
            header.className = 'test-result-header';
            header.textContent = `Test ${index + 1}: ${test.passed ? '✅ Passed' : '❌ Failed'}`;

            const details = document.createElement('div');
            details.className = 'test-result-details';

            if (test.error) {
                details.innerHTML = `Error: ${test.error}`;
            } else {
                details.innerHTML = `
                    Input: ${JSON.stringify(test.input)}<br>
                    Expected: ${JSON.stringify(test.expected)}<br>
                    Actual: ${JSON.stringify(test.actual)}
                `;
            }

            testDiv.appendChild(header);
            testDiv.appendChild(details);
            output.appendChild(testDiv);
        });

        // Summary
        const summary = document.createElement('div');
        summary.className = `test-result ${result.passed ? 'passed' : 'failed'}`;
        summary.style.marginTop = '12px';
        summary.style.fontWeight = 'bold';

        const passedCount = result.testResults.filter(t => t.passed).length;
        summary.textContent = result.passed
            ? '✅ All tests passed!'
            : `❌ ${passedCount}/${result.testResults.length} tests passed`;

        output.appendChild(summary);

        document.getElementById('testResults').style.display = 'block';
    }

    async skipQuestion() {
        if (!confirm('Are you sure you want to skip this question?')) return;

        const question = this.questions[this.currentQuestionIndex];

        try {
            await api.skipQuestion(this.assessmentId, question.id);

            this.answers.set(this.currentQuestionIndex, {
                skipped: true
            });

            this.completedQuestions.add(this.currentQuestionIndex);
            this.renderQuestionNav();

            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.nextQuestion();
            } else {
                document.getElementById('completeBtn').style.display = 'inline-block';
            }
        } catch (error) {
            alert('Failed to skip question: ' + error.message);
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.loadQuestion(this.currentQuestionIndex + 1);
        }
    }

    autoSubmitAnswer() {
        // Auto-submit when time runs out
        if (!this.completedQuestions.has(this.currentQuestionIndex)) {
            this.skipQuestion();
        }
    }

    async completeAssessment() {
        if (!confirm('Are you sure you want to complete the assessment?')) return;

        try {
            window.timerManager.stopAll();

            const result = await api.completeAssessment(this.assessmentId);

            // Show completion modal
            document.getElementById('finalCompleted').textContent =
                `${this.completedQuestions.size}/${this.questions.length}`;

            const totalMinutes = Math.floor(window.timerManager.getQuestionTime() / 60);
            document.getElementById('finalTime').textContent =
                `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}`;

            document.getElementById('completionModal').classList.add('active');

        } catch (error) {
            alert('Failed to complete assessment: ' + error.message);
        }
    }

    async endAssessment() {
        // Called when total time runs out
        await this.completeAssessment();
    }

    updateProgress() {
        const completed = this.completedQuestions.size;
        const total = this.questions.length;
        const progress = (completed / total) * 100;

        document.getElementById('completedCount').textContent = `${completed}/${total}`;
        document.getElementById('progressBar').style.width = `${progress}%`;
    }
}
