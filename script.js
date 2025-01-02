class CaptionGenerator {
    constructor() {
        this.API_KEY_STORAGE_KEY = 'openrouter_api_key';
        this.OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
        
        this.initializeElements();
        this.setupEventListeners();
        this.checkStoredApiKey();
    }

    initializeElements() {
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.saveApiKeyBtn = document.getElementById('saveApiKey');
        this.apiStatus = document.getElementById('apiStatus');
        this.topicInput = document.getElementById('topicInput');
        this.generateBtn = document.getElementById('generateBtn');
        this.outputText = document.getElementById('outputText');
        this.copyBtn = document.getElementById('copyBtn');
        this.toneButtons = document.querySelectorAll('.tone-btn');
        this.languageButtons = document.querySelectorAll('.lang-btn');
        this.themeToggleBtn = document.getElementById('themeToggle');
        this.checkStoredTheme();
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.outputSection = document.querySelector('.output-section');
    }

    setupEventListeners() {
        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.generateBtn.addEventListener('click', () => this.generateCaption());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        
        this.toneButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setTone(btn));
        });

        this.languageButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setLanguage(btn));
        });

        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    checkStoredApiKey() {
        const storedKey = localStorage.getItem(this.API_KEY_STORAGE_KEY);
        if (storedKey) {
            this.apiKeyInput.value = storedKey;
            this.apiStatus.textContent = '✅ API Key loaded';
        }
    }

    saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
            this.apiStatus.textContent = '✅ API Key saved';
        } else {
            this.apiStatus.textContent = '❌ Please enter an API key';
        }
    }

    setTone(selectedBtn) {
        this.toneButtons.forEach(btn => btn.classList.remove('active'));
        selectedBtn.classList.add('active');
    }

    getCurrentTone() {
        const activeBtn = document.querySelector('.tone-btn.active');
        return activeBtn ? activeBtn.dataset.tone : 'casual';
    }

    setLanguage(selectedBtn) {
        this.languageButtons.forEach(btn => btn.classList.remove('active'));
        selectedBtn.classList.add('active');
    }

    getCurrentLanguage() {
        const activeBtn = document.querySelector('.lang-btn.active');
        return activeBtn ? activeBtn.dataset.lang : 'en';
    }

    async generateCaption() {
        const topic = this.topicInput.value.trim();
        if (!topic) {
            alert('Please enter a topic for your post!');
            return;
        }

        const apiKey = localStorage.getItem(this.API_KEY_STORAGE_KEY);
        if (!apiKey) {
            alert('Please save your OpenRouter API key first!');
            return;
        }

        this.generateBtn.disabled = true;
        this.generateBtn.textContent = '⌛ Generating...';
        this.outputSection.classList.add('loading');

        try {
            const tone = this.getCurrentTone();
            const prompt = this.createPrompt(topic, tone);
            const response = await this.callOpenRouterAPI(prompt, apiKey);
            
            if (response.choices && response.choices[0]) {
                const rawContent = response.choices[0].message.content.trim();
                this.outputText.value = this.formatOutput(rawContent);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate caption. Please try again.');
        } finally {
            this.generateBtn.disabled = false;
            this.generateBtn.textContent = '✨ Generate Caption';
            this.outputSection.classList.remove('loading');
        }
    }

    formatOutput(content) {
        // Split content into paragraphs
        const paragraphs = content.split('\n').filter(p => p.trim());
        
        // Identify hashtags section (usually at the end)
        const hashtagIndex = paragraphs.findIndex(p => p.includes('#'));
        
        let mainContent = paragraphs;
        let hashtags = '';
        
        if (hashtagIndex !== -1) {
            mainContent = paragraphs.slice(0, hashtagIndex);
            hashtags = paragraphs.slice(hashtagIndex).join('\n');
        }
        
        // Format main content with proper spacing and dividers
        const formattedContent = mainContent
            .map(p => p.trim())
            .filter(p => p)
            .join('\n\n');
        
        // Add emoji divider before hashtags
        const divider = '\n\n✨ • ✨ • ✨\n\n';
        
        // Combine everything with proper spacing
        return `${formattedContent}${divider}${hashtags}`;
    }

    createPrompt(topic, tone) {
        const toneGuides = {
            casual: "conversational with humor and straight talk",
            professional: "confident and authoritative yet approachable",
            motivational: "emotionally engaging with urgency and excitement"
        };

        const language = this.getCurrentLanguage();
        const languageInstructions = language === 'my' 
            ? `Write the caption in Bahasa Malaysia (Malay language). Use natural, conversational Malay that's commonly used in Malaysia. Include some English words where appropriate, as this is common in Malaysian social media. Ensure the tone and style remain appropriate for Malaysian audience.`
            : `Write the caption in English.`;

        return `Write a Facebook post about: ${topic}

        ${languageInstructions}

        Use this writing style:

        Sentence Structure:
        Short and punchy sentences: Sentences are concise, often fragmented for emphasis, making the content easy to read and engaging.
        Frequent use of lists: Lists are used to break down concepts, making ideas clearer and more digestible.
        Strategic repetition: Key ideas or phrases are repeated for emphasis and to drive home the main points.

        Tone:
        Conversational and relatable: Feels like a friend or mentor sharing advice, with a mix of humor and straight talk.
        Confident and persuasive: Communicates authority on the subject while staying approachable.
        Emotionally engaging: Plays on emotions like urgency, excitement, or nostalgia to connect with the audience.

        Voice:
        Informal and witty: Uses slang, playful sarcasm, and humor to make the content lively and engaging.
        Personal and reflective: Often includes personal anecdotes, rhetorical questions, and first-person language to create a connection with the reader.
        Encouraging and motivational: Inspires action and confidence, especially when talking about strategies or solutions.

        Apply the ${toneGuides[tone]} style throughout the content.

        The goal is to position the topic as something valuable and desirable for the target audience, similar to how tiny villas would be positioned as the ultimate passive income generator for investors.

        Additional Requirements:
        - Add relevant emojis throughout the text
        - Include 3-5 relevant hashtags at the end
        - End with a strong call-to-action
        - For Malay captions: Use appropriate Malaysian expressions and cultural references

        Format the output with:
        - Single line break between related ideas
        - Double line break for major topic shifts
        - Emojis at the start of each section
        - Hashtags on separate lines at the end
        - Clear visual hierarchy

        Please write a compelling caption following these guidelines:`;
    }

    async callOpenRouterAPI(prompt, apiKey) {
        const response = await fetch(this.OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Facebook Caption Generator',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'model': 'google/learnlm-1.5-pro-experimental:free',
                'messages': [{
                    'role': 'user',
                    'content': [{
                        'type': 'text',
                        'text': prompt
                    }]
                }],
                'temperature': 0.7,
                'max_tokens': 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || 'API request failed');
        }

        return await response.json();
    }

    copyToClipboard() {
        this.outputText.select();
        document.execCommand('copy');
        this.copyBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            this.copyBtn.textContent = '📋 Copy Caption';
        }, 2000);
    }

    checkStoredTheme() {
        const storedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', storedTheme);
        this.updateThemeToggleButton(storedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeToggleButton(newTheme);
    }

    updateThemeToggleButton(theme) {
        this.themeToggleBtn.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CaptionGenerator();
}); 