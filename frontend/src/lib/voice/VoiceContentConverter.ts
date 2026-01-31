
import type { TeachingBlock } from '@/types/teaching';
import type { VerbosityLevel } from '@/types/voice';

export interface VoiceScript {
    text: string;
    pauseAfter?: number;
    emphasis?: boolean;
}

export class VoiceContentConverter {
    private verbosity: VerbosityLevel = 'normal';

    constructor(verbosity: VerbosityLevel = 'normal') {
        this.verbosity = verbosity;
    }

    public setVerbosity(level: VerbosityLevel): void {
        this.verbosity = level;
    }

    public convertBlock(block: TeachingBlock, index: number, total: number): VoiceScript[] {
        const scripts: VoiceScript[] = [];

        if (this.verbosity === 'detailed') {
            scripts.push({
                text: `Section ${index + 1} of ${total}.`,
                pauseAfter: 300,
            });
        }

        switch (block.type) {
            case 'paragraph':
                scripts.push(...this.convertParagraph(block.content));
                break;

            case 'formula':
                scripts.push(...this.convertFormula(block.formula, block.explanation));
                break;

            case 'insight':
                scripts.push(...this.convertInsight(block.content));
                break;

            case 'list':
                scripts.push(...this.convertList(block.items));
                break;

            case 'simulation':
                scripts.push(...this.convertSimulation(block.description));
                break;

            case 'question':
                scripts.push(...this.convertQuestion(block));
                break;
        }

        return scripts;
    }

    private convertParagraph(content: string): VoiceScript[] {
        const cleanedContent = content.replace(/\*\*(.*?)\*\*/g, '$1');

        const sentences = cleanedContent.match(/[^.!?]+[.!?]+/g) || [cleanedContent];

        if (this.verbosity === 'short') {
            return [{
                text: sentences[0].trim(),
                pauseAfter: 500,
            }];
        }

        return sentences.map((sentence, i) => ({
            text: sentence.trim(),
            pauseAfter: i < sentences.length - 1 ? 300 : 500,
        }));
    }

    private convertFormula(formula: string, explanation: string): VoiceScript[] {
        const scripts: VoiceScript[] = [];

        const spokenFormula = this.convertFormulaToSpeech(formula);

        if (this.verbosity === 'short') {
            scripts.push({
                text: `The formula is: ${spokenFormula}`,
                pauseAfter: 500,
            });
        } else {
            scripts.push({
                text: `Here's the formula:`,
                pauseAfter: 300,
            });

            scripts.push({
                text: spokenFormula,
                pauseAfter: 500,
            });

            if (explanation) {
                scripts.push({
                    text: `This means: ${explanation}`,
                    pauseAfter: 500,
                });
            }
        }

        return scripts;
    }

    private convertFormulaToSpeech(formula: string): string {
        return formula
            .replace(/=/g, ' equals ')
            .replace(/\+/g, ' plus ')
            .replace(/-/g, ' minus ')
            .replace(/\*/g, ' times ')
            .replace(/\//g, ' divided by ')
            .replace(/\^/g, ' to the power of ')
            .replace(/√/g, ' square root of ')
            .replace(/Δ/g, ' delta ')
            .replace(/∑/g, ' sum of ')
            .replace(/∫/g, ' integral of ')
            .replace(/\(/g, ' open parenthesis ')
            .replace(/\)/g, ' close parenthesis ')
            .trim();
    }

    private convertInsight(content: string): VoiceScript[] {
        const cleanedContent = content.replace(/\*\*(.*?)\*\*/g, '$1');

        return [{
            text: `Key insight: ${cleanedContent}`,
            pauseAfter: 700,
            emphasis: true,
        }];
    }

    private convertList(items: string[]): VoiceScript[] {
        const scripts: VoiceScript[] = [];

        if (this.verbosity === 'detailed') {
            scripts.push({
                text: `Here are ${items.length} points:`,
                pauseAfter: 300,
            });
        }

        items.forEach((item, index) => {
            const cleanedItem = item.replace(/\*\*(.*?)\*\*/g, '$1');

            const prefix = this.verbosity === 'short' ? '' :
                this.verbosity === 'detailed' ? `Point ${index + 1}: ` :
                    `${this.numberToWord(index + 1)}, `;

            scripts.push({
                text: `${prefix}${cleanedItem}`,
                pauseAfter: index < items.length - 1 ? 400 : 600,
            });

            if (this.verbosity === 'short' && index >= 2) {
                if (items.length > 3) {
                    scripts.push({
                        text: `And ${items.length - 3} more points.`,
                        pauseAfter: 600,
                    });
                }
                return scripts;
            }
        });

        return scripts;
    }

    private convertSimulation(description: string): VoiceScript[] {
        const scripts: VoiceScript[] = [];

        scripts.push({
            text: `There's an interactive simulation here: ${description}`,
            pauseAfter: 500,
        });

        if (this.verbosity !== 'short') {
            scripts.push({
                text: 'You can explore this visually on screen, or say "next" to continue.',
                pauseAfter: 700,
            });
        }

        return scripts;
    }

    private convertQuestion(question: any): VoiceScript[] {
        const scripts: VoiceScript[] = [];

        scripts.push({
            text: 'Question:',
            pauseAfter: 300,
        });

        scripts.push({
            text: question.question,
            pauseAfter: 500,
        });

        if (question.questionType === 'mcq' && question.options) {
            if (this.verbosity === 'detailed') {
                scripts.push({
                    text: 'Here are your options:',
                    pauseAfter: 300,
                });
            }

            question.options.forEach((option: string, index: number) => {
                const label = String.fromCharCode(65 + index); // A, B, C, D
                scripts.push({
                    text: `Option ${label}: ${option}`,
                    pauseAfter: 400,
                });
            });

            scripts.push({
                text: 'Say your answer as "option A", "option B", and so on.',
                pauseAfter: 700,
            });
        }
        else if (question.questionType === 'fill_in_blank') {
            scripts.push({
                text: 'Please speak your answer.',
                pauseAfter: 700,
            });
        }

        return scripts;
    }

    private numberToWord(num: number): string {
        const words = ['First', 'Second', 'Third', 'Fourth', 'Fifth',
            'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
        return words[num - 1] || `Number ${num}`;
    }

    public convertFeedback(isCorrect: boolean, explanation: string): VoiceScript[] {
        const scripts: VoiceScript[] = [];

        if (isCorrect) {
            scripts.push({
                text: 'Correct!',
                pauseAfter: 500,
                emphasis: true,
            });
        } else {
            scripts.push({
                text: 'Not quite right.',
                pauseAfter: 400,
            });
        }

        if (explanation && this.verbosity !== 'short') {
            scripts.push({
                text: explanation,
                pauseAfter: 600,
            });
        }

        return scripts;
    }

    public createProgressAnnouncement(current: number, total: number): VoiceScript {
        if (this.verbosity === 'short') {
            return {
                text: `Section ${current} of ${total}`,
                pauseAfter: 300,
            };
        }

        return {
            text: `You're on section ${current} of ${total}. ${this.getProgressEncouragement(current, total)}`,
            pauseAfter: 500,
        };
    }

    private getProgressEncouragement(current: number, total: number): string {
        const progress = current / total;

        if (progress < 0.25) return "Let's keep going!";
        if (progress < 0.5) return "You're making good progress!";
        if (progress < 0.75) return "More than halfway there!";
        if (progress < 1.0) return "Almost done!";
        return "Great work!";
    }
}
