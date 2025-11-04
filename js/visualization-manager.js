// In: js/visualization-manager.js

class VisualizationManager {
    constructor() {
        this.themeIcons = THEME_ICONS;

        // Jargon and Synonym Normalization Map
        // Keys MUST be lowercase. Values are the desired final display form.
        this.jargonMap = {
            'stl': 'ST Logistics',
            'st logistics': 'ST Logistics',
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

    // ADDED: New method for Top Rising Terms (as an additional view)
    renderRisingTermsForPresenter(submissions) {
        if (submissions.length === 0) return '<h2>Waiting for approved submissions...</h2>';

        // Extract and normalize terms
        const allTerms = submissions.flatMap(s =>
            (s.keyTerms.map(kt => kt.term)).concat(s.keyPhrases || [])
        );

        const cleanedTerms = allTerms.map(term =>
            term.replace(/[^\p{L}\p{N}\s-]/gu, '').trim()
        ).filter(term => term.length > 0);

        const normalizedTerms = cleanedTerms.map(term => this.normalizeTerm(term));

        // Count terms
        const termCounts = new Map();
        normalizedTerms.forEach(term => {
            const lowerTerm = term.toLowerCase();
            const existing = termCounts.get(lowerTerm);
            if (existing) {
                existing.count++;
            } else {
                termCounts.set(lowerTerm, { displayTerm: term, count: 1 });
            }
        });

        // Boost multi-word phrases
        const multiWordPhrases = submissions.flatMap(s => s.keyPhrases || [])
            .map(p => p.replace(/[^\p{L}\p{N}\s-]/gu, '').trim())
            .filter(p => p.length > 0)
            .map(p => this.normalizeTerm(p));

        multiWordPhrases.forEach(phrase => {
            if (phrase.includes(' ')) {
                const lowerPhrase = phrase.toLowerCase();
                const existing = termCounts.get(lowerPhrase);
                if (existing) {
                    existing.count += 0.5;
                }
            }
        });

        // Get top 6 (optimized for no-scroll layout)
        const topTerms = Array.from(termCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        if (topTerms.length === 0) return '<h2>Not enough data for key terms yet...</h2>';

        const maxCount = topTerms[0].count;

        let html = '<div class="rising-terms-container">';
        html += '<div class="rising-terms-list">';

        topTerms.forEach((item, index) => {
            const { displayTerm, count } = item;
            const percentage = (count / maxCount) * 100;
            const rank = index + 1;

            // Medal for top 3
            let medal = '';
            if (rank === 1) medal = '🥇';
            else if (rank === 2) medal = '🥈';
            else if (rank === 3) medal = '🥉';

            html += `
                <div class="rising-term-item" style="animation-delay: ${index * 0.1}s">
                    <div class="term-rank">${medal || `#${rank}`}</div>
                    <div class="term-content">
                        <div class="term-name">${displayTerm}</div>
                        <div class="term-bar-container">
                            <div class="term-bar" style="width: ${percentage}%;"></div>
                        </div>
                    </div>
                    <div class="term-count">${Math.round(count)}</div>
                </div>
            `;
        });

        html += '</div></div>';
        return html;
    }

    // MODIFIED: Enhanced with intelligent filtering for presentation
    renderWordCloudForPresenter(submissions) {
        if (submissions.length === 0) return '<h2>Waiting for approved submissions...</h2>';

        // Whitelist of important acronyms and technical terms that should NEVER be filtered
        const importantTerms = new Set([
            'ai', 'it', 'ml', 'iot', 'api', 'ui', 'ux', 'ar', 'vr', 'xr',
            'bi', 'ci', 'cd', 'qa', 'hr', 'pr', 'roi', 'kpi', 'erp', 'crm',
            'nlp', 'llm', 'gpt', 'aws', 'sap', 'oss', 'sdk', 'ide',
            'we', 'us', 'our' // Organizational identity terms - can be meaningful
        ]);

        // Minimal stop words - only filter truly meaningless terms
        // Trust frequency-based ranking to surface important terms naturally
        const stopWords = new Set([
            'a', 'an', 'the', 'and', 'or', 'but', 'if', 'as', 'at', 'by',
            'for', 'with', 'about', 'into', 'to', 'from', 'in', 'on',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
            'this', 'that', 'these', 'those',
            'there', 'here', 'when', 'where', 'why', 'how'
        ]);

        // Step 1: Extract all raw terms and phrases from submissions
        const allTerms = submissions.flatMap(s =>
            (s.keyTerms.map(kt => kt.term)).concat(s.keyPhrases || [])
        );

        // Step 2: Clean and intelligently filter terms
        const cleanedTerms = allTerms
            .map(term => term.replace(/[^\p{L}\p{N}\s-]/gu, '').trim())
            .filter(term => {
                if (term.length === 0) return false;

                const lowerTerm = term.toLowerCase();
                const wordCount = term.split(/\s+/).length;

                // ALWAYS keep whitelisted important terms
                if (wordCount === 1 && importantTerms.has(lowerTerm)) return true;

                // Filter out very long phrases (likely sentence fragments)
                if (wordCount > 4) return false;

                // Filter single-word stop words (but multi-word phrases are OK)
                if (wordCount === 1 && stopWords.has(lowerTerm)) return false;

                // Filter very short words unless they're uppercase acronyms or whitelisted
                if (term.length <= 2 && term !== term.toUpperCase() && !importantTerms.has(lowerTerm)) {
                    return false;
                }

                // Filter phrases that start or end with stop words (but not whitelisted terms)
                const words = term.toLowerCase().split(/\s+/);
                const startsWithStopWord = stopWords.has(words[0]) && !importantTerms.has(words[0]);
                const endsWithStopWord = stopWords.has(words[words.length - 1]) && !importantTerms.has(words[words.length - 1]);
                if (startsWithStopWord || endsWithStopWord) return false;

                return true;
            });

        // Step 3: Normalize the cleaned terms (e.g., 'ml' -> 'Machine Learning')
        const normalizedTerms = cleanedTerms.map(term => this.normalizeTerm(term));

        // Step 4: Perform case-insensitive counting on the clean, normalized terms
        const termCounts = new Map();
        normalizedTerms.forEach(term => {
            const lowerTerm = term.toLowerCase();
            const existing = termCounts.get(lowerTerm);
            if (existing) {
                existing.count++;
            } else {
                termCounts.set(lowerTerm, { displayTerm: term, count: 1 });
            }
        });

        // Step 5: Boost scores for multi-word phrases (using the cleaned & normalized phrases)
        const multiWordPhrases = submissions.flatMap(s => s.keyPhrases || [])
            .map(p => p.replace(/[^\p{L}\p{N}\s-]/gu, '').trim()) // Clean the phrases again here
            .filter(p => p.length > 0)
            .map(p => this.normalizeTerm(p));
            
        multiWordPhrases.forEach(phrase => {
            if (phrase.includes(' ')) { // Only boost if it's actually a multi-word phrase
                const lowerPhrase = phrase.toLowerCase();
                const existing = termCounts.get(lowerPhrase);
                if (existing) {
                    existing.count += 0.5; // Give a bonus for being a multi-word phrase
                }
            }
        });

        // Step 6: Sort, slice, and render with enhanced visual hierarchy
        const sorted = Array.from(termCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // Reduced from 30 to 20 for less clutter

        if (sorted.length === 0) return '<h2>Not enough data for key terms yet...</h2>';

        const maxCount = sorted[0].count;
        const minCount = sorted[sorted.length - 1].count;

        let html = '<div id="word-cloud-area" class="word-cloud-container">';
        html += '<div class="word-cloud-inner">';
        sorted.forEach((item, index) => {
            const { displayTerm, count } = item;

            // Linear normalization (0 to 1)
            const normalizedCount = (count - minCount) / (maxCount - minCount + 1);

            // ENHANCED: Use exponential scaling for more dramatic size differences
            // This makes the top terms MUCH larger while keeping smaller terms readable
            const exponentialScale = Math.pow(normalizedCount, 0.6);

            // ADJUSTED: Smaller font size range to fit better (1.2rem to 5rem for better containment)
            const fontSizeRem = 1.2 + exponentialScale * 3.8;

            // ENHANCED: Stronger weight for top terms
            let fontWeight = 300;
            if (index < 3) fontWeight = 700; // Top 3 are bold
            else if (index < 7) fontWeight = 600; // Top 4-7 are semi-bold
            else if (exponentialScale > 0.5) fontWeight = 500; // Mid-tier terms

            // ENHANCED: More selective color coding - only top terms get vibrant colors
            let colorClass = 't-secondary';
            if (index === 0) colorClass = 't-cyan'; // #1 is bright cyan
            else if (index < 3) colorClass = 't-orange'; // #2-3 are orange
            else if (index < 8) colorClass = 't-primary'; // #4-8 are primary
            // Rest stay secondary (more subtle)

            const formattedTerm = displayTerm.replace(/ /g, '\u00A0'); // Non-breaking space
            html += `<span class="cloud-word ${colorClass}" style="font-size: ${fontSizeRem.toFixed(2)}rem; font-weight: ${fontWeight};">${formattedTerm}</span>`;
        });
        html += '</div>'; // Close word-cloud-inner
        html += '</div>'; // Close word-cloud-container
        return html;
    }

    initializeWordCloudLayout() {
        const container = document.getElementById('word-cloud-area');
        if (!container) return;

        // Get the inner container for positioning
        const innerContainer = container.querySelector('.word-cloud-inner');
        if (!innerContainer) return;

        const words = Array.from(innerContainer.getElementsByClassName('cloud-word'));
        const containerRect = innerContainer.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;

        // Define safe margins to keep words within bounds
        const margin = 20;
        const maxX = containerRect.width - margin;
        const maxY = containerRect.height - margin;

        const placedRects = [];

        const checkCollision = (rect1, rect2) => {
            const padding = 8;
            return (rect1.x < rect2.x + rect2.width + padding &&
                    rect1.x + rect1.width + padding > rect2.x &&
                    rect1.y < rect2.y + rect2.height + padding &&
                    rect1.y + rect1.height + padding > rect2.y);
        };

        const isWithinBounds = (word) => {
            return word.x >= margin &&
                   word.y >= margin &&
                   word.x + word.width <= maxX &&
                   word.y + word.height <= maxY;
        };

        words.forEach((wordEl, index) => {
            const wordRect = wordEl.getBoundingClientRect();
            const currentWord = { width: wordRect.width, height: wordRect.height };

            if (index === 0) {
                // Place first word at center
                currentWord.x = centerX - currentWord.width / 2;
                currentWord.y = centerY - currentWord.height / 2;
            } else {
                let angle = Math.random() * 2 * Math.PI;
                let radius = 0.15 * Math.min(containerRect.width, containerRect.height); // Start smaller
                let foundPosition = false;

                for (let i = 0; i < 300; i++) {
                    radius += 1.5; // Slower growth
                    angle += 0.25;

                    const x = centerX + radius * Math.cos(angle) - currentWord.width / 2;
                    const y = centerY + radius * Math.sin(angle) - currentWord.height / 2;

                    currentWord.x = x;
                    currentWord.y = y;

                    // Check if within bounds AND not colliding
                    if (isWithinBounds(currentWord)) {
                        let isColliding = false;
                        for (const placed of placedRects) {
                            if (checkCollision(currentWord, placed)) {
                                isColliding = true;
                                break;
                            }
                        }
                        if (!isColliding) {
                            foundPosition = true;
                            break;
                        }
                    }
                }

                if (!foundPosition) {
                    wordEl.style.display = 'none';
                    return;
                }
            }

            placedRects.push(currentWord);
            wordEl.style.left = `${currentWord.x}px`;
            wordEl.style.top = `${currentWord.y}px`;
            wordEl.style.animationDelay = `${index * 0.05}s`;
            wordEl.classList.add('placed');
        });
    }
    renderInsightsSummaryForPresenter(insights) {
        if (!insights || insights.totalDocuments < 3) {
            return '<h2>Waiting for more data to generate insights...</h2>';
        }

        let html = '<div class="insights-highlights-container">';
        let cardCount = 0;
        const maxCards = 4; // Limit to 4 cards for optimal viewport fit

        // --- Top Excitement (Most Positive Topic) ---
        if (insights.sentimentHotspots.positive && cardCount < maxCards) {
            html += `
                <div class="highlight-card excitement">
                    <div class="highlight-icon">🎉</div>
                    <div class="highlight-label">Top Excitement</div>
                    <div class="highlight-topic">${insights.sentimentHotspots.positive}</div>
                </div>
            `;
            cardCount++;
        }

        // --- Top Concern ---
        if (insights.sentimentHotspots.concern && cardCount < maxCards) {
            html += `
                <div class="highlight-card concern">
                    <div class="highlight-icon">🤔</div>
                    <div class="highlight-label">Top Concern</div>
                    <div class="highlight-topic">${insights.sentimentHotspots.concern}</div>
                </div>
            `;
            cardCount++;
        }

        // --- Trending Topics (Key Discussion Points) ---
        if (insights.keyDiscussionPoints.length > 0) {
            // Take top 1-2 discussion points based on remaining space
            const remaining = maxCards - cardCount;
            const topDiscussions = insights.keyDiscussionPoints.slice(0, Math.min(remaining, 2));
            topDiscussions.forEach((topic, index) => {
                const icons = ['💡', '🔥', '⚡', '🎯'];
                const icon = icons[index % icons.length];
                html += `
                    <div class="highlight-card trending">
                        <div class="highlight-icon">${icon}</div>
                        <div class="highlight-label">Trending Topic</div>
                        <div class="highlight-topic">${topic.name}</div>
                        <div class="highlight-count">${topic.count} mentions</div>
                    </div>
                `;
                cardCount++;
            });
        }

        // --- Emerging Concepts (only if space available) ---
        if (insights.emergingConcepts.length > 0 && cardCount < maxCards) {
            const remaining = maxCards - cardCount;
            const topConcepts = insights.emergingConcepts.slice(0, Math.min(remaining, 1));
            topConcepts.forEach(concept => {
                html += `
                    <div class="highlight-card emerging">
                        <div class="highlight-icon">🚀</div>
                        <div class="highlight-label">Emerging Concept</div>
                        <div class="highlight-topic">${concept.phrase}</div>
                        <div class="highlight-count">${concept.count}x mentioned</div>
                    </div>
                `;
                cardCount++;
            });
        }

        // --- Representative Quote (shorter, if available) ---
        if (insights.keyDiscussionPoints.length > 0 && insights.keyDiscussionPoints[0].example) {
            const quote = insights.keyDiscussionPoints[0].example;
            const truncatedQuote = quote.length > 80 ? quote.substring(0, 80) + '...' : quote;
            html += `
                <div class="highlight-quote-card">
                    <div class="quote-icon">💬</div>
                    <div class="quote-text">"${truncatedQuote}"</div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

     // ADDED: New method to render a detailed list of submissions
    renderListView(submissions) {
        if (!submissions || submissions.length === 0) {
            return '<h2>Waiting for approved submissions...</h2>';
        }

        // Sort by timestamp, newest first
        const sorted = [...submissions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        let html = '<div class="list-view-container">';
        
        sorted.forEach(sub => {
            const icon = this.themeIcons[sub.theme] || '💭';
            
            // Determine sentiment icon and color
            let sentimentIcon = '·';
            let sentimentColor = 'var(--color-text-secondary)';
            if (sub.sentiment === 'positive') {
                sentimentIcon = '✓';
                sentimentColor = 'var(--color-success)';
            } else if (sub.sentiment === 'concern' || sub.sentiment === 'negative') {
                sentimentIcon = '!';
                sentimentColor = 'var(--color-accent-orange)';
            }

            // Calculate time ago
            const seconds = Math.floor((new Date() - new Date(sub.timestamp)) / 1000);
            let timeAgo = 'Just now';
            if (seconds >= 60 && seconds < 3600) {
                timeAgo = `${Math.floor(seconds / 60)}m ago`;
            } else if (seconds >= 3600 && seconds < 86400) {
                timeAgo = `${Math.floor(seconds / 3600)}h ago`;
            } else if (seconds >= 86400) {
                 timeAgo = `${Math.floor(seconds / 86400)}d ago`;
            }

            // Highlight key terms in the text
            let text = sub.text;
            if (sub.keyTerms && sub.keyTerms.length > 0) {
                // Create a regex that matches any of the key terms, case-insensitive
                // We use \b to ensure we only match whole words
                const termsPattern = sub.keyTerms.map(kt => kt.term).join('|');
                try {
                    const regex = new RegExp(`\\b(${termsPattern})\\b`, 'gi');
                    text = text.replace(regex, '<strong class="highlight">$1</strong>');
                } catch (e) {
                    // Fallback if regex fails (e.g., special characters in terms)
                    console.warn("Could not highlight terms:", e);
                }
            }

            // Check if featured
            const isFeatured = sub.status === 'featured';
            const featuredClass = isFeatured ? 'featured-item' : '';
            const featuredIcon = isFeatured ? '<span class="featured-icon">⭐</span>' : '';

            html += `
                <div class="list-item ${featuredClass}">
                    <div class="list-item-header">
                        <div class="list-item-meta">
                            ${featuredIcon}
                            <span class="theme-icon">${icon}</span>
                            <span class="theme-name">${sub.theme}</span>
                        </div>
                        <div class="list-item-sentiment" style="color: ${sentimentColor}">
                            ${sentimentIcon} <span class="sentiment-label">${sub.sentiment}</span>
                        </div>
                    </div>
                    <div class="list-item-body">
                        "${text}"
                    </div>
                    <div class="list-item-footer">
                        ${timeAgo}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    renderSentimentOverviewForPresenter(submissions) {
        if (submissions.length === 0) return '<h2>Waiting for approved submissions...</h2>';

        const sentimentCounts = submissions.reduce((acc, s) => {
            acc[s.sentiment] = (acc[s.sentiment] || 0) + 1;
            return acc;
        }, { positive: 0, neutral: 0, negative: 0, concern: 0 });

        const total = submissions.length;
        const positivePercent = total > 0 ? Math.round((sentimentCounts.positive / total) * 100) : 0;
        const negativePercent = total > 0 ? Math.round((sentimentCounts.negative / total) * 100) : 0;
        const concernPercent = total > 0 ? Math.round((sentimentCounts.concern / total) * 100) : 0;
        const neutralPercent = 100 - positivePercent - negativePercent - concernPercent;

        // Calculate overall sentiment score (-100 to +100)
        // Positive = +1, Neutral = 0, Concern = -0.5, Negative = -1
        const sentimentScore = (
            (sentimentCounts.positive * 1) +
            (sentimentCounts.neutral * 0) +
            (sentimentCounts.concern * -0.5) +
            (sentimentCounts.negative * -1)
        ) / total * 100;

        // Determine needle position (0-180 degrees for semicircle)
        // -100 = 0deg (left), 0 = 90deg (center), +100 = 180deg (right)
        const needleAngle = ((sentimentScore + 100) / 200) * 180;

        // Determine mood label and emoji
        let moodLabel = 'Neutral';
        let moodEmoji = '😐';
        let moodColor = 'var(--color-text-secondary)';

        if (sentimentScore >= 50) {
            moodLabel = 'Very Positive';
            moodEmoji = '😃';
            moodColor = 'var(--color-accent-green)';
        } else if (sentimentScore >= 20) {
            moodLabel = 'Positive';
            moodEmoji = '🙂';
            moodColor = 'var(--color-accent-green)';
        } else if (sentimentScore >= -20) {
            moodLabel = 'Mixed';
            moodEmoji = '😐';
            moodColor = 'var(--color-text-secondary)';
        } else if (sentimentScore >= -50) {
            moodLabel = 'Concerned';
            moodEmoji = '😕';
            moodColor = 'var(--color-accent-orange)';
        } else {
            moodLabel = 'Very Concerned';
            moodEmoji = '😟';
            moodColor = 'var(--color-accent-red)';
        }

        let html = `
            <div class="sentiment-gauge-container">
                <div class="gauge-wrapper">
                    <svg class="sentiment-gauge" viewBox="0 0 200 120" width="100%" height="auto" style="max-width: 500px; max-height: 300px;">
                        <!-- Background arc zones -->
                        <path d="M 20 100 A 80 80 0 0 1 60 35"
                              fill="none" stroke="var(--color-accent-red)" stroke-width="20" opacity="0.3"/>
                        <path d="M 60 35 A 80 80 0 0 1 100 20"
                              fill="none" stroke="var(--color-accent-orange)" stroke-width="20" opacity="0.3"/>
                        <path d="M 100 20 A 80 80 0 0 1 140 35"
                              fill="none" stroke="var(--color-text-secondary)" stroke-width="20" opacity="0.3"/>
                        <path d="M 140 35 A 80 80 0 0 1 180 100"
                              fill="none" stroke="var(--color-accent-green)" stroke-width="20" opacity="0.3"/>

                        <!-- Needle -->
                        <g class="gauge-needle" style="transform-origin: 100px 100px; transform: rotate(${needleAngle}deg);">
                            <line x1="100" y1="100" x2="100" y2="35"
                                  stroke="${moodColor}" stroke-width="3" stroke-linecap="round"/>
                            <circle cx="100" cy="100" r="8" fill="${moodColor}"/>
                        </g>
                    </svg>

                    <div class="gauge-center">
                        <div class="gauge-emoji">${moodEmoji}</div>
                        <div class="gauge-label" style="color: ${moodColor};">${moodLabel}</div>
                        <div class="gauge-score">${sentimentScore > 0 ? '+' : ''}${Math.round(sentimentScore)}</div>
                    </div>
                </div>

                <div class="sentiment-breakdown">
                    <div class="breakdown-item positive">
                        <div class="breakdown-icon">😃</div>
                        <div class="breakdown-label">Positive</div>
                        <div class="breakdown-value">${positivePercent}%</div>
                        <div class="breakdown-count">${sentimentCounts.positive}</div>
                    </div>
                    <div class="breakdown-item neutral">
                        <div class="breakdown-icon">😐</div>
                        <div class="breakdown-label">Neutral</div>
                        <div class="breakdown-value">${neutralPercent}%</div>
                        <div class="breakdown-count">${sentimentCounts.neutral}</div>
                    </div>
                    <div class="breakdown-item concern">
                        <div class="breakdown-icon">🤔</div>
                        <div class="breakdown-label">Concern</div>
                        <div class="breakdown-value">${concernPercent}%</div>
                        <div class="breakdown-count">${sentimentCounts.concern}</div>
                    </div>
                    <div class="breakdown-item negative">
                        <div class="breakdown-icon">😟</div>
                        <div class="breakdown-label">Negative</div>
                        <div class="breakdown-value">${negativePercent}%</div>
                        <div class="breakdown-count">${sentimentCounts.negative}</div>
                    </div>
                </div>
            </div>
        `;
        return html;
    }
    // ENHANCED: VS-Style Battle renderer for the Yes/No poll results
    renderPollResultsForPresenter(questionText, yesCount, noCount) {
        const total = yesCount + noCount;
        if (total === 0) {
            return `<h2>${questionText}</h2><p>Waiting for poll responses...</p>`;
        }

        const yesPercent = Math.round((yesCount / total) * 100);
        const noPercent = 100 - yesPercent;
        const winner = yesPercent > noPercent ? 'yes' : (noPercent > yesPercent ? 'no' : 'tie');

        let html = `
            <div class="poll-vs-container">
                <h2 class="poll-question-text">${questionText}</h2>

                <div class="vs-battle">
                    <div class="vs-side yes-side ${winner === 'yes' ? 'winner' : ''}">
                        <div class="vs-icon">✓</div>
                        <div class="vs-label">YES</div>
                        <div class="vs-percentage">${yesPercent}%</div>
                        <div class="vs-votes">${yesCount} vote${yesCount !== 1 ? 's' : ''}</div>
                    </div>

                    <div class="vs-divider">
                        <div class="vs-text">VS</div>
                    </div>

                    <div class="vs-side no-side ${winner === 'no' ? 'winner' : ''}">
                        <div class="vs-icon">✗</div>
                        <div class="vs-label">NO</div>
                        <div class="vs-percentage">${noPercent}%</div>
                        <div class="vs-votes">${noCount} vote${noCount !== 1 ? 's' : ''}</div>
                    </div>
                </div>

                <div class="poll-total-responses">
                    Total Responses: <strong>${total}</strong>
                </div>
            </div>
        `;
        return html;
    }
}