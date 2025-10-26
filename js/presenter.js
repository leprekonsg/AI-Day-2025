// In: js/presenter.js

class Presenter {
    constructor() {
        this.storage = new Storage();
        this.vizManager = new VisualizationManager();

        // DOM Elements
        this.visContainer = document.getElementById('visualization-container');
        this.titleElement = document.getElementById('current-view-title');
        this.progressBar = document.getElementById('progress-bar');

        this.submissions = [];
        this.currentViewIndex = 0;
        this.views = [
            { name: 'Top Themes', method: 'renderBarChartForPresenter' },
            { name: 'Top Key Terms', method: 'renderWordCloudForPresenter' },
            { name: 'Audience Sentiment', method: 'renderSentimentOverviewForPresenter' }
        ];
        this.rotationInterval = 15000; // 15 seconds
        this.unsubscribe = null;
    }

    init() {
        // Set up the real-time listener for approved submissions.
        this.unsubscribe = this.storage.getApprovedSubmissions(approvedData => {
            this.submissions = approvedData;
            // Re-render the currently active view whenever new data arrives.
            this.renderCurrentView();
        });

        // The view rotation timer remains the same.
        setInterval(() => this.rotateView(), this.rotationInterval);
        this.rotateView(); // Initial call
    }

    // REMOVED: updateDataAndRender() is no longer needed.

    rotateView() {
        this.currentViewIndex = (this.currentViewIndex + 1) % this.views.length;
        this.renderCurrentView();
        this.startProgressBar();
    }

    renderCurrentView() {
        const currentView = this.views[this.currentViewIndex];
        this.titleElement.textContent = currentView.name;

        // The submissions data is now always up-to-date.
        const viewHtml = this.vizManager[currentView.method](this.submissions);
        
        this.visContainer.innerHTML = `<div class="visualization-content">${viewHtml}</div>`;

        if (currentView.method === 'renderWordCloudForPresenter') {
            this.vizManager.initializeWordCloudLayout();
        }
    }

    startProgressBar() {
        this.progressBar.classList.remove('active');
        void this.progressBar.offsetWidth; 
        this.progressBar.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const presenter = new Presenter();
    presenter.init();
});