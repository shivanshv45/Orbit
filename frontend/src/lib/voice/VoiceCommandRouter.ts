import type { VoiceCommand } from '@/types/voice';

interface CommandPattern {
    patterns: string[];
    command: VoiceCommand;
}

function fuzzyMatch(utterance: string, patterns: string[]): boolean {
    const normalizedUtterance = utterance.toLowerCase().trim();

    return patterns.some(pattern => {
        const normalizedPattern = pattern.toLowerCase();

        if (normalizedUtterance === normalizedPattern) return true;
        if (normalizedUtterance.includes(normalizedPattern)) return true;
        if (normalizedUtterance.startsWith(normalizedPattern)) return true;

        const words = normalizedUtterance.split(/\s+/);
        return words.some(word => word === normalizedPattern);
    });
}

const NAVIGATION_COMMANDS: CommandPattern[] = [
    {
        patterns: ['start', 'begin', "let's start", "let's begin", 'start lesson', 'begin lesson'],
        command: { type: 'navigation', action: 'start' },
    },
    {
        patterns: ['next lesson', 'go to next lesson', 'next topic', 'next chapter'],
        command: { type: 'navigation', action: 'next_lesson' },
    },
    {
        patterns: ['previous lesson', 'go to previous lesson', 'last lesson', 'previous topic', 'previous chapter'],
        command: { type: 'navigation', action: 'previous_lesson' },
    },
    {
        patterns: ['next', 'continue', 'go on', 'proceed', 'move on', 'keep going', 'next section', 'next slide', 'forward'],
        command: { type: 'navigation', action: 'next' },
    },
    {
        patterns: ['repeat', 'say that again', 'say again', 'what', 'pardon', 'come again', 'repeat that', 'one more time', 'again'],
        command: { type: 'navigation', action: 'repeat' },
    },
    {
        patterns: ['pause', 'stop', 'wait', 'hold on', 'hold'],
        command: { type: 'navigation', action: 'pause' },
    },
    {
        patterns: ['resume', 'go on', 'continue', 'keep going'],
        command: { type: 'navigation', action: 'resume' },
    },
    {
        patterns: ['back', 'go back', 'previous', 'last one', 'previous section', 'go to previous', 'backwards'],
        command: { type: 'navigation', action: 'back' },
    },
];

const ACCESSIBILITY_COMMANDS: CommandPattern[] = [
    {
        patterns: ['faster', 'speak faster', 'speed up', 'go faster', 'quick', 'quicker'],
        command: { type: 'accessibility', action: 'speed_up' },
    },
    {
        patterns: ['slower', 'speak slower', 'slow down', 'go slower'],
        command: { type: 'accessibility', action: 'slow_down' },
    },
    {
        patterns: ['help', 'what can i say', 'commands', 'what are the commands', 'options'],
        command: { type: 'accessibility', action: 'help' },
    },
    {
        patterns: ['settings', 'open settings', 'show settings', 'voice settings', 'preferences'],
        command: { type: 'accessibility', action: 'open_settings' },
    },
    {
        patterns: ['close settings', 'exit settings', 'hide settings'],
        command: { type: 'accessibility', action: 'close_settings' },
    },
    {
        patterns: ['return to curriculum', 'go to curriculum', 'back to curriculum', 'show curriculum', 'exit lesson'],
        command: { type: 'navigation', action: 'return_to_curriculum' },
    },
    {
        patterns: ['where am i', 'what lesson', 'current lesson', 'which lesson'],
        command: { type: 'accessibility', action: 'current_position' },
    },
    {
        patterns: ['how many left', 'sections left', 'how much more', 'progress'],
        command: { type: 'accessibility', action: 'show_progress' },
    },
    {
        patterns: ['explain more', 'more detail', 'detailed', 'elaborate', 'tell me more'],
        command: { type: 'accessibility', action: 'verbosity_detailed' },
    },
    {
        patterns: ['keep it short', 'brief', 'summarize', 'less detail', 'shorter'],
        command: { type: 'accessibility', action: 'verbosity_short' },
    },
    {
        patterns: ['normal', 'normal detail', 'regular', 'default'],
        command: { type: 'accessibility', action: 'verbosity_normal' },
    },
    {
        patterns: ['camera on', 'enable camera', 'turn on camera', 'start camera'],
        command: { type: 'accessibility', action: 'camera_on' },
    },
    {
        patterns: ['camera off', 'disable camera', 'turn off camera', 'stop camera'],
        command: { type: 'accessibility', action: 'camera_off' },
    },
    {
        patterns: ['ask doubt', 'ask question', 'ask ai', 'i have a doubt', 'i have a question'],
        command: { type: 'accessibility', action: 'ask_ai' },
    },
];

function parseAnswer(utterance: string): VoiceCommand | null {
    const normalized = utterance.toLowerCase().trim();

    const patterns = [
        /option\s+([a-d])/i,
        /answer\s+([a-d])/i,
        /select\s+([a-d])/i,
        /choose\s+([a-d])/i,
        /([a-d])\s*$/i,
        /^([a-d])$/i,
    ];

    for (const pattern of patterns) {
        const match = normalized.match(pattern);
        if (match) {
            const option = match[1].toUpperCase();
            return {
                type: 'answer',
                action: 'select_option',
                parameters: { option },
            };
        }
    }

    return null;
}

function parseFillInAnswer(utterance: string): VoiceCommand {
    return {
        type: 'answer',
        action: 'fill_in',
        parameters: { answer: utterance.trim() },
    };
}

export class VoiceCommandRouter {
    public route(
        utterance: string,
        context: { state: string; questionType?: 'mcq' | 'fill_in_blank' }
    ): VoiceCommand | null {

        if (!utterance || utterance.trim().length === 0) {
            return null;
        }

        for (const cmdPattern of NAVIGATION_COMMANDS) {
            if (fuzzyMatch(utterance, cmdPattern.patterns)) {
                return cmdPattern.command;
            }
        }

        for (const cmdPattern of ACCESSIBILITY_COMMANDS) {
            if (fuzzyMatch(utterance, cmdPattern.patterns)) {
                return cmdPattern.command;
            }
        }

        if (context.state === 'QUESTION') {
            const submitPatterns = [/submit/i, /check answer/i, /lock it in/i, /confirm/i];
            if (submitPatterns.some(p => utterance.match(p))) {
                return { type: 'answer', action: 'submit_answer' };
            }

            if (context.questionType === 'mcq') {
                const answerCmd = parseAnswer(utterance);
                if (answerCmd) {
                    return answerCmd;
                }
            } else if (context.questionType === 'fill_in_blank') {
                return parseFillInAnswer(utterance);
            }
        }

        return null;
    }

    public getHelpText(state: string): string {
        const baseCommands = [
            'Say next to continue',
            'Say repeat to hear again',
            'Say pause to pause',
            'Say faster or slower to adjust speed',
            'Say ask doubt to ask AI about the topic',
            'Say camera on or camera off to toggle camera',
        ];

        if (state === 'QUESTION') {
            return 'You can answer by saying option A, option B, and so on. ' +
                'You can also say repeat to hear the question again, or help for more options.';
        }

        if (state === 'PAUSED') {
            return 'Say resume to continue learning, or say help for more options.';
        }

        if (state === 'TEACHING') {
            return 'Available commands: ' + baseCommands.join('. ') +
                '. Say help anytime for assistance.';
        }

        return 'Say start to begin the lesson, or say help for available commands.';
    }

    public getNavigationCommands(): string[] {
        return NAVIGATION_COMMANDS.map(cmd => cmd.patterns[0]);
    }

    public getAccessibilityCommands(): string[] {
        return ACCESSIBILITY_COMMANDS.map(cmd => cmd.patterns[0]);
    }
}
