class Moderator {
    constructor() {
        this.storage = new Storage();
        
        this.pendingQueue = document.getElementById('pending-queue');
        this.approvedPool = document.getElementById('approved-pool');
        this.featuredRail = document.getElementById('featured-rail');
        
        this.pendingCount = document.getElementById('pending-count');
        this.approvedCount = document.getElementById('approved-count');
        this.featuredCount = document.getElementById('featured-count');

        this.unsubscribers = [];
        this.currentOverrideId = null; // ADDED: To track the live question
        this.init();
    }

    init() {
        // ADDED: Listen to the override state to update the UI
        const overrideUnsubscribe = this.storage.listenForOverride(overrideData => {
            this.currentOverrideId = overrideData ? overrideData.firestoreId : null;
            // We need to re-render the featured rail to show the correct button
            this.refreshCollection('featured');
        });
        this.unsubscribers.push(overrideUnsubscribe);

        // Set up the three collection listeners
        this.listenToCollection('pending', this.pendingQueue, this.pendingCount, this.createPendingCard.bind(this));
        this.listenToCollection('approved', this.approvedPool, this.approvedCount, this.createApprovedCard.bind(this));
        this.listenToCollection('featured', this.featuredRail, this.featuredCount, this.createFeaturedCard.bind(this));
    }

    // ADDED: A helper to manually refresh a single column when state changes
    refreshCollection(status) {
        const collectionMap = {
            'featured': { container: this.featuredRail, countEl: this.featuredCount, creator: this.createFeaturedCard.bind(this) }
            // Add other collections here if they ever need manual refreshing
        };
        const config = collectionMap[status];
        if (!config) return;

        this.storage.submissionsRef.where('status', '==', status).orderBy('timestamp', 'desc').get().then(querySnapshot => {
            config.countEl.textContent = querySnapshot.size;
            config.container.innerHTML = '';
            if (querySnapshot.empty) {
                config.container.innerHTML = `<p class="empty-message">This list is empty.</p>`;
            } else {
                querySnapshot.forEach(doc => {
                    const sub = { firestoreId: doc.id, ...doc.data() };
                    const card = config.creator(sub);
                    config.container.appendChild(card);
                });
            }
        });
    }

    listenToCollection(status, container, countEl, cardCreator) {
        const unsubscribe = this.storage.submissionsRef.where('status', '==', status)
            .orderBy('timestamp', 'desc')
            .onSnapshot(querySnapshot => {
                countEl.textContent = querySnapshot.size;
                container.innerHTML = ''; // Clear the container on each update
                if (querySnapshot.empty) {
                    container.innerHTML = `<p class="empty-message">This list is empty.</p>`;
                } else {
                    querySnapshot.forEach(doc => {
                        const sub = { firestoreId: doc.id, ...doc.data() };
                        const card = cardCreator(sub);
                        container.appendChild(card);
                    });
                }
            }, error => console.error(`[Firestore] Error listening to ${status} submissions:`, error));
        
        this.unsubscribers.push(unsubscribe);
    }

    // Card Creator for the PENDING column
    createPendingCard(sub) {
        const card = this.createBaseCard(sub);
        card.innerHTML += `
            <div class="card-actions">
                <button class="btn reject-btn" title="Reject this question">Reject</button>
                <button class="btn approve-btn" title="Move to Live Pool">Approve</button>
                <button class="btn feature-now-btn" title="Approve and Feature immediately">⭐ Approve & Feature</button>
            </div>`;
        card.querySelector('.reject-btn').addEventListener('click', () => this.updateStatus(sub.firestoreId, 'rejected'));
        card.querySelector('.approve-btn').addEventListener('click', () => this.updateStatus(sub.firestoreId, 'approved'));
        card.querySelector('.feature-now-btn').addEventListener('click', () => this.updateStatus(sub.firestoreId, 'featured'));
        return card;
    }

    // Card Creator for the APPROVED column
    createApprovedCard(sub) {
        const card = this.createBaseCard(sub);
        card.innerHTML += `
            <div class="card-actions">
                <button class="btn recall-btn" title="Move back to Triage Queue">Recall</button>
                <button class="btn feature-btn" title="Move to Featured">⭐ Feature</button>
            </div>`;
        card.querySelector('.recall-btn').addEventListener('click', () => this.updateStatus(sub.firestoreId, 'pending'));
        card.querySelector('.feature-btn').addEventListener('click', () => this.updateStatus(sub.firestoreId, 'featured'));
        return card;
    }

     // MODIFIED: The Featured card creator now has conditional logic for the button
    createFeaturedCard(sub) {
        const card = this.createBaseCard(sub);
        card.classList.add('featured-card');

        let actionButtonHTML = '';
        // Check if THIS card is the one currently being displayed
        if (this.currentOverrideId === sub.firestoreId) {
            actionButtonHTML = `<button class="btn clear-override-btn" title="Hide from main screen">Hide from Screen</button>`;
        } else {
            actionButtonHTML = `<button class="btn display-now-btn" title="Push this question to the main screen">Display Now</button>`;
        }

        card.innerHTML += `
            <div class="card-actions">
                <button class="btn unfeature-btn" title="Move back to Live Pool">Un-Feature</button>
                ${actionButtonHTML}
            </div>`;

        card.querySelector('.unfeature-btn').addEventListener('click', () => this.updateStatus(sub.firestoreId, 'approved'));
        
        // Add listeners for the new buttons
        const displayBtn = card.querySelector('.display-now-btn');
        if (displayBtn) {
            displayBtn.addEventListener('click', () => this.storage.setOverride(sub));
        }
        
        const clearBtn = card.querySelector('.clear-override-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.storage.clearOverride());
        }

        return card;
    }

    createBaseCard(sub) {
        const card = document.createElement('div');
        card.className = 'submission-card';
        card.dataset.id = sub.firestoreId;
        const sentimentClass = sub.sentiment.toLowerCase();
        card.innerHTML = `
            <p class="card-text">"${sub.text}"</p>
            <div class="card-metadata">
                <span class="meta-tag theme-tag">${sub.theme}</span>
                <span class="meta-tag sentiment-tag ${sentimentClass}">${sub.sentiment}</span>
            </div>`;
        return card;
    }

    updateStatus(id, status) {
        this.storage.updateSubmissionStatus(id, status);
        // No need to manually remove cards; the real-time listeners will handle it automatically.
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Moderator();
});