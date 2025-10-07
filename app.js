// EduLearn Pro - NAPRAWIONA WERSJA
class EduLearnApp {
    constructor() {
        this.currentSection = 'upload';
        this.currentQuizIndex = 0;
        this.quizAnswers = [];
        this.selectedQuizOption = null;
        this.currentPdfDoc = null;
        this.extractedText = '';
        this.currentDocumentName = '';
        
        // User progress
        this.userProgress = this.loadProgress() || {
            points: 0,
            level: 'Początkujący',
            badges: [],
            documentsProcessed: 0,
            completedQuizzes: 0
        };
        
        // Generated content from real PDFs - START WITH NULL
        this.mindMapData = null;
        this.summaryData = null;
        this.quizData = [];
        
        // Gamification data
        this.badges = [
            {name: 'PDF Master', description: 'Przetworzył pierwszy dokument PDF', icon: '📄', requirement: 'uploadPdf'},
            {name: 'Mind Map Creator', description: 'Stworzył pierwszą mapę myśli', icon: '🧠', requirement: 'createMindMap'},
            {name: 'Quiz Champion', description: 'Uzyskał wynik powyżej 80%', icon: '🏆', requirement: 'score80'},
            {name: 'Perfectionist', description: 'Uzyskał 100% w quizie', icon: '⭐', requirement: 'perfectScore'},
            {name: 'Streaker', description: 'Uczył się przez 7 dni z rzędu', icon: '🔥', requirement: 'streak7'}
        ];
        
        this.levels = ['Początkujący', 'Średniozaawansowany', 'Zaawansowany', 'Ekspert'];
        
        // KLUCZOWE: Nie inicjalizuj od razu, poczekaj na DOM
        console.log('EduLearnApp constructor - oczekiwanie na DOM...');
    }
    
    init() {
        console.log('Inicjalizacja aplikacji...');
        
        // Configure PDF.js worker - BARDZO WAŻNE!
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            console.log('PDF.js worker skonfigurowany:', pdfjsLib.GlobalWorkerOptions.workerSrc);
        } else {
            console.error('PDF.js nie jest załadowany!');
            alert('Błąd: PDF.js nie został załadowany. Sprawdź połączenie z internetem.');
            return;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI with current progress
        this.updateProgressDisplay();
        
        console.log('Aplikacja zainicjalizowana pomyślnie');
    }
    
    setupEventListeners() {
        console.log('Konfigurowanie event listeners...');
        
        // File input - NAPRAWIONE
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            // Usuń poprzednie listenery
            fileInput.removeEventListener('change', this.handleFileInputChange);
            
            // Dodaj nowy listener z bind
            this.handleFileInputChange = (e) => {
                console.log('Plik wybrany:', e.target.files);
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            };
            
            fileInput.addEventListener('change', this.handleFileInputChange);
            console.log('File input listener dodany');
        } else {
            console.error('Element fileInput nie został znaleziony!');
        }
        
        // Upload button - NAPRAWIONE  
        const uploadButtons = document.querySelectorAll('[onclick*="fileInput"]');
        uploadButtons.forEach(button => {
            // Usuń onclick attribute i dodaj prawidłowy listener
            button.removeAttribute('onclick');
            button.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Przycisk "Wybierz PDF" kliknięty');
                const fileInput = document.getElementById('fileInput');
                if (fileInput) {
                    fileInput.click();
                } else {
                    console.error('FileInput nie znaleziony!');
                }
            });
        });
        
        // Drag and drop - NAPRAWIONE
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            // Usuń poprzednie listenery
            uploadArea.removeEventListener('dragover', this.handleDragOver);
            uploadArea.removeEventListener('drop', this.handleDrop);
            uploadArea.removeEventListener('dragenter', this.handleDragEnter);
            uploadArea.removeEventListener('dragleave', this.handleDragLeave);
            
            // Dodaj nowe listenery z bind
            this.handleDragOver = (e) => this.onDragOver(e);
            this.handleDrop = (e) => this.onDrop(e);
            this.handleDragEnter = (e) => this.onDragEnter(e);
            this.handleDragLeave = (e) => this.onDragLeave(e);
            
            uploadArea.addEventListener('dragover', this.handleDragOver);
            uploadArea.addEventListener('drop', this.handleDrop);
            uploadArea.addEventListener('dragenter', this.handleDragEnter);
            uploadArea.addEventListener('dragleave', this.handleDragLeave);
            
            console.log('Drag & drop listeners dodane');
        } else {
            console.error('Element uploadArea nie został znaleziony!');
        }
        
        console.log('Event listeners skonfigurowane');
    }
    
    onDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('dragover');
        console.log('Drag enter');
    }
    
    onDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('dragover');
    }
    
    onDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dragover');
        console.log('Drag leave');
    }
    
    onDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dragover');
        
        console.log('Plik upuszczony!');
        const files = e.dataTransfer.files;
        
        if (files && files.length > 0) {
            const file = files[0];
            console.log('Typ pliku:', file.type, 'Nazwa:', file.name);
            
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                this.handleFileUpload(file);
            } else {
                alert('Proszę upuścić prawidłowy plik PDF');
            }
        } else {
            console.log('Brak plików do przetworzenia');
        }
    }
    
    async handleFileUpload(file) {
        console.log('=== ROZPOCZĘCIE PRZETWARZANIA PDF ===');
        console.log('Plik:', file.name, 'Rozmiar:', file.size, 'bajtów', 'Typ:', file.type);
        
        try {
            this.currentDocumentName = file.name;
            this.showLoading('Przetwarzanie dokumentu PDF...');
            
            // KROK 1: Sprawdź PDF.js
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js nie jest załadowany. Sprawdź połączenie z internetem.');
            }
            
            console.log('PDF.js jest dostępny');
            
            // KROK 2: Czytaj plik jako ArrayBuffer
            console.log('Czytanie pliku...');
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            console.log('Plik przeczytany, rozmiar ArrayBuffer:', arrayBuffer.byteLength, 'bajtów');
            
            if (arrayBuffer.byteLength === 0) {
                throw new Error('Plik jest pusty lub uszkodzony');
            }
            
            // KROK 3: Załaduj dokument PDF
            console.log('Ładowanie dokumentu PDF...');
            this.updateLoadingProgress(20, 'Ładowanie dokumentu PDF...');
            
            const uint8Array = new Uint8Array(arrayBuffer);
            const loadingTask = pdfjsLib.getDocument({
                data: uint8Array,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true
            });
            
            this.currentPdfDoc = await loadingTask.promise;
            console.log('PDF załadowany pomyślnie! Liczba stron:', this.currentPdfDoc.numPages);
            
            // KROK 4: Ekstraktuj tekst
            this.updateLoadingProgress(40, 'Ekstraktowanie tekstu...');
            this.extractedText = await this.extractAllText(this.currentPdfDoc);
            
            console.log('=== WYEKSTRAKTOWANY TEKST ===');
            console.log('Długość tekstu:', this.extractedText.length, 'znaków');
            console.log('Pierwsze 500 znaków:', this.extractedText.substring(0, 500));
            console.log('========================');
            
            if (!this.extractedText || this.extractedText.trim().length < 50) {
                throw new Error('Nie udało się wyekstraktować wystarczającej ilości tekstu z PDF. Plik może zawierać głównie obrazy lub być zeskanowany.');
            }
            
            // KROK 5: Generuj zawartość NA PODSTAWIE RZECZYWISTEGO TEKSTU
            console.log('Generowanie zawartości na podstawie rzeczywistego tekstu...');
            
            this.updateLoadingProgress(60, 'Generowanie mapy myśli...');
            this.mindMapData = this.generateMindMapFromText(this.extractedText);
            console.log('Mapa myśli wygenerowana:', this.mindMapData);
            
            this.updateLoadingProgress(75, 'Tworzenie streszczenia...');
            this.summaryData = this.generateSummaryFromText(this.extractedText);
            console.log('Streszczenie wygenerowane');
            
            this.updateLoadingProgress(90, 'Przygotowywanie quizu...');
            this.quizData = this.generateQuizFromText(this.extractedText);
            console.log('Quiz wygenerowany, liczba pytań:', this.quizData.length);
            
            // KROK 6: Aktualizuj postęp użytkownika
            this.checkBadgeRequirement('uploadPdf');
            this.userProgress.documentsProcessed++;
            this.addPoints(10);
            this.saveProgress();
            this.addToRecentDocuments(file.name, this.currentPdfDoc.numPages);
            
            this.updateLoadingProgress(100, 'Gotowe!');
            
            console.log('=== PRZETWARZANIE ZAKOŃCZONE POMYŚLNIE ===');
            
            setTimeout(() => {
                this.hideLoading();
                this.showActivities();
            }, 1500);
            
        } catch (error) {
            console.error('=== BŁĄD PRZETWARZANIA PDF ===');
            console.error('Szczegóły błędu:', error);
            console.error('Stack trace:', error.stack);
            
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
    
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                console.log('FileReader onload - ArrayBuffer utworzony');
                resolve(event.target.result);
            };
            
            reader.onerror = function(event) {
                console.error('FileReader error:', event);
                reject(new Error('Nie udało się przeczytać pliku'));
            };
            
            reader.onprogress = function(event) {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    console.log(`Czytanie pliku: ${progress}%`);
                }
            };
            
            console.log('Rozpoczynam czytanie pliku jako ArrayBuffer...');
            reader.readAsArrayBuffer(file);
        });
    }
    
    async extractAllText(pdfDoc) {
        console.log('Ekstraktowanie tekstu ze wszystkich stron...');
        const numPages = pdfDoc.numPages;
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            try {
                console.log(`Przetwarzanie strony ${pageNum}/${numPages}...`);
                const page = await pdfDoc.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                const pageText = textContent.items
                    .filter(item => item.str && item.str.trim().length > 0)
                    .map(item => item.str)
                    .join(' ');
                
                if (pageText.trim().length > 0) {
                    fullText += pageText + '\n';
                    console.log(`Strona ${pageNum}: wyekstraktowano ${pageText.length} znaków`);
                } else {
                    console.log(`Strona ${pageNum}: brak tekstu`);
                }
                
                // Update progress
                const progress = Math.round(((pageNum / numPages) * 20) + 40); // 40-60% for text extraction
                this.updateLoadingProgress(progress, `Przetwarzanie strony ${pageNum}/${numPages}...`);
                
            } catch (pageError) {
                console.warn(`Błąd przetwarzania strony ${pageNum}:`, pageError);
            }
        }
        
        const finalText = fullText.trim();
        console.log(`Ekstraktowanie zakończone. Łączna długość tekstu: ${finalText.length} znaków`);
        
        return finalText;
    }
    
    generateMindMapFromText(text) {
        console.log('Generowanie mapy myśli z rzeczywistego tekstu...');
        console.log('Długość tekstu do analizy:', text.length);
        
        const keywords = this.extractKeywords(text);
        console.log('Znalezione słowa kluczowe:', keywords);
        
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        console.log('Liczba zdań do analizy:', sentences.length);
        
        // Find main topic (most frequent significant word)
        const mainTopic = keywords[0] || "Główny temat dokumentu";
        console.log('Główny temat:', mainTopic);
        
        // Create branches for top keywords
        const branches = keywords.slice(1, 6).map((keyword, index) => {
            const relatedSentences = this.findRelatedSentences(keyword, sentences);
            const subtopics = relatedSentences.slice(0, 4).map(s => this.extractKeyPhrase(s));
            
            console.log(`Branch ${index + 1}: ${keyword} - ${subtopics.length} subtopics`);
            
            return {
                topic: this.capitalizeFirst(keyword),
                subtopics: subtopics
            };
        });
        
        const mindMap = {
            central: this.capitalizeFirst(mainTopic),
            branches: branches
        };
        
        console.log('Mapa myśli wygenerowana:', mindMap);
        return mindMap;
    }
    
    extractKeywords(text) {
        console.log('Ekstraktowanie słów kluczowych...');
        
        // Polish stop words
        const stopWords = [
            'i', 'a', 'w', 'na', 'do', 'z', 'ze', 'się', 'że', 'przez', 'dla', 'od', 'o', 'po', 'przy',
            'bardzo', 'tylko', 'oraz', 'także', 'również', 'jest', 'są', 'będzie', 'może', 'można',
            'tym', 'tej', 'ten', 'ta', 'to', 'te', 'ich', 'jego', 'jej', 'jako', 'lub', 'albo',
            'które', 'która', 'który', 'gdzie', 'kiedy', 'jak', 'nie', 'tak', 'czy', 'aby', 'żeby',
            'więc', 'czyli', 'oraz', 'między', 'nad', 'pod', 'przed', 'za', 'obok', 'około'
        ];
        
        const words = text.toLowerCase()
            .replace(/[^\w\sąęćłńóśźż]/g, ' ')
            .split(/\s+/)
            .filter(word => 
                word.length > 3 && 
                !stopWords.includes(word) &&
                !/^\d+$/.test(word) &&
                word.length < 20 // Usuń bardzo długie słowa (prawdopodobnie błędy OCR)
            );
        
        // Count word frequency
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        // Return most frequent words
        const keywords = Object.keys(wordCount)
            .filter(word => wordCount[word] >= 2) // Tylko słowa występujące co najmniej 2 razy
            .sort((a, b) => wordCount[b] - wordCount[a])
            .slice(0, 15);
        
        console.log('Top 15 słów kluczowych:', keywords);
        return keywords;
    }
    
    findRelatedSentences(keyword, sentences) {
        const related = sentences
            .filter(sentence => sentence.toLowerCase().includes(keyword.toLowerCase()))
            .slice(0, 5);
        
        console.log(`Znaleziono ${related.length} zdań związanych z "${keyword}"`);
        return related;
    }
    
    extractKeyPhrase(sentence) {
        const words = sentence.trim().split(' ').filter(w => w.length > 0);
        if (words.length <= 6) return sentence.trim();
        
        // Extract meaningful phrase (first 4-6 words)
        return words.slice(0, 5).join(' ') + '...';
    }
    
    generateSummaryFromText(text) {
        console.log('Generowanie streszczenia z rzeczywistego tekstu...');
        
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        
        console.log(`Analiza: ${sentences.length} zdań, ${paragraphs.length} akapitów`);
        
        return {
            short: this.createSummary(sentences, 3, 'short'),
            medium: this.createSummary(sentences, 6, 'medium'),
            long: this.createSummary(sentences, 10, 'long')
        };
    }
    
    createSummary(sentences, maxSentences, type) {
        console.log(`Tworzenie streszczenia (${type}): ${maxSentences} zdań`);
        
        // Score sentences based on keyword frequency and position
        const scoredSentences = sentences.map((sentence, index) => {
            let score = 0;
            
            // Position score (earlier sentences are more important)
            score += (sentences.length - index) / sentences.length * 0.3;
            
            // Length score (prefer medium length sentences)
            const wordCount = sentence.split(' ').length;
            if (wordCount >= 8 && wordCount <= 25) score += 0.3;
            
            // Keyword density score
            const keywords = this.extractKeywords(sentence);
            score += Math.min(keywords.length * 0.1, 0.4);
            
            return { sentence: sentence.trim(), score, index };
        });
        
        // Select top sentences and sort by original order
        const topSentences = scoredSentences
            .sort((a, b) => b.score - a.score)
            .slice(0, maxSentences)
            .sort((a, b) => a.index - b.index)
            .map(item => item.sentence);
        
        const summary = topSentences.join('. ') + '.';
        console.log(`Streszczenie ${type} utworzone (${summary.length} znaków)`);
        
        return summary;
    }
    
    generateQuizFromText(text) {
        console.log('Generowanie quizu z rzeczywistego tekstu...');
        
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const keywords = this.extractKeywords(text);
        const quiz = [];
        
        console.log(`Dostępne zdania: ${sentences.length}, słowa kluczowe: ${keywords.length}`);
        
        // Generate different types of questions
        const questionTypes = ['multiple_choice', 'true_false', 'fill_blank'];
        
        for (let i = 0; i < Math.min(12, sentences.length / 3); i++) {
            const questionType = questionTypes[i % questionTypes.length];
            const sentenceIndex = Math.floor(Math.random() * Math.min(sentences.length, 50)); // Use first 50 sentences
            const sentence = sentences[sentenceIndex];
            
            if (!sentence || sentence.length < 30) continue;
            
            console.log(`Generowanie pytania ${i + 1} (${questionType})...`);
            
            let question;
            
            switch (questionType) {
                case 'multiple_choice':
                    question = this.createMultipleChoiceQuestion(sentence, keywords);
                    break;
                case 'true_false':
                    question = this.createTrueFalseQuestion(sentence);
                    break;
                case 'fill_blank':
                    question = this.createFillBlankQuestion(sentence, keywords);
                    break;
            }
            
            if (question) {
                quiz.push(question);
                console.log(`Pytanie ${i + 1} utworzone:`, question.question.substring(0, 100));
            }
        }
        
        const finalQuiz = quiz.slice(0, 10); // Return max 10 questions
        console.log(`Quiz wygenerowany: ${finalQuiz.length} pytań`);
        
        return finalQuiz;
    }
    
    createMultipleChoiceQuestion(sentence, keywords) {
        const words = sentence.split(' ').filter(w => w.length > 4 && w.length < 20);
        if (words.length < 5) return null;
        
        // Find important word (preferably a keyword)
        let targetWord = null;
        for (let word of words) {
            if (keywords.some(k => word.toLowerCase().includes(k.toLowerCase()))) {
                targetWord = word;
                break;
            }
        }
        
        // If no keyword found, use a random significant word
        if (!targetWord) {
            targetWord = words[Math.floor(Math.random() * Math.min(words.length, 10))];
        }
        
        const cleanTarget = targetWord.replace(/[^\w\sąęćłńóśźż]/g, '');
        const question = sentence.replace(new RegExp(targetWord, 'gi'), '____');
        
        // Create distractors
        const distractors = keywords
            .filter(k => k !== cleanTarget.toLowerCase())
            .slice(0, 3)
            .map(k => this.capitalizeFirst(k));
        
        // If not enough distractors, add some generic ones
        while (distractors.length < 3) {
            const genericOptions = ['brak danych', 'nie dotyczy', 'nieznane', 'inne'];
            distractors.push(genericOptions[distractors.length % genericOptions.length]);
        }
        
        const options = [cleanTarget, ...distractors].slice(0, 4);
        this.shuffleArray(options);
        
        return {
            question: `Uzupełnij zdanie: ${question}`,
            options: options,
            correct: options.indexOf(cleanTarget),
            type: 'multiple_choice',
            explanation: `Prawidłowa odpowiedź to "${cleanTarget}" zgodnie z treścią dokumentu.`
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
                explanation: 'To stwierdzenie jest prawdziwe według treści dokumentu.'
            };
        } else {
            // Modify sentence to make it false
            const modifiedSentence = this.modifySentenceToFalse(sentence);
            return {
                question: `Prawda czy fałsz: ${modifiedSentence}`,
                options: ['Prawda', 'Fałsz'],
                correct: 1,
                type: 'true_false',
                explanation: 'To stwierdzenie jest fałszywe - zostało zmodyfikowane w stosunku do treści dokumentu.'
            };
        }
    }
    
    createFillBlankQuestion(sentence, keywords) {
        const words = sentence.split(' ').filter(w => w.length > 4);
        const importantWords = words.filter(w => 
            keywords.some(k => w.toLowerCase().includes(k.toLowerCase()))
        );
        
        if (importantWords.length === 0) return null;
        
        const targetWord = importantWords[0].replace(/[^\w\sąęćłńóśźż]/g, '');
        const question = sentence.replace(new RegExp(importantWords[0], 'gi'), '____');
        
        return {
            question: `Uzupełnij: ${question}`,
            options: [targetWord, `nie ${targetWord}`, `${targetWord}em`, `bez ${targetWord}`],
            correct: 0,
            type: 'fill_blank',
            explanation: `Prawidłowa odpowiedź to "${targetWord}".`
        };
    }
    
    modifySentenceToFalse(sentence) {
        // Simple modifications to make sentence false
        const modifications = [
            s => s.replace(/jest/gi, 'nie jest'),
            s => s.replace(/ma\b/gi, 'nie ma'),
            s => s.replace(/można/gi, 'nie można'),
            s => s.replace(/(\d+)/g, (match) => {
                const num = parseInt(match);
                return isNaN(num) ? match : (num + 10).toString();
            })
        ];
        
        const modification = modifications[Math.floor(Math.random() * modifications.length)];
        const modified = modification(sentence);
        
        // If modification didn't work, try a simple negation
        if (modified === sentence) {
            return `Nieprawdą jest, że ${sentence.toLowerCase()}`;
        }
        
        return modified;
    }
    
    // UI Methods - WSZYSTKIE POZOSTAJĄ BEZ ZMIAN
    showLoading(message = 'Ładowanie...') {
        this.hideAllSections();
        document.getElementById('loadingSection').classList.remove('hidden');
        document.getElementById('loadingText').textContent = message;
        this.updateLoadingProgress(0, 'Rozpoczynam...');
    }
    
    hideLoading() {
        document.getElementById('loadingSection').classList.add('hidden');
    }
    
    updateLoadingProgress(percent, details) {
        const progressFill = document.getElementById('progressFill');
        const loadingDetails = document.getElementById('loadingDetails');
        
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
        
        if (loadingDetails && details) {
            loadingDetails.textContent = details;
        }
        
        console.log(`Postęp: ${percent}% - ${details}`);
    }
    
    showActivities() {
        this.hideAllSections();
        document.getElementById('activitiesSection').classList.remove('hidden');
        
        // Update document info
        document.getElementById('currentDocName').textContent = this.currentDocumentName || 'Nieznany dokument';
        document.getElementById('currentDocPages').textContent = 
            this.currentPdfDoc ? this.currentPdfDoc.numPages : '-';
            
        console.log('Wyświetlono sekcję aktywności');
    }
    
    showMindMap() {
        if (!this.mindMapData) {
            alert('Brak danych do wyświetlenia mapy myśli. Wgraj najpierw dokument PDF.');
            return;
        }
        
        this.hideAllSections();
        document.getElementById('mindmapSection').classList.remove('hidden');
        this.renderMindMap();
        this.checkBadgeRequirement('createMindMap');
        this.addPoints(25);
    }
    
    showSummary() {
        if (!this.summaryData) {
            alert('Brak danych do wyświetlenia streszczenia. Wgraj najpierw dokument PDF.');
            return;
        }
        
        this.hideAllSections();
        document.getElementById('summarySection').classList.remove('hidden');
        this.renderSummary();
        this.addPoints(15);
    }
    
    showQuiz() {
        if (!this.quizData || this.quizData.length === 0) {
            alert('Brak pytań do wyświetlenia quizu. Wgraj najpierw dokument PDF.');
            return;
        }
        
        this.hideAllSections();
        document.getElementById('quizSection').classList.remove('hidden');
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
        if (!canvas || !this.mindMapData) {
            console.error('Brak canvas lub danych do mapy myśli');
            return;
        }
        
        console.log('Renderowanie mapy myśli:', this.mindMapData);
        
        canvas.innerHTML = ''; // Clear previous content
        
        // Create central node
        const centralNode = document.createElement('div');
        centralNode.className = 'mind-node central-node';
        centralNode.textContent = this.mindMapData.central;
        centralNode.style.left = '50%';
        centralNode.style.top = '50%';
        centralNode.style.transform = 'translate(-50%, -50%)';
        canvas.appendChild(centralNode);
        
        // Create branch nodes
        this.mindMapData.branches.forEach((branch, index) => {
            const angle = (index * 360) / this.mindMapData.branches.length;
            const radius = 200;
            
            const x = 50 + radius * Math.cos(angle * Math.PI / 180) / 10;
            const y = 50 + radius * Math.sin(angle * Math.PI / 180) / 10;
            
            // Main branch node
            const branchNode = document.createElement('div');
            branchNode.className = 'mind-node branch-node';
            branchNode.textContent = branch.topic;
            branchNode.style.left = `${x}%`;
            branchNode.style.top = `${y}%`;
            branchNode.style.transform = 'translate(-50%, -50%)';
            canvas.appendChild(branchNode);
            
            // Connection line
            const line = document.createElement('div');
            line.className = 'mind-connection';
            const lineLength = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
            const lineAngle = Math.atan2(y - 50, x - 50) * 180 / Math.PI;
            
            line.style.width = `${lineLength}%`;
            line.style.left = '50%';
            line.style.top = '50%';
            line.style.transform = `rotate(${lineAngle}deg)`;
            line.style.transformOrigin = '0 50%';
            canvas.appendChild(line);
            
            // Add click event for subtopics
            branchNode.addEventListener('click', () => {
                this.showSubtopics(branchNode, branch.subtopics);
            });
        });
        
        console.log('Mapa myśli wyrenderowana');
    }
    
    showSubtopics(parentNode, subtopics) {
        // Remove existing subtopics
        document.querySelectorAll('.subtopic-node').forEach(node => node.remove());
        
        subtopics.forEach((subtopic, index) => {
            const subtopicNode = document.createElement('div');
            subtopicNode.className = 'mind-node subtopic-node';
            subtopicNode.textContent = subtopic;
            
            // Position around parent
            const angle = (index * 360) / subtopics.length;
            const offsetX = 80 * Math.cos(angle * Math.PI / 180);
            const offsetY = 80 * Math.sin(angle * Math.PI / 180);
            
            const parentRect = parentNode.getBoundingClientRect();
            const canvasRect = document.getElementById('mindmapCanvas').getBoundingClientRect();
            
            const x = ((parentRect.left - canvasRect.left + offsetX) / canvasRect.width) * 100;
            const y = ((parentRect.top - canvasRect.top + offsetY) / canvasRect.height) * 100;
            
            subtopicNode.style.left = `${x}%`;
            subtopicNode.style.top = `${y}%`;
            subtopicNode.style.transform = 'translate(-50%, -50%)';
            
            document.getElementById('mindmapCanvas').appendChild(subtopicNode);
        });
    }
    
    renderSummary() {
        const summaryContent = document.getElementById('summaryContent');
        if (!summaryContent || !this.summaryData) {
            console.error('Brak kontenera lub danych do streszczenia');
            return;
        }
        
        const length = document.getElementById('summaryLength').value || 'medium';
        const summary = this.summaryData[length] || this.summaryData.medium || 'Brak streszczenia';
        
        summaryContent.innerHTML = `<div class="summary-text">${summary}</div>`;
        
        console.log('Streszczenie wyrenderowane:', length);
    }
    
    updateSummary() {
        this.renderSummary();
    }
    
    startQuiz() {
        this.currentQuizIndex = 0;
        this.quizAnswers = [];
        this.selectedQuizOption = null;
        this.renderQuizQuestion();
        
        console.log('Quiz rozpoczęty, liczba pytań:', this.quizData.length);
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
        document.getElementById('quizProgress').style.width = `${progress}%`;
        document.getElementById('currentQuestion').textContent = this.currentQuizIndex + 1;
        document.getElementById('totalQuestions').textContent = this.quizData.length;
        
        quizContent.innerHTML = `
            <div class="question">
                <h3>${question.question}</h3>
                <div class="options">
                    ${question.options.map((option, index) => `
                        <div class="option" onclick="app.selectOption(${index})">
                            <input type="radio" name="answer" id="option${index}" value="${index}">
                            <label for="option${index}">${option}</label>
                        </div>
                    `).join('')}
                </div>
                <div class="quiz-actions">
                    <button class="btn btn--primary" onclick="app.submitAnswer()" disabled id="submitBtn">
                        Potwierdź odpowiedź
                    </button>
                </div>
            </div>
        `;
        
        this.selectedQuizOption = null;
        
        console.log(`Pytanie ${this.currentQuizIndex + 1} wyrenderowane`);
    }
    
    selectOption(optionIndex) {
        // Remove previous selection
        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        
        // Select current option
        const selectedOption = document.querySelectorAll('.option')[optionIndex];
        if (selectedOption) {
            selectedOption.classList.add('selected');
            document.getElementById(`option${optionIndex}`).checked = true;
        }
        
        this.selectedQuizOption = optionIndex;
        document.getElementById('submitBtn').disabled = false;
        
        console.log('Opcja wybrana:', optionIndex);
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
        
        // Show feedback
        this.showAnswerFeedback(isCorrect, question.explanation);
        
        console.log('Odpowiedź przesłana:', isCorrect ? 'poprawna' : 'niepoprawna');
        
        // Move to next question after delay
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
            <div class="feedback-explanation">
                ${explanation}
            </div>
        `;
        
        quizContent.appendChild(feedbackElement);
    }
    
    showQuizResults() {
        this.hideAllSections();
        document.getElementById('quizResultsSection').classList.remove('hidden');
        
        const correctAnswers = this.quizAnswers.filter(a => a.isCorrect).length;
        const totalQuestions = this.quizAnswers.length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        // Update results display
        document.getElementById('finalScore').textContent = percentage;
        document.getElementById('correctAnswers').textContent = correctAnswers;
        document.getElementById('wrongAnswers').textContent = totalQuestions - correctAnswers;
        document.getElementById('predictedGrade').textContent = this.getGradeFromPercentage(percentage);
        
        // Show improvement areas
        this.showImprovementAreas();
        
        // Award points and check badges
        this.addPoints(correctAnswers * 3);
        this.userProgress.completedQuizzes++;
        
        if (percentage >= 80) this.checkBadgeRequirement('score80');
        if (percentage === 100) this.checkBadgeRequirement('perfectScore');
        
        this.saveProgress();
        
        console.log(`Quiz zakończony: ${percentage}% (${correctAnswers}/${totalQuestions})`);
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
        
        if (incorrectAnswers.length === 0) {
            improvementList.innerHTML = '<p class="no-improvements">🎉 Doskonały wynik! Nie ma obszarów do poprawy.</p>';
            return;
        }
        
        const areas = incorrectAnswers.map((answer, index) => `
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
    
    // Utility methods
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
    
    // Progress and gamification
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
            this.showAchievement('🆙 Nowy poziom!', `Awansowałeś na poziom: ${newLevel}`, '🎖️');
        }
    }
    
    checkBadgeRequirement(requirement) {
        const badge = this.badges.find(b => 
            b.requirement === requirement && 
            !this.userProgress.badges.includes(b.name)
        );
        
        if (badge) {
            this.userProgress.badges.push(badge.name);
            this.showAchievement(badge.name, badge.description, badge.icon);
        }
    }
    
    showAchievement(title, description, icon) {
        const popup = document.getElementById('achievementPopup');
        if (!popup) return;
        
        document.getElementById('achievementTitle').textContent = title;
        document.getElementById('achievementDescription').textContent = description;
        document.getElementById('achievementIcon').textContent = icon;
        
        popup.classList.remove('hidden');
        
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 4000);
    }
    
    updateProgressDisplay() {
        const levelElement = document.getElementById('userLevel');
        const pointsElement = document.getElementById('userPoints');
        
        if (levelElement) levelElement.textContent = this.userProgress.level;
        if (pointsElement) pointsElement.textContent = this.userProgress.points;
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
            console.warn('Błąd odczytu recent documents:', e);
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
    
    // Storage methods
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
            console.warn('Nie można wczytać postępu:', e);
            return null;
        }
    }
    
    // Export functions
    exportMindMap() {
        if (!this.mindMapData) {
            alert('Brak danych do eksportu');
            return;
        }
        
        const dataStr = JSON.stringify(this.mindMapData, null, 2);
        this.downloadFile(dataStr, `mapa-mysli-${Date.now()}.json`, 'application/json');
    }
    
    exportSummary() {
        if (!this.summaryData) {
            alert('Brak danych do eksportu');
            return;
        }
        
        const length = document.getElementById('summaryLength').value || 'medium';
        const summary = this.summaryData[length];
        
        this.downloadFile(summary, `streszczenie-${Date.now()}.txt`, 'text/plain;charset=utf-8');
    }
    
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], {type: mimeType});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    handleUrlSubmit() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();
        
        if (!url) {
            alert('Proszę podać URL');
            return;
        }
        
        alert('Funkcja wczytywania z URL zostanie wkrótce dodana. Na razie obsługiwane są tylko pliki PDF.');
        urlInput.value = '';
    }
    
    // Mind map controls
    zoomIn() {
        const canvas = document.getElementById('mindmapCanvas');
        if (!canvas) return;
        
        const currentTransform = canvas.style.transform;
        const currentScale = currentTransform.match(/scale\(([\d.]+)\)/);
        const scale = currentScale ? parseFloat(currentScale[1]) : 1;
        const newScale = Math.min(scale * 1.2, 3);
        
        canvas.style.transform = `scale(${newScale})`;
    }
    
    zoomOut() {
        const canvas = document.getElementById('mindmapCanvas');
        if (!canvas) return;
        
        const currentTransform = canvas.style.transform;
        const currentScale = currentTransform.match(/scale\(([\d.]+)\)/);
        const scale = currentScale ? parseFloat(currentScale[1]) : 1;
        const newScale = Math.max(scale / 1.2, 0.5);
        
        canvas.style.transform = `scale(${newScale})`;
    }
    
    resetZoom() {
        const canvas = document.getElementById('mindmapCanvas');
        if (canvas) {
            canvas.style.transform = 'scale(1)';
        }
    }
}

// KLUCZOWE: Inicjalizacja aplikacji po załadowaniu DOM
console.log('Skrypt app.js załadowany');

// Sprawdź czy DOM jest gotowy
if (document.readyState === 'loading') {
    console.log('DOM się ładuje, oczekiwanie na DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    console.log('DOM już załadowany, inicjalizacja natychmiast');
    initializeApp();
}

function initializeApp() {
    console.log('=== INICJALIZACJA APLIKACJI ===');
    
    try {
        // Sprawdź czy PDF.js jest dostępny
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js nie jest załadowany!');
            alert('Błąd: PDF.js nie został załadowany. Sprawdź połączenie z internetem i odśwież stronę.');
            return;
        }
        
        console.log('PDF.js dostępny:', typeof pdfjsLib);
        
        // Sprawdź czy wszystkie wymagane elementy DOM istnieją
        const requiredElements = ['fileInput', 'uploadArea', 'uploadSection'];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Brak wymaganych elementów DOM:', missingElements);
            alert('Błąd: Nie wszystkie elementy interfejsu zostały załadowane. Odśwież stronę.');
            return;
        }
        
        console.log('Wszystkie wymagane elementy DOM są dostępne');
        
        // Utwórz i zainicjalizuj aplikację
        window.app = new EduLearnApp();
        window.app.init();
        
        console.log('=== APLIKACJA ZAINICJALIZOWANA POMYŚLNIE ===');
        
    } catch (error) {
        console.error('=== BŁĄD INICJALIZACJI APLIKACJI ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        alert(`Błąd inicjalizacji aplikacji: ${error.message}`);
    }
}