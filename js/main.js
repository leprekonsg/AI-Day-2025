class AIInsightsCollector {
    constructor() {
        this.storage = new Storage();
        this.topicModeler = new EnhancedTopicModeler();

        this.submissionForm = document.getElementById('submissionForm');
        this.questionInput = document.getElementById('questionInput');
        this.charCounter = document.getElementById('charCounter');
        this.submissionState = document.getElementById('submission-state');
        this.successState = document.getElementById('success-state');
        this.submittedText = document.getElementById('submitted-text');
        this.askAnotherBtn = document.getElementById('askAnotherBtn');

        this.initEventListeners();
    }

    initEventListeners() {
        this.submissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = this.questionInput.value.trim();
            if (text) {
                await this.addSubmission(text);
                this.showSuccessState(text);
            }
        });

        let typingTimer;
        this.questionInput.addEventListener('input', () => {
            const text = this.questionInput.value;
            const length = text.length;
            this.charCounter.textContent = `${length} / 500`;

            clearTimeout(typingTimer);
            if (length > 20) {
                typingTimer = setTimeout(() => {
                    const themeResult = this.topicModeler.analyzeTheme(text);
                    if (themeResult.theme !== 'General Topics') {
                        this.showThemeSuggestion(themeResult);
                    }
                }, 500);
            }
        });

        this.askAnotherBtn.addEventListener('click', () => {
            this.resetForm();
        });
    }

    async addSubmission(text) {
        this.topicModeler.updateCorpusStats(text);

        const themeResult = this.topicModeler.analyzeTheme(text);
        const sentimentResult = await this.topicModeler.analyzeSentiment(text);
        const keyTerms = this.topicModeler.extractKeyTerms(text, 5);
        const keyPhrases = this.topicModeler.extractKeyPhrases(text);

        const submission = {
            text,
            id: Date.now(), // Still useful for non-DB identification if needed
            timestamp: new Date().toISOString(),
            theme: themeResult.theme,
            sentiment: sentimentResult.sentiment,
            analysisSource: sentimentResult.source,
            keyTerms,
            keyPhrases,
            confidence: themeResult.confidence,
            status: 'pending'
        };
        // This is now an async call
        await this.storage.addSubmission(submission);
    }

    showSuccessState(text) {
        this.submittedText.textContent = text;
        this.submissionState.classList.add('hidden');
        this.successState.classList.remove('hidden');
    }

    resetForm() {
        this.questionInput.value = '';
        this.charCounter.textContent = '0 / 500';
        this.successState.classList.add('hidden');
        this.submissionState.classList.remove('hidden');
    }

    showThemeSuggestion(themeResult) {
        const existingSuggestion = document.querySelector('.theme-suggestion');
        if (existingSuggestion) existingSuggestion.remove();

        const suggestion = document.createElement('div');
        suggestion.className = 'theme-suggestion';
        const icon = THEME_ICONS[themeResult.theme] || '💡';
        suggestion.innerHTML = `
            <span>${icon}</span>
            <span>Detected Theme: <strong>${themeResult.theme}</strong></span>
            <span class="confidence">${Math.round(themeResult.confidence * 100)}%</span>
        `;

        const inputWrapper = document.querySelector('.input-wrapper');
        inputWrapper.appendChild(suggestion);

        setTimeout(() => {
            if (suggestion) {
                suggestion.style.opacity = '0';
                setTimeout(() => suggestion.remove(), 300);
            }
        }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AIInsightsCollector();
});
