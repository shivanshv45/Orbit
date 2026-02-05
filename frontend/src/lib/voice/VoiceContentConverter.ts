import type { TeachingBlock } from '@/types/teaching';
import type { VerbosityLevel } from '@/types/voice';

export interface VoiceScript {
    text: string;
    pauseAfter?: number;
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

        console.log('🎤 Converting block:', block.type, 'index:', index, 'block:', block);

        if (this.verbosity === 'detailed' && index === 0) {
            scripts.push({ text: `Starting lesson. There are ${total} sections.`, pauseAfter: 400 });
        }

        switch (block.type) {
            case 'paragraph':
                scripts.push(...this.convertParagraph(block.content));
                break;
            case 'formula':
                scripts.push(...this.convertFormula(block.formula || '', block.explanation || ''));
                break;
            case 'insight':
                scripts.push(...this.convertInsight(block.content));
                break;
            case 'list':
                scripts.push(...this.convertList(block.items || []));
                break;
            case 'simulation':
                scripts.push(...this.convertSimulation(block.description || ''));
                break;
            case 'question':
                scripts.push(...this.convertQuestion(block));
                break;
            default:
                console.log('🎤 Unknown block type:', (block as any).type);
        }

        if (index < total - 1) {
            scripts.push({ text: 'Say next to continue, or repeat to hear again.', pauseAfter: 300 });
        } else {
            scripts.push({ text: 'This is the last section. Say next to complete the lesson.', pauseAfter: 300 });
        }

        console.log('🎤 Generated scripts:', scripts.map(s => s.text.substring(0, 50)));

        return scripts;
    }

    private cleanMarkdown(content: string): string {
        return content
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .trim();
    }

    private convertParagraph(content: string): VoiceScript[] {
        const cleaned = this.cleanMarkdown(content);
        return [{ text: cleaned, pauseAfter: 500 }];
    }

    private convertFormula(formula: string, explanation: string): VoiceScript[] {
        const scripts: VoiceScript[] = [];
        const spokenFormula = this.convertFormulaToSpeech(formula);

        scripts.push({ text: 'Here is a formula:', pauseAfter: 300 });
        scripts.push({ text: spokenFormula, pauseAfter: 600 });

        if (explanation) {
            scripts.push({ text: this.cleanMarkdown(explanation), pauseAfter: 500 });
        }

        return scripts;
    }

    private convertFormulaToSpeech(formula: string): string {
        let spoken = formula;

        const replacements: [RegExp, string][] = [
            [/(\w)\^2/g, '$1 squared'],
            [/(\w)\^3/g, '$1 cubed'],
            [/(\w)\^(\d+)/g, '$1 to the power of $2'],
            [/(\w)\^(\w)/g, '$1 to the power of $2'],
            [/sqrt\((.*?)\)/gi, 'square root of $1'],
            [/√\((.*?)\)/g, 'square root of $1'],
            [/√(\w)/g, 'square root of $1'],
            [/\bpi\b/gi, 'pie'],
            [/π/g, 'pie'],
            [/θ/g, 'theta'],
            [/α/g, 'alpha'],
            [/β/g, 'beta'],
            [/γ/g, 'gamma'],
            [/Δ/g, 'delta'],
            [/δ/g, 'delta'],
            [/λ/g, 'lambda'],
            [/μ/g, 'mu'],
            [/σ/g, 'sigma'],
            [/Σ/g, 'sigma'],
            [/ω/g, 'omega'],
            [/∞/g, 'infinity'],
            [/∫/g, 'integral of'],
            [/∑/g, 'sum of'],
            [/∏/g, 'product of'],
            [/≈/g, 'is approximately equal to'],
            [/≠/g, 'is not equal to'],
            [/≤/g, 'is less than or equal to'],
            [/≥/g, 'is greater than or equal to'],
            [/<=/g, 'is less than or equal to'],
            [/>=/g, 'is greater than or equal to'],
            [/</g, 'is less than'],
            [/>/g, 'is greater than'],
            [/=/g, ' equals '],
            [/\+/g, ' plus '],
            [/(?<!\w)-(?!\w)/g, ' minus '],
            [/\*/g, ' times '],
            [/×/g, ' times '],
            [/÷/g, ' divided by '],
            [/\//g, ' over '],
            [/\(/g, ', open parenthesis, '],
            [/\)/g, ', close parenthesis, '],
            [/\[/g, ', open bracket, '],
            [/\]/g, ', close bracket, '],
            [/\{/g, ', open brace, '],
            [/\}/g, ', close brace, '],
            [/,/g, ', '],
            [/\s+/g, ' '],
        ];

        for (const [pattern, replacement] of replacements) {
            spoken = spoken.replace(pattern, replacement);
        }

        return spoken.trim();
    }

    private convertInsight(content: string): VoiceScript[] {
        return [{ text: `Key insight: ${this.cleanMarkdown(content)}`, pauseAfter: 600 }];
    }

    private convertList(items: string[]): VoiceScript[] {
        const scripts: VoiceScript[] = [];
        scripts.push({ text: `Here are ${items.length} points:`, pauseAfter: 300 });

        items.forEach((item, index) => {
            const cleaned = this.cleanMarkdown(item);
            const ordinal = this.getOrdinal(index + 1);
            scripts.push({ text: `${ordinal}: ${cleaned}`, pauseAfter: 400 });
        });

        return scripts;
    }

    private getOrdinal(n: number): string {
        const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
        return ordinals[n - 1] || `Number ${n}`;
    }

    private convertSimulation(description: string): VoiceScript[] {
        return [
            { text: `There is an interactive simulation: ${this.cleanMarkdown(description)}`, pauseAfter: 400 },
            { text: 'You can explore it on screen. Say next to continue.', pauseAfter: 300 }
        ];
    }

    private convertQuestion(question: any): VoiceScript[] {
        const scripts: VoiceScript[] = [];
        const cleaned = this.cleanMarkdown(question.question);

        scripts.push({ text: 'Question time!', pauseAfter: 400 });
        scripts.push({ text: cleaned, pauseAfter: 600 });

        if (question.questionType === 'mcq' && question.options) {
            scripts.push({ text: 'Your options are:', pauseAfter: 300 });

            question.options.forEach((option: string, index: number) => {
                const label = String.fromCharCode(65 + index);
                const cleanedOption = this.cleanMarkdown(option);
                scripts.push({ text: `${label}: ${cleanedOption}`, pauseAfter: 400 });
            });

            scripts.push({ text: 'Say the letter of your answer, like A, B, C, or D.', pauseAfter: 400 });
        } else if (question.questionType === 'fill_in_blank') {
            scripts.push({ text: 'Speak your answer when ready.', pauseAfter: 400 });
        }

        return scripts;
    }

    public convertFeedback(isCorrect: boolean, explanation: string, correctAnswer?: string): VoiceScript[] {
        const scripts: VoiceScript[] = [];

        if (isCorrect) {
            scripts.push({ text: 'Correct! Great job!', pauseAfter: 500 });
        } else {
            scripts.push({ text: 'Not quite right.', pauseAfter: 300 });
            if (correctAnswer) {
                scripts.push({ text: `The correct answer was ${correctAnswer}.`, pauseAfter: 400 });
            }
        }

        if (explanation) {
            scripts.push({ text: this.cleanMarkdown(explanation), pauseAfter: 500 });
        }

        scripts.push({ text: 'Say next to continue.', pauseAfter: 300 });

        return scripts;
    }

    public getTextsForPrefetch(blocks: TeachingBlock[], startIndex: number, count: number = 3): string[] {
        const texts: string[] = [];
        for (let i = startIndex; i < Math.min(startIndex + count, blocks.length); i++) {
            const block = blocks[i];
            const scripts = this.convertBlock(block, i, blocks.length);
            scripts.forEach(s => texts.push(s.text));
        }
        return texts;
    }
}
