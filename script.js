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
            casual: "santai dan mesra dengan unsur humor",
            professional: "profesional tetapi mesra",
            motivational: "memberi semangat dan inspirasi"
        };

        const language = this.getCurrentLanguage();
        const languageInstructions = language === 'my' 
            ? `Tulis caption dalam Bahasa Malaysia dengan gaya copywriting Malaysia. Gunakan bahasa yang natural dan santai seperti yang biasa digunakan di media sosial Malaysia. Boleh campurkan perkataan Bahasa Inggeris di mana sesuai.`
            : `Write the caption in English.`;

        return `Write a Facebook post about: ${topic}

        ${languageInstructions}

        Use this writing style:

        Sentence Structure:
        - Short, punchy sentences that end with questions or exclamations
        - Frequent use of Malaysian expressions like "Padu?" and "Susah bai"
        - Strategic repetition for emphasis (e.g., "Senang, senang, dan senang")
        - Break complex ideas into simple, numbered steps
        - Use frequent line breaks for better readability

        Tone:
        - Super casual and conversational, like chatting with a friend
        - Use Malaysian slang and colloquial expressions
        - Mix Malay and English naturally (e.g., "You can't get both. Susah bai. KECUALI!")
        - Encouraging and supportive while maintaining local flavor
        - Include rhetorical questions to engage readers

        Voice:
        - Share personal experiences and opinions
        - Use Malaysian cultural references and local context
        - Focus on providing value and actionable insights
        - Keep it authentic and relatable to Malaysian audience
        - Use "Stack Value" concept to make offers irresistible

        Apply the ${toneGuides[tone]} style throughout the content.

        Additional Requirements:
        - Add relevant emojis throughout the text
        - Include 3-5 relevant hashtags at the end
        - End with a strong call-to-action
        - For Malay captions: Use Malaysian expressions like "bersen-sen", "padu", "best", etc.
        - Include engagement hooks like "Setuju tak?" or "Tag kawan yang perlu tengok ni!"

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