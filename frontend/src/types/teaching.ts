export interface ParagraphBlock {
    type: 'paragraph';
    content: string;
}

export interface FormulaBlock {
    type: 'formula';
    formula: string;
    explanation: string;
}

export interface InsightBlock {
    type: 'insight';
    content: string;
}

export interface ListBlock {
    type: 'list';
    items: string[];
}

export interface SimulationBlock {
    type: 'simulation';
    html: string;
    description: string;
}

export interface QuestionExplanations {
    correct: string;
    incorrect?: string[];
}

export interface QuestionBlock {
    type: 'question';
    questionType: 'mcq' | 'fill_in_blank';
    question: string;
    options?: string[];
    correctIndex?: number;
    correctAnswer?: string;
    explanations: QuestionExplanations;
}

export type TeachingBlock =
    | ParagraphBlock
    | FormulaBlock
    | InsightBlock
    | ListBlock
    | SimulationBlock
    | QuestionBlock;

export interface TeachingContent {
    blocks: TeachingBlock[];
    cached: boolean;
}
