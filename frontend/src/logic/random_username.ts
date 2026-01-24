const firstnames: string[] = ["Orbit", "Nova", "Luna", "Neo", "Zen", "Astro", "Astra", "Vega", "Sol", "Cosmo",
    "Echo", "Lyra", "Sora", "Kairo", "Riven", "Aiden", "Arlo", "Milo", "Zayn", "Iris",
    "Elio", "Nico", "Raya", "Skye", "Juno", "Cleo", "Ari", "Theo", "Eren", "Kael",
    "Kian", "Noel", "Rey", "Sage", "Wren", "Finn", "Ezra", "Jade", "Kira", "Maya",
    "Ayla", "Nora", "Vian", "Rin", "Tara", "Zara", "Lior", "Dara", "Rhea", "Eira",
    "Zeno", "Aero", "Rune", "Dusk", "Dawn", "Blaze", "Storm", "Frost", "Onyx", "Slate",
    "Ivory", "Cinder", "Ember", "Axiom", "Pixel", "Byte", "Cipher", "Vector", "Quark", "Neon",
    "Pulse", "Flux", "Glitch", "Comet", "Meteor", "Orion", "Altair", "Sirius", "Helios", "Atlas",
    "Zephyr", "Nimbus", "Ray", "Spark", "Drift", "Wave", "Reef", "Tide", "Vale", "Summit",
    "Cove", "Grove", "Stone", "Ridge", "Pine", "Basil", "Olive", "Lotus", "Indigo", "Pearl"];

const lastnames: string[] = ["Learner", "Scholar", "Thinker", "Reader", "Writer", "Builder", "Maker", "Creator", "Explorer", "Seeker",
    "Dreamer", "Doer", "Runner", "Climber", "Coder", "Hacker", "Engineer", "Designer", "Artist", "Craft",
    "Fox", "Wolf", "Hawk", "Raven", "Owl", "Falcon", "Tiger", "Panda", "Otter", "Koala",
    "Lion", "Bear", "Shark", "Dolphin", "Whale", "Ray", "Eagle", "Viper", "Cobra", "Dragon",
    "Phoenix", "Hydra", "Griffin", "Kraken", "Sprite", "Ninja", "Samurai", "Viking", "Nomad", "Wanderer",
    "Voyager", "Pilot", "Captain", "Sailor", "Rider", "Driver", "Skater", "Surfer", "Diver", "Scout",
    "Guardian", "Sentinel", "Warden", "Knight", "Squire", "Monk", "Sage", "Oracle", "Wizard", "Alchemist",
    "Cipher", "Vector", "Matrix", "Quark", "Photon", "Neuron", "Circuit", "Signal", "Kernel", "Algorithm",
    "Syntax", "Compiler", "Debugger", "Server", "Client", "Router", "Packet", "Module", "Subtopic", "Chapter",
    "Spark", "Flame", "Ember", "Frost", "Storm", "Thunder", "Breeze", "Nimbus", "Shadow", "Echo"];

const randomFromArray = (arr: string[]): string => {
    return arr[Math.floor(Math.random() * arr.length)];
}

export const randomUserName = (): string => {
    const firstname: string = randomFromArray(firstnames);
    const lastname: string = randomFromArray(lastnames);
    return `${firstname} ${lastname}`;
}
