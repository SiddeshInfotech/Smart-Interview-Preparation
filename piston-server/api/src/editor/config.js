/**
 * Code Editor Settings & Language Metadata Specification Provider
 * Optimized for Python 3.12.0, GCC 10.2.0 (C/C++), and Java 15.0.2
 */

const LANGUAGE_SPECS = {
    python: {
        name: 'Python 3.12',
        targetVersion: '3.12.0',
        pistonAlias: 'python',
        monacoMode: 'python',
        aceMode: 'python',
        extension: '.py',
        tabSize: 4,
        insertSpaces: true,
        lineComment: '#',
        blockComment: ['"""', '"""'],
        autoCompleteKeywords: [
            'def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else',
            'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'lambda',
            'yield', 'async', 'await', 'match', 'case', 'type', 'print', 'len',
            'range', 'enumerate', 'zip', 'map', 'filter', 'isinstance', 'type'
        ]
    },
    c: {
        name: 'C (GCC 10.2)',
        targetVersion: '10.2.0',
        pistonAlias: 'gcc',
        monacoMode: 'c',
        aceMode: 'c_cpp',
        extension: '.c',
        tabSize: 4,
        insertSpaces: true,
        lineComment: '//',
        blockComment: ['/*', '*/'],
        autoCompleteKeywords: [
            '#include', 'int', 'char', 'float', 'double', 'void', 'struct',
            'typedef', 'return', 'if', 'else', 'for', 'while', 'do', 'switch',
            'case', 'break', 'printf', 'scanf', 'malloc', 'free', 'sizeof'
        ]
    },
    cpp: {
        name: 'C++ (GCC 10.2 / C++20)',
        targetVersion: '10.2.0',
        pistonAlias: 'gcc',
        monacoMode: 'cpp',
        aceMode: 'c_cpp',
        extension: '.cpp',
        tabSize: 4,
        insertSpaces: true,
        lineComment: '//',
        blockComment: ['/*', '*/'],
        autoCompleteKeywords: [
            '#include', 'std::cout', 'std::cin', 'std::vector', 'std::string',
            'std::map', 'std::set', 'std::unordered_map', 'class', 'public',
            'private', 'protected', 'namespace', 'template', 'concept', 'requires',
            'co_await', 'co_return', 'auto', 'const', 'constexpr', 'return'
        ]
    },
    java: {
        name: 'Java 15',
        targetVersion: '15.0.2',
        pistonAlias: 'java',
        monacoMode: 'java',
        aceMode: 'java',
        extension: '.java',
        tabSize: 4,
        insertSpaces: true,
        lineComment: '//',
        blockComment: ['/*', '*/'],
        autoCompleteKeywords: [
            'public', 'class', 'record', 'sealed', 'permits', 'non-sealed',
            'static', 'void', 'main', 'System.out.println', 'int', 'String',
            'double', 'boolean', 'return', 'import', 'new', 'final', 'interface'
        ]
    },
    javascript: {
        name: 'JavaScript (Node.js)',
        targetVersion: '*',
        pistonAlias: 'javascript',
        monacoMode: 'javascript',
        aceMode: 'javascript',
        extension: '.js',
        tabSize: 2,
        insertSpaces: true,
        lineComment: '//',
        blockComment: ['/*', '*/'],
        autoCompleteKeywords: [
            'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for',
            'while', 'switch', 'case', 'break', 'class', 'import', 'export',
            'async', 'await', 'try', 'catch', 'console.log', 'Promise'
        ]
    },
    go: {
        name: 'Go',
        targetVersion: '*',
        pistonAlias: 'go',
        monacoMode: 'go',
        aceMode: 'golang',
        extension: '.go',
        tabSize: 4,
        insertSpaces: false,
        lineComment: '//',
        blockComment: ['/*', '*/'],
        autoCompleteKeywords: [
            'package', 'import', 'func', 'main', 'var', 'const', 'type',
            'struct', 'interface', 'return', 'fmt.Println', 'range'
        ]
    }
};

// Language alias dictionary
const ALIASES = {
    py: 'python',
    python3: 'python',
    py3: 'python',
    gcc: 'c',
    'c++': 'cpp',
    js: 'javascript',
    node: 'javascript',
    golang: 'go'
};

function getEditorConfig(language) {
    if (!language) {
        return {
            defaultTheme: 'vs-dark',
            fontSize: 14,
            minimap: { enabled: true },
            lineNumbers: 'on',
            languages: LANGUAGE_SPECS
        };
    }

    const norm = language.toLowerCase().trim();
    const key = ALIASES[norm] || norm;

    return LANGUAGE_SPECS[key] || {
        name: language,
        targetVersion: '*',
        monacoMode: 'plaintext',
        extension: '.txt',
        tabSize: 4,
        insertSpaces: true,
        lineComment: '//',
        autoCompleteKeywords: []
    };
}

module.exports = {
    LANGUAGE_SPECS,
    getEditorConfig
};
