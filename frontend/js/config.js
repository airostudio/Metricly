// Configuration
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : `${window.location.origin}/api`,
    SOCKET_URL: window.location.origin,

    // Assessment settings (will be overridden by server config)
    totalQuestions: 10,
    questionTimeLimit: 900, // 15 minutes per question in seconds
    totalTimeLimit: 7200, // 2 hours total in seconds
    enableAIDetection: true,
    strictMode: true,
    languages: ['javascript', 'python', 'java', 'cpp', 'sql']
};
