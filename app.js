// EduLearn Pro Application
class EduLearnApp {
    constructor() {
        this.currentSection = 'upload';
        this.currentQuizIndex = 0;
        this.quizAnswers = [];
        this.selectedQuizOption = null; // Track selected option properly
        this.userProgress = {
            points: 0,
            level: 'Początkujący',
            badges: [],
            documentsProcessed: 0
        };
        
        // Sample data from application_data_json
        this.sampleContent = "Anatomia człowieka to nauka zajmująca się badaniem budowy ciała ludzkiego. System kostny składa się z 206 kości u dorosłego człowieka. Żebra to kości płaskie, które chronią narządy klatki piersiowej. Wyróżniamy 12 par żeber: 7 par żeber prawdziwych połączonych bezpośrednio z mostkiem, 3 pary żeber fałszywych połączonych pośrednio z mostkiem oraz 2 pary żeber wolnych. Kręgosłup składa się z 33-34 kręgów podzielonych na odcinki: szyjny (7 kręgów), piersiowy (12 kręgów), lędźwiowy (5 kręgów), krzyżowy (5 kręgów zrośniętych) i guziczny (4-5 kręgów). Ruchy kręgosłupa to zgięcie, prostowanie, skłony boczne i rotacja.";
        
        this.mindMapData = {
            central: "Anatomia człowieka",
            branches: [
                {
                    topic: "System kostny",
                    subtopics: ["206 kości u dorosłego", "Funkcje ochronne", "Funkcje podporowe"]
                },
                {
                    topic: "Żebra",
                    subtopics: ["12 par żeber", "7 par prawdziwych", "3 pary fałszywych", "2 pary wolnych", "Ochrona narządów"]
                },
                {
                    topic: "Kręgosłup", 
                    subtopics: ["33-34 kręgi", "Odcinek szyjny (7)", "Odcinek piersiowy (12)", "Odcinek lędźwiowy (5)", "Odcinek krzyżowy (5)", "Odcinek guziczny (4-5)"]
                },
                {
                    topic: "Ruchy kręgosłupa",
                    subtopics: ["Zgięcie", "Prostowanie", "Skłony boczne", "Rotacja"]
                }
            ]
        };
        
        this.quizData = [
            {
                question: "Ile par żeber ma dorosły człowiek?",
                options: ["10 par", "11 par", "12 par", "13 par"],
                correct: 2,
                explanation: "Dorosły człowiek ma 12 par żeber chroniących narządy klatki piersiowej."
            },
            {
                question: "Które żebra nazywane są prawdziwymi?",
                options: ["Pierwsze 5 par", "Pierwsze 7 par", "Pierwsze 9 par", "Wszystkie żebra"],
                correct: 1,
                explanation: "Pierwsze 7 par żeber to żebra prawdziwe, połączone bezpośrednio z mostkiem."
            },
            {
                question: "Ile kręgów ma odcinek lędźwiowy kręgosłupa?",
                options: ["3 kręgi", "5 kręgów", "7 kręgów", "12 kręgów"],
                correct: 1,
                explanation: "Odcinek lędźwiowy kręgosłupa składa się z 5 kręgów."
            },
            {
                question: "Prawda czy fałsz: Kręgosłup może wykonywać ruchy rotacyjne.",
                options: ["Prawda", "Fałsz"],
                correct: 0,
                explanation: "Prawda. Kręgosłup może wykonywać ruchy rotacyjne oprócz zgięcia, prostowania i skłonów bocznych."
            }
        ];
        
        this.badges = [
            {name: "PDF Master", description: "Przetworzyłeś pierwszy dokument PDF", icon: "📄", earned: false},
            {name: "Mind Map Creator", description: "Stworzyłeś pierwszą mapę myśli", icon: "🧠", earned: false},
            {name: "Quiz Champion", description: "Uzyskałeś wynik powyżej 80%", icon: "🏆", earned: false},
            {name: "Streaker", description: "Uczyłeś się przez 7 dni z rzędu", icon: "🔥", earned: false},
            {name: "Perfectionist", description: "Uzyskałeś 100% w quizie", icon: "⭐", earned: false}
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUserStats();
        this.renderBadges();
        this.showSection('upload');
    }

    setupEventListeners() {
        // Upload functionality - Fix file input to properly trigger
        const fileInputBtn = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const addLinkBtn = document.getElementById('addLinkBtn');

        fileInputBtn?.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Fix upload area click to properly trigger file input
        uploadArea?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInputBtn?.click();
        });
        
        uploadArea?.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea?.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea?.addEventListener('drop', (e) => this.handleFileDrop(e));
        addLinkBtn?.addEventListener('click', () => this.handleLinkAdd());

        // Activity selection
        document.querySelectorAll('.activity-card').forEach(card => {
            card.addEventListener('click', () => {
                const activity = card.dataset.activity;
                this.startActivity(activity);
            });
        });

        // Navigation
        document.getElementById('backFromMindmap')?.addEventListener('click', () => this.showSection('activity'));
        document.getElementById('backFromSummary')?.addEventListener('click', () => this.showSection('activity'));
        document.getElementById('backFromQuiz')?.addEventListener('click', () => this.showSection('activity'));
        document.getElementById('backFromResults')?.addEventListener('click', () => this.showSection('activity'));

        // Quiz functionality
        document.getElementById('submitAnswer')?.addEventListener('click', () => this.submitQuizAnswer());
        document.getElementById('nextQuestion')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('retakeQuiz')?.addEventListener('click', () => this.retakeQuiz());
        document.getElementById('tryOtherActivity')?.addEventListener('click', () => this.showSection('activity'));

        // Summary controls
        document.getElementById('summaryLength')?.addEventListener('change', (e) => this.updateSummary(e.target.value));

        // Export functionality
        document.getElementById('exportMindmap')?.addEventListener('click', () => this.exportMindMap());
        document.getElementById('exportSummary')?.addEventListener('click', () => this.exportSummary());

        // Modal
        document.getElementById('closeModal')?.addEventListener('click', () => this.hideModal());
        document.getElementById('modalOkBtn')?.addEventListener('click', () => this.hideModal());
        
        // Modal backdrop click to close
        document.querySelector('.modal-backdrop')?.addEventListener('click', () => this.hideModal());
    }

    // File handling
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            this.processDocument(file.name, 'pdf');
        } else if (file) {
            this.showModal('Błąd', 'Proszę wybrać plik PDF.');
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(event) {
        event.currentTarget.classList.remove('drag-over');
    }

    handleFileDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                this.processDocument(file.name, 'pdf');
            } else {
                this.showModal('Błąd', 'Proszę upuścić plik PDF.');
            }
        }
    }

    handleLinkAdd() {
        const linkInput = document.getElementById('linkInput');
        const url = linkInput?.value.trim();
        
        if (url && this.isValidUrl(url)) {
            this.processDocument(url, 'link');
            linkInput.value = '';
        } else {
            this.showModal('Błąd', 'Proszę wprowadzić prawidłowy adres URL.');
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Document processing
    processDocument(source, type) {
        this.showSection('processing');
        this.simulateProcessing().then(() => {
            this.awardPoints(10);
            this.checkBadge('PDF Master');
            this.userProgress.documentsProcessed++;
            this.showSection('activity');
        });
    }

    simulateProcessing() {
        return new Promise((resolve) => {
            const progressFill = document.getElementById('progressFill');
            let progress = 0;
            
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setTimeout(resolve, 500);
                }
                
                if (progressFill) {
                    progressFill.style.width = `${progress}%`;
                }
            }, 200);
        });
    }

    // Section navigation
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('fade-in');
        }

        // Show/hide additional sections based on current section
        if (sectionName === 'upload') {
            document.getElementById('recentSection')?.classList.remove('hidden');
            document.querySelector('.achievements-section')?.classList.remove('hidden');
        }

        this.currentSection = sectionName;
    }

    // Activity management
    startActivity(activityType) {
        switch (activityType) {
            case 'mindmap':
                this.generateMindMap();
                break;
            case 'summary':
                this.generateSummary();
                break;
            case 'quiz':
                this.startQuiz();
                break;
        }
    }

    // Mind Map functionality
    generateMindMap() {
        this.showSection('mindmap');
        this.renderMindMap();
        this.awardPoints(25);
        this.checkBadge('Mind Map Creator');
    }

    renderMindMap() {
        const canvas = document.getElementById('mindmapCanvas');
        if (!canvas) return;

        canvas.innerHTML = '';
        
        const containerRect = canvas.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;

        // Create central node
        const centralNode = this.createMindMapNode(
            this.mindMapData.central, 
            centerX - 100, 
            centerY - 25, 
            'central'
        );
        canvas.appendChild(centralNode);

        // Create branch nodes
        const angleStep = (2 * Math.PI) / this.mindMapData.branches.length;
        const branchRadius = 120;

        this.mindMapData.branches.forEach((branch, index) => {
            const angle = index * angleStep;
            const branchX = centerX + Math.cos(angle) * branchRadius - 75;
            const branchY = centerY + Math.sin(angle) * branchRadius - 20;

            // Create line to branch
            const line = this.createMindMapLine(centerX, centerY, branchX + 75, branchY + 20);
            canvas.appendChild(line);

            // Create branch node
            const branchNode = this.createMindMapNode(branch.topic, branchX, branchY, 'branch');
            canvas.appendChild(branchNode);

            // Create subtopic nodes
            const subtopicRadius = 80;
            const subtopicAngleStep = Math.PI / Math.max(branch.subtopics.length - 1, 1);
            const startAngle = angle - Math.PI / 4;

            branch.subtopics.forEach((subtopic, subtopicIndex) => {
                const subtopicAngle = startAngle + subtopicIndex * subtopicAngleStep;
                const subtopicX = branchX + 75 + Math.cos(subtopicAngle) * subtopicRadius - 60;
                const subtopicY = branchY + 20 + Math.sin(subtopicAngle) * subtopicRadius - 15;

                // Create line to subtopic
                const subtopicLine = this.createMindMapLine(branchX + 75, branchY + 20, subtopicX + 60, subtopicY + 15);
                canvas.appendChild(subtopicLine);

                // Create subtopic node
                const subtopicNode = this.createMindMapNode(subtopic, subtopicX, subtopicY, 'subtopic');
                canvas.appendChild(subtopicNode);
            });
        });
    }

    createMindMapNode(text, x, y, type) {
        const node = document.createElement('div');
        node.className = `mindmap-node ${type}`;
        node.textContent = text;
        node.style.left = `${Math.max(0, Math.min(x, 400))}px`;
        node.style.top = `${Math.max(0, Math.min(y, 400))}px`;
        
        // Add touch and click events
        node.addEventListener('click', () => {
            node.style.transform = 'scale(1.1)';
            setTimeout(() => {
                node.style.transform = 'scale(1)';
            }, 200);
        });

        return node;
    }

    createMindMapLine(x1, y1, x2, y2) {
        const line = document.createElement('div');
        line.className = 'mindmap-line';
        
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        line.style.width = `${length}px`;
        line.style.height = '2px';
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.transform = `rotate(${angle}deg)`;
        
        return line;
    }

    exportMindMap() {
        this.showModal('Export', 'Mapa myśli została wyeksportowana jako obraz PNG.');
    }

    // Summary functionality
    generateSummary() {
        this.showSection('summary');
        this.updateSummary('medium');
        this.awardPoints(15);
    }

    updateSummary(length) {
        const summaryContent = document.getElementById('summaryContent');
        if (!summaryContent) return;

        let content = '';
        
        switch (length) {
            case 'short':
                content = `
                    <h3>Krótkie streszczenie</h3>
                    <ul>
                        <li>Dorosły człowiek ma <span class="key-concept">206 kości</span></li>
                        <li><span class="key-concept">12 par żeber</span> chroni klatkę piersiową</li>
                        <li>Kręgosłup składa się z <span class="key-concept">33-34 kręgów</span></li>
                    </ul>
                `;
                break;
            case 'medium':
                content = `
                    <h3>Średnie streszczenie</h3>
                    <p>Anatomia człowieka obejmuje badanie budowy ciała ludzkiego, ze szczególnym uwzględnieniem systemu kostnego.</p>
                    
                    <h3>System kostny</h3>
                    <ul>
                        <li>Składa się z <span class="key-concept">206 kości</span> u dorosłego człowieka</li>
                        <li>Pełni funkcje ochronne i podporowe</li>
                    </ul>

                    <h3>Żebra</h3>
                    <ul>
                        <li><span class="key-concept">12 par żeber</span> łącznie</li>
                        <li>7 par prawdziwych połączonych z mostkiem</li>
                        <li>3 pary fałszywych + 2 pary wolnych</li>
                    </ul>

                    <h3>Kręgosłup</h3>
                    <ul>
                        <li>33-34 kręgi w 5 odcinkach</li>
                        <li>Umożliwia różnorodne ruchy</li>
                    </ul>
                `;
                break;
            case 'detailed':
                content = `
                    <h3>Szczegółowe streszczenie</h3>
                    <p>Anatomia człowieka to kompleksowa nauka zajmująca się szczegółowym badaniem budowy ciała ludzkiego. System kostny stanowi fundamentalną strukturę organizmu.</p>
                    
                    <h3>System kostny - podstawowe informacje</h3>
                    <ul>
                        <li>Dorosły człowiek posiada <span class="key-concept">206 kości</span></li>
                        <li>Kości pełnią funkcje ochronne dla narządów wewnętrznych</li>
                        <li>Zapewniają podporę strukturalną całego organizmu</li>
                        <li>Umożliwiają ruch poprzez połączenia stawowe</li>
                    </ul>

                    <h3>Żebra - szczegółowa charakterystyka</h3>
                    <ul>
                        <li>Łącznie <span class="key-concept">12 par żeber</span> (24 żebra)</li>
                        <li><span class="key-concept">7 par żeber prawdziwych</span> - bezpośrednio połączonych z mostkiem</li>
                        <li><span class="key-concept">3 pary żeber fałszywych</span> - pośrednio połączonych z mostkiem</li>
                        <li><span class="key-concept">2 pary żeber wolnych</span> - nie połączonych z mostkiem</li>
                        <li>Główna funkcja: ochrona narządów klatki piersiowej (serce, płuca)</li>
                    </ul>

                    <h3>Kręgosłup - budowa i funkcje</h3>
                    <ul>
                        <li>Składa się z <span class="key-concept">33-34 kręgów</span></li>
                        <li><span class="key-concept">Odcinek szyjny</span>: 7 kręgów</li>
                        <li><span class="key-concept">Odcinek piersiowy</span>: 12 kręgów</li>
                        <li><span class="key-concept">Odcinek lędźwiowy</span>: 5 kręgów</li>
                        <li><span class="key-concept">Odcinek krzyżowy</span>: 5 kręgów zrośniętych</li>
                        <li><span class="key-concept">Odcinek guziczny</span>: 4-5 kręgów</li>
                    </ul>

                    <h3>Ruchy kręgosłupa</h3>
                    <ul>
                        <li><span class="key-concept">Zgięcie</span> - pochylanie do przodu</li>
                        <li><span class="key-concept">Prostowanie</span> - wyprostowywanie</li>
                        <li><span class="key-concept">Skłony boczne</span> - ruchy na boki</li>
                        <li><span class="key-concept">Rotacja</span> - ruchy obrotowe</li>
                    </ul>
                `;
                break;
        }
        
        summaryContent.innerHTML = content;
    }

    exportSummary() {
        const summaryContent = document.getElementById('summaryContent');
        if (summaryContent) {
            const text = summaryContent.textContent;
            this.showModal('Export', 'Streszczenie zostało skopiowane do schowka.');
        }
    }

    // Quiz functionality - Fixed selection tracking
    startQuiz() {
        this.currentQuizIndex = 0;
        this.quizAnswers = [];
        this.selectedQuizOption = null; // Reset selection
        this.showSection('quiz');
        this.displayQuestion();
    }

    displayQuestion() {
        const question = this.quizData[this.currentQuizIndex];
        const questionText = document.getElementById('questionText');
        const questionNumber = document.getElementById('questionNumber');
        const totalQuestions = document.getElementById('totalQuestions');
        const optionsContainer = document.getElementById('quizOptions');
        const feedback = document.getElementById('quizFeedback');
        const submitBtn = document.getElementById('submitAnswer');
        const nextBtn = document.getElementById('nextQuestion');

        // Reset selection state
        this.selectedQuizOption = null;

        if (questionText) questionText.textContent = question.question;
        if (questionNumber) questionNumber.textContent = this.currentQuizIndex + 1;
        if (totalQuestions) totalQuestions.textContent = this.quizData.length;

        // Clear previous options
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            
            question.options.forEach((option, index) => {
                const optionButton = document.createElement('button');
                optionButton.className = 'quiz-option';
                optionButton.textContent = option;
                optionButton.dataset.index = index;
                
                // Fixed event listener with proper selection tracking
                optionButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Remove selection from all options
                    document.querySelectorAll('.quiz-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // Add selection to clicked option
                    optionButton.classList.add('selected');
                    
                    // Store selection
                    this.selectedQuizOption = index;
                    
                    console.log('Selected option:', index); // Debug log
                });
                
                optionsContainer.appendChild(optionButton);
            });
        }

        // Reset UI state
        if (feedback) feedback.classList.add('hidden');
        if (submitBtn) {
            submitBtn.classList.remove('hidden');
            submitBtn.disabled = false;
        }
        if (nextBtn) nextBtn.classList.add('hidden');
    }

    submitQuizAnswer() {
        // Check if an option is selected using the tracked state
        if (this.selectedQuizOption === null) {
            this.showModal('Uwaga', 'Proszę wybrać odpowiedź przed przesłaniem.');
            return;
        }

        const selectedIndex = this.selectedQuizOption;
        const question = this.quizData[this.currentQuizIndex];
        const isCorrect = selectedIndex === question.correct;

        console.log('Submitting answer:', selectedIndex, 'Correct:', question.correct, 'Is correct:', isCorrect); // Debug log

        // Store answer
        this.quizAnswers.push({
            questionIndex: this.currentQuizIndex,
            selectedIndex: selectedIndex,
            correct: isCorrect
        });

        // Show feedback
        this.showQuizFeedback(isCorrect, question.explanation);
        
        // Update option styles
        document.querySelectorAll('.quiz-option').forEach((option, index) => {
            option.disabled = true;
            if (index === question.correct) {
                option.classList.add('correct');
            } else if (index === selectedIndex && !isCorrect) {
                option.classList.add('incorrect');
            }
        });

        // Update UI
        const submitBtn = document.getElementById('submitAnswer');
        const nextBtn = document.getElementById('nextQuestion');
        
        if (submitBtn) submitBtn.classList.add('hidden');
        if (nextBtn) nextBtn.classList.remove('hidden');
    }

    showQuizFeedback(isCorrect, explanation) {
        const feedback = document.getElementById('quizFeedback');
        if (feedback) {
            feedback.innerHTML = `
                <div style="margin-bottom: 12px;">
                    <strong>${isCorrect ? '✅ Poprawnie!' : '❌ Niepoprawnie'}</strong>
                </div>
                <div>${explanation}</div>
            `;
            feedback.classList.remove('hidden');
        }
    }

    nextQuestion() {
        this.currentQuizIndex++;
        
        if (this.currentQuizIndex >= this.quizData.length) {
            this.showQuizResults();
        } else {
            this.displayQuestion();
        }
    }

    showQuizResults() {
        this.showSection('quiz-results');
        
        const correctAnswers = this.quizAnswers.filter(answer => answer.correct).length;
        const totalQuestions = this.quizData.length;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        // Update results display
        const scorePercentage = document.getElementById('scorePercentage');
        const correctAnswersSpan = document.getElementById('correctAnswers');
        const totalAnswersSpan = document.getElementById('totalAnswers');
        const gradeDisplay = document.getElementById('gradeDisplay');
        const improvementsList = document.getElementById('improvementsList');

        if (scorePercentage) scorePercentage.textContent = `${percentage}%`;
        if (correctAnswersSpan) correctAnswersSpan.textContent = correctAnswers;
        if (totalAnswersSpan) totalAnswersSpan.textContent = totalQuestions;
        
        // Calculate grade
        const grade = this.calculateGrade(percentage);
        if (gradeDisplay) gradeDisplay.textContent = grade;

        // Show improvement areas
        if (improvementsList) {
            improvementsList.innerHTML = '';
            const wrongAnswers = this.quizAnswers.filter(answer => !answer.correct);
            
            if (wrongAnswers.length === 0) {
                improvementsList.innerHTML = '<li>Doskonała robota! Nie ma obszarów wymagających poprawy.</li>';
            } else {
                wrongAnswers.forEach(wrongAnswer => {
                    const question = this.quizData[wrongAnswer.questionIndex];
                    const li = document.createElement('li');
                    li.textContent = this.getImprovementArea(question.question);
                    improvementsList.appendChild(li);
                });
            }
        }

        // Award points and check badges
        this.awardPoints(30);
        if (percentage >= 80) {
            this.checkBadge('Quiz Champion');
        }
        if (percentage === 100) {
            this.checkBadge('Perfectionist');
            this.awardPoints(50);
        }
    }

    calculateGrade(percentage) {
        if (percentage >= 90) return '5';
        if (percentage >= 80) return '4+';
        if (percentage >= 70) return '4';
        if (percentage >= 60) return '3+';
        if (percentage >= 50) return '3';
        return '2';
    }

    getImprovementArea(question) {
        if (question.includes('żeber')) return 'Budowa żeber i ich klasyfikacja';
        if (question.includes('kręgów') || question.includes('kręgosłup')) return 'Budowa i funkcje kręgosłupa';
        if (question.includes('ruchy')) return 'Ruchy kręgosłupa';
        return 'Anatomia systemu kostnego';
    }

    retakeQuiz() {
        this.startQuiz();
    }

    // Gamification system
    awardPoints(points) {
        this.userProgress.points += points;
        this.updateLevel();
        this.updateUserStats();
        
        // Show points notification
        this.showModal('Punkty!', `Otrzymałeś ${points} punktów! 🎉`);
    }

    updateLevel() {
        const points = this.userProgress.points;
        let newLevel;
        
        if (points >= 300) newLevel = 'Ekspert';
        else if (points >= 200) newLevel = 'Zaawansowany';
        else if (points >= 100) newLevel = 'Średniozaawansowany';
        else newLevel = 'Początkujący';
        
        if (newLevel !== this.userProgress.level) {
            this.userProgress.level = newLevel;
            this.showModal('Awans!', `Gratulacje! Osiągnąłeś poziom: ${newLevel}! 🎊`);
        }
    }

    checkBadge(badgeName) {
        const badge = this.badges.find(b => b.name === badgeName);
        if (badge && !badge.earned) {
            badge.earned = true;
            this.userProgress.badges.push(badgeName);
            this.renderBadges();
            this.showModal('Nowa odznaka!', `Otrzymałeś odznakę: ${badgeName}! ${badge.icon}`);
        }
    }

    updateUserStats() {
        const levelElement = document.getElementById('userLevel');
        const pointsElement = document.getElementById('userPoints');
        
        if (levelElement) levelElement.textContent = this.userProgress.level;
        if (pointsElement) pointsElement.textContent = this.userProgress.points;
    }

    renderBadges() {
        const badgesGrid = document.getElementById('badgesGrid');
        if (!badgesGrid) return;

        badgesGrid.innerHTML = '';
        
        this.badges.forEach(badge => {
            const badgeElement = document.createElement('div');
            badgeElement.className = `badge ${badge.earned ? 'earned' : ''}`;
            badgeElement.innerHTML = `
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-description">${badge.description}</div>
            `;
            badgesGrid.appendChild(badgeElement);
        });
    }

    // Modal functionality
    showModal(title, message) {
        const modal = document.getElementById('notificationModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        
        if (modalTitle) modalTitle.textContent = title;
        if (modalMessage) modalMessage.textContent = message;
        if (modal) modal.classList.remove('hidden');
    }

    hideModal() {
        const modal = document.getElementById('notificationModal');
        if (modal) modal.classList.add('hidden');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new EduLearnApp();
});

// Add touch-friendly interactions for iOS
if ('ontouchstart' in window) {
    // Add touch feedback
    document.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('btn') || 
            e.target.classList.contains('quiz-option') ||
            e.target.classList.contains('activity-card')) {
            e.target.style.transform = 'scale(0.95)';
        }
    });

    document.addEventListener('touchend', (e) => {
        if (e.target.classList.contains('btn') || 
            e.target.classList.contains('quiz-option') ||
            e.target.classList.contains('activity-card')) {
            setTimeout(() => {
                e.target.style.transform = '';
            }, 150);
        }
    });
}

// Prevent zoom on iOS
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

// Add visual feedback for successful actions
function addSuccessAnimation(element) {
    if (element) {
        element.classList.add('slide-up');
        setTimeout(() => {
            element.classList.remove('slide-up');
        }, 300);
    }
}