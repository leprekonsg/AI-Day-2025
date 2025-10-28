// MODIFIED: Replaced the entire class to add control logic
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
        this.pauseBtn = document.getElementById('pause-btn');
        this.playBtn = document.getElementById('play-btn');
        this.skipBtn = document.getElementById('skip-btn');

        this.submissions = [];
        this.currentViewIndex = 0;
        this.views = [
            { name: 'Top Themes', method: 'renderBarChartForPresenter' },
            { name: 'Top Key Terms', method: 'renderWordCloudForPresenter' },
            { name: 'Audience Sentiment', method: 'renderSentimentOverviewForPresenter' },
            { name: 'Insights Summary', method: 'renderInsightsSummaryForPresenter' }
        ];
        this.rotationInterval = 15000;
        this.unsubscribe = null;

         // ADDED: Override elements
        this.overrideContainer = document.getElementById('override-container');
        this.overrideTheme = this.overrideContainer.querySelector('.override-theme');
        this.overrideText = this.overrideContainer.querySelector('.override-text');

        this.isPaused = false;
        this.timerId = null;
    }

    init() {
        this.unsubscribe = this.storage.getApprovedSubmissions(approvedData => {
            this.submissions = approvedData;
            this.topicModeler = new EnhancedTopicModeler(false);
            this.submissions.forEach(sub => {
                this.topicModeler.updateCorpusStats(sub.text);
            });
            this.renderCurrentView();
        });

        // Event listeners for the new controls
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.playBtn.addEventListener('click', () => this.play());
        this.skipBtn.addEventListener('click', () => this.skip());

        // ADDED: Start listening for the override command
        this.storage.listenForOverride(overrideData => {
            this.handleOverride(overrideData);
        });

        this.startTimer(); // MODIFIED: Use a dedicated method to start the timer
        this.rotateView();
    }

    // ADDED: Method to start the rotation timer
    startTimer() {
        if (this.timerId) clearInterval(this.timerId);
        this.timerId = setInterval(() => this.rotateView(), this.rotationInterval);
    }

    // ADDED: Pause functionality
    pause() {
        if (this.isPaused) return;
        this.isPaused = true;
        clearInterval(this.timerId);
        this.progressBar.style.animationPlayState = 'paused';
        this.pauseBtn.classList.add('hidden');
        this.playBtn.classList.remove('hidden');
    }

    // ADDED: Play functionality
    play() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.startTimer();
        this.progressBar.style.animationPlayState = 'running';
        this.playBtn.classList.add('hidden');
        this.pauseBtn.classList.remove('hidden');
    }

    // ADDED: Skip functionality
    skip() {
        this.rotateView(); // Immediately rotate to the next view
        if (!this.isPaused) {
            // If not paused, reset the timer to give the new view a full 15 seconds
            this.startTimer();
        }
    }

    rotateView() {
        this.currentViewIndex = (this.currentViewIndex + 1) % this.views.length;
        this.renderCurrentView();
        this.startProgressBar();
    }

    renderCurrentView() {
        const currentView = this.views[this.currentViewIndex];
        this.titleElement.textContent = currentView.name;

        let viewHtml;
        if (currentView.method === 'renderInsightsSummaryForPresenter') {
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
        // ADDED: Ensure the animation is running when a new view starts
        if (this.isPaused) {
            this.progressBar.style.animationPlayState = 'paused';
        } else {
            this.progressBar.style.animationPlayState = 'running';
        }
    }
     // ADDED: New method to handle the override state
    handleOverride(overrideData) {
        if (overrideData) {
            // An override is active
            this.overrideTheme.textContent = overrideData.theme;
            this.overrideText.textContent = `“${overrideData.text}”`;
            this.overrideContainer.classList.remove('hidden');
            this.pause(); // Reuse our existing pause logic
        } else {
            // The override has been cleared
            this.overrideContainer.classList.add('hidden');
            this.play(); // Reuse our existing play logic
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const presenter = new Presenter();
    presenter.init();
});