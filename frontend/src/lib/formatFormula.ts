/**
 * Format LaTeX formulas into readable Unicode mathematical notation
 */

export function formatFormula(latex: string): string {
    let formatted = latex;


    formatted = formatted.replace(/\\text\s*\{([^}]*)\}/g, ' $1 ');
    formatted = formatted.replace(/\\vec\s*\{([A-Za-z])\}/g, '$1\u20D7'); // Combining vector arrow
    formatted = formatted.replace(/\\mathbf\s*\{([^}]+)\}/g, '$1'); // Just text for now, or use bold in UI
    formatted = formatted.replace(/\\mathrm\s*\{([^}]+)\}/g, '$1');
    formatted = formatted.replace(/\\quad/g, '    ');
    formatted = formatted.replace(/\\qquad/g, '        ');
    formatted = formatted.replace(/\\,/g, ' ');
    formatted = formatted.replace(/\\:/g, ' ');
    formatted = formatted.replace(/\\;/g, ' ');


    const replacements: Record<string, string> = {
        '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε',
        '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ', '\\iota': 'ι', '\\kappa': 'κ',
        '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π',
        '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'ϕ',
        '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
        '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ',
        '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Phi': 'Φ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
        '\\sin': 'sin', '\\cos': 'cos', '\\tan': 'tan', '\\cot': 'cot', '\\sec': 'sec', '\\csc': 'csc',
        '\\log': 'log', '\\ln': 'ln',
        '\\sqrt': '√', '\\infty': '∞', '\\cdot': '·', '\\times': '×', '\\div': '÷',
        '\\pm': '±', '\\mp': '∓', '\\leq': '≤', '\\geq': '≥', '\\neq': '≠',
        '\\approx': '≈', '\\equiv': '≡', '\\partial': '∂', '\\nabla': '∇',
        '\\int': '∫', '\\sum': '∑', '\\prod': '∏',
        '\\to': '→', '\\Rightarrow': '⇒', '\\leftrightarrow': '↔', '\\Leftrightarrow': '⇔',
        '\\ell': 'ℓ', '\\hbar': 'ℏ',
    };

    for (const [cmd, repl] of Object.entries(replacements)) {
        formatted = formatted.split(cmd).join(repl);
    }


    while (formatted.includes('\\frac')) {
        formatted = formatted.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)');
    }


    const supers: Record<string, string> = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
    };

    const subs: Record<string, string> = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', 'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 'h': 'ₕ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'p': 'ₚ', 's': 'ₛ', 't': 'ₜ'
    };


    formatted = formatted.replace(/\^\{([^{}]+)\}/g, (_, content) => {
        return content.split('').map((c: string) => supers[c] || '^' + c).join('');
    });
    formatted = formatted.replace(/\^([0-9a-zA-Z])/g, (_, char) => {
        return supers[char] || '^' + char;
    });


    formatted = formatted.replace(/_\{([^{}]+)\}/g, (_, content) => {
        return content.split('').map((c: string) => subs[c] || c).join(''); // Fallback to normal char if no sub available
    });

    formatted = formatted.replace(/_([0-9a-zA-Z])/g, (_, char) => {
        return subs[char] || char;
    });

    formatted = formatted.replace(/_([0-9]+)/g, (_, digits) => {
        return digits.split('').map((d: string) => subs[d] || d).join('');
    });

    formatted = formatted.replace(/_([i-nxyz])/g, (_, char) => {
        return subs[char] || '_' + char;
    });


    formatted = formatted.replace(/\{/g, '');
    formatted = formatted.replace(/\}/g, '');

    formatted = formatted.replace(/\s+/g, ' ');

    return formatted.trim();
}
