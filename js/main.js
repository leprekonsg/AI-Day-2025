class AIInsightsCollector {
    constructor() {
        this.storage = new Storage();
        this.topicModeler = new EnhancedTopicModeler();

        this.submissionForm = document.getElementById('submissionForm');
        this.questionInput = document.getElementById('questionInput');
        this.charCounter = document.getElementById('charCounter');
        this.submitBtn = this.submissionForm.querySelector('button[type="submit"]');
        this.originalBtnHTML = this.submitBtn.innerHTML;
        this.feedbackArea = document.getElementById('post-submission-feedback'); // ADDED: Get the new element

        this.initEventListeners();
    }

    initEventListeners() {
        this.submissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = this.questionInput.value.trim();
            if (text.length > 10 && !this.submitBtn.disabled) {
                await this.handleSubmission(text);
            }
        });

        let typingTimer;
        this.questionInput.addEventListener('input', () => {
            // ADDED: Clear feedback when user starts typing again
            if (this.feedbackArea.innerHTML !== '') {
                this.feedbackArea.innerHTML = '';
            }

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
            } else {
                this.removeThemeSuggestion();
            }
        });
    }

    async handleSubmission(text) {
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = `<span>Processing...</span>`;

        const themeResult = await this.addSubmission(text);

        this.submitBtn.classList.add('success');
        this.submitBtn.innerHTML = `<span>✓ Added to ${themeResult.theme}</span>`;

        // MODIFIED: Show the link after a short delay
        setTimeout(() => {
            this.feedbackArea.innerHTML = `Thank you! Your insight is in the review queue. <a href="presenter.html" target="_blank">View the live feed</a>.`;
        }, 500);

        setTimeout(() => {
            this.resetForm();
        }, 2500);
    }

    // ... (addSubmission method is unchanged) ...
    async addSubmission(text) {
        this.topicModeler.updateCorpusStats(text);

        const themeResult = this.topicModeler.analyzeTheme(text);
        const sentimentResult = await this.topicModeler.analyzeSentiment(text);
        const keyTerms = this.topicModeler.extractKeyTerms(text, 5);
        const keyPhrases = this.topicModeler.extractKeyPhrases(text);

        const submission = {
            text,
            id: Date.now(),
            timestamp: new Date().toISOString(),
            theme: themeResult.theme,
            sentiment: sentimentResult.sentiment,
            analysisSource: sentimentResult.source,
            keyTerms,
            keyPhrases,
            confidence: themeResult.confidence,
            status: 'pending'
        };
        
        await this.storage.addSubmission(submission);
        return themeResult;
    }


    resetForm() {
        this.questionInput.value = '';
        this.charCounter.textContent = '0 / 500';
        this.submitBtn.classList.remove('success');
        this.submitBtn.innerHTML = this.originalBtnHTML;
        this.submitBtn.disabled = false;
        this.removeThemeSuggestion();
        // NOTE: We intentionally leave the feedback message visible until the user types again.
    }

    // ... (showThemeSuggestion and removeThemeSuggestion methods are unchanged) ...
    showThemeSuggestion(themeResult) {
        this.removeThemeSuggestion();
        const suggestion = document.createElement('div');
        suggestion.className = 'theme-suggestion';
        const icon = THEME_ICONS[themeResult.theme] || '💡';
        suggestion.innerHTML = `
            <span>${icon}</span>
            <span>Detected Theme: <strong>${themeResult.theme}</strong></span>
            <span class="confidence">${Math.round(themeResult.confidence * 100)}%</span>
        `;
        this.submissionForm.appendChild(suggestion);
    }

    removeThemeSuggestion() {
        const existingSuggestion = document.querySelector('.theme-suggestion');
        if (existingSuggestion) {
            existingSuggestion.remove();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AIInsightsCollector();
});