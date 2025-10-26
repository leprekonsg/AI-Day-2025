// In: js/visualization-manager.js

class VisualizationManager {
    constructor() {
        this.themeIcons = THEME_ICONS;

        // Jargon and Synonym Normalization Map
        // Keys MUST be lowercase. Values are the desired final display form.
        this.jargonMap = {
            'ai': 'AI',
            'a.i.': 'AI',
            'artificial intelligence': 'AI',
            'ml': 'Machine Learning',
            'machine learning': 'Machine Learning',
            'llm': 'LLM',
            'large language model': 'LLM',
            'gpt': 'GPT',
            'supply chain': 'Supply Chain',
            'supply chain management': 'Supply Chain',
            'scm': 'Supply Chain',
            'kpi': 'KPI',
            'key performance indicator': 'KPI',
            'roi': 'ROI',
            'return on investment': 'ROI',
            'job security': 'Job Security',
            'future of work': 'Future of Work'
        };
    }

    /**
     * Normalizes a term by checking it against the jargon map.
     * This process is case-insensitive.
     * @param {string} term The term to normalize.
     * @returns {string} The normalized term.
     */
    normalizeTerm(term) {
        const lowerTerm = term.toLowerCase();
        // If the lowercase term exists in our map, return the canonical version.
        if (this.jargonMap[lowerTerm]) {
            return this.jargonMap[lowerTerm];
        }
        // --- REFINEMENT ---
        // If not in the map, we still want to handle simple case differences.
        // For example, to group "Cloud" and "cloud".
        // We will return the original term, as its casing might be intentional (like an acronym).
        // The counting logic below will handle the grouping.
        return term;
    }

    renderBarChartForPresenter(submissions) {
        // ... (this method remains unchanged) ...
        if (submissions.length === 0) return '<h2>Waiting for approved submissions...</h2>';
        const themeCounts = {};
        submissions.forEach(sub => { themeCounts[sub.theme] = (themeCounts[sub.theme] || 0) + 1; });
        const sortedThemes = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]);
        const totalSubmissions = submissions.length;
        let html = '<div class="bar-chart-container">';
        sortedThemes.forEach(([themeName, count]) => {
            const percentage = Math.round((count / totalSubmissions) * 100);
            const icon = this.themeIcons[themeName] || '💭';
            const themeSubmissions = submissions.filter(s => s.theme === themeName);
            const sentimentCount = themeSubmissions.reduce((acc, s) => { acc[s.sentiment] = (acc[s.sentiment] || 0) + 1; return acc; }, { positive: 0, negative: 0, neutral: 0, concern: 0 });
            const avgConfidence = themeSubmissions.reduce((sum, s) => sum + (s.confidence || 0), 0) / themeSubmissions.length;
            const confidencePercent = Math.round(avgConfidence * 100);
            const latestSubmission = themeSubmissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            const sampleText = latestSubmission ? `"${latestSubmission.text.substring(0, 100)}..."` : "No sample available.";
            html += `
                <div class="bar-item">
                    <div class="bar-header">
                        <div class="bar-title">
                            <span>${icon}</span>
                            <span>${themeName}</span>
                            <span class="bar-count">(${count})</span>
                            <span class="confidence-badge">${confidencePercent}% confidence</span>
                        </div>
                        <div class="bar-sentiment">
                            ${sentimentCount.positive > 0 ? `<span class="sentiment-badge positive">✓ ${sentimentCount.positive}</span>` : ''}
                            ${sentimentCount.negative > 0 ? `<span class="sentiment-badge negative">! ${sentimentCount.negative}</span>` : ''}
                            ${sentimentCount.concern > 0 ? `<span class="sentiment-badge concern">? ${sentimentCount.concern}</span>` : ''}
                            ${sentimentCount.neutral > 0 ? `<span class="sentiment-badge neutral">• ${sentimentCount.neutral}</span>` : ''}
                        </div>
                    </div>
                    <div class="bar-fill-container"><div class="bar-fill" style="width: ${percentage}%;">${percentage}%</div></div>
                    <div class="bar-sample">${sampleText}</div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    renderWordCloudForPresenter(submissions) {
        if (submissions.length === 0) return '<h2>Waiting for approved submissions...</h2>';

        // First, extract and normalize all terms and phrases
        const allTerms = submissions.flatMap(s => 
            (s.keyTerms.map(kt => kt.term)).concat(s.keyPhrases || [])
        );

        const normalizedTerms = allTerms.map(term => this.normalizeTerm(term));

        // --- REFINEMENT: Case-insensitive counting ---
        // This is the most robust way to count. We use a map where keys are the
        // lowercase version for counting, but we store the correctly-cased version.
        const termCounts = new Map();
        normalizedTerms.forEach(term => {
            const lowerTerm = term.toLowerCase();
            const existing = termCounts.get(lowerTerm);
            if (existing) {
                // Increment the count
                existing.count++;
            } else {
                // Add the new term, storing its original casing for display
                termCounts.set(lowerTerm, { displayTerm: term, count: 1 });
            }
        });

        // Boost scores for multi-word phrases
        const multiWordPhrases = submissions.flatMap(s => s.keyPhrases || []).map(p => this.normalizeTerm(p));
        multiWordPhrases.forEach(phrase => {
            const lowerPhrase = phrase.toLowerCase();
            const existing = termCounts.get(lowerPhrase);
            if (existing) {
                // Give a 0.5 bonus for being a multi-word phrase
                existing.count += 0.5;
            }
        });

        // Convert the map to an array and sort by count
        const sorted = Array.from(termCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 30);
        
        if (sorted.length === 0) return '<h2>Not enough data for key terms yet...</h2>';

        const maxCount = sorted[0].count;
        const minCount = sorted[sorted.length - 1].count;

        let html = '<div id="word-cloud-area" class="word-cloud-container">';
        sorted.forEach(item => {
            const { displayTerm, count } = item;
            const normalizedCount = (count - minCount) / (maxCount - minCount + 1);
            const fontSizeRem = 1 + normalizedCount * 3.5;
            const fontWeight = (normalizedCount > 0.7) ? 600 : 400;
            let colorClass = 't-secondary';
            if (normalizedCount > 0.8) colorClass = 't-cyan';
            else if (normalizedCount > 0.5) colorClass = 't-orange';
            else if (normalizedCount > 0.2) colorClass = 't-primary';
            const formattedTerm = displayTerm.replace(/ /g, '\u00A0');
            html += `<span class="cloud-word ${colorClass}" style="font-size: ${fontSizeRem.toFixed(2)}rem; font-weight: ${fontWeight};">${formattedTerm}</span>`;
        });
        html += '</div>';
        return html;
    }

    initializeWordCloudLayout() {
        // ... (this method remains unchanged) ...
        const container = document.getElementById('word-cloud-area');
        if (!container) return;
        const words = Array.from(container.getElementsByClassName('cloud-word'));
        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        const placedRects = [];
        const checkCollision = (rect1, rect2) => {
            const padding = 5;
            return (rect1.x < rect2.x + rect2.width + padding && rect1.x + rect1.width + padding > rect2.x && rect1.y < rect2.y + rect2.height + padding && rect1.y + rect1.height + padding > rect2.y);
        };
        words.forEach((wordEl, index) => {
            const wordRect = wordEl.getBoundingClientRect();
            const currentWord = { width: wordRect.width, height: wordRect.height };
            if (index === 0) {
                currentWord.x = centerX - currentWord.width / 2;
                currentWord.y = centerY - currentWord.height / 2;
            } else {
                let angle = Math.random() * 2 * Math.PI;
                let radius = 0.2 * Math.max(containerRect.width, containerRect.height);
                let foundPosition = false;
                for (let i = 0; i < 250; i++) {
                    radius += 2; angle += 0.3;
                    const x = centerX + radius * Math.cos(angle) - currentWord.width / 2;
                    const y = centerY + radius * Math.sin(angle) - currentWord.height / 2;
                    currentWord.x = x; currentWord.y = y;
                    let isColliding = false;
                    for (const placed of placedRects) { if (checkCollision(currentWord, placed)) { isColliding = true; break; } }
                    if (!isColliding) { foundPosition = true; break; }
                }
                if (!foundPosition) { wordEl.style.display = 'none'; return; }
            }
            placedRects.push(currentWord);
            wordEl.style.left = `${currentWord.x}px`;
            wordEl.style.top = `${currentWord.y}px`;
            wordEl.style.animationDelay = `${index * 0.05}s`;
            wordEl.classList.add('placed');
        });
    }

    renderSentimentOverviewForPresenter(submissions) {
        // ... (this method remains unchanged) ...
        if (submissions.length === 0) return '<h2>Waiting for approved submissions...</h2>';
        const sentimentCounts = submissions.reduce((acc, s) => { acc[s.sentiment] = (acc[s.sentiment] || 0) + 1; return acc; }, { positive: 0, neutral: 0, negative: 0, concern: 0 });
        const total = submissions.length;
        const positivePercent = total > 0 ? Math.round((sentimentCounts.positive / total) * 100) : 0;
        const negativePercent = total > 0 ? Math.round((sentimentCounts.negative / total) * 100) : 0;
        const concernPercent = total > 0 ? Math.round((sentimentCounts.concern / total) * 100) : 0;
        const neutralPercent = 100 - positivePercent - negativePercent - concernPercent;
        let html = `<div class="sentiment-overview">
            <div class="sentiment-bar">
                <div class="sentiment-fill positive" style="width: ${positivePercent}%">${positivePercent > 5 ? `${positivePercent}%` : ''}</div>
                <div class="sentiment-fill concern" style="width: ${concernPercent}%">${concernPercent > 5 ? `${concernPercent}%` : ''}</div>
                <div class="sentiment-fill negative" style="width: ${negativePercent}%">${negativePercent > 5 ? `${negativePercent}%` : ''}</div>
                <div class="sentiment-fill neutral" style="width: ${neutralPercent}%">${neutralPercent > 5 ? `${neutralPercent}%` : ''}</div>
            </div>
            <div class="sentiment-legend">
                <div class="legend-item positive"><span></span>Positive (${sentimentCounts.positive})</div>
                <div class="legend-item concern"><span></span>Concern (${sentimentCounts.concern})</div>
                <div class="legend-item negative"><span></span>Negative (${sentimentCounts.negative})</div>
                <div class="legend-item neutral"><span></span>Neutral (${sentimentCounts.neutral})</div>
            </div>
        </div>`;
        return html;
    }
}