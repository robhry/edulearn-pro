// EduLearn Pro - NAPRAWIONA WERSJA Z AI (Samodzielna)
class EduLearnApp {
    constructor() {
        this.currentSection = 'upload';
        this.currentQuizIndex = 0;
        this.quizAnswers = [];
        this.selectedQuizOption = null;
        this.currentPdfDoc = null;
        this.extractedText = '';
        this.currentDocumentName = '';
        
        // AI components
        this.summarizationPipeline = null;
        this.textGenerationPipeline = null;
        this.aiModelsLoaded = false;
        this.useAI = true; // Można wyłączyć jeśli AI nie działa
        
        // User progress
        this.userProgress = this.loadProgress() || {
            points: 0,
            level: 'Początkujący',
            badges: [],
            documentsProcessed: 0,
            completedQuizzes: 0
        };
        
        // Generated content - zaczyna z null
        this.mindMapData = null;
        this.summaryData = null;
        this.quizData = [];
        
        // Gamification
        this.badges = [
            {name: 'PDF Master', description: 'Przetworzył pierwszy dokument PDF', icon: '📄', requirement: 'uploadPdf'},
            {name: 'Mind Map Creator', description: 'Stworzył pierwszą mapę myśli', icon: '🧠', requirement: 'createMindMap'},
            {name: 'Quiz Champion', description: 'Uzyskał wynik powyżej 80%', icon: '🏆', requirement: 'score80'},
            {name: 'Perfectionist', description: 'Uzyskał 100% w quizie', icon: '⭐', requirement: 'perfectScore'}
        ];
        
        this.levels = ['Początkujący', 'Średniozaawansowany', 'Zaawansowany', 'Ekspert'];
        
        console.log('EduLearnApp constructor - aplikacja zainicjowana');
    }
    
    init() {
        console.log('=== INICJALIZACJA APLIKACJI ===');
        
        try {
            // Configure PDF.js worker
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                console.log('✅ PDF.js worker skonfigurowany');
            } else {
                console.error('❌ PDF.js nie jest załadowany!');
                alert('Błąd: PDF.js nie został załadowany. Sprawdź połączenie z internetem.');
                return;
            }
            
            // Setup podstawowych event listeners
            this.setupEventListeners();
            
            // Update UI
            this.updateProgressDisplay();
            
            // Inicjalizuj AI w tle (bez blokowania aplikacji)
            if (this.useAI) {
                setTimeout(() => {
                    this.initializeAI().catch(error => {
                        console.warn('AI initialization failed, continuing with basic features:', error);
                        this.useAI = false;
                    });
                }, 1000);
            }
            
            console.log('✅ Aplikacja zainicjalizowana pomyślnie');
            
        } catch (error) {
            console.error('❌ Błąd inicjalizacji aplikacji:', error);
            alert(`Błąd inicjalizacji: ${error.message}`);
        }
    }
    
    async initializeAI() {
        console.log('🤖 Próba ładowania modeli AI...');
        
        try {
            // Try to load Transformers.js
            const transformersModule = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
            
            if (!transformersModule || !transformersModule.pipeline) {
                throw new Error('Transformers.js nie jest dostępny');
            }
            
            console.log('📦 Transformers.js załadowany, ładowanie modeli...');
            
            // Load lightweight models
            this.summarizationPipeline = await transformersModule.pipeline(
                'summarization', 
                'Xenova/distilbart-cnn-6-6'  // Mniejszy model
            );
            
            this.aiModelsLoaded = true;
            console.log('✅ Modele AI załadowane pomyślnie!');
            
            // Update UI to show AI is ready
            const aiStatus = document.getElementById('aiStatus');
            if (aiStatus) {
                aiStatus.textContent = 'Gotowe';
                aiStatus.style.color = 'var(--success-color)';
            }
            
        } catch (error) {
            console.warn('⚠️  AI niedostępne:', error.message);
            this.useAI = false;
            this.aiModelsLoaded = false;
            
            const aiStatus = document.getElementById('aiStatus');
            if (aiStatus) {
                aiStatus.textContent = 'Podstawowe';
                aiStatus.style.color = 'var(--text-secondary)';
            }
        }
    }
    
    setupEventListeners() {
        console.log('🔧 Konfigurowanie event listeners...');
        
        try {
            // File input listener
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    console.log('📁 Plik wybrany:', e.target.files);
                    if (e.target.files && e.target.files.length > 0) {
                        this.handleFileUpload(e.target.files[0]);
                    }
                });
                console.log('✅ File input listener dodany');
            } else {
                console.error('❌ Element fileInput nie znaleziony!');
            }
            
            // Select PDF button
            const selectBtn = document.getElementById('selectPdfBtn');
            if (selectBtn) {
                selectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('🖱️  Przycisk "Wybierz PDF" kliknięty');
                    const fileInput = document.getElementById('fileInput');
                    if (fileInput) {
                        fileInput.click();
                    } else {
                        console.error('❌ FileInput nie znaleziony!');
                    }
                });
                console.log('✅ Select button listener dodany');
            } else {
                console.error('❌ Element selectPdfBtn nie znaleziony!');
            }
            
            // Drag and drop
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea) {
                uploadArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('dragover');
                });
                
                uploadArea.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('dragover');
                });
                
                uploadArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('dragover');
                    
                    console.log('📎 Plik upuszczony!');
                    const files = e.dataTransfer.files;
                    
                    if (files && files.length > 0) {
                        const file = files[0];
                        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                            this.handleFileUpload(file);
                        } else {
                            alert('Proszę upuścić prawidłowy plik PDF');
                        }
                    }
                });
                
                console.log('✅ Drag & drop listeners dodane');
            } else {
                console.error('❌ Element uploadArea nie znaleziony!');
            }
            
            // Activity buttons
            const buttons = {
                'mindMapBtn': () => this.showMindMap(),
                'summaryBtn': () => this.showSummary(),
                'quizBtn': () => this.showQuiz(),
                'mindMapBackBtn': () => this.showActivities(),
                'summaryBackBtn': () => this.showActivities(),
                'quizBackBtn': () => this.showActivities(),
                'retakeQuizBtn': () => this.retakeQuiz(),
                'resultsBackBtn': () => this.showActivities()
            };
            
            Object.keys(buttons).forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('click', buttons[id]);
                    console.log(`✅ Listener dodany do ${id}`);
                } else {
                    console.warn(`⚠️  Element ${id} nie znaleziony`);
                }
            });
            
            // Summary controls
            const summaryLength = document.getElementById('summaryLength');
            if (summaryLength) {
                summaryLength.addEventListener('change', () => this.renderSummary());
            }
            
            console.log('✅ Wszystkie event listeners skonfigurowane');
            
        } catch (error) {
            console.error('❌ Błąd konfiguracji event listeners:', error);
        }
    }
    
    async handleFileUpload(file) {
        console.log('=== ROZPOCZĘCIE PRZETWARZANIA PDF ===');
        console.log('📄 Plik:', file.name, 'Rozmiar:', file.size, 'bajtów', 'Typ:', file.type);
        
        try {
            this.currentDocumentName = file.name;
            this.showLoading('Przetwarzanie dokumentu PDF...');
            
            // Step 1: Check PDF.js
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js nie jest załadowany');
            }
            
            // Step 2: Read file
            console.log('📖 Czytanie pliku...');
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            console.log('✅ Plik przeczytany:', arrayBuffer.byteLength, 'bajtów');
            
            if (arrayBuffer.byteLength === 0) {
                throw new Error('Plik jest pusty lub uszkodzony');
            }
            
            // Step 3: Load PDF
            console.log('📋 Ładowanie dokumentu PDF...');
            this.updateLoadingProgress(20, 'Ładowanie dokumentu PDF...');
            
            const uint8Array = new Uint8Array(arrayBuffer);
            const loadingTask = pdfjsLib.getDocument({
                data: uint8Array,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true
            });
            
            this.currentPdfDoc = await loadingTask.promise;
            console.log('✅ PDF załadowany! Stron:', this.currentPdfDoc.numPages);
            
            // Step 4: Extract text
            this.updateLoadingProgress(40, 'Ekstraktowanie tekstu...');
            this.extractedText = await this.extractAllText(this.currentPdfDoc);
            
            console.log('=== WYEKSTRAKTOWANY TEKST ===');
            console.log('📝 Długość:', this.extractedText.length, 'znaków');
            console.log('🔍 Początek:', this.extractedText.substring(0, 300) + '...');
            console.log('==========================');
            
            if (!this.extractedText || this.extractedText.trim().length < 50) {
                throw new Error('Nie udało się wyekstraktować wystarczającej ilości tekstu z PDF');
            }
            
            // Step 5: Generate content
            await this.generateAllContent();
            
            // Step 6: Update progress
            this.userProgress.documentsProcessed++;
            this.addPoints(10);
            this.saveProgress();
            this.addToRecentDocuments(file.name, this.currentPdfDoc.numPages);
            
            this.updateLoadingProgress(100, 'Gotowe!');
            
            console.log('✅ PRZETWARZANIE ZAKOŃCZONE POMYŚLNIE');
            
            setTimeout(() => {
                this.hideLoading();
                this.showActivities();
            }, 1500);
            
        } catch (error) {
            console.error('❌ BŁĄD PRZETWARZANIA PDF:', error);
            this.hideLoading();
            
            let errorMessage = 'Nie udało się przetworzyć pliku PDF.\n\n';
            errorMessage += `Błąd: ${error.message}\n\n`;
            errorMessage += 'Sprawdź czy:\n';
            errorMessage += '• Plik jest prawidłowym PDF\n';
            errorMessage += '• PDF nie jest chroniony hasłem\n';
            errorMessage += '• PDF zawiera tekst (nie tylko obrazy)\n';
            errorMessage += '• Masz stabilne połączenie z internetem';
            
            alert(errorMessage);
        }
    }
    
    async generateAllContent() {
        console.log('🏗️  Generowanie wszystkich treści...');
        
        try {
            // Mind map
            this.updateLoadingProgress(60, 'Generowanie mapy myśli...');
            this.mindMapData = await this.generateMindMapFromText(this.extractedText);
            console.log('✅ Mapa myśli wygenerowana');
            
            // Summary
            this.updateLoadingProgress(75, 'Tworzenie streszczenia...');
            this.summaryData = await this.generateSummaryFromText(this.extractedText);
            console.log('✅ Streszczenie wygenerowane');
            
            // Quiz
            this.updateLoadingProgress(90, 'Przygotowywanie quizu...');
            this.quizData = await this.generateQuizFromText(this.extractedText);
            console.log('✅ Quiz wygenerowany:', this.quizData.length, 'pytań');
            
        } catch (error) {
            console.error('⚠️  Błąd generowania treści:', error);
            // Fallback do podstawowych funkcji
            this.mindMapData = this.generateBasicMindMap(this.extractedText);
            this.summaryData = this.generateBasicSummary(this.extractedText);
            this.quizData = this.generateBasicQuiz(this.extractedText);
        }
    }
    
    // AI-ENHANCED SUMMARY GENERATION
    async generateSummaryFromText(text) {
        console.log('📝 Generowanie streszczenia...');
        
        // Try AI first if available
        if (this.useAI && this.aiModelsLoaded && this.summarizationPipeline) {
            try {
                console.log('🤖 Używam AI do streszczenia');
                return await this.generateAISummary(text);
            } catch (error) {
                console.warn('⚠️  AI summary failed, using fallback:', error);
            }
        }
        
        // Fallback to improved basic algorithm
        console.log('🔧 Używam ulepszony algorytm podstawowy');
        return this.generateBasicSummary(text);
    }
    
    async generateAISummary(text) {
        const summaries = {};
        
        // Split text if too long (BART has token limits)
        const maxChunkLength = 800;
        const chunks = this.splitTextIntoChunks(text, maxChunkLength);
        
        for (const [type, maxLen, minLen] of [
            ['short', 60, 25],
            ['medium', 120, 50],
            ['long', 200, 80]
        ]) {
            console.log(`🤖 Generowanie streszczenia ${type}...`);
            
            let combinedSummary = '';
            
            for (let i = 0; i < Math.min(chunks.length, 3); i++) {
                try {
                    const result = await this.summarizationPipeline(chunks[i], {
                        max_length: Math.round(maxLen / chunks.length),
                        min_length: Math.round(minLen / chunks.length),
                        do_sample: false
                    });
                    
                    if (result && result[0] && result[0].summary_text) {
                        combinedSummary += result[0].summary_text + ' ';
                    }
                } catch (error) {
                    console.warn(`⚠️  Chunk ${i} failed:`, error);
                }
            }
            
            summaries[type] = combinedSummary.trim() || this.generateBasicSummary(text)[type];
            console.log(`✅ ${type}: ${summaries[type].length} znaków`);
        }
        
        return summaries;
    }
    
    // IMPROVED BASIC SUMMARY (Better than original)
    generateBasicSummary(text) {
        console.log('🔧 Generowanie podstawowego streszczenia...');
        
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const keywords = this.extractKeywords(text);
        
        // Score sentences more intelligently
        const scoredSentences = sentences.map((sentence, index) => {
            let score = 0;
            
            // Position score (first and last sentences more important)
            if (index < 3 || index > sentences.length - 3) score += 0.3;
            
            // Length score (prefer medium length)
            const wordCount = sentence.split(' ').length;
            if (wordCount >= 10 && wordCount <= 25) score += 0.2;
            
            // Keyword density
            const sentenceWords = sentence.toLowerCase().split(' ');
            const keywordMatches = keywords.filter(k => 
                sentenceWords.some(w => w.includes(k))
            ).length;
            score += keywordMatches * 0.1;
            
            // Avoid fragments and incomplete sentences
            if (sentence.trim().length < 30 || !sentence.includes(' ')) score -= 0.5;
            
            return { sentence: sentence.trim(), score, index };
        });
        
        // Select top sentences for each length
        const summaries = {};
        
        for (const [type, count] of [['short', 2], ['medium', 4], ['long', 6]]) {
            const topSentences = scoredSentences
                .sort((a, b) => b.score - a.score)
                .slice(0, count)
                .sort((a, b) => a.index - b.index)
                .map(item => item.sentence);
            
            summaries[type] = topSentences.join('. ') + '.';
        }
        
        return summaries;
    }
    
    // BASIC MIND MAP (Improved)
    async generateMindMapFromText(text) {
        console.log('🧠 Generowanie mapy myśli...');
        
        const keywords = this.extractKeywords(text);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        
        const mainTopic = keywords[0] || "Główny temat dokumentu";
        
        // Create smarter branches
        const branches = keywords.slice(1, 6).map((keyword, index) => {
            const relatedSentences = this.findRelatedSentences(keyword, sentences);
            const subtopics = relatedSentences
                .slice(0, 4)
                .map(s => this.extractKeyPhrase(s))
                .filter(phrase => phrase && phrase.length > 3 && phrase.length < 50);
            
            return {
                topic: this.capitalizeFirst(keyword),
                subtopics: subtopics.length > 0 ? subtopics : [`Aspekty ${keyword}`, `Znaczenie ${keyword}`, `Zastosowanie ${keyword}`]
            };
        });
        
        return {
            central: this.capitalizeFirst(mainTopic),
            branches: branches
        };
    }
    
    // BASIC QUIZ (Improved)
    async generateQuizFromText(text) {
        console.log('🎓 Generowanie quizu...');
        
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const keywords = this.extractKeywords(text);
        const quiz = [];
        
        // Generate different types of questions
        for (let i = 0; i < Math.min(10, sentences.length / 3); i++) {
            const questionTypes = ['multiple_choice', 'true_false'];
            const questionType = questionTypes[i % questionTypes.length];
            const sentence = sentences[Math.floor(Math.random() * Math.min(sentences.length, 30))];
            
            if (sentence && sentence.length > 30) {
                let question = null;
                
                if (questionType === 'multiple_choice') {
                    question = this.createMultipleChoiceQuestion(sentence, keywords);
                } else {
                    question = this.createTrueFalseQuestion(sentence);
                }
                
                if (question) {
                    quiz.push(question);
                }
            }
        }
        
        return quiz.slice(0, 10);
    }
    
    // UTILITY METHODS
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject(new Error('Nie udało się przeczytać pliku'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    async extractAllText(pdfDoc) {
        const numPages = pdfDoc.numPages;
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            try {
                const page = await pdfDoc.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                const pageText = textContent.items
                    .filter(item => item.str && item.str.trim().length > 0)
                    .map(item => item.str)
                    .join(' ');
                
                fullText += pageText + '\n';
                
                const progress = Math.round(((pageNum / numPages) * 20) + 40);
                this.updateLoadingProgress(progress, `Przetwarzanie strony ${pageNum}/${numPages}...`);
                
            } catch (pageError) {
                console.warn(`⚠️  Błąd strony ${pageNum}:`, pageError);
            }
        }
        
        return fullText.trim();
    }
    
    extractKeywords(text) {
        const stopWords = [
            'i', 'a', 'w', 'na', 'do', 'z', 'ze', 'się', 'że', 'przez', 'dla', 'od', 'o', 'po', 'przy',
            'bardzo', 'tylko', 'oraz', 'także', 'również', 'jest', 'są', 'będzie', 'może', 'można',
            'tym', 'tej', 'ten', 'ta', 'to', 'te', 'ich', 'jego', 'jej', 'jako', 'lub', 'albo'
        ];
        
        const words = text.toLowerCase()
            .replace(/[^\w\sąęćłńóśźż]/g, ' ')
            .split(/\s+/)
            .filter(word => 
                word.length > 3 && 
                !stopWords.includes(word) &&
                !/^\d+$/.test(word)
            );
        
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        return Object.keys(wordCount)
            .filter(word => wordCount[word] >= 2)
            .sort((a, b) => wordCount[b] - wordCount[a])
            .slice(0, 15);
    }
    
    findRelatedSentences(keyword, sentences) {
        return sentences
            .filter(sentence => sentence.toLowerCase().includes(keyword.toLowerCase()))
            .slice(0, 5);
    }
    
    extractKeyPhrase(sentence) {
        const words = sentence.trim().split(' ').filter(w => w.length > 0);
        if (words.length <= 6) return sentence.trim();
        return words.slice(0, 5).join(' ') + '...';
    }
    
    splitTextIntoChunks(text, maxLength) {
        const words = text.split(' ');
        const chunks = [];
        let currentChunk = [];
        let currentLength = 0;
        
        for (const word of words) {
            if (currentLength + word.length + 1 > maxLength && currentChunk.length > 0) {
                chunks.push(currentChunk.join(' '));
                currentChunk = [word];
                currentLength = word.length;
            } else {
                currentChunk.push(word);
                currentLength += word.length + 1;
            }
        }
        
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join(' '));
        }
        
        return chunks;
    }
    
    createMultipleChoiceQuestion(sentence, keywords) {
        const words = sentence.split(' ').filter(w => w.length > 4);
        if (words.length < 5) return null;
        
        const targetWord = words.find(w => 
            keywords.some(k => w.toLowerCase().includes(k.toLowerCase()))
        ) || words[Math.floor(Math.random() * Math.min(words.length, 10))];
        
        const cleanTarget = targetWord.replace(/[^\w\sąęćłńóśźż]/g, '');
        const question = sentence.replace(new RegExp(targetWord, 'gi'), '____');
        
        const distractors = keywords
            .filter(k => k !== cleanTarget.toLowerCase())
            .slice(0, 3)
            .map(k => this.capitalizeFirst(k));
        
        while (distractors.length < 3) {
            distractors.push(['inne', 'brak', 'nieznane'][distractors.length % 3]);
        }
        
        const options = [cleanTarget, ...distractors].slice(0, 4);
        this.shuffleArray(options);
        
        return {
            question: `Uzupełnij zdanie: ${question}`,
            options: options,
            correct: options.indexOf(cleanTarget),
            type: 'multiple_choice',
            explanation: `Prawidłowa odpowiedź to "${cleanTarget}".`
        };
    }
    
    createTrueFalseQuestion(sentence) {
        const isTrue = Math.random() > 0.5;
        
        if (isTrue) {
            return {
                question: `Prawda czy fałsz: ${sentence}`,
                options: ['Prawda', 'Fałsz'],
                correct: 0,
                type: 'true_false',
                explanation: 'To stwierdzenie jest prawdziwe według dokumentu.'
            };
        } else {
            const modifiedSentence = sentence.replace(/jest/gi, 'nie jest');
            return {
                question: `Prawda czy fałsz: ${modifiedSentence}`,
                options: ['Prawda', 'Fałsz'],
                correct: 1,
                type: 'true_false',
                explanation: 'To stwierdzenie zostało zmodyfikowane i jest fałszywe.'
            };
        }
    }
    
    capitalizeFirst(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // UI METHODS
    showLoading(message = 'Ładowanie...') {
        this.hideAllSections();
        const loadingSection = document.getElementById('loadingSection');
        if (loadingSection) {
            loadingSection.classList.remove('hidden');
        }
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.textContent = message;
        }
        this.updateLoadingProgress(0, 'Rozpoczynam...');
    }
    
    hideLoading() {
        const loadingSection = document.getElementById('loadingSection');
        if (loadingSection) {
            loadingSection.classList.add('hidden');
        }
    }
    
    updateLoadingProgress(percent, details) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
        
        const loadingDetails = document.getElementById('loadingDetails');
        if (loadingDetails && details) {
            loadingDetails.textContent = details;
        }
        
        console.log(`📊 Postęp: ${percent}% - ${details}`);
    }
    
    showActivities() {
        this.hideAllSections();
        const activitiesSection = document.getElementById('activitiesSection');
        if (activitiesSection) {
            activitiesSection.classList.remove('hidden');
        }
        
        // Update document info
        const docName = document.getElementById('currentDocName');
        if (docName) docName.textContent = this.currentDocumentName || 'Nieznany dokument';
        
        const docPages = document.getElementById('currentDocPages');
        if (docPages) docPages.textContent = this.currentPdfDoc ? this.currentPdfDoc.numPages : '-';
        
        console.log('📋 Wyświetlono sekcję aktywności');
    }
    
    showMindMap() {
        if (!this.mindMapData) {
            alert('Brak danych do wyświetlenia mapy myśli. Wgraj najpierw dokument PDF.');
            return;
        }
        
        this.hideAllSections();
        const mindmapSection = document.getElementById('mindmapSection');
        if (mindmapSection) {
            mindmapSection.classList.remove('hidden');
        }
        this.renderMindMap();
        this.addPoints(25);
    }
    
    showSummary() {
        if (!this.summaryData) {
            alert('Brak danych do wyświetlenia streszczenia. Wgraj najpierw dokument PDF.');
            return;
        }
        
        this.hideAllSections();
        const summarySection = document.getElementById('summarySection');
        if (summarySection) {
            summarySection.classList.remove('hidden');
        }
        this.renderSummary();
        this.addPoints(15);
    }
    
    showQuiz() {
        if (!this.quizData || this.quizData.length === 0) {
            alert('Brak pytań do wyświetlenia quizu. Wgraj najpierw dokument PDF.');
            return;
        }
        
        this.hideAllSections();
        const quizSection = document.getElementById('quizSection');
        if (quizSection) {
            quizSection.classList.remove('hidden');
        }
        this.startQuiz();
        this.addPoints(5);
    }
    
    hideAllSections() {
        const sections = [
            'uploadSection', 'loadingSection', 'activitiesSection', 
            'mindmapSection', 'summarySection', 'quizSection', 'quizResultsSection'
        ];
        
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.classList.add('hidden');
            }
        });
    }
    
    renderMindMap() {
        const canvas = document.getElementById('mindmapCanvas');
        if (!canvas || !this.mindMapData) return;
        
        canvas.innerHTML = '';
        
        // Central node
        const centralNode = document.createElement('div');
        centralNode.className = 'mind-node central-node';
        centralNode.textContent = this.mindMapData.central;
        centralNode.style.cssText = 'left: 50%; top: 50%; transform: translate(-50%, -50%);';
        canvas.appendChild(centralNode);
        
        // Branch nodes
        this.mindMapData.branches.forEach((branch, index) => {
            const angle = (index * 360) / this.mindMapData.branches.length;
            const radius = 200;
            
            const x = 50 + radius * Math.cos(angle * Math.PI / 180) / 10;
            const y = 50 + radius * Math.sin(angle * Math.PI / 180) / 10;
            
            const branchNode = document.createElement('div');
            branchNode.className = 'mind-node branch-node';
            branchNode.textContent = branch.topic;
            branchNode.style.cssText = `left: ${x}%; top: ${y}%; transform: translate(-50%, -50%);`;
            canvas.appendChild(branchNode);
            
            // Connection line
            const line = document.createElement('div');
            line.className = 'mind-connection';
            const lineLength = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
            const lineAngle = Math.atan2(y - 50, x - 50) * 180 / Math.PI;
            
            line.style.cssText = `
                width: ${lineLength}%; 
                left: 50%; 
                top: 50%; 
                transform: rotate(${lineAngle}deg);
                transform-origin: 0 50%;
            `;
            canvas.appendChild(line);
            
            // Click event for subtopics
            branchNode.addEventListener('click', () => {
                this.showSubtopics(branchNode, branch.subtopics);
            });
        });
    }
    
    showSubtopics(parentNode, subtopics) {
        document.querySelectorAll('.subtopic-node').forEach(node => node.remove());
        
        subtopics.forEach((subtopic, index) => {
            const subtopicNode = document.createElement('div');
            subtopicNode.className = 'mind-node subtopic-node';
            subtopicNode.textContent = subtopic;
            
            const angle = (index * 360) / subtopics.length;
            const offsetX = 80 * Math.cos(angle * Math.PI / 180);
            const offsetY = 80 * Math.sin(angle * Math.PI / 180);
            
            const parentRect = parentNode.getBoundingClientRect();
            const canvasRect = document.getElementById('mindmapCanvas').getBoundingClientRect();
            
            const x = ((parentRect.left - canvasRect.left + offsetX) / canvasRect.width) * 100;
            const y = ((parentRect.top - canvasRect.top + offsetY) / canvasRect.height) * 100;
            
            subtopicNode.style.cssText = `left: ${x}%; top: ${y}%; transform: translate(-50%, -50%);`;
            document.getElementById('mindmapCanvas').appendChild(subtopicNode);
        });
    }
    
    renderSummary() {
        const summaryContent = document.getElementById('summaryContent');
        if (!summaryContent || !this.summaryData) return;
        
        const length = document.getElementById('summaryLength')?.value || 'medium';
        const summary = this.summaryData[length] || this.summaryData.medium || 'Brak streszczenia';
        
        // Dodaj wskaźnik AI jeśli używano
        const aiIndicator = this.useAI && this.aiModelsLoaded ? 
            '<div class="ai-indicator-small">🤖 Wygenerowane przez AI</div>' : '';
        
        summaryContent.innerHTML = `
            ${aiIndicator}
            <div class="summary-text">${summary}</div>
        `;
        
        console.log('📝 Streszczenie wyrenderowane:', length);
    }
    
    startQuiz() {
        this.currentQuizIndex = 0;
        this.quizAnswers = [];
        this.selectedQuizOption = null;
        this.renderQuizQuestion();
    }
    
    renderQuizQuestion() {
        if (this.currentQuizIndex >= this.quizData.length) {
            this.showQuizResults();
            return;
        }
        
        const question = this.quizData[this.currentQuizIndex];
        const quizContent = document.getElementById('quizContent');
        
        // Update progress
        const progress = ((this.currentQuizIndex + 1) / this.quizData.length) * 100;
        const progressBar = document.getElementById('quizProgress');
        if (progressBar) progressBar.style.width = `${progress}%`;
        
        const currentQ = document.getElementById('currentQuestion');
        if (currentQ) currentQ.textContent = this.currentQuizIndex + 1;
        
        const totalQ = document.getElementById('totalQuestions');
        if (totalQ) totalQ.textContent = this.quizData.length;
        
        if (quizContent) {
            quizContent.innerHTML = `
                <div class="question">
                    <h3>${question.question}</h3>
                    <div class="options">
                        ${question.options.map((option, index) => `
                            <div class="option" data-index="${index}">
                                <input type="radio" name="answer" id="option${index}" value="${index}">
                                <label for="option${index}">${option}</label>
                            </div>
                        `).join('')}
                    </div>
                    <div class="quiz-actions">
                        <button class="btn btn--primary" id="submitAnswerBtn" disabled>
                            Potwierdź odpowiedź
                        </button>
                    </div>
                </div>
            `;
            
            // Add option listeners
            document.querySelectorAll('.option').forEach((option, index) => {
                option.addEventListener('click', () => this.selectOption(index));
            });
            
            // Add submit listener
            const submitBtn = document.getElementById('submitAnswerBtn');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => this.submitAnswer());
            }
        }
        
        this.selectedQuizOption = null;
    }
    
    selectOption(optionIndex) {
        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        document.querySelectorAll('.option')[optionIndex].classList.add('selected');
        document.getElementById(`option${optionIndex}`).checked = true;
        
        this.selectedQuizOption = optionIndex;
        document.getElementById('submitAnswerBtn').disabled = false;
    }
    
    submitAnswer() {
        if (this.selectedQuizOption === null) return;
        
        const question = this.quizData[this.currentQuizIndex];
        const isCorrect = this.selectedQuizOption === question.correct;
        
        this.quizAnswers.push({
            questionIndex: this.currentQuizIndex,
            selectedAnswer: this.selectedQuizOption,
            correctAnswer: question.correct,
            isCorrect: isCorrect,
            question: question.question,
            explanation: question.explanation
        });
        
        this.showAnswerFeedback(isCorrect, question.explanation);
        
        setTimeout(() => {
            this.currentQuizIndex++;
            this.renderQuizQuestion();
        }, 2000);
    }
    
    showAnswerFeedback(isCorrect, explanation) {
        const quizContent = document.getElementById('quizContent');
        const feedbackClass = isCorrect ? 'feedback-correct' : 'feedback-incorrect';
        const feedbackIcon = isCorrect ? '✅' : '❌';
        const feedbackText = isCorrect ? 'Poprawnie!' : 'Niepoprawnie';
        
        const feedbackElement = document.createElement('div');
        feedbackElement.className = `answer-feedback ${feedbackClass}`;
        feedbackElement.innerHTML = `
            <div class="feedback-header">
                <span class="feedback-icon">${feedbackIcon}</span>
                <span class="feedback-text">${feedbackText}</span>
            </div>
            <div class="feedback-explanation">${explanation}</div>
        `;
        
        quizContent.appendChild(feedbackElement);
    }
    
    showQuizResults() {
        this.hideAllSections();
        const resultsSection = document.getElementById('quizResultsSection');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
        }
        
        const correctAnswers = this.quizAnswers.filter(a => a.isCorrect).length;
        const totalQuestions = this.quizAnswers.length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        // Update results display
        const finalScore = document.getElementById('finalScore');
        if (finalScore) finalScore.textContent = percentage;
        
        const correctEl = document.getElementById('correctAnswers');
        if (correctEl) correctEl.textContent = correctAnswers;
        
        const wrongEl = document.getElementById('wrongAnswers');
        if (wrongEl) wrongEl.textContent = totalQuestions - correctAnswers;
        
        const gradeEl = document.getElementById('predictedGrade');
        if (gradeEl) gradeEl.textContent = this.getGradeFromPercentage(percentage);
        
        this.showImprovementAreas();
        
        // Award points and badges
        this.addPoints(correctAnswers * 3);
        this.userProgress.completedQuizzes++;
        
        if (percentage >= 80) this.checkBadgeRequirement('score80');
        if (percentage === 100) this.checkBadgeRequirement('perfectScore');
        
        this.saveProgress();
    }
    
    getGradeFromPercentage(percentage) {
        if (percentage >= 95) return '5.0 (Celujący)';
        if (percentage >= 85) return '4.5 (Bardzo dobry+)';
        if (percentage >= 75) return '4.0 (Bardzo dobry)';
        if (percentage >= 65) return '3.5 (Dobry+)';
        if (percentage >= 55) return '3.0 (Dobry)';
        if (percentage >= 45) return '2.5 (Dostateczny+)';
        if (percentage >= 35) return '2.0 (Dostateczny)';
        return '1.0 (Niedostateczny)';
    }
    
    showImprovementAreas() {
        const incorrectAnswers = this.quizAnswers.filter(a => !a.isCorrect);
        const improvementList = document.getElementById('improvementList');
        
        if (!improvementList) return;
        
        if (incorrectAnswers.length === 0) {
            improvementList.innerHTML = '<p class="no-improvements">🎉 Doskonały wynik! Nie ma obszarów do poprawy.</p>';
            return;
        }
        
        const areas = incorrectAnswers.map(answer => `
            <div class="improvement-item">
                <h4>Pytanie ${answer.questionIndex + 1}</h4>
                <p class="question-text">${answer.question}</p>
                <p class="explanation">${answer.explanation}</p>
            </div>
        `);
        
        improvementList.innerHTML = areas.join('');
    }
    
    retakeQuiz() {
        this.startQuiz();
        this.showQuiz();
    }
    
    // PROGRESS AND STORAGE
    addPoints(points) {
        this.userProgress.points += points;
        this.updateLevel();
        this.updateProgressDisplay();
        this.saveProgress();
    }
    
    updateLevel() {
        const points = this.userProgress.points;
        let newLevel;
        
        if (points >= 1000) newLevel = 'Ekspert';
        else if (points >= 500) newLevel = 'Zaawansowany';
        else if (points >= 200) newLevel = 'Średniozaawansowany';
        else newLevel = 'Początkujący';
        
        if (newLevel !== this.userProgress.level) {
            this.userProgress.level = newLevel;
            // Show achievement
        }
    }
    
    checkBadgeRequirement(requirement) {
        const badge = this.badges.find(b => 
            b.requirement === requirement && 
            !this.userProgress.badges.includes(b.name)
        );
        
        if (badge) {
            this.userProgress.badges.push(badge.name);
            // Show achievement popup
        }
    }
    
    updateProgressDisplay() {
        const levelEl = document.getElementById('userLevel');
        if (levelEl) levelEl.textContent = this.userProgress.level;
        
        const pointsEl = document.getElementById('userPoints');
        if (pointsEl) pointsEl.textContent = this.userProgress.points;
        
        const aiStatusEl = document.getElementById('aiStatus');
        if (aiStatusEl && !this.aiModelsLoaded) {
            aiStatusEl.textContent = this.useAI ? 'Ładowanie...' : 'Podstawowe';
        }
    }
    
    addToRecentDocuments(fileName, pageCount) {
        const recentDocs = this.getRecentDocuments();
        const newDoc = {
            name: fileName,
            pages: pageCount,
            date: new Date().toLocaleDateString('pl-PL'),
            timestamp: Date.now()
        };
        
        recentDocs.unshift(newDoc);
        localStorage.setItem('edulearn_recent_docs', JSON.stringify(recentDocs.slice(0, 5)));
        this.updateRecentDocsDisplay();
    }
    
    getRecentDocuments() {
        try {
            const stored = localStorage.getItem('edulearn_recent_docs');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
    
    updateRecentDocsDisplay() {
        const recentDocs = this.getRecentDocuments();
        const container = document.getElementById('recentDocsList');
        
        if (!container) return;
        
        if (recentDocs.length === 0) {
            container.innerHTML = '<p class="no-docs">Nie ma jeszcze przetworzonych dokumentów</p>';
            return;
        }
        
        container.innerHTML = recentDocs.map(doc => `
            <div class="recent-doc-item">
                <div class="doc-icon">📄</div>
                <div class="doc-info">
                    <div class="doc-name">${doc.name}</div>
                    <div class="doc-details">${doc.pages} stron • ${doc.date}</div>
                </div>
            </div>
        `).join('');
    }
    
    saveProgress() {
        try {
            localStorage.setItem('edulearn_progress', JSON.stringify(this.userProgress));
        } catch (e) {
            console.warn('Nie można zapisać postępu:', e);
        }
    }
    
    loadProgress() {
        try {
            const stored = localStorage.getItem('edulearn_progress');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    }
}

// INICJALIZACJA APLIKACJI
console.log('📚 EduLearn Pro - Skrypt załadowany');

// Sprawdź czy DOM jest gotowy
if (document.readyState === 'loading') {
    console.log('⏳ DOM się ładuje, oczekiwanie...');
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    console.log('✅ DOM załadowany, inicjalizacja natychmiast');
    initializeApp();
}

function initializeApp() {
    console.log('=== INICJALIZACJA APLIKACJI ===');
    
    try {
        // Sprawdź PDF.js
        if (typeof pdfjsLib === 'undefined') {
            console.error('❌ PDF.js nie jest załadowany!');
            alert('Błąd: PDF.js nie został załadowany. Sprawdź połączenie z internetem i odśwież stronę.');
            return;
        }
        
        console.log('✅ PDF.js dostępny');
        
        // Sprawdź elementy DOM
        const requiredElements = ['fileInput', 'uploadArea', 'uploadSection'];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('❌ Brak elementów DOM:', missingElements);
            alert('Błąd: Nie wszystkie elementy interfejsu zostały załadowane. Odśwież stronę.');
            return;
        }
        
        console.log('✅ Wszystkie elementy DOM dostępne');
        
        // Utwórz aplikację
        window.app = new EduLearnApp();
        window.app.init();
        
        console.log('🎉 === APLIKACJA GOTOWA DO UŻYCIA ===');
        
        // Test basic functionality
        setTimeout(() => {
            const fileInput = document.getElementById('fileInput');
            const selectBtn = document.getElementById('selectPdfBtn');
            console.log('🧪 Test elementów:');
            console.log('  - FileInput:', fileInput ? '✅' : '❌');
            console.log('  - SelectBtn:', selectBtn ? '✅' : '❌');
            console.log('  - Event listeners:', fileInput && selectBtn ? '✅' : '❌');
        }, 1000);
        
    } catch (error) {
        console.error('❌ BŁĄD INICJALIZACJI:', error);
        alert(`Błąd inicjalizacji aplikacji: ${error.message}`);
    }
}
