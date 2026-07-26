/**
 * Structural Code Analysis & Metrics Engine
 * Optimized for Python 3.12.0, GCC 10.2.0 (C/C++), and Java 15.0.2
 */

function analyzeCode(code, language) {
    if (!code || typeof code !== 'string') {
        return {
            linesCount: 0,
            codeLines: 0,
            commentLines: 0,
            blankLines: 0,
            characterCount: 0,
            functions: [],
            estimatedComplexity: 1,
            securityAlerts: []
        };
    }

    const lines = code.split(/\r?\n/);
    const langKey = (language || 'python').toLowerCase().trim();

    let commentLines = 0;
    let blankLines = 0;
    let codeLines = 0;
    let inBlockComment = false;

    const functions = [];
    const securityAlerts = [];
    let decisionPoints = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line) {
            blankLines++;
            continue;
        }

        // Multi-line comment tracking
        if (inBlockComment) {
            commentLines++;
            if (line.includes('*/') || line.includes('"""') || line.includes("'''")) {
                inBlockComment = false;
            }
            continue;
        }

        if (line.startsWith('/*') || (langKey.includes('python') && (line.startsWith('"""') || line.startsWith("'''")))) {
            commentLines++;
            if (!line.endsWith('*/') && !line.endsWith('"""') && !line.endsWith("'''")) {
                inBlockComment = true;
            }
            continue;
        }

        // Single line comments
        if (line.startsWith('//') || line.startsWith('#') || line.startsWith('--')) {
            commentLines++;
            continue;
        }

        codeLines++;

        // Decision point tracking for Cyclomatic Complexity estimation (including Python 3.12 match/case & Java 15 switch expressions)
        if (/\b(if|elif|else if|while|for|switch|case|catch|&&|\|\||match)\b/.test(line)) {
            decisionPoints++;
        }

        // Function & Record extraction patterns
        let fnMatch;
        if (langKey.includes('python')) {
            fnMatch = line.match(/^def\s+([a-zA-Z0-9_]+)\s*\(/);
        } else if (langKey.includes('c') || langKey.includes('cpp') || langKey.includes('gcc')) {
            fnMatch = line.match(/(?:function|void|int|float|double|char|auto|bool|size_t)\s+([a-zA-Z0-9_]+)\s*\(/);
        } else if (langKey.includes('java')) {
            fnMatch = line.match(/(?:public|private|protected|static|final|\s)+\s+(?:[a-zA-Z0-9_<>]+)\s+([a-zA-Z0-9_]+)\s*\(/);
            // Also extract Java 15 Record definitions
            const recMatch = line.match(/public\s+record\s+([a-zA-Z0-9_]+)/);
            if (recMatch && recMatch[1]) {
                functions.push({
                    name: `Record: ${recMatch[1]}`,
                    line: i + 1
                });
            }
        } else if (langKey.includes('go')) {
            fnMatch = line.match(/^func\s+([a-zA-Z0-9_]+)\s*\(/);
        }

        if (fnMatch && fnMatch[1] && !['if', 'for', 'while', 'switch', 'catch', 'match'].includes(fnMatch[1])) {
            functions.push({
                name: fnMatch[1],
                line: i + 1
            });
        }

        // Security / Dangerous calls audit
        if (/\b(eval|exec|system|popen|subprocess|unlink|rmdir)\b/.test(line)) {
            securityAlerts.push({
                line: i + 1,
                snippet: line.substring(0, 50),
                warning: `Use of potentially restricted system call '${line.match(/\b(eval|exec|system|popen|subprocess|unlink|rmdir)\b/)[0]}'`
            });
        }
    }

    return {
        linesCount: lines.length,
        codeLines,
        commentLines,
        blankLines,
        characterCount: code.length,
        functions,
        estimatedComplexity: decisionPoints + 1,
        securityAlerts
    };
}

module.exports = {
    analyzeCode
};
