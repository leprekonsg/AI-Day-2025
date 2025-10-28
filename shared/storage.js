// In: shared/storage.js

/* ============================================= */
/* STORAGE MANAGER (FIRESTORE IMPLEMENTATION)    */
/* ============================================= */
/* Handles all interactions with Google Firestore,*/
/* acting as the single source of truth for      */
/* submission data across all pages.             */
/* ============================================= */

class Storage {
    constructor() {
        // The 'db' constant is now available globally from firebase-init.js
        if (typeof db === 'undefined') {
            console.error("Firestore (db) is not initialized. Make sure firebase-init.js is loaded correctly.");
            return;
        }
        this.submissionsRef = db.collection('submissions');
        console.log("Storage Manager initialized with Firestore.");
    }

    async addSubmission(newSubmission) {
        try {
            const docRef = await this.submissionsRef.add(newSubmission);
            console.log(`[Firestore] Submission added with ID: ${docRef.id}`);
        } catch (error) {
            console.error("[Firestore] Error adding document: ", error);
        }
    }

    /**
     * Sets up a real-time listener for pending submissions.
     * @param {function} callback Function to be called with the array of pending submissions whenever data changes.
     * @returns {function} An unsubscribe function to stop listening for changes.
     */
    getPendingSubmissions(callback) {
        const unsubscribe = this.submissionsRef.where('status', '==', 'pending')
            .orderBy('timestamp', 'desc')
            .onSnapshot(querySnapshot => {
                const pending = [];
                querySnapshot.forEach(doc => {
                    // IMPORTANT: We add the Firestore document ID to the object
                    pending.push({ firestoreId: doc.id, ...doc.data() });
                });
                callback(pending);
            }, error => {
                console.error("[Firestore] Error listening to pending submissions: ", error);
            });
        return unsubscribe;
    }

    /**
     * Sets up a real-time listener for approved submissions.
     * @param {function} callback Function to be called with the array of approved submissions whenever data changes.
     * @returns {function} An unsubscribe function to stop listening for changes.
     */
    getApprovedSubmissions(callback) {
        // MODIFIED: Use an 'in' query to get both approved and featured documents
        const unsubscribe = this.submissionsRef.where('status', 'in', ['approved', 'featured'])
            .orderBy('timestamp', 'desc')
            .onSnapshot(querySnapshot => {
                const approved = [];
                querySnapshot.forEach(doc => {
                    approved.push({ firestoreId: doc.id, ...doc.data() });
                });
                console.log(`[Firestore] Presenter received update. Found ${approved.length} live submissions.`);
                callback(approved);
            }, error => {
                console.error("[Firestore] Error listening to approved submissions: ", error);
            });
        return unsubscribe;
    }

    async updateSubmissionStatus(firestoreId, status) {
        try {
            await this.submissionsRef.doc(firestoreId).update({ status: status });
            console.log(`[Firestore] Updated submission ID ${firestoreId} to status '${status}'.`);
        } catch (error) {
            console.error(`[Firestore] FAILED to update submission with ID ${firestoreId}.`, error);
        }
    }

     // ADDED: Method to set or create the override document
    async setOverride(questionData) {
        try {
            // We use a predictable document ID 'current' for easy access
            await db.collection('live_control').doc('current').set(questionData);
            console.log("[Firestore] Override set with question ID:", questionData.firestoreId);
        } catch (error) {
            console.error("[Firestore] FAILED to set override.", error);
        }
    }

    // ADDED: Method to clear the override document
    async clearOverride() {
        try {
            await db.collection('live_control').doc('current').delete();
            console.log("[Firestore] Override cleared.");
        } catch (error) {
            console.error("[Firestore] FAILED to clear override.", error);
        }
    }

    // ADDED: Method for the Presenter and Moderator to listen to the override state
    listenForOverride(callback) {
        const unsubscribe = db.collection('live_control').doc('current')
            .onSnapshot(doc => {
                callback(doc.exists ? { id: doc.id, ...doc.data() } : null);
            }, error => {
                console.error("[Firestore] Error listening to override: ", error);
            });
        return unsubscribe;
    }
}