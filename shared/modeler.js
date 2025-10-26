class EnhancedTopicModeler {
    constructor() {
        this.storageKey = `${APP_CONFIG.storageKey}_corpus`;
        this.themeDefinitions = {
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
        try {
            const storedStats = localStorage.getItem(this.storageKey);
            if (storedStats) {
                const parsed = JSON.parse(storedStats);
                return { termFrequency: new Map(parsed.termFrequency), documentFrequency: new Map(parsed.documentFrequency), totalDocuments: parsed.totalDocuments, emergingPhrases: new Map(parsed.emergingPhrases) };
            }
        } catch (e) { console.error("Could not load corpus stats:", e); }
        return { termFrequency: new Map(), documentFrequency: new Map(), totalDocuments: 0, emergingPhrases: new Map() };
    }

    saveCorpusStats() {
        try {
            const serializableStats = { termFrequency: Array.from(this.corpusStats.termFrequency.entries()), documentFrequency: Array.from(this.corpusStats.documentFrequency.entries()), totalDocuments: this.corpusStats.totalDocuments, emergingPhrases: Array.from(this.corpusStats.emergingPhrases.entries()) };
            localStorage.setItem(this.storageKey, JSON.stringify(serializableStats));
        } catch (e) { console.error("Could not save corpus stats:", e); }
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