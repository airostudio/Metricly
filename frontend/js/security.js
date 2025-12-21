// Security Monitor
class SecurityMonitor {
    constructor(assessmentId) {
        this.assessmentId = assessmentId;
        this.violationCount = 0;
        this.tabActive = true;
        this.copyPasteBlocked = true;
        this.initializeMonitoring();
    }

    initializeMonitoring() {
        this.blockCopyPaste();
        this.monitorTabVisibility();
        this.blockContextMenu();
        this.detectDevTools();
    }

    blockCopyPaste() {
        document.addEventListener('copy', (e) => {
            if (this.copyPasteBlocked) {
                e.preventDefault();
                this.reportViolation('copy_attempt', 'User attempted to copy');
                showWarning('Copy/Paste is disabled during assessment');
            }
        });

        document.addEventListener('paste', (e) => {
            if (this.copyPasteBlocked) {
                e.preventDefault();
                this.reportViolation('paste_attempt', 'User attempted to paste');
                showWarning('Copy/Paste is disabled during assessment');
            }
        });
    }

    monitorTabVisibility() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.tabActive = false;
                const badge = document.getElementById('tabFocus');
                badge.classList.remove('active');
                badge.classList.add('warning');
                badge.innerHTML = '<span>⚠️</span> Tab Switched';

                this.reportViolation('tab_switch', 'User switched tabs or windows');

                if (CONFIG.strictMode) {
                    showWarning('Tab switching is not allowed. Multiple violations may result in test termination.');
                }
            } else {
                this.tabActive = true;
                const badge = document.getElementById('tabFocus');
                badge.classList.remove('warning');
                badge.classList.add('active');
                badge.innerHTML = '<span>●</span> Tab Active';
            }
        });
    }

    blockContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            if (CONFIG.strictMode) {
                e.preventDefault();
                this.reportViolation('other', 'Right-click attempted');
                showWarning('Right-click is disabled');
            }
        });
    }

    detectDevTools() {
        // Simple dev tools detection
        setInterval(() => {
            const threshold = 160;
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;

            if (widthThreshold || heightThreshold) {
                if (CONFIG.strictMode) {
                    this.reportViolation('other', 'Developer tools possibly open');
                }
            }
        }, 1000);
    }

    async reportViolation(type, details) {
        this.violationCount++;

        try {
            const result = await api.reportViolation(this.assessmentId, type, details);

            if (result.terminated) {
                alert('Assessment terminated due to too many security violations.');
                window.location.reload();
            }

            // Also send via socket if connected
            if (window.socket && window.socket.connected) {
                window.socket.emit('security-violation', {
                    assessmentId: this.assessmentId,
                    type,
                    details,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Failed to report violation:', error);
        }
    }
}

// Warning system
function showWarning(message) {
    document.getElementById('warningMessage').textContent = message;
    document.getElementById('warningModal').classList.add('active');
}

function closeWarning() {
    document.getElementById('warningModal').classList.remove('active');
}
