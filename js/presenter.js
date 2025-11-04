class Presenter {
    constructor() {
        this.storage = new Storage();
        this.vizManager = new VisualizationManager();
        this.topicModeler = new EnhancedTopicModeler(false);

        // DOM Elements
        this.visContainer = document.getElementById('visualization-container');
        this.titleElement = document.getElementById('current-view-title');
        this.progressBar = document.getElementById('progress-bar');
        
        // Control elements
        this.controls = document.getElementById('presenter-controls'); 
        this.pauseBtn = document.getElementById('pause-btn');
        this.playBtn = document.getElementById('play-btn');
        this.skipBtn = document.getElementById('skip-btn');
        this.overrideContainer = document.getElementById('override-container');
        this.overrideTheme = this.overrideContainer.querySelector('.override-theme');
        this.overrideText = this.overrideContainer.querySelector('.override-text');

        // State Management
        this.submissions = [];
        this.pollResponses = [];
        this.currentViewIndex = 0;
        this.baseViews = [
            { name: 'Top Themes', method: 'renderBarChartForPresenter' },
            { name: 'Top Key Terms', method: 'renderWordCloudForPresenter' },
            { name: 'Top 6 Trending Terms', method: 'renderRisingTermsForPresenter' },
            { name: 'Audience Sentiment', method: 'renderSentimentOverviewForPresenter' },
            { name: 'Insights Summary', method: 'renderInsightsSummaryForPresenter' }
        ];
        this.views = [...this.baseViews]; // Will be updated dynamically with poll views
        this.rotationInterval = 10000;
        this.unsubscribe = null;
        this.pollUnsubscribe = null;
        this.isPaused = false;
        this.timerId = null;

        this.isOverridden = false;
        this.wasPausedBeforeOverride = false;
    }

    init() {
        this.unsubscribe = this.storage.getApprovedSubmissions(approvedData => {
            this.submissions = approvedData;
            this.topicModeler = new EnhancedTopicModeler(false);
            this.submissions.forEach(sub => {
                this.topicModeler.updateCorpusStats(sub.text);
            });
            if (!this.isOverridden) {
                this.renderCurrentView();
            }
        });

        // Listen for poll responses
        this.pollUnsubscribe = this.storage.listenForPollResponses(responses => {
            this.pollResponses = responses;
            this.updateViewsWithPollData();
            if (!this.isOverridden) {
                this.renderCurrentView();
            }
        });

        this.pauseBtn.addEventListener('click', () => this.pause());
        this.playBtn.addEventListener('click', () => this.play());
        this.skipBtn.addEventListener('click', () => this.skip());

        this.storage.listenForOverride(overrideData => {
            this.handleOverride(overrideData);
        });

        this.startTimer();
        this.rotateView();
    }

    startTimer() {
        if (this.timerId) clearInterval(this.timerId);
        this.timerId = setInterval(() => this.rotateView(), this.rotationInterval);
    }

    pause() {
        if (this.isOverridden || this.isPaused) return;
        this.isPaused = true;
        clearInterval(this.timerId);
        this.progressBar.style.animationPlayState = 'paused';
        this.pauseBtn.classList.add('hidden');
        this.playBtn.classList.remove('hidden');
    }

    play() {
        if (this.isOverridden || !this.isPaused) return;
        this.isPaused = false;
        this.startTimer();
        this.progressBar.style.animationPlayState = 'running';
        this.playBtn.classList.add('hidden');
        this.pauseBtn.classList.remove('hidden');
    }

    skip() {
        if (this.isOverridden) return;
        this.rotateView();
        if (!this.isPaused) {
            this.startTimer();
        }
    }

    rotateView() {
        this.currentViewIndex = (this.currentViewIndex + 1) % this.views.length;
        this.renderCurrentView();
        this.startProgressBar();
    }

    /**
     * Calculates the Yes/No counts for a specific poll question
     * @param {string} questionKey - The question key (q1, q2, q3)
     * @returns {object} Object with yesCount and noCount
     */
    calculatePollCounts(questionKey) {
        let yesCount = 0;
        let noCount = 0;

        this.pollResponses.forEach(response => {
            const answer = response[questionKey];
            if (answer === 'yes') {
                yesCount++;
            } else if (answer === 'no') {
                noCount++;
            }
            // 'no_response' is ignored
        });

        return { yesCount, noCount };
    }

    /**
     * Updates the views array to include poll visualizations if responses exist
     */
    updateViewsWithPollData() {
        // Start with base views
        this.views = [...this.baseViews];

        // Only add poll views if we have responses
        if (this.pollResponses.length > 0) {
            // Add each poll question as a separate view
            Object.keys(POLL_QUESTIONS).forEach(questionKey => {
                const counts = this.calculatePollCounts(questionKey);
                const total = counts.yesCount + counts.noCount;

                // Only add the view if there are actual yes/no responses
                if (total > 0) {
                    this.views.push({
                        name: `Poll: ${questionKey.toUpperCase()}`,
                        method: 'renderPoll',
                        questionKey: questionKey
                    });
                }
            });
        }

        console.log(`[Presenter] Updated views. Total views: ${this.views.length}`);
    }

    renderCurrentView() {
        const currentView = this.views[this.currentViewIndex];
        this.titleElement.textContent = currentView.name;

        let viewHtml;
        if (currentView.method === 'renderPoll') {
            // Handle poll rendering
            const questionKey = currentView.questionKey;
            const questionText = POLL_QUESTIONS[questionKey];
            const counts = this.calculatePollCounts(questionKey);
            viewHtml = this.vizManager.renderPollResultsForPresenter(
                questionText,
                counts.yesCount,
                counts.noCount
            );
        } else if (currentView.method === 'renderInsightsSummaryForPresenter') {
            const insights = this.topicModeler.generateInsights(this.submissions);
            viewHtml = this.vizManager[currentView.method](insights);
        } else {
            viewHtml = this.vizManager[currentView.method](this.submissions, this.topicModeler);
        }

        this.visContainer.innerHTML = `<div class="visualization-content">${viewHtml}</div>`;

        if (currentView.method === 'renderWordCloudForPresenter') {
            this.vizManager.initializeWordCloudLayout();
        }
    }

    startProgressBar() {
        this.progressBar.classList.remove('active');
        void this.progressBar.offsetWidth; 
        this.progressBar.classList.add('active');
        if (this.isPaused || this.isOverridden) {
            this.progressBar.style.animationPlayState = 'paused';
        } else {
            this.progressBar.style.animationPlayState = 'running';
        }
    }

    // MODIFIED: This is the key change to fix the visual freeze
    handleOverride(overrideData) {
        if (overrideData && !this.isOverridden) {
            // --- An override is STARTING ---
            this.isOverridden = true;
            this.wasPausedBeforeOverride = this.isPaused;
            clearInterval(this.timerId);
            this.overrideTheme.textContent = overrideData.theme;
            this.overrideText.textContent = `“${overrideData.text}”`;
            this.overrideContainer.classList.add('visible'); // Use the new class
            this.progressBar.style.animationPlayState = 'paused';
            this.controls.classList.add('hidden');
        } else if (!overrideData && this.isOverridden) {
            // --- An override is ENDING ---
            this.isOverridden = false;
            this.overrideContainer.classList.remove('visible'); // Use the new class
            this.controls.classList.remove('hidden');
            if (this.wasPausedBeforeOverride) {
                this.isPaused = true;
                this.pauseBtn.classList.add('hidden');
                this.playBtn.classList.remove('hidden');
            } else {
                this.isPaused = false;
                this.playBtn.classList.add('hidden');
                this.pauseBtn.classList.remove('hidden');
                this.startTimer();
                this.progressBar.style.animationPlayState = 'running';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const presenter = new Presenter();
    presenter.init();
});