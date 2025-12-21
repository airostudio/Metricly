// Main Application
document.addEventListener('DOMContentLoaded', () => {
    // Check for existing session
    const token = localStorage.getItem('token');
    if (token) {
        api.setToken(token);
    }

    // Setup auth form
    setupAuthForm();
});

function setupAuthForm() {
    const emailInput = document.getElementById('candidateEmail');
    const accessCodeInput = document.getElementById('accessCode');
    const assessmentIdInput = document.getElementById('assessmentId');
    const videoConsent = document.getElementById('videoConsent');
    const dataConsent = document.getElementById('dataConsent');
    const startBtn = document.getElementById('startBtn');
    const authError = document.getElementById('authError');

    // Enable start button only when all fields are filled and consents given
    const checkForm = () => {
        const allFilled = emailInput.value && accessCodeInput.value && assessmentIdInput.value;
        const allConsented = videoConsent.checked && dataConsent.checked;
        startBtn.disabled = !(allFilled && allConsented);
    };

    emailInput.addEventListener('input', checkForm);
    accessCodeInput.addEventListener('input', checkForm);
    assessmentIdInput.addEventListener('input', checkForm);
    videoConsent.addEventListener('change', checkForm);
    dataConsent.addEventListener('change', checkForm);

    startBtn.addEventListener('click', async () => {
        authError.textContent = '';
        startBtn.disabled = true;
        startBtn.textContent = 'Starting...';

        try {
            // Authenticate candidate
            const authResult = await api.candidateAccess(
                emailInput.value,
                accessCodeInput.value,
                assessmentIdInput.value
            );

            api.setToken(authResult.token);

            // Start assessment
            const assessmentResult = await api.startAssessment(
                assessmentIdInput.value,
                {
                    videoConsent: videoConsent.checked,
                    dataConsent: dataConsent.checked
                }
            );

            // Initialize assessment
            window.assessment = new AssessmentManager(
                assessmentResult.assessment,
                assessmentResult.questions
            );

        } catch (error) {
            authError.textContent = error.message || 'Failed to start assessment';
            startBtn.disabled = false;
            startBtn.textContent = 'Start Assessment';
        }
    });

    // Parse URL parameters if provided
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('assessmentId')) {
        assessmentIdInput.value = urlParams.get('assessmentId');
    }
    if (urlParams.has('email')) {
        emailInput.value = urlParams.get('email');
    }

    checkForm();
}

// Prevent leaving page accidentally
window.addEventListener('beforeunload', (e) => {
    if (window.assessment && !document.getElementById('completionModal').classList.contains('active')) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});
