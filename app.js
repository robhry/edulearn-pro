// EduLearn Pro - Z PRAWDZIWYM AI (Transformers.js)
class EduLearnAppAI extends EduLearnApp {
    constructor() {
        super();
        this.summarizationPipeline = null;
        this.textGenerationPipeline = null;
        this.aiModelsLoaded = false;
    }
    
    async init() {
        // Podstawowa inicjalizacja
        super.init();
        
        // Inicjalizuj modele AI w tle
        this.initializeAIModels();
    }
    
    async initializeAIModels() {
        try {
            console.log('Ładowanie modeli AI...');
            
            // Dynamically import Transformers.js
            const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.0');
            
            // Load summarization model (Facebook BART - najlepszy do streszczeń)
            this.showLoadingMessage('Ładowanie modelu do streszczeń...');
            this.summarizationPipeline = await pipeline('summarization', 'Xenova/distilbart-cnn-12-6', {
                progress_callback: (progress) => {
                    console.log(`Model loading: ${Math.round(progress.progress || 0)}%`);
                }
            });
            
            // Load text generation model for mind maps
            this.showLoadingMessage('Ładowanie modelu do analizy tekstu...');
            this.textGenerationPipeline = await pipeline('text-generation', 'Xenova/gpt2', {
                progress_callback: (progress) => {
                    console.log(`Text generation model: ${Math.round(progress.progress || 0)}%`);
                }
            });
            
            this.aiModelsLoaded = true;
            this.hideLoadingMessage();
            console.log('Modele AI załadowane pomyślnie!');
            
        } catch (error) {
            console.error('Błąd ładowania modeli AI:', error);
            this.hideLoadingMessage();
            
            // Fallback do podstawowych algorytmów
            alert('Nie udało się załadować modeli AI. Aplikacja będzie używać podstawowych algorytmów.');
        }
    }
    
    showLoadingMessage(message) {
        // Pokaż subtelny indicator ładowania modelu
        const indicator = document.getElementById('aiLoadingIndicator') || this.createAILoadingIndicator();
        indicator.textContent = message;
        indicator.style.display = 'block';
    }
    
    hideLoadingMessage() {
        const indicator = document.getElementById('aiLoadingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    createAILoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'aiLoadingIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: rgba(0, 122, 255, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 1000;
            display: none;
        `;
        document.body.appendChild(indicator);
        return indicator;
    }
    
    // NOWA FUNKCJA: Prawdziwe streszczenie z AI
    async generateSummaryFromText(text) {
        console.log('Generowanie streszczenia z modelem AI...');
        
        if (!this.aiModelsLoaded || !this.summarizationPipeline) {
            console.log('Model AI nie jest dostępny, używam podstawowego algorytmu');
            return super.generateSummaryFromText(text); // Fallback do starej metody
        }
        
        try {
            // Podziel tekst na chunki jeśli jest za długi (BART ma limit ~1000 tokenów)
            const maxLength = 800; // ~600-700 słów
            const textChunks = this.splitTextIntoChunks(text, maxLength);
            
            const summaries = {
                short: '',
                medium: '',
                long: ''
            };
            
            // Generuj streszczenia dla każdej długości
            for (const [type, maxLen, minLen] of [
                ['short', 50, 20],
                ['medium', 120, 40], 
                ['long', 200, 80]
            ]) {
                console.log(`Generowanie streszczenia ${type}...`);
                
                let combinedSummary = '';
                
                // Przetwórz każdy chunk
                for (let i = 0; i < textChunks.length; i++) {
                    const chunk = textChunks[i];
                    console.log(`Przetwarzanie fragmentu ${i + 1}/${textChunks.length} dla ${type}`);
                    
                    try {
                        const result = await this.summarizationPipeline(chunk, {
                            max_length: Math.round(maxLen / Math.max(textChunks.length, 1)),
                            min_length: Math.round(minLen / Math.max(textChunks.length, 1)),
                            do_sample: false,
                            temperature: 0.3
                        });
                        
                        if (result && result[0] && result[0].summary_text) {
                            combinedSummary += result[0].summary_text + ' ';
                        }
                        
                    } catch (chunkError) {
                        console.warn(`Błąd przetwarzania fragmentu ${i + 1}:`, chunkError);
                        // Dodaj fragment oryginalnego tekstu jako fallback
                        const sentences = chunk.split('.').slice(0, 2);
                        combinedSummary += sentences.join('. ') + '. ';
                    }
                }
                
                // Jeśli mamy wiele fragmentów, spróbuj jeszcze raz skrócić
                if (textChunks.length > 1 && combinedSummary.length > maxLen * 6) {
                    try {
                        const finalResult = await this.summarizationPipeline(combinedSummary.trim(), {
                            max_length: maxLen,
                            min_length: minLen,
                            do_sample: false
                        });
                        
                        if (finalResult && finalResult[0] && finalResult[0].summary_text) {
                            summaries[type] = finalResult[0].summary_text;
                        } else {
                            summaries[type] = combinedSummary.trim();
                        }
                    } catch (error) {
                        console.warn('Błąd końcowego streszczenia:', error);
                        summaries[type] = combinedSummary.trim();
                    }
                } else {
                    summaries[type] = combinedSummary.trim();
                }
                
                console.log(`Streszczenie ${type} ukończone (${summaries[type].length} znaków)`);
            }
            
            console.log('Wszystkie streszczenia AI ukończone');
            return summaries;
            
        } catch (error) {
            console.error('Błąd generowania streszczenia AI:', error);
            // Fallback do podstawowego algorytmu
            return super.generateSummaryFromText(text);
        }
    }
    
    // NOWA FUNKCJA: Inteligentna mapa myśli z AI
    async generateMindMapFromText(text) {
        console.log('Generowanie mapy myśli z AI...');
        
        if (!this.aiModelsLoaded || !this.textGenerationPipeline) {
            console.log('Model AI nie jest dostępny, używam podstawowego algorytmu');
            return super.generateMindMapFromText(text);
        }
        
        try {
            // Użyj AI do wygenerowania struktury mapy myśli
            const prompt = this.createMindMapPrompt(text);
            console.log('Prompt dla AI:', prompt.substring(0, 200) + '...');
            
            const result = await this.textGenerationPipeline(prompt, {
                max_new_tokens: 300,
                temperature: 0.7,
                do_sample: true,
                top_p: 0.9
            });
            
            if (result && result[0] && result[0].generated_text) {
                const aiResponse = result[0].generated_text.replace(prompt, '').trim();
                console.log('Odpowiedź AI:', aiResponse);
                
                // Parsuj odpowiedź AI na strukturę mapy myśli
                const mindMap = this.parseAIMindMapResponse(aiResponse, text);
                
                if (mindMap && mindMap.branches && mindMap.branches.length > 0) {
                    console.log('Mapa myśli AI wygenerowana pomyślnie');
                    return mindMap;
                }
            }
            
            // Fallback do podstawowego algorytmu
            console.log('Fallback do podstawowego algorytmu mapy myśli');
            return super.generateMindMapFromText(text);
            
        } catch (error) {
            console.error('Błąd generowania mapy myśli AI:', error);
            return super.generateMindMapFromText(text);
        }
    }
    
    createMindMapPrompt(text) {
        const keywords = this.extractKeywords(text).slice(0, 10).join(', ');
        const firstSentences = text.split('.').slice(0, 3).join('. ');
        
        return `Analiza tekstu: "${firstSentences}..."
        
Kluczowe słowa: ${keywords}

Stwórz mapę myśli w formacie:
GŁÓWNY_TEMAT
- Podtemat 1: szczegół1, szczegół2, szczegół3
- Podtemat 2: szczegół1, szczegół2, szczegół3  
- Podtemat 3: szczegół1, szczegół2, szczegół3

Mapa myśli:`;
    }
    
    parseAIMindMapResponse(aiResponse, originalText) {
        try {
            const lines = aiResponse.split('\n').filter(line => line.trim());
            
            let centralTopic = '';
            const branches = [];
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                
                if (trimmedLine && !trimmedLine.startsWith('-') && !trimmedLine.includes(':')) {
                    // To jest główny temat
                    centralTopic = trimmedLine.replace(/[^\w\sąęćłńóśźż]/g, '').trim();
                } else if (trimmedLine.startsWith('-')) {
                    // To jest podtemat
                    const branchText = trimmedLine.substring(1).trim();
                    const [topic, details] = branchText.split(':');
                    
                    if (topic && details) {
                        const subtopics = details.split(',')
                            .map(s => s.trim())
                            .filter(s => s.length > 0 && s.length < 50)
                            .slice(0, 4);
                        
                        if (subtopics.length > 0) {
                            branches.push({
                                topic: topic.trim(),
                                subtopics: subtopics
                            });
                        }
                    }
                }
            }
            
            // Jeśli AI nie zwróciło dobrej struktury, użyj podstawowego algorytmu
            if (!centralTopic || branches.length === 0) {
                console.log('AI nie zwróciło poprawnej struktury, używam fallback');
                return super.generateMindMapFromText(originalText);
            }
            
            return {
                central: centralTopic,
                branches: branches.slice(0, 6) // Max 6 branży
            };
            
        } catch (error) {
            console.error('Błąd parsowania odpowiedzi AI:', error);
            return super.generateMindMapFromText(originalText);
        }
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
    
    // ULEPSZONA FUNKCJA: Lepsze pytania do quizu z AI
    async generateQuizFromText(text) {
        console.log('Generowanie quizu z AI...');
        
        if (!this.aiModelsLoaded || !this.textGenerationPipeline) {
            console.log('Model AI nie jest dostępny, używam podstawowego algorytmu');
            return super.generateQuizFromText(text);
        }
        
        try {
            // Użyj AI do wygenerowania lepszych pytań
            const questions = [];
            const keyTopics = this.extractKeywords(text).slice(0, 5);
            
            for (let i = 0; i < Math.min(5, keyTopics.length); i++) {
                const topic = keyTopics[i];
                const relevantText = this.findTextAboutTopic(text, topic);
                
                if (relevantText) {
                    const aiQuestion = await this.generateQuestionWithAI(relevantText, topic);
                    if (aiQuestion) {
                        questions.push(aiQuestion);
                    }
                }
            }
            
            // Dodaj podstawowe pytania jeśli za mało z AI
            if (questions.length < 5) {
                const basicQuestions = super.generateQuizFromText(text);
                questions.push(...basicQuestions.slice(0, 10 - questions.length));
            }
            
            return questions.slice(0, 10);
            
        } catch (error) {
            console.error('Błąd generowania quizu AI:', error);
            return super.generateQuizFromText(text);
        }
    }
    
    async generateQuestionWithAI(relevantText, topic) {
        try {
            const prompt = `Tekst: "${relevantText}"

Na podstawie tego tekstu stwórz pytanie testowe o temacie "${topic}".
Format:
Pytanie: [pytanie]
A) [opcja A]
B) [opcja B] 
C) [opcja C]
D) [opcja D]
Poprawna: [A/B/C/D]

Przykład:`;

            const result = await this.textGenerationPipeline(prompt, {
                max_new_tokens: 150,
                temperature: 0.8,
                do_sample: true
            });
            
            if (result && result[0] && result[0].generated_text) {
                const aiResponse = result[0].generated_text.replace(prompt, '').trim();
                return this.parseAIQuestionResponse(aiResponse, relevantText);
            }
            
            return null;
            
        } catch (error) {
            console.error('Błąd generowania pytania AI:', error);
            return null;
        }
    }
    
    parseAIQuestionResponse(aiResponse, context) {
        try {
            const lines = aiResponse.split('\n');
            let question = '';
            const options = [];
            let correct = -1;
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('Pytanie:')) {
                    question = trimmed.replace('Pytanie:', '').trim();
                } else if (/^[ABCD]\)/.test(trimmed)) {
                    options.push(trimmed.substring(3).trim());
                } else if (trimmed.startsWith('Poprawna:')) {
                    const answer = trimmed.replace('Poprawna:', '').trim();
                    correct = ['A', 'B', 'C', 'D'].indexOf(answer);
                }
            }
            
            if (question && options.length === 4 && correct >= 0) {
                return {
                    question: question,
                    options: options,
                    correct: correct,
                    type: 'ai_generated',
                    explanation: `Odpowiedź oparta na fragmencie: "${context.substring(0, 100)}..."`
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('Błąd parsowania pytania AI:', error);
            return null;
        }
    }
    
    findTextAboutTopic(text, topic) {
        const sentences = text.split('.').filter(s => s.length > 20);
        const relevantSentences = sentences
            .filter(sentence => 
                sentence.toLowerCase().includes(topic.toLowerCase())
            )
            .slice(0, 3);
        
        return relevantSentences.join('. ') || null;
    }
}

// Zastąp oryginalną aplikację wersją z AI
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== INICJALIZACJA APLIKACJI Z AI ===');
    
    try {
        window.app = new EduLearnAppAI();
        window.app.init();
    } catch (error) {
        console.error('Błąd inicjalizacji aplikacji AI:', error);
        // Fallback do podstawowej wersji
        window.app = new EduLearnApp();
        window.app.init();
    }
});
