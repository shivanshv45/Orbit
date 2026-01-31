/**
 * Format LaTeX formulas into readable Unicode mathematical notation
 */

export function formatFormula(latex: string): string {
    let formatted = latex;

    // Handle \text{} command - extract text content
    formatted = formatted.replace(/\\text\s*\{([^}]*)\}/g, ' $1 ');

    // Handle \vec{} command - use hat accent (^ above) which has better font support
    formatted = formatted.replace(/\\vec\s*\{([A-Za-z])\}/g, (match, letter) => {
        // Use letter with combining circumflex accent (hat symbol above)
        return letter + '\u0302'; // Combining circumflex accent
    });

    // Handle \mathbf{} command - bold the letter  
    formatted = formatted.replace(/\\mathbf\s*\{([^}]+)\}/g, '**$1**');

    // Handle fractions \frac{a}{b} -> (a)/(b)
    formatted = formatted.replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, '($1)/($2)');

    // Spacing commands
    formatted = formatted.replace(/\\quad/g, '    ');
    formatted = formatted.replace(/\\qquad/g, '        ');

    // Greek letters
    formatted = formatted.replace(/\\alpha/g, 'α');
    formatted = formatted.replace(/\\beta/g, 'β');
    formatted = formatted.replace(/\\gamma/g, 'γ');
    formatted = formatted.replace(/\\delta/g, 'δ');
    formatted = formatted.replace(/\\epsilon/g, 'ε');
    formatted = formatted.replace(/\\theta/g, 'θ');
    formatted = formatted.replace(/\\lambda/g, 'λ');
    formatted = formatted.replace(/\\mu/g, 'μ');
    formatted = formatted.replace(/\\pi/g, 'π');
    formatted = formatted.replace(/\\rho/g, 'ρ');
    formatted = formatted.replace(/\\sigma/g, 'σ');
    formatted = formatted.replace(/\\tau/g, 'τ');
    formatted = formatted.replace(/\\phi/g, 'φ');
    formatted = formatted.replace(/\\omega/g, 'ω');
    formatted = formatted.replace(/\\Gamma/g, 'Γ');
    formatted = formatted.replace(/\\Delta/g, 'Δ');
    formatted = formatted.replace(/\\Theta/g, 'Θ');
    formatted = formatted.replace(/\\Lambda/g, 'Λ');
    formatted = formatted.replace(/\\Sigma/g, 'Σ');
    formatted = formatted.replace(/\\Omega/g, 'Ω');

    // Trig functions
    formatted = formatted.replace(/\\sin/g, 'sin');
    formatted = formatted.replace(/\\cos/g, 'cos');
    formatted = formatted.replace(/\\tan/g, 'tan');
    formatted = formatted.replace(/\\log/g, 'log');
    formatted = formatted.replace(/\\ln/g, 'ln');

    // Math symbols
    formatted = formatted.replace(/\\sqrt/g, '√');
    formatted = formatted.replace(/\\infty/g, '∞');
    formatted = formatted.replace(/\\cdot/g, '·');
    formatted = formatted.replace(/\\times/g, '×');
    formatted = formatted.replace(/\\div/g, '÷');
    formatted = formatted.replace(/\\pm/g, '±');
    formatted = formatted.replace(/\\leq/g, '≤');
    formatted = formatted.replace(/\\geq/g, '≥');
    formatted = formatted.replace(/\\neq/g, '≠');
    formatted = formatted.replace(/\\approx/g, '≈');
    formatted = formatted.replace(/\\partial/g, '∂');
    formatted = formatted.replace(/\\nabla/g, '∇');
    formatted = formatted.replace(/\\int/g, '∫');
    formatted = formatted.replace(/\\sum/g, '∑');
    formatted = formatted.replace(/\\to/g, '→');

    // Remove curly braces
    formatted = formatted.replace(/\{/g, '');
    formatted = formatted.replace(/\}/g, '');

    // Remove backslashes  
    formatted = formatted.replace(/\\/g, '');

    return formatted.trim();
}
