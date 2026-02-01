import type { VoiceState, VoiceCommand } from '@/types/voice';

export interface StateTransition {
    fromState: VoiceState;
    command: string;
    toState: VoiceState;
}

export interface StateMachineConfig {
    onStateChange?: (oldState: VoiceState, newState: VoiceState) => void;
    onPromptNeeded?: (prompt: string) => void;
    onAction?: (action: string, parameters?: Record<string, any>) => void;
}

export class VoiceTeachingStateMachine {
    private currentState: VoiceState = 'IDLE';
    private config: StateMachineConfig;

    constructor(config: StateMachineConfig = {}) {
        this.config = config;
    }

    public getState(): VoiceState {
        return this.currentState;
    }

    public processCommand(command: VoiceCommand): boolean {
        const { action, parameters } = command;

        switch (this.currentState) {
            case 'IDLE':
                return this.handleIdleCommand(action, parameters);

            case 'TEACHING':
                return this.handleTeachingCommand(action, parameters);

            case 'QUESTION':
                return this.handleQuestionCommand(action, parameters);

            case 'PAUSED':
                return this.handlePausedCommand(action, parameters);

            case 'COMPLETED':
                return this.handleCompletedCommand(action, parameters);

            case 'ERROR':
                return this.handleErrorCommand(action, parameters);

            default:
                return false;
        }
    }

    private handleIdleCommand(action: string, _parameters?: Record<string, any>): boolean {
        if (action === 'start') {
            this.transitionTo('TEACHING');
            this.triggerAction('start_lesson');
            return true;
        }
        return false;
    }

    private handleTeachingCommand(action: string, _parameters?: Record<string, any>): boolean {
        switch (action) {
            case 'next':
                this.triggerAction('next_block');
                return true;

            case 'next_lesson':
                this.triggerAction('next_lesson');
                return true;

            case 'previous_lesson':
                this.triggerAction('previous_lesson');
                return true;

            case 'repeat':
                this.triggerAction('repeat_block');
                return true;

            case 'pause':
                this.transitionTo('PAUSED');
                this.triggerAction('pause_speech');
                return true;

            case 'back':
                this.triggerAction('previous_block');
                return true;

            case 'speed_up':
                this.triggerAction('adjust_speed', { delta: 0.2 });
                return true;

            case 'slow_down':
                this.triggerAction('adjust_speed', { delta: -0.2 });
                return true;

            case 'verbosity_detailed':
                this.triggerAction('set_verbosity', { level: 'detailed' });
                return true;

            case 'verbosity_short':
                this.triggerAction('set_verbosity', { level: 'short' });
                return true;

            case 'verbosity_normal':
                this.triggerAction('set_verbosity', { level: 'normal' });
                return true;

            case 'help':
                this.triggerAction('show_help');
                return true;

            case 'open_settings':
                this.triggerAction('open_settings');
                return true;

            case 'camera_on':
            case 'camera_off':
                this.triggerAction('toggle_camera');
                return true;

            case 'ask_ai':
                this.triggerAction('ask_ai');
                return true;

            default:
                return false;
        }
    }

    private handleQuestionCommand(action: string, parameters?: Record<string, any>): boolean {
        switch (action) {
            case 'select_option':
                this.triggerAction('submit_answer', parameters);
                return true;

            case 'fill_in':
                this.triggerAction('submit_answer', parameters);
                return true;

            case 'repeat':
                this.triggerAction('repeat_question');
                return true;

            case 'help':
                this.triggerAction('show_help');
                return true;

            case 'speed_up':
            case 'slow_down':
                return this.handleTeachingCommand(action, parameters);

            default:
                return false;
        }
    }

    private handlePausedCommand(action: string, _parameters?: Record<string, any>): boolean {
        if (action === 'resume') {
            this.transitionTo('TEACHING');
            this.triggerAction('resume_speech');
            return true;
        }

        if (action === 'help') {
            this.triggerAction('show_help');
            return true;
        }

        return false;
    }

    private handleCompletedCommand(action: string, _parameters?: Record<string, any>): boolean {
        if (action === 'next') {
            this.triggerAction('next_lesson');
            return true;
        }
        return false;
    }

    private handleErrorCommand(action: string, _parameters?: Record<string, any>): boolean {
        if (action === 'start') {
            this.transitionTo('IDLE');
            return true;
        }

        if (action === 'help') {
            this.triggerAction('show_help');
            return true;
        }

        return false;
    }

    public transitionTo(newState: VoiceState): void {
        const oldState = this.currentState;

        if (oldState === newState) return;

        this.currentState = newState;

        if (this.config.onStateChange) {
            this.config.onStateChange(oldState, newState);
        }

        this.triggerStatePrompt(newState);
    }

    private triggerStatePrompt(state: VoiceState): void {
        let prompt = '';

        switch (state) {
            case 'IDLE':
                prompt = 'Voice mode ready. Say start to begin the lesson.';
                break;

            case 'TEACHING':
                prompt = 'Continuing lesson. Say next to continue or pause to stop.';
                break;

            case 'QUESTION':
                prompt = 'Please answer the question. Say repeat to hear it again.';
                break;

            case 'PAUSED':
                prompt = 'Lesson paused. Say resume to continue.';
                break;

            case 'COMPLETED':
                prompt = 'Lesson completed! Say next for the next lesson.';
                break;

            case 'ERROR':
                prompt = 'An error occurred. Say start to restart or help for assistance.';
                break;
        }

        if (prompt && this.config.onPromptNeeded) {
            this.config.onPromptNeeded(prompt);
        }
    }

    private triggerAction(action: string, parameters?: Record<string, any>): void {
        if (this.config.onAction) {
            this.config.onAction(action, parameters);
        }
    }

    public getAllowedCommands(): string[] {
        switch (this.currentState) {
            case 'IDLE':
                return ['start', 'help'];

            case 'TEACHING':
                return ['next', 'repeat', 'pause', 'back', 'help', 'speed_up', 'slow_down', 'camera_on', 'camera_off', 'ask_ai'];

            case 'QUESTION':
                return ['answer', 'repeat', 'help'];

            case 'PAUSED':
                return ['resume', 'help'];

            case 'COMPLETED':
                return ['next'];

            case 'ERROR':
                return ['start', 'help'];

            default:
                return [];
        }
    }

    public reset(): void {
        this.transitionTo('IDLE');
    }
}
