# AI Day 2025 - Live Insights Platform

A real-time audience interaction and data visualization platform designed for live events. This system allows attendees to submit questions, which are then analyzed by a sophisticated, client-side NLP engine for themes and sentiment, approved by a moderator, and displayed on a main presenter screen in a dynamic, engaging dashboard.

![Presenter Dashboard Screenshot](https://storage.googleapis.com/gemini-prod/images/2024/05/20/19_15_01_332222_00.png)
*(Image: A representation of the main Presenter Dashboard. The live view is even more advanced, featuring a kinetic word cloud with multi-word phrases.)*

---

## ✨ Key Features

*   **Advanced NLP Engine:** A powerful, client-side model that analyzes submissions for:
    *   **Thematic Content:** Classifies questions into relevant categories.
    *   **Nuanced Sentiment:** Detects positive, negative, and neutral sentiment, plus a special `concern` category for anxious or worried questions.
    *   **Context Awareness:** Understands negation (e.g., "not good"), contractions, and intensifiers (e.g., "very important").
*   **Multi-Word Phrase Analysis:** The system intelligently extracts key multi-word concepts (e.g., "supply chain logistics," "job security") and displays them in a dynamic, kinetic word cloud on the presenter's screen.
*   **Enhanced Moderator Insights:** The moderation queue gives crucial context, showing whether an analysis was performed by the advanced, grammar-aware engine or the dependency-free fallback, allowing for more confident decision-making.
*   **Dynamic Presenter Dashboard:** A dedicated, full-screen presenter mode that automatically rotates through key data visualizations (Top Themes, Word Cloud, Sentiment Analysis).
*   **Progressive Enhancement Architecture:** The platform is built on a "zero-dependency" core that works anywhere. It can be optionally enhanced by loading the `Compromise.js` NLP library to provide even deeper grammatical analysis without ever breaking the core functionality.
*   **Shared AI Corpus:** The AI model's "memory" of words and phrases is persisted in `localStorage`, allowing it to become more intelligent and accurate with every new submission from the audience.

---

## 🏛️ System Architecture

The platform operates on a powerful decoupled architecture, using the browser's `localStorage` as a shared data source.

1.  **Audience (`index.html`)**: A user submits a question. The question is analyzed by the NLP engine, and the resulting metadata (theme, sentiment, key phrases, etc.) is saved to `localStorage` with a `pending` status.
2.  **Moderator (`moderator.html`)**: This page reads all `pending` submissions. The moderator uses the AI-enriched "Insight Cards" to approve or reject them, which updates their status in `localStorage`.
3.  **Presenter (`presenter.html`)**: This page reads all `approved` submissions and renders the data visualizations. It polls for changes periodically to keep the display up-to-date.

This design uses **progressive enhancement**. The core application has zero dependencies. If the optional `Compromise.js` library is loaded, the sentiment analysis and phrase extraction become more powerful. If the library fails to load, the system seamlessly falls back to its robust, internal rule-based engine.

---

## 📂 Project Structure

```
.
├── css/
│   ├── main.css         # Styles for the audience submission page
│   ├── moderator.css    # Styles for the moderation queue
│   └── presenter.css    # Styles for the presenter dashboard
├── js/
│   ├── main.js          # Logic for the audience submission page
│   ├── moderator.js     # Logic for the moderation queue
│   ├── presenter.js     # Logic for the presenter dashboard
│   └── visualization-manager.js # Renders visualization HTML
├── shared/
│   ├── background-animation.js # Renders the dynamic background effect
│   ├── config.js        # Global configuration
│   ├── modeler.js       # The core AI topic/sentiment analyzer
│   ├── storage.js       # Helper class to manage localStorage
│   ├── theme-data.js    # Shared theme icon definitions
│   └── style.css        # Shared styles, variables, and base layout
├── img/
│   └── qr-code-placeholder.png # Placeholder for your event's QR code
├── index.html           # The audience submission page
├── moderator.html       # The moderation interface
└── presenter.html       # The main screen presenter dashboard
```

---

## 🚀 Getting Started

This project is designed to run without any server or build dependencies.

### Prerequisites

*   A modern web browser (Chrome, Firefox, Safari, Edge).
*   An internet connection (for the optional `Compromise.js` enhancement).
*   A code editor (e.g., VS Code) for any customizations.
*   (Recommended) The **Live Server** extension for VS Code to easily serve the files locally.

### Installation & Launch

1.  **Clone or Download:** Get a copy of the project files onto your local machine.
2.  **Launch the Pages:**
    *   Open `index.html` in your browser to access the audience submission form.
    *   Open `moderator.html` to view the moderation queue.
    *   Open `presenter.html` to see the live presenter dashboard.

    *Tip: Open each page in a separate browser tab or window to simulate the live event experience.*

---

## 🔧 Customization

This project is easy to customize:

*   **Visuals & Branding:** Modify colors, fonts, and logos in `shared/style.css`.
*   **Presenter View Rotation:** Change the time each visualization is displayed by editing the `rotationInterval` variable in `js/presenter.js`.
*   **AI Theme Definitions:** Tailor the topic modeler to your event's content by adjusting the keywords in the `themeDefinitions` object in `shared/modeler.js`.
*   **Sentiment Analysis Tuning:** Fine-tune the sentiment engine by adding or adjusting words and weights in the `positive`, `negative`, `intensifiers`, and `diminishers` lexicons inside the `analyzeSentiment` method in `shared/modeler.js`.