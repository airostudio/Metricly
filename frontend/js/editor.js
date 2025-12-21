// Code Editor Manager
class EditorManager {
    constructor() {
        this.editor = document.getElementById('editor');
        this.currentTemplate = '';
        this.keystrokes = [];
        this.typingIntervals = [];
        this.initializeEditor();
    }

    initializeEditor() {
        this.editor.addEventListener('input', () => this.handleInput());
        this.editor.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    loadTemplate(template) {
        this.currentTemplate = template;
        this.editor.textContent = template;
        this.keystrokes = [];
        this.typingIntervals = [];
    }

    handleInput() {
        // Start first key timer if not started
        if (window.timerManager && window.timerManager.timers.firstKeyPress === null) {
            window.timerManager.startFirstKeyTimer();
        }

        // Enable submit button
        document.getElementById('submitBtn').disabled = false;

        // Track typing for AI detection
        this.recordKeystroke();
    }

    handleKeydown(e) {
        // Handle tab key
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
        }

        // Prevent Ctrl+V (paste)
        if (e.ctrlKey && e.key === 'v') {
            e.preventDefault();
        }

        // Prevent Ctrl+C (copy) in editor
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
        }
    }

    recordKeystroke() {
        const now = Date.now();

        this.keystrokes.push({
            timestamp: now,
            length: this.editor.textContent.length
        });

        if (this.keystrokes.length > 1) {
            const interval = now - this.keystrokes[this.keystrokes.length - 2].timestamp;
            this.typingIntervals.push(interval);
        }

        // Keep only recent keystrokes to avoid memory issues
        if (this.keystrokes.length > 500) {
            this.keystrokes.shift();
            this.typingIntervals.shift();
        }
    }

    getCode() {
        return this.editor.textContent;
    }

    getTypingMetrics() {
        return {
            keystrokes: this.keystrokes,
            intervals: this.typingIntervals
        };
    }

    reset() {
        this.loadTemplate(this.currentTemplate);
        document.getElementById('submitBtn').disabled = true;
    }

    clear() {
        this.editor.textContent = '';
        this.keystrokes = [];
        this.typingIntervals = [];
    }
}
