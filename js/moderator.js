// MODIFIED: Replaced the entire class to fix the rendering conflict
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
        this.currentOverrideId = null;
        this.init();
    }

    init() {
        // Listener for the override state.
        // MODIFIED: This now ONLY updates the state and triggers a re-render of the featured column.
        const overrideUnsubscribe = this.storage.listenForOverride(overrideData => {
            const newOverrideId = overrideData ? overrideData.firestoreId : null;
            // Only re-render if the override ID has actually changed
            if (this.currentOverrideId !== newOverrideId) {
                this.currentOverrideId = newOverrideId;
                // Manually trigger the listener for the featured collection to re-render with the new state.
                // We do this by re-attaching it.
                if (this.featuredListener) this.featuredListener(); // Unsubscribe the old one
                this.featuredListener = this.listenToCollection('featured', this.featuredRail, this.featuredCount, this.createFeaturedCard.bind(this));
            }
        });
        this.unsubscribers.push(overrideUnsubscribe);

        // Set up the three collection listeners
        this.listenToCollection('pending', this.pendingQueue, this.pendingCount, this.createPendingCard.bind(this));
        this.listenToCollection('approved', this.approvedPool, this.approvedCount, this.createApprovedCard.bind(this));
        // Store the featured listener so we can refresh it
        this.featuredListener = this.listenToCollection('featured', this.featuredRail, this.featuredCount, this.createFeaturedCard.bind(this));
    }

    // REMOVED: The conflicting refreshCollection method has been deleted.

    listenToCollection(status, container, countEl, cardCreator) {
        const unsubscribe = this.storage.submissionsRef.where('status', '==', status)
            .orderBy('timestamp', 'desc')
            .onSnapshot(querySnapshot => {
                countEl.textContent = querySnapshot.size;
                container.innerHTML = '';
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
        return unsubscribe; // Return the function to allow us to re-attach it
    }

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

    createFeaturedCard(sub) {
        const card = this.createBaseCard(sub);
        card.classList.add('featured-card');

        let actionButtonHTML = '';
        // MODIFIED: The card creator now correctly checks the current override state
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Moderator();
});