/**
 * Code Templates & Starter Boilerplates for Code Editor Backend
 * Optimized specifically for Python 3.12.0, GCC 10.2.0 (C/C++), and Java 15.0.2
 */

const TEMPLATES = {
    python: {
        language: 'python',
        version: '3.12.0',
        filename: 'main.py',
        template: `# Python 3.12.0 Starter Code
from typing import List, Optional

def main() -> None:
    print("Hello from Python 3.12.0!")
    
    # Python 3.12 Type Parameter & F-String expression capabilities
    numbers: List[int] = [10, 20, 30]
    total = calculate_sum(numbers)
    print(f"Calculated Sum of {numbers = }: {total}")

def calculate_sum(numbers: List[int]) -> int:
    return sum(numbers)

if __name__ == "__main__":
    main()
`,
        snippets: [
            {
                name: 'Python 3.12 Match-Case Statement',
                code: `match status_code:\n    case 200:\n        print("Success")\n    case 404:\n        print("Not Found")\n    case _:\n        print("Other Status")`
            },
            {
                name: 'Python 3.12 Type Statement',
                code: 'type Point = tuple[float, float]'
            },
            {
                name: 'Read Stdin Lines',
                code: 'import sys\nfor line in sys.stdin:\n    print(line.strip())'
            }
        ]
    },
    c: {
        language: 'c',
        version: '10.2.0',
        filename: 'main.c',
        template: `/* C Starter Code (GCC 10.2.0 - C17) */
#include <stdio.h>
#include <stdlib.h>

int calculate_sum(int a, int b) {
    return a + b;
}

int main(void) {
    printf("Hello from C (GCC 10.2.0)!\\n");
    
    int result = calculate_sum(10, 20);
    printf("Sum: %d\\n", result);
    
    return 0;
}
`,
        snippets: [
            {
                name: 'Read Input Integer',
                code: 'int val;\nif (scanf("%d", &val) == 1) {\n    printf("Input: %d\\n", val);\n}'
            },
            {
                name: 'Dynamic Allocation',
                code: 'int *arr = (int *)malloc(n * sizeof(int));\nif (arr != NULL) {\n    free(arr);\n}'
            }
        ]
    },
    cpp: {
        language: 'cpp',
        version: '10.2.0',
        filename: 'main.cpp',
        template: `// C++ Starter Code (GCC 10.2.0 - C++20)
#include <iostream>
#include <vector>
#include <numeric>

int calculateSum(const std::vector<int>& vec) {
    return std::accumulate(vec.begin(), vec.end(), 0);
}

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);

    std::cout << "Hello from C++20 (GCC 10.2.0)!" << std::endl;

    std::vector<int> numbers = {10, 20, 30};
    int total = calculateSum(numbers);

    std::cout << "Sum: " << total << std::endl;

    return 0;
}
`,
        snippets: [
            {
                name: 'Fast I/O',
                code: 'std::ios_base::sync_with_stdio(false);\nstd::cin.tie(NULL);'
            },
            {
                name: 'Vector Range Loop',
                code: 'for (const auto& num : numbers) {\n    std::cout << num << " ";\n}'
            }
        ]
    },
    java: {
        language: 'java',
        version: '15.0.2',
        filename: 'Main.java',
        template: `// Java 15.0.2 Starter Code
import java.util.List;
import java.util.Scanner;

public class Main {
    
    // Java Record (Preview in Java 15)
    public record Point(int x, int y) {}

    public static void main(String[] args) {
        // Java 15 Text Block
        String banner = """
            ===============================
            Hello from Java 15.0.2 Portal!
            ===============================
            """;
        System.out.println(banner);

        Point p = new Point(10, 20);
        System.out.println("Point Coordinates: " + p.x() + ", " + p.y());
    }
}
`,
        snippets: [
            {
                name: 'Java 15 Text Block',
                code: 'String text = """\n    Line 1\n    Line 2\n    """;'
            },
            {
                name: 'Java 15 Record',
                code: 'public record User(String name, int age) {}'
            },
            {
                name: 'Scanner Input',
                code: 'Scanner scanner = new Scanner(System.in);\nif (scanner.hasNextInt()) {\n    int val = scanner.nextInt();\n}'
            }
        ]
    },
    javascript: {
        language: 'javascript',
        version: '*',
        filename: 'main.js',
        template: `// JavaScript (Node.js) Starter Code
function main() {
    console.log("Hello, World!");
    
    const result = calculateSum(10, 20);
    console.log("Sum:", result);
}

function calculateSum(a, b) {
    return a + b;
}

main();
`,
        snippets: []
    },
    go: {
        language: 'go',
        version: '*',
        filename: 'main.go',
        template: `// Go Starter Code
package main

import "fmt"

func main() {
	fmt.Println("Hello from Go!")
}
`,
        snippets: []
    }
};

// Aliases mapping
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

function getTemplate(lang) {
    if (!lang) return null;
    const normalized = lang.toLowerCase().trim();
    const key = ALIASES[normalized] || normalized;
    return TEMPLATES[key] || null;
}

function getAllTemplates() {
    return Object.keys(TEMPLATES).map(key => ({
        key,
        language: TEMPLATES[key].language,
        version: TEMPLATES[key].version,
        filename: TEMPLATES[key].filename,
        hasSnippets: (TEMPLATES[key].snippets || []).length > 0
    }));
}

module.exports = {
    TEMPLATES,
    getTemplate,
    getAllTemplates
};
