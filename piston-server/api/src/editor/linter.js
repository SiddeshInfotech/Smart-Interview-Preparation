/**
 * Static Code Linting & Syntax Validation Service
 * Optimized for Python 3.12.0, GCC 10.2.0 (C/C++), and Java 15.0.2
 */

function lintCode(code, language) {
    const diagnostics = [];

    if (!code || typeof code !== 'string' || !code.trim()) {
        diagnostics.push({
            line: 1,
            column: 1,
            severity: 'warning',
            message: 'Source code file is empty.'
        });
        return {
            valid: true,
            diagnostics
        };
    }

    const lines = code.split('\n');
    const langKey = (language || 'python').toLowerCase().trim();

    // 1. Bracket, Parentheses, Brace & Quote Matching
    const stack = [];
    const openBrackets = ['(', '{', '['];
    const closeBrackets = [')', '}', ']'];
    const matching = { ')': '(', '}': '{', ']': '[' };

    let inJavaTextBlock = false;
    let inPyTripleQuote = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Java 15 Text Block (""") check
        if (langKey === 'java' && line.includes('"""')) {
            const count = (line.match(/"""/g) || []).length;
            if (count % 2 !== 0) {
                inJavaTextBlock = !inJavaTextBlock;
            }
            if (inJavaTextBlock) continue;
        }

        // Python 3.12 Triple Quote string check
        if (langKey.includes('python') && (line.includes('"""') || line.includes("'''"))) {
            const count3 = (line.match(/"""/g) || []).length + (line.match(/'''/g) || []).length;
            if (count3 % 2 !== 0) {
                inPyTripleQuote = !inPyTripleQuote;
            }
            if (inPyTripleQuote) continue;
        }

        if (inJavaTextBlock || inPyTripleQuote) continue;

        for (let col = 0; col < line.length; col++) {
            const char = line[col];

            // String skip check
            if (char === '"' || char === "'") {
                col = skipString(line, col, char);
                continue;
            }

            if (openBrackets.includes(char)) {
                stack.push({ char, line: i + 1, col: col + 1 });
            } else if (closeBrackets.includes(char)) {
                if (stack.length === 0) {
                    diagnostics.push({
                        line: i + 1,
                        column: col + 1,
                        severity: 'error',
                        message: `Unmatched closing bracket '${char}'`
                    });
                } else {
                    const top = stack.pop();
                    if (top.char !== matching[char]) {
                        diagnostics.push({
                            line: i + 1,
                            column: col + 1,
                            severity: 'error',
                            message: `Mismatched bracket '${char}'. Expected closing for '${top.char}' from line ${top.line}`
                        });
                    }
                }
            }
        }
    }

    if (inJavaTextBlock) {
        diagnostics.push({
            line: lines.length,
            column: 1,
            severity: 'error',
            message: 'Unclosed Java 15 Text Block (""")'
        });
    }

    if (inPyTripleQuote) {
        diagnostics.push({
            line: lines.length,
            column: 1,
            severity: 'error',
            message: 'Unclosed Python triple-quoted string (""" or \'\'\')'
        });
    }

    while (stack.length > 0) {
        const unclosed = stack.pop();
        diagnostics.push({
            line: unclosed.line,
            column: unclosed.col,
            severity: 'error',
            message: `Unclosed bracket '${unclosed.char}'`
        });
    }

    // 2. Language Specific Static Rules
    if (langKey.includes('python') || langKey === 'py') {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('\t') && line.startsWith(' ')) {
                diagnostics.push({
                    line: i + 1,
                    column: 1,
                    severity: 'warning',
                    message: 'Mixed spaces and tabs in Python indentation.'
                });
            }
            // Python 3.12 colon block check (including match/case)
            if (line.trim().endsWith(':') && i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                if (nextLine.trim() && getIndent(nextLine) <= getIndent(line)) {
                    diagnostics.push({
                        line: i + 2,
                        column: 1,
                        severity: 'warning',
                        message: 'Expected an indented block after colons.'
                    });
                }
            }
        }
    } else if (langKey === 'c' || langKey === 'cpp' || langKey === 'c++' || langKey === 'gcc') {
        if (!code.includes('main')) {
            diagnostics.push({
                line: 1,
                column: 1,
                severity: 'warning',
                message: 'No main() function entry point detected in GCC source file.'
            });
        }
    } else if (langKey === 'java') {
        if (!code.includes('class ') && !code.includes('record ')) {
            diagnostics.push({
                line: 1,
                column: 1,
                severity: 'warning',
                message: 'Java 15 file must declare a class or record.'
            });
        }
        if (!code.includes('public static void main')) {
            diagnostics.push({
                line: 1,
                column: 1,
                severity: 'warning',
                message: 'No public static void main method found in Java file.'
            });
        }
    }

    const errorsCount = diagnostics.filter(d => d.severity === 'error').length;

    return {
        valid: errorsCount === 0,
        errorsCount,
        warningsCount: diagnostics.filter(d => d.severity === 'warning').length,
        diagnostics
    };
}

function skipString(line, startCol, quoteChar) {
    let i = startCol + 1;
    while (i < line.length) {
        if (line[i] === quoteChar && line[i - 1] !== '\\') {
            return i;
        }
        i++;
    }
    return line.length - 1;
}

function getIndent(line) {
    let count = 0;
    for (let char of line) {
        if (char === ' ') count++;
        else if (char === '\t') count += 4;
        else break;
    }
    return count;
}

module.exports = {
    lintCode
};
