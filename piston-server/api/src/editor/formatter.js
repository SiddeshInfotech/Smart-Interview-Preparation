/**
 * Code Formatter & Beautification Engine
 */

function formatCode(code, language, options = {}) {
    if (!code || typeof code !== 'string') {
        return { formattedCode: code || '', modified: false };
    }

    const indentSize = options.tabSize || options.indentSize || 4;
    const useTabs = !!options.useTabs;
    const indentUnit = useTabs ? '\t' : ' '.repeat(indentSize);
    const langKey = (language || 'javascript').toLowerCase().trim();

    const lines = code.split(/\r?\n/);
    let currentIndent = 0;
    const formattedLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (line.length === 0) {
            formattedLines.push('');
            continue;
        }

        // Language specific formatting rules
        if (['c', 'cpp', 'c++', 'java', 'javascript', 'typescript', 'csharp', 'go', 'php'].includes(langKey)) {
            // Decrease indent before printing if closing brace
            if (line.startsWith('}') || line.startsWith(']')) {
                currentIndent = Math.max(0, currentIndent - 1);
            }

            formattedLines.push(indentUnit.repeat(currentIndent) + line);

            // Count open and close braces in line (ignore strings simplified)
            const openCount = (line.match(/[\{\[]/g) || []).length;
            const closeCount = (line.match(/[\}\]]/g) || []).length;

            if (!line.startsWith('}') && !line.startsWith(']')) {
                currentIndent = Math.max(0, currentIndent + openCount - closeCount);
            } else {
                currentIndent = Math.max(0, currentIndent + openCount);
            }
        } else if (['python', 'py', 'ruby'].includes(langKey)) {
            // Normalize trailing whitespace
            formattedLines.push(lines[i].trimEnd());
        } else {
            formattedLines.push(line);
        }
    }

    const formattedCode = formattedLines.join('\n');

    return {
        formattedCode,
        modified: formattedCode !== code
    };
}

module.exports = {
    formatCode
};
