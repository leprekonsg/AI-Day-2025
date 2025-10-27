class EnhancedTopicModeler {
    constructor(persistToLocalStorage = true) {
        this.persistToLocalStorage = persistToLocalStorage; // ADDED: Store the setting
        this.storageKey = `${APP_CONFIG.storageKey}_corpus`;
        this.themeDefinitions = {
            'Company & Strategy': { 
                exact: ['stl'], 
                partial: ['st logistics', 'stlogistics', 'our company', 'business model', 'strategy'], 
                weight: 1.5 // Give it a higher weight to prioritize company questions
            },
            'Automation & AI': { exact: ['ai', 'ml', 'llm', 'gpt', 'bot'], partial: ['automat', 'robot', 'artificial', 'machine', 'learning', 'algorithm', 'neural', 'intelligence', 'smart', 'autonomous'], weight: 1.2 },
            'Efficiency & Optimization': { exact: ['kpi', 'roi', 'sla'], partial: ['efficien', 'optimiz', 'speed', 'fast', 'quick', 'performance', 'cost', 'reduc', 'streamlin', 'productiv', 'improv', 'better', 'faster', 'cheaper', 'lean', 'waste'] },
            'Innovation & Future': { exact: ['new', '5g', 'iot'], partial: ['innovat', 'transform', 'future', 'cutting', 'edge', 'breakthrough', 'revolution', 'disrupt', 'next', 'generation', 'advanced', 'modern', 'evolv', 'pioneer', 'vision'] },
            'Integration & Systems': { exact: ['api', 'erp', 'crm', 'wms', 'tms', 'sap'], partial: ['integrat', 'connect', 'system', 'platform', 'unified', 'seamless', 'interface', 'interoper', 'workflow', 'sync', 'link', 'bridge', 'ecosystem'] },
            'Analytics & Data': { exact: ['bi', 'etl'], partial: ['analyt', 'data', 'insight', 'metric', 'report', 'dashboard', 'visual', 'predict', 'forecast', 'intelligence', 'track', 'measur', 'monitor', 'trend'] },
            'Operations & Logistics': { exact: ['scm', 'jit'], partial: ['supply', 'chain', 'logistic', 'warehous', 'inventory', 'shipment', 'deliver', 'transport', 'freight', 'fulfill', 'procurement', 'vendor', 'supplier'] }
        };
        
        this.corpusStats = this.loadCorpusStats();
        this.stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'our', 'your', 'my']);
        this.importantAcronyms = new Set();
        Object.values(this.themeDefinitions).forEach(def => {
            if (def.exact) def.exact.forEach(acronym => this.importantAcronyms.add(acronym));
        });
    }

    loadCorpusStats() {
        if (this.persistToLocalStorage) {
            try {
                const storedStats = localStorage.getItem(this.storageKey);
                if (storedStats) {
                    const parsed = JSON.parse(storedStats);
                    return { termFrequency: new Map(parsed.termFrequency), documentFrequency: new Map(parsed.documentFrequency), totalDocuments: parsed.totalDocuments, emergingPhrases: new Map(parsed.emergingPhrases) };
                }
            } catch (e) { console.error("Could not load corpus stats:", e); }
        }
        // This is now the default for a non-persistent modeler
        return { termFrequency: new Map(), documentFrequency: new Map(), totalDocuments: 0, emergingPhrases: new Map() };
    }

    saveCorpusStats() {
        // MODIFIED: Check the setting before trying to save
        if (this.persistToLocalStorage) {
            try {
                const serializableStats = { termFrequency: Array.from(this.corpusStats.termFrequency.entries()), documentFrequency: Array.from(this.corpusStats.documentFrequency.entries()), totalDocuments: this.corpusStats.totalDocuments, emergingPhrases: Array.from(this.corpusStats.emergingPhrases.entries()) };
                localStorage.setItem(this.storageKey, JSON.stringify(serializableStats));
            } catch (e) { console.error("Could not save corpus stats:", e); }
        }
    }
    
    preprocess(text) {
        const lower = text.toLowerCase();
        const tokens = lower.match(/\b[\w-]+\b/g) || [];
        return tokens.filter(token => !this.stopWords.has(token) && (token.length > 2 || this.importantAcronyms.has(token)));
    }
    
    updateCorpusStats(text) {
        const tokens = this.preprocess(text);
        const uniqueTokens = new Set(tokens);
        tokens.forEach(token => { this.corpusStats.termFrequency.set(token, (this.corpusStats.termFrequency.get(token) || 0) + 1); });
        uniqueTokens.forEach(token => { this.corpusStats.documentFrequency.set(token, (this.corpusStats.documentFrequency.get(token) || 0) + 1); });
        const bigrams = this.extractNGrams(tokens, 2);
        bigrams.forEach(bigram => { this.corpusStats.emergingPhrases.set(bigram, (this.corpusStats.emergingPhrases.get(bigram) || 0) + 1); });
        this.corpusStats.totalDocuments++;
        this.saveCorpusStats();
    }
    
    extractNGrams(tokens, n = 2) {
        const ngrams = [];
        for (let i = 0; i <= tokens.length - n; i++) ngrams.push(tokens.slice(i, i + n).join(' '));
        return ngrams;
    }
    
    calculateTFIDF(term, docTokens) {
        if (docTokens.length === 0) return 0;
        const tf = docTokens.filter(t => t === term).length / docTokens.length;
        const df = this.corpusStats.documentFrequency.get(term) || 1;
        const idf = Math.log((this.corpusStats.totalDocuments + 1) / df);
        return tf * idf;
    }
    
    extractKeyTerms(text, topN = 5) {
        const tokens = this.preprocess(text);
        if (tokens.length === 0) return [];
        const uniqueTokens = Array.from(new Set(tokens));
        const scores = uniqueTokens.map(token => ({ term: token, score: this.calculateTFIDF(token, tokens) }));
        scores.sort((a, b) => b.score - a.score);
        return scores.slice(0, topN);
    }

    extractKeyPhrases(text) {
        // REVISED: This now contains the full try/catch block.
        try {
            // This will only work if the compromise library has loaded successfully.
            const doc = nlp(text);
            return doc.nouns().out('array');
        } catch (e) {
            // FALLBACK: If nlp() fails, log a warning and return an empty array.
            // This ensures the app never crashes and the rest of the analysis continues.
            console.warn("Compromise.js not available for phrase extraction, falling back.");
            return [];
        }
    }
    
    analyzeTheme(text) {
        const tokens = this.preprocess(text);
        const tokenSet = new Set(tokens);
        const bigrams = this.extractNGrams(tokens, 2);
        const themeScores = {};
        for (const [themeName, keywords] of Object.entries(this.themeDefinitions)) {
            let score = 0;
            const weight = keywords.weight || 1.0;
            if (keywords.exact) keywords.exact.forEach(keyword => { if (tokenSet.has(keyword)) score += 3 * weight; });
            if (keywords.partial) {
                const matched = tokens.filter(token => keywords.partial.some(kw => token.startsWith(kw) || (kw.length > 4 && token.includes(kw))));
                score += matched.length * weight;
            }
            if (this.corpusStats.totalDocuments > 0) tokens.forEach(token => { if (keywords.partial && keywords.partial.some(kw => token.startsWith(kw))) score += this.calculateTFIDF(token, tokens) * 0.5; });
            bigrams.forEach(bigram => { const bigramTokens = bigram.split(' '); if (keywords.partial && bigramTokens.some(t => keywords.partial.some(kw => t.startsWith(kw)))) score += 1.5 * weight; });
            if (score > 0) themeScores[themeName] = score;
        }
        let assignedTheme = 'General Topics';
        if (Object.keys(themeScores).length > 0) assignedTheme = Object.entries(themeScores).sort((a, b) => b[1] - a[1])[0][0];
        return { theme: assignedTheme, scores: themeScores, confidence: this.calculateConfidence(themeScores) };
    }
    
    // ADDED: New method to discover emerging themes
    discoverEmergingThemes(minOccurrences = 2) {
        const themes = [];
        for (const [phrase, count] of this.corpusStats.emergingPhrases.entries()) {
            if (count >= minOccurrences) {
                // Check if the phrase is truly novel and not just part of an existing theme
                const isNovel = !Object.values(this.themeDefinitions).some(theme =>
                    phrase.split(' ').some(token =>
                        (theme.exact && theme.exact.includes(token)) ||
                        (theme.partial && theme.partial.some(kw => token.startsWith(kw)))
                    )
                );
                if (isNovel) {
                    themes.push({ phrase, count });
                }
            }
        }
        return themes.sort((a, b) => b.count - a.count).slice(0, 5);
    }

    // MODIFIED: Replaced the entire method. It now requires the full submission list.
    generateInsights(submissions) {
        if (!submissions || submissions.length === 0) {
            return null;
        }

        const themeData = {};
        Object.keys(this.themeDefinitions).forEach(theme => {
            themeData[theme] = {
                count: 0,
                sentiments: { positive: 0, negative: 0, concern: 0, neutral: 0 },
                representativeQuestions: []
            };
        });

        // 1. Aggregate data by theme
        submissions.forEach(sub => {
            if (themeData[sub.theme]) {
                themeData[sub.theme].count++;
                themeData[sub.theme].sentiments[sub.sentiment]++;
                // Store the text and confidence for finding the best examples later
                themeData[sub.theme].representativeQuestions.push({ text: sub.text, confidence: sub.confidence });
            }
        });

        // 2. Find Sentiment Hotspots
        let mostPositiveTheme = { name: 'N/A', score: 0 };
        let mostConcernTheme = { name: 'N/A', score: 0 };

        for (const themeName in themeData) {
            const theme = themeData[themeName];
            if (theme.count > 0) {
                const positiveRatio = theme.sentiments.positive / theme.count;
                const concernRatio = theme.sentiments.concern / theme.count;

                if (positiveRatio > mostPositiveTheme.score) {
                    mostPositiveTheme = { name: themeName, score: positiveRatio };
                }
                if (concernRatio > mostConcernTheme.score) {
                    mostConcernTheme = { name: themeName, score: concernRatio };
                }
            }
        }

        // 3. Find Key Discussion Points (Top 2 themes by volume)
        const topThemes = Object.entries(themeData)
            .filter(([_, data]) => data.count > 0)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 2)
            .map(([name, data]) => {
                // Sort questions by confidence to find the most representative one
                data.representativeQuestions.sort((a, b) => b.confidence - a.confidence);
                return {
                    name,
                    count: data.count,
                    example: data.representativeQuestions.length > 0 ? data.representativeQuestions[0].text : "No specific example available."
                };
            });
            
        // 4. Discover Emerging Concepts (using existing logic) and find an example
        const emerging = this.discoverEmergingThemes(2).map(theme => {
            // Find the first submission that contains this emerging phrase
            const exampleSubmission = submissions.find(s => s.text.toLowerCase().includes(theme.phrase));
            return {
                ...theme,
                example: exampleSubmission ? exampleSubmission.text : "No specific example available."
            };
        });

        return {
            totalDocuments: submissions.length,
            sentimentHotspots: {
                positive: mostPositiveTheme.score > 0.1 ? mostPositiveTheme.name : null,
                concern: mostConcernTheme.score > 0.1 ? mostConcernTheme.name : null,
            },
            keyDiscussionPoints: topThemes,
            emergingConcepts: emerging
        };
    }

    calculateConfidence(scores) {
        const values = Object.values(scores);
        if (values.length === 0) return 0.3;
        if (values.length === 1) return 0.9;
        values.sort((a, b) => b - a);
        const [topScore, secondScore] = values;
        if (topScore === 0) return 0.3;
        const gap = (topScore - secondScore) / topScore;
        return Math.min(0.95, 0.5 + gap * 0.5);
    }

    async analyzeSentiment(text) {
        const lower = text.toLowerCase();
        const tokens = lower.match(/\b[\w-']+\b/g) || [];
        if (tokens.length === 0) return { sentiment: 'neutral', source: 'rule-based' };

        // --- Lexicons & Modifiers ---
        const positive = { love: 3, amazing: 3, excellent: 3, remarkable: 3, great: 2, good: 1, nice: 1, like: 1, hopeful: 1, positive: 1, excited: 2, benefit: 2, opportunity: 2 };
        const negative = { hate: -3, horrible: -3, worst: -3, bad: -2, poor: -2, problem: -1, issue: -1, risk: -1, threat: -1, concern: -1, challenge: -1, fear: -2 };
        
        // FIX: Comprehensive list of contractions.
        const negationWords = new Set(['not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere', "don't", "doesn't", "didn't", "won't", "wouldn't", "can't", "cannot", "couldn't", "shouldn't", "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't", "hadn't"]);
        
        // NEW: Intensifiers and diminishers.
        const intensifiers = { very: 1.5, extremely: 2.0, really: 1.3, absolutely: 1.8, highly: 1.5 };
        const diminishers = { slightly: 0.5, somewhat: 0.7, barely: 0.4, hardly: 0.4 };

        const semanticConcerns = {
            jobDisplacement: ['takeover', 'replace', 'jobs', 'job', 'workers', 'obsolete', 'unemployment', 'future of work', 'job security'],
            skillGaps: ['skills', 'skill', 'learn', 'training', 'adapt', 'reskill', 'upskill', 'required', 'necessary']
        };

        // --- Context Gathering (Progressive Enhancement) ---
        let isQuestion = false;
        let analysisSource = 'rule-based';
        try {
            const doc = nlp(text);
            isQuestion = doc.questions().length > 0;
            analysisSource = 'context-enhanced';
        } catch (e) {
            isQuestion = /^(will|can|do|is|are|what|how|why)\b/.test(lower);
        }

        // --- Scoring Engine ---
        let score = 0;
        let negationEndIndex = -1;
        let intensityMultiplier = 1.0;
        let intensityEndIndex = -1;

        tokens.forEach((token, i) => {
            // 1. Detect and set windows for negation and modifiers.
            if (negationWords.has(token)) {
                negationEndIndex = i + 3; // Affect next 3 words.
            }
            if (intensifiers[token]) {
                intensityMultiplier = intensifiers[token];
                intensityEndIndex = i + 2; // Affect next 2 words.
            }
            if (diminishers[token]) {
                intensityMultiplier = diminishers[token];
                intensityEndIndex = i + 2;
            }

            // 2. Calculate the final multiplier for the current token.
            const negationMultiplier = (i <= negationEndIndex) ? -1.5 : 1;
            const finalIntensity = (i <= intensityEndIndex) ? intensityMultiplier : 1;
            const totalMultiplier = negationMultiplier * finalIntensity;

            // 3. Apply score if the word is in our lexicons.
            // This correctly ignores neutral words within the negation window.
            if (positive[token]) {
                score += positive[token] * totalMultiplier;
            }
            if (negative[token]) {
                score += negative[token] * totalMultiplier;
            }
        });

        // --- Classification ---
        // FIX: Normalize score by text length for more reliable thresholds.
        const normalizedScore = score / Math.sqrt(tokens.length);
        let sentiment = 'neutral';

        const positiveThreshold = 0.5;
        const negativeThreshold = -0.5;

        if (normalizedScore > positiveThreshold) sentiment = 'positive';
        else if (normalizedScore < negativeThreshold) sentiment = 'negative';
        else {
            // If lexically neutral, check for semantic concerns.
            let concernScore = 0;
            Object.values(semanticConcerns).flat().forEach(term => {
                if (lower.includes(term)) concernScore++;
            });
            if (isQuestion && concernScore > 0) concernScore++;
            
            if (concernScore > 1) sentiment = 'concern';
        }

        return { sentiment, source: analysisSource };
    }
}