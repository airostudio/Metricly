// Timer Manager
class TimerManager {
    constructor(config) {
        this.config = config;
        this.timers = {
            questionStart: null,
            firstKeyPress: null,
            totalStart: null,
            questionInterval: null,
            totalInterval: null,
            firstKeyInterval: null
        };
    }

    startTotal() {
        this.timers.totalStart = Date.now();
        this.timers.totalInterval = setInterval(() => this.updateTotalTimer(), 1000);
    }

    startQuestion() {
        this.timers.questionStart = Date.now();
        this.timers.firstKeyPress = null;

        if (this.timers.questionInterval) {
            clearInterval(this.timers.questionInterval);
        }

        this.timers.questionInterval = setInterval(() => this.updateQuestionTimer(), 1000);

        // Reset first key timer display
        document.getElementById('firstKeyTimer').textContent = 'First Key: --:--';
    }

    startFirstKeyTimer() {
        if (!this.timers.firstKeyPress) {
            this.timers.firstKeyPress = Date.now();
            this.timers.firstKeyInterval = setInterval(() => this.updateFirstKeyTimer(), 1000);
        }
    }

    updateQuestionTimer() {
        const elapsed = Math.floor((Date.now() - this.timers.questionStart) / 1000);
        const remaining = Math.max(0, this.config.questionTimeLimit - elapsed);

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;

        const timerElement = document.getElementById('questionTimer');
        timerElement.textContent = `Question: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (remaining < 60) {
            timerElement.classList.add('danger');
        }

        if (remaining <= 0) {
            clearInterval(this.timers.questionInterval);
            if (window.assessment) {
                window.assessment.autoSubmitAnswer();
            }
        }
    }

    updateFirstKeyTimer() {
        if (!this.timers.firstKeyPress) return;

        const elapsed = Math.floor((Date.now() - this.timers.firstKeyPress) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        document.getElementById('firstKeyTimer').textContent =
            `First Key: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    updateTotalTimer() {
        const elapsed = Math.floor((Date.now() - this.timers.totalStart) / 1000);
        const remaining = Math.max(0, this.config.totalTimeLimit - elapsed);

        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;

        const timerElement = document.getElementById('totalTimer');
        timerElement.textContent =
            `Total: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (remaining <= 300) { // 5 minutes remaining
            timerElement.classList.add('danger');
        }

        if (remaining <= 0) {
            clearInterval(this.timers.totalInterval);
            if (window.assessment) {
                window.assessment.endAssessment();
            }
        }
    }

    getQuestionTime() {
        if (!this.timers.questionStart) return 0;
        return Math.floor((Date.now() - this.timers.questionStart) / 1000);
    }

    getFirstKeyTime() {
        if (!this.timers.questionStart || !this.timers.firstKeyPress) return 0;
        return Math.floor((this.timers.firstKeyPress - this.timers.questionStart) / 1000);
    }

    stopAll() {
        if (this.timers.questionInterval) clearInterval(this.timers.questionInterval);
        if (this.timers.totalInterval) clearInterval(this.timers.totalInterval);
        if (this.timers.firstKeyInterval) clearInterval(this.timers.firstKeyInterval);
    }
}
