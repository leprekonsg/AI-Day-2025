// In: js/moderator.js

class Moderator {
    constructor() {
        this.storage = new Storage();
        this.pendingQueue = document.getElementById('pending-queue');
        this.pendingCount = document.getElementById('pending-count');
        this.unsubscribe = null; // To hold the listener cleanup function
        this.init();
    }

    init() {
        // Set up the real-time listener.
        // The callback function will be executed immediately and whenever data changes.
        this.unsubscribe = this.storage.getPendingSubmissions(pendingData => {
            this.renderQueue(pendingData);
        });
    }

    renderQueue(pending) {
        this.pendingCount.textContent = pending.length;
        this.pendingQueue.innerHTML = '';

        if (pending.length === 0) {
            this.pendingQueue.innerHTML = '<p>The queue is empty. Great job!</p>';
            return;
        }

        pending.forEach(sub => {
            const card = this.createSubmissionCard(sub);
            this.pendingQueue.appendChild(card);
        });
    }

    createSubmissionCard(sub) {
        const card = document.createElement('div');
        card.className = 'submission-card';
        // Use the Firestore document ID for data-id
        card.dataset.id = sub.firestoreId;

        // ... (the innerHTML of the card is the same as before) ...
        const sentimentClass = sub.sentiment.toLowerCase();
        let sourceIndicator = '';
        if (sub.analysisSource === 'enhanced') {
            sourceIndicator = `<span class="analysis-indicator" title="Analyzed with Enhanced NLP">✨</span>`;
        } else if (sub.analysisSource === 'fallback') {
            sourceIndicator = `<span class="analysis-indicator" title="Analyzed with Fallback Logic">⚠️</span>`;
        }

        card.innerHTML = `
            <div class="card-content">
                <p>"${sub.text}"</p>
            </div>
            <div class="card-metadata">
                <span class="meta-tag theme-tag">${sub.theme}</span>
                <span class="meta-tag sentiment-tag ${sentimentClass}">${sub.sentiment}</span>
                ${sourceIndicator}
                ${sub.keyTerms.map(kt => `<span class="meta-tag">${kt.term}</span>`).join('')}
                <div class="card-actions">
                    <button class="btn reject-btn">Reject</button>
                    <button class="btn approve-btn">Approve</button>
                </div>
            </div>
        `;
        // Use sub.firestoreId for the update
        card.querySelector('.approve-btn').addEventListener('click', () => this.updateStatus(sub.firestoreId, 'approved'));
        card.querySelector('.reject-btn').addEventListener('click', () => this.updateStatus(sub.firestoreId, 'rejected'));

        return card;
    }

    updateStatus(id, status) {
        // Call the new async storage method. No need to cast ID to number.
        this.storage.updateSubmissionStatus(id, status);
        // The UI will update automatically via the onSnapshot listener,
        // but removing the card manually provides a faster-feeling user experience.
        const cardToRemove = this.pendingQueue.querySelector(`[data-id='${id}']`);
        if (cardToRemove) {
            cardToRemove.remove();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Moderator();
});