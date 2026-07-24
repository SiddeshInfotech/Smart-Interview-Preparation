from app.services.executor import execute_code
from app.schemas.execute_schema import CodeExecutionRequest


tests = [

    {
        "language": "python",
        "code": """
name = input()
print("Hello", name)
""",
        "input": "Python User"
    },


    {
        "language": "java",
        "code": """
import java.util.*;

public class Main {

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        String name = sc.nextLine();

        System.out.println("Hello " + name);

    }
}
""",
        "input": "Java User"
    },


    {
        "language": "c",
        "code": """
#include <stdio.h>

int main()
{
    char name[50];

    scanf("%s", name);

    printf("Hello %s", name);

    return 0;
}
""",
        "input": "C User"
    },


    {
        "language": "cpp",
        "code": """
#include <iostream>
using namespace std;

int main()
{
    string name;

    cin >> name;

    cout << "Hello " << name;

    return 0;
}
""",
        "input": "CPP User"
    }

]


for test in tests:

    print("\n====================")
    print("Testing:", test["language"])
    print("====================")


    request = CodeExecutionRequest(

        language=test["language"],

        code=test["code"],

        input=test["input"]

    )


    response = execute_code(request)


    print(response)