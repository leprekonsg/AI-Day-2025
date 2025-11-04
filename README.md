# AI Day 2025 - Live Insights Platform

A real-time audience interaction and data visualization platform designed for live events. This system allows attendees to submit questions, which are then analyzed by a sophisticated NLP engine and managed by a moderator in a powerful **Control Center**. The moderator can curate, feature, and even push critical questions directly to the main presenter screen, overriding the standard slideshow for maximum impact.

![Presenter Dashboard Screenshot](https://storage.googleapis.com/gemini-prod/images/2024/05/20/19_15_01_332222_00.png)
*(Image: A representation of the main Presenter Dashboard, which can be dynamically overridden by the moderator's "Director Mode".)*

---

## ✨ Key Features

*   **Moderator Control Center & Director Mode:** The moderator is no longer just a gatekeeper but a live content director.
    *   **Three-Column Workflow:** Manage questions in a clear `Triage (Pending)`, `Live Pool (Approved)`, and `⭐ Featured` layout.
    *   **Full Lifecycle Control:** Seamlessly move questions between states: Approve, Reject, Feature, Un-Feature, or Recall.
    *   **Push to Screen:** Instantly override the presenter's auto-rotating slideshow to display a single, important question full-screen, guiding the conversation in real-time.
*   **Enhanced Visualizations:** Modern, audience-focused designs for maximum engagement:
    *   **VS-Style Poll Results:** Dramatic battle layout for Yes/No registration questions with winner effects.
    *   **Sentiment Gauge:** Animated arc meter showing real-time audience mood with emoji indicators.
    *   **Icon-Driven Insights:** Visual-first highlight cards focusing on key topics and emerging trends.
    *   **Top 10 Trending Terms:** Ranked list with medals showing the most discussed concepts.
*   **Interactive Presenter Controls:** The presenter retains command over the visualization slideshow with intuitive **Pause, Play, and Skip** controls.
*   **Real-Time Database Backend:** Built on **Google Firestore** with three collections: `submissions` (main data), `live_control` (Director Mode), and `poll_responses` (registration polls).
*   **Advanced NLP Engine:** A powerful, client-side model that analyzes submissions for thematic content, nuanced sentiment, and context awareness.
*   **Shared AI Corpus:** The AI model's "memory" is persisted in `localStorage` on the submission page, allowing it to become more intelligent with every new submission.

---

## 🏛️ System Architecture

The platform uses a sophisticated, real-time architecture with three Firestore collections.

1.  **Audience (`index.html`)**: A user submits a question. The client-side NLP engine analyzes it, and the question is written to the `submissions` collection with a `pending` status.
2.  **Moderator (`moderator.html`)**: The Control Center listens to the `submissions` collection, displaying questions based on their status (`pending`, `approved`, `featured`). When the moderator uses the **"Display Now"** button, the app writes that question's data to a separate `live_control` document.
3.  **Presenter (`presenter.html`)**: The presenter page has three real-time listeners:
    *   Listens to `submissions` collection for `approved` and `featured` questions to populate standard visualizations.
    *   Listens to `live_control` document for Director Mode overrides (pauses slideshow, shows full-screen question).
    *   Listens to `poll_responses` collection for registration poll data (displays Yes/No results in VS-style battle format).

This multi-collection design separates main data, live control commands, and poll responses for a robust and responsive system.

---

## 📂 Project Structure

```
.
├── css/
│   ├── main.css
│   ├── moderator.css
│   └── presenter.css
├── js/
│   ├── main.js
│   ├── moderator.js
│   ├── presenter.js
│   └── visualization-manager.js
├── shared/
│   ├── background-animation.js
│   ├── config.js
│   ├── firebase-init.js      # Your Firebase credentials
│   ├── firebase-init.template.js # Template for configuration
│   ├── modeler.js
│   ├── storage.js            # Firestore interaction logic
│   ├── style.css
│   └── theme-data.js
├── img/
│   └── qr-code.png
├── index.html                # Audience submission page
├── moderator.html            # Moderation interface
├── presenter.html            # Presenter dashboard
├── package.json              # Project dependencies
└── server.js                 # Local Express server
```

---

## 🚀 Getting Started

This project uses Node.js and requires a Google Firebase project.

### Prerequisites

*   A modern web browser (Chrome, Firefox, Safari, Edge).
*   [Node.js](https://nodejs.org/) (version 20.0.0 or higher).
*   A Google Firebase account and a new project created.

### Installation & Launch

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Firebase:**
    *   In the Firebase Console, create a new Web App for your project.
    *   Copy the `firebaseConfig` object provided.
    *   Rename `shared/firebase-init.template.js` to `shared/firebase-init.js` and paste your config object into it.
    *   Go to **Firestore Database** and create a database.

4.  **Set Firestore Security Rules:**
    *   In the Firestore section of the Firebase Console, click the **Rules** tab.
    *   Delete the existing rules and replace them with the following, then click **Publish**.
    ```javascript
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {

        // Rules for the main submissions collection
        match /submissions/{submissionId} {
          allow read;
          allow create: if request.resource.data.status == 'pending';
          allow update: if request.resource.data.status in ['approved', 'rejected', 'featured', 'pending'];
          allow delete: if false;
        }

        // Rules for the "Director Mode" control collection
        match /live_control/{docId} {
          allow read, write, delete: if true;
        }

        // Rules for poll responses collection
        match /poll_responses/{responseId} {
          allow read;
          allow write: if true;  // Enable write for manual_upload.py script
        }
      }
    }
    ```

5.  **Run the Server:**
    ```bash
    npm start
    ```
    The server will be running at `http://localhost:8080`.

6.  **Launch the Pages:**
    *   Audience View: **`http://localhost:8080/index.html`**
    *   Moderator View: **`http://localhost:8080/moderator.html`**
    *   Presenter View: **`http://localhost:8080/presenter.html`**

---

## 🔧 Customization

*   **Visuals & Branding:** Modify colors, fonts, and logos in `shared/style.css`.
*   **Presenter View Rotation:** Change the time each visualization is displayed by editing the `rotationInterval` variable in `js/presenter.js` (default: 15 seconds).
*   **Poll Questions:** Update registration poll questions in the `POLL_QUESTIONS` object in `shared/config.js`.
*   **AI Theme Definitions:** Tailor the topic modeler to your event's content by adjusting the keywords in the `themeDefinitions` object in `shared/modeler.js`.
*   **Sentiment Analysis Tuning:** Fine-tune the sentiment engine by adding or adjusting words and weights in the `analyzeSentiment` method in `shared/modeler.js`.