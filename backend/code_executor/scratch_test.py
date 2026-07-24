import requests

def test_exec(lang, code, inp):
    res = requests.post('http://127.0.0.1:8001/execute', json={
        'language': lang,
        'code': code,
        'input': inp
    }, timeout=30)
    print(f"[{lang.upper()} TEST RESULTS]:")
    print(res.json())
    print("-" * 50)

# C test
c_code = """#include <stdio.h>
int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("Sum: %d", a + b);
    return 0;
}"""
test_exec('c', c_code, '10\n20')

# C++ test
cpp_code = """#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    cout << "Number: " << n << endl;
    return 0;
}"""
test_exec('cpp', cpp_code, '42')
