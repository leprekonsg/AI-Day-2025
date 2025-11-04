/* ============================================= */
/* GLOBAL CONFIGURATION                          */
/* ============================================= */
/* Central place for application-wide settings.  */
/* ============================================= */

const APP_CONFIG = {
    // The key used to store all submission data in the browser's localStorage.
    // Changing this key will effectively reset the application's data.
    storageKey: 'ai_day_2025_submissions'
};

// Registration Poll Questions (Yes/No format)
const POLL_QUESTIONS = {
    q1: "Do you believe AI is ready to take over core logistics processes today (like forecasting, routing, or inventory planning)?",
    q2: "Do you think AI will create more jobs than it replaces in the logistics sector?",
    q3: "Should every organization have an AI governance framework before rolling out any AI solutions?"
};
