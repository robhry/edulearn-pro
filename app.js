// EduLearn Pro - Live Application
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
        
        // Generated content from real PDFs
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
        
        this.init();
    }
    
    init() {
        // Configure PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update UI with current progress
        this.updateProgressDisplay();
    }
    
    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
        }
        
        // Drag and drop
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            this.handleFileUpload(files[0]);
        } else {
            alert('Proszę upuścić prawidłowy plik PDF');
        }
    }
    
    async handleFileUpload(file) {
        try {
            this.currentDocumentName = file.name;
            this.showLoading('Przetwarzanie dokumentu PDF...');
            
            console.log('Rozpoczynam przetwarzanie pliku:', file.name);
            
            // Read file as ArrayBuffer
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            console.log('Plik przeczytany, rozmiar:', arrayBuffer.byteLength, 'bajtów');
            
            // Load PDF document
            const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer));
            this.currentPdfDoc = await loadingTask.promise;
            
            console.log('PDF załadowany, liczba stron:', this.currentPdfDoc.numPages);
            
            // Extract text from all pages
            this.updateLoadingProgress(30, 'Ekstraktowanie tekstu...');
            this.extractedText = await this.extractAllText(this.currentPdfDoc);
            
            console.log('Tekst wyekstraktowany, długość:', this.extractedText.length, 'znaków');
            console.log('Początek tekstu:', this.extractedText.substring(0, 200) + '...');
            
            if (this.extractedText.trim().length === 0) {
                throw new Error('Nie udało się wyekstraktować tekstu z PDF. Plik może być zeskanowany lub zabezpieczony.');
            }
            
            // Generate mind map data
            this.updateLoadingProgress(60, 'Generowanie mapy myśli...');
            this.mindMapData = this.generateMindMapFromText(this.extractedText);
            
            // Generate summary data
            this.updateLoadingProgress(80, 'Tworzenie streszczenia...');
            this.summaryData = this.generateSummaryFromText(this.extractedText);
            
            // Generate quiz questions
            this.updateLoadingProgress(90, 'Przygotowywanie quizu...');
            this.quizData = this.generateQuizFromText(this.extractedText);
            
            // Award badge for first PDF upload
            this.checkBadgeRequirement('uploadPdf');
            
            // Update progress
            this.userProgress.documentsProcessed++;
            this.addPoints(10);
            this.saveProgress();
            
            // Save to recent documents
            this.addToRecentDocuments(file.name, this.currentPdfDoc.numPages);
            
            this.updateLoadingProgress(100, 'Gotowe!');
            
            setTimeout(() => {
                this.hideLoading();
                this.showActivities();
            }, 1000);
            
        } catch (error) {
            console.error('Błąd przetwarzania PDF:', error);
            this.hideLoading();
            alert(`Nie udało się przetworzyć pliku PDF:\n${error.message}\n\nSprawdź czy:\n- Plik jest prawidłowym PDF\n- PDF nie jest zabezpieczony hasłem\n- Plik zawiera tekst (nie tylko obrazy)`);
        }
    }
    
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
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
                
                // Update progress
                const progress = Math.round((pageNum / numPages) * 30) + 30; // 30-60% for text extraction
                this.updateLoadingProgress(progress, `Przetwarzanie strony ${pageNum}/${numPages}...`);
                
            } catch (pageError) {
                console.warn(`Błąd przetwarzania strony ${pageNum}:`, pageError);
            }
        }
        
        return fullText.trim();
    }
    
    generateMindMapFromText(text) {
        const keywords = this.extractKeywords(text);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        
        // Find main topic (most frequent significant word)
        const mainTopic = keywords[0] || "Główny temat";
        
        // Create branches for top keywords
        const branches = keywords.slice(1, 6).map(keyword => {
            const relatedSentences = this.findRelatedSentences(keyword, sentences);
            return {
                topic: this.capitalizeFirst(keyword),
                subtopics: relatedSentences.slice(0, 4).map(s => this.extractKeyPhrase(s))
            };
        });
        
        return {
            central: this.capitalizeFirst(mainTopic),
            branches: branches
        };
    }
    
    extractKeywords(text) {
        // Polish stop words
        const stopWords = [
            'i', 'a', 'w', 'na', 'do', 'z', 'ze', 'się', 'że', 'przez', 'dla', 'od', 'o', 'po', 'przy',
            'bardzo', 'tylko', 'oraz', 'także', 'również', 'jest', 'są', 'będzie', 'może', 'można',
            'tym', 'tej', 'ten', 'ta', 'to', 'te', 'ich', 'jego', 'jej', 'jego', 'jako', 'oraz'
        ];
        
        const words = text.toLowerCase()
            .replace(/[^\w\sąęćłńóśźż]/g, ' ')
            .split(/\s+/)
            .filter(word => 
                word.length > 3 && 
                !stopWords.includes(word) &&
                !/^\d+$/.test(word)
            );
        
        // Count word frequency
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        // Return most frequent words
        return Object.keys(wordCount)
            .sort((a, b) => wordCount[b] - wordCount[a])
            .slice(0, 10);
    }
    
    findRelatedSentences(keyword, sentences) {
        return sentences
            .filter(sentence => sentence.toLowerCase().includes(keyword.toLowerCase()))
            .slice(0, 5);
    }
    
    extractKeyPhrase(sentence) {
        const words = sentence.trim().split(' ');
        if (words.length <= 6) return sentence.trim();
        
        // Try to find a meaningful phrase
        const phrases = [];
        for (let i = 0; i < words.length - 2; i++) {
            phrases.push(words.slice(i, i + 3).join(' '));
        }
        
        return phrases[0] || words.slice(0, 4).join(' ') + '...';
    }
    
    generateSummaryFromText(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        
        return {
            short: this.createSummary(sentences, 3, 'short'),
            medium: this.createSummary(sentences, 6, 'medium'),
            long: this.createSummary(sentences, 10, 'long')
        };
    }
    
    createSummary(sentences, maxSentences, type) {
        // Score sentences based on keyword frequency and position
        const scoredSentences = sentences.map((sentence, index) => {
            let score = 0;
            
            // Position score (earlier sentences are more important)
            score += (sentences.length - index) / sentences.length * 0.3;
            
            // Length score (not too short, not too long)
            const wordCount = sentence.split(' ').length;
            if (wordCount >= 10 && wordCount <= 30) score += 0.3;
            
            // Keyword density score
            const keywords = this.extractKeywords(sentence);
            score += keywords.length * 0.1;
            
            return { sentence: sentence.trim(), score };
        });
        
        // Select top sentences
        const topSentences = scoredSentences
            .sort((a, b) => b.score - a.score)
            .slice(0, maxSentences)
            .map(item => item.sentence);
        
        return topSentences.join('. ') + '.';
    }
    
    generateQuizFromText(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const keywords = this.extractKeywords(text);
        const quiz = [];
        
        // Generate different types of questions
        const questionTypes = ['multiple_choice', 'true_false', 'fill_blank'];
        
        for (let i = 0; i < Math.min(12, sentences.length / 5); i++) {
            const questionType = questionTypes[i % questionTypes.length];
            const sentence = sentences[i * 3] || sentences[i];
            
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
            }
        }
        
        return quiz.slice(0, 10); // Return max 10 questions
    }
    
    createMultipleChoiceQuestion(sentence, keywords) {
        const words = sentence.split(' ').filter(w => w.length > 4);
        if (words.length < 5) return null;
        
        const targetWord = words[Math.floor(Math.random() * words.length)];
        const question = sentence.replace(targetWord, '____');
        
        // Create distractors
        const distractors = keywords
            .filter(k => k !== targetWord.toLowerCase())
            .slice(0, 3)
            .map(k => this.capitalizeFirst(k));
        
        const options = [targetWord, ...distractors].slice(0, 4);
        this.shuffleArray(options);
        
        return {
            question: `Uzupełnij zdanie: ${question}`,
            options: options,
            correct: options.indexOf(targetWord),
            type: 'multiple_choice',
            explanation: `Prawidłowa odpowiedź to "${targetWord}" zgodnie z treścią dokumentu.`
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
        const words = sentence.split(' ');
        const importantWords = words.filter(w => 
            w.length > 4 && 
            keywords.some(k => w.toLowerCase().includes(k))
        );
        
        if (importantWords.length === 0) return null;
        
        const targetWord = importantWords[0];
        const question = sentence.replace(targetWord, '____');
        
        return {
            question: `Uzupełnij: ${question}`,
            options: [targetWord, `Nie ${targetWord}`, `${targetWord}y`, `Bez ${targetWord}`],
            correct: 0,
            type: 'fill_blank',
            explanation: `Prawidłowa odpowiedź to "${targetWord}".`
        };
    }
    
    modifySentenceToFalse(sentence) {
        // Simple modifications to make sentence false
        const modifications = [
            s => s.replace(/jest/g, 'nie jest'),
            s => s.replace(/ma/g, 'nie ma'),
            s => s.replace(/można/g, 'nie można'),
            s => s.replace(/(\d+)/g, (match) => (parseInt(match) + 10).toString())
        ];
        
        const modification = modifications[Math.floor(Math.random() * modifications.length)];
        return modification(sentence);
    }
    
    // UI Methods
    showLoading(message = 'Ładowanie...') {
        document.getElementById('uploadSection').classList.add('hidden');
        document.getElementById('activitiesSection').classList.add('hidden');
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
            progressFill.style.width = `${percent}%`;
        }
        
        if (loadingDetails && details) {
            loadingDetails.textContent = details;
        }
    }
    
    showActivities() {
        this.hideAllSections();
        document.getElementById('activitiesSection').classList.remove('hidden');
        
        // Update document info
        document.getElementById('currentDocName').textContent = this.currentDocumentName;
        document.getElementById('currentDocPages').textContent = 
            this.currentPdfDoc ? this.currentPdfDoc.numPages : '-';
    }
    
    showMindMap() {
        this.hideAllSections();
        document.getElementById('mindmapSection').classList.remove('hidden');
        this.renderMindMap();
        this.checkBadgeRequirement('createMindMap');
        this.addPoints(25);
    }
    
    showSummary() {
        this.hideAllSections();
        document.getElementById('summarySection').classList.remove('hidden');
        this.renderSummary();
        this.addPoints(15);
    }
    
    showQuiz() {
        this.hideAllSections();
        document.getElementById('quizSection').classList.remove('hidden');
        this.startQuiz();
        this.addPoints(5); // Small points for starting
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
        if (!summaryContent || !this.summaryData) return;
        
        const length = document.getElementById('summaryLength').value;
        const summary = this.summaryData[length] || this.summaryData.medium;
        
        summaryContent.innerHTML = `<div class="summary-text">${summary}</div>`;
    }
    
    updateSummary() {
        this.renderSummary();
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
    }
    
    selectOption(optionIndex) {
        // Remove previous selection
        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        
        // Select current option
        document.querySelectorAll('.option')[optionIndex].classList.add('selected');
        document.getElementById(`option${optionIndex}`).checked = true;
        
        this.selectedQuizOption = optionIndex;
        document.getElementById('submitBtn').disabled = false;
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
        
        quizContent.innerHTML += `
            <div class="answer-feedback ${feedbackClass}">
                <div class="feedback-header">
                    <span class="feedback-icon">${feedbackIcon}</span>
                    <span class="feedback-text">${feedbackText}</span>
                </div>
                <div class="feedback-explanation">
                    ${explanation}
                </div>
            </div>
        `;
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
        this.addPoints(correctAnswers * 3); // 3 points per correct answer
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
        document.getElementById('achievementTitle').textContent = title;
        document.getElementById('achievementDescription').textContent = description;
        document.getElementById('achievementIcon').textContent = icon;
        
        popup.classList.remove('hidden');
        
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 4000);
    }
    
    updateProgressDisplay() {
        document.getElementById('userLevel').textContent = this.userProgress.level;
        document.getElementById('userPoints').textContent = this.userProgress.points;
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
        localStorage.setItem('edulearn_recent_docs', JSON.stringify(recentDocs.slice(0, 5))); // Keep only 5 recent
        this.updateRecentDocsDisplay();
    }
    
    getRecentDocuments() {
        const stored = localStorage.getItem('edulearn_recent_docs');
        return stored ? JSON.parse(stored) : [];
    }
    
    updateRecentDocsDisplay() {
        const recentDocs = this.getRecentDocuments();
        const container = document.getElementById('recentDocsList');
        
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
        localStorage.setItem('edulearn_progress', JSON.stringify(this.userProgress));
    }
    
    loadProgress() {
        const stored = localStorage.getItem('edulearn_progress');
        return stored ? JSON.parse(stored) : null;
    }
    
    // Export functions
    exportMindMap() {
        if (!this.mindMapData) return;
        
        const dataStr = JSON.stringify(this.mindMapData, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `mapa-mysli-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    exportSummary() {
        if (!this.summaryData) return;
        
        const length = document.getElementById('summaryLength').value;
        const summary = this.summaryData[length];
        
        const blob = new Blob([summary], {type: 'text/plain;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `streszczenie-${Date.now()}.txt`;
        a.click();
        
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
        const currentScale = parseFloat(canvas.style.transform.replace(/[^0-9.]/g, '')) || 1;
        const newScale = Math.min(currentScale * 1.2, 3);
        canvas.style.transform = `scale(${newScale})`;
    }
    
    zoomOut() {
        const canvas = document.getElementById('mindmapCanvas');
        const currentScale = parseFloat(canvas.style.transform.replace(/[^0-9.]/g, '')) || 1;
        const newScale = Math.max(currentScale / 1.2, 0.5);
        canvas.style.transform = `scale(${newScale})`;
    }
    
    resetZoom() {
        const canvas = document.getElementById('mindmapCanvas');
        canvas.style.transform = 'scale(1)';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EduLearnApp();
});