export interface Subtopic {
    id: string;
    title: string;
    score: number;
    position: number;
    status: 'available' | 'in-progress' | 'completed' | 'locked';
}

export interface Module {
    id: string;
    title: string;
    position: number;
    subtopics: Subtopic[];
}

export interface Curriculum {
    modules: Module[];
}
