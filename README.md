# AI Day 2025 - Live Insights Platform

A real-time audience interaction and data visualization platform designed for live events. This system allows attendees to submit questions, which are then analyzed by a sophisticated, client-side NLP engine, approved by a moderator, and displayed on a main presenter screen. The presenter dashboard features an auto-rotating slideshow of visualizations, complete with interactive controls and a powerful "Executive Briefing" summary.

![Presenter Dashboard Screenshot](https://storage.googleapis.com/gemini-prod/images/2024/05/20/19_15_01_332222_00.png)
*(Image: A representation of the main Presenter Dashboard. The live view is even more advanced, featuring an Executive Briefing panel, presenter controls, and a kinetic word cloud.)*

---

## ✨ Key Features

*   **Executive Briefing Panel:** Instead of just showing data, the AI generates a high-level summary for the presenter, identifying **Sentiment Hotspots** (e.g., "Most Positive Topic"), **Key Discussion Points** with representative quotes, and **Emerging Concepts** that are bubbling up from the audience.
*   **Interactive Presenter Controls:** The presenter has full command over the visualization slideshow with intuitive **Pause, Play, and Skip** controls, allowing them to linger on important insights or move to the next topic.
*   **Seamless Submission Experience:** The audience submission form provides instant, inline feedback. The submit button confirms the question's theme, and a link to the live feed appears without navigating the user away from the page.
*   **Real-Time Database Backend:** Built on **Google Firestore** to ensure seamless, instantaneous data synchronization between the audience, moderators, and the presenter screen.
*   **Advanced NLP Engine:** A powerful, client-side model that analyzes submissions for thematic content, nuanced sentiment (including a special `concern` category), and context awareness (negation, intensifiers).
*   **Dynamic Visualizations:** The platform automatically rotates through key data visualizations, including a Top Themes bar chart, a kinetic Word Cloud with multi-word phrase analysis, and an overall Audience Sentiment meter.
*   **Shared AI Corpus:** The AI model's "memory" of words and phrases is persisted in the browser's `localStorage` on the submission page, allowing it to become more intelligent and provide better theme suggestions with every new submission.

---

## 🏛️ System Architecture

The platform is built on a modern, decoupled architecture using **Google Firestore** as its real-time data backend and the browser's `localStorage` for client-side AI model enhancement.

1.  **Audience (`index.html`)**: A user submits a question. The client-side NLP engine—which learns from previous submissions stored in `localStorage`—analyzes it. The question and its metadata are written to Firestore with a `pending` status.
2.  **Moderator (`moderator.html`)**: This page listens to Firestore for `pending` submissions. The moderator can approve or reject questions, which instantly updates their status in the database.
3.  **Presenter (`presenter.html`)**: This page listens for `approved` submissions. As soon as a question is approved, it is factored into the live visualizations. The presenter's AI model operates independently of `localStorage` to ensure it only analyzes the fresh, approved data from Firestore.

This hybrid design ensures a scalable, real-time experience while providing a continuously improving AI model for the audience.

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

This project uses Node.js to run a simple web server and requires a Google Firebase project for the backend.

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
    *   Rename the `shared/firebase-init.template.js` file to `shared/firebase-init.js`.
    *   Paste your `firebaseConfig` object into `shared/firebase-init.js`.
    *   In the Firebase Console, go to **Firestore Database**, create a database, and start in **test mode** for initial setup (you can secure it with rules later).

4.  **Run the Server:**
    ```bash
    npm start
    ```
    The server will be running at `http://localhost:8080`.

5.  **Launch the Pages:**
    *   Audience View: **`http://localhost:8080/index.html`**
    *   Moderator View: **`http://localhost:8080/moderator.html`**
    *   Presenter View: **`http://localhost:8080/presenter.html`**

    *Tip: Open each page in a separate browser tab to simulate the live event experience.*

---

## 🔧 Customization

This project is easy to customize:

*   **Visuals & Branding:** Modify colors, fonts, and logos in `shared/style.css`.
*   **Presenter View Rotation:** Change the time each visualization is displayed by editing the `rotationInterval` variable in `js/presenter.js`.
*   **AI Theme Definitions:** Tailor the topic modeler to your event's content by adjusting the keywords in the `themeDefinitions` object in `shared/modeler.js`.
*   **Sentiment Analysis Tuning:** Fine-tune the sentiment engine by adding or adjusting words and weights in the lexicons inside the `analyzeSentiment` method in `shared/modeler.js`.