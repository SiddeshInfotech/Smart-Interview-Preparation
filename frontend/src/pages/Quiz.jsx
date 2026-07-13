import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Plus
} from 'lucide-react';
import api from '../api/authAPI';
import '../styles/Quiz.css';
import PageNavbar from "../components/PageNavbar.jsx";

const Quiz = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('setup');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [topicSuggestions, setTopicSuggestions] = useState([]);
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionRef = useRef(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [promptText, setPromptText] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timer, setTimer] = useState(900);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);

  // --- Close dropdowns when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowTopicSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Debounced topic suggestions ---
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (newTopic.trim().length >= 1) {
        fetchTopicSuggestions(newTopic.trim());
      } else {
        setTopicSuggestions([]);
        setShowTopicSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [newTopic]);

  const fetchTopicSuggestions = async (query) => {
    setLoadingSuggestions(true);
    try {
      const response = await api.get(`/common/skills/?search=${encodeURIComponent(query)}`);
      setTopicSuggestions(response.data);
      setShowTopicSuggestions(response.data.length > 0);
    } catch (error) {
      console.error("Error fetching topics:", error);
      setTopicSuggestions([]);
      setShowTopicSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addTopicFromSuggestion = (topic) => {
    if (!selectedTopics.some((t) => t.skill_name?.toLowerCase() === topic.skill_name?.toLowerCase() || t.name?.toLowerCase() === topic.skill_name?.toLowerCase())) {
      setSelectedTopics([...selectedTopics, { id: topic.id, name: topic.skill_name }]);
    }
    setNewTopic("");
    setShowTopicSuggestions(false);
  };

  const handleAddTopic = (e) => {
    if (e.key === 'Enter' && newTopic.trim()) {
      const trimmed = newTopic.trim();
      const matched = topicSuggestions.find(
        (t) => t.skill_name.toLowerCase() === trimmed.toLowerCase()
      );
      
      if (matched) {
        addTopicFromSuggestion(matched);
      } else {
        if (!selectedTopics.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
          setSelectedTopics([...selectedTopics, { id: Date.now().toString(), name: trimmed }]);
        }
        setNewTopic('');
        setShowTopicSuggestions(false);
      }
    }
  };

  const removeTopic = (id) => {
    setSelectedTopics(selectedTopics.filter(t => t.id !== id));
  };

  const difficulties = ['Easy', 'Medium', 'Hard'];
  const questionTypes = ['MCQ', 'Coding Challenge', 'Mock Interview'];

  const questionBank = {
    'c': {
      'Easy': {
        'MCQ': [
          { id: 1, text: 'What is the size of int in C?', options: ['2 bytes', '4 bytes', '8 bytes', 'Depends on compiler'], correct: 3, explanation: 'Size of int depends on compiler and architecture.' },
          { id: 2, text: 'Which header file is used for printf()?', options: ['stdio.h', 'stdlib.h', 'string.h', 'math.h'], correct: 0, explanation: 'stdio.h is the standard input/output header.' },
          { id: 3, text: 'What is the correct way to declare a variable in C?', options: ['int x;', 'variable x;', 'x int;', 'declare int x;'], correct: 0, explanation: 'int x; is the correct way to declare an integer variable.' },
          { id: 4, text: 'Which operator is used for address of a variable?', options: ['&', '*', '#', '@'], correct: 0, explanation: '& is the address-of operator in C.' },
          { id: 5, text: 'What is the output of sizeof(char) in C?', options: ['1 byte', '2 bytes', '4 bytes', '8 bytes'], correct: 0, explanation: 'char always occupies 1 byte in C.' }
        ],
        'True False': [
          { id: 1, text: 'C is a statically typed language.', options: ['True', 'False'], correct: 0, explanation: 'C is statically typed.' },
          { id: 2, text: 'C supports object-oriented programming.', options: ['True', 'False'], correct: 1, explanation: 'C is procedural, not object-oriented.' },
          { id: 3, text: 'The main() function is mandatory in C programs.', options: ['True', 'False'], correct: 0, explanation: 'Every C program must have a main() function.' },
          { id: 4, text: 'C is case-sensitive language.', options: ['True', 'False'], correct: 0, explanation: 'C is case-sensitive.' },
          { id: 5, text: 'Comments can be nested in C.', options: ['True', 'False'], correct: 1, explanation: 'Comments cannot be nested in C.' }
        ],
        'Coding': [
          { id: 1, text: 'Write C code to print "Hello World".', options: ['printf("Hello World");', 'print("Hello World");', 'console.log("Hello World");', 'System.out.println("Hello World");'], correct: 0, explanation: 'printf() is used to print in C.' },
          { id: 2, text: 'Write C code to declare an integer variable and assign value 10.', options: ['int x = 10;', 'x = 10;', 'int x; x = 10;', 'Both A and C'], correct: 3, explanation: 'Both int x = 10; and int x; x = 10; are valid.' },
          { id: 3, text: 'Write C code for a for loop that prints 1 to 5.', options: ['for(i=1;i<=5;i++) printf("%d",i);', 'for(i=1;i<5;i++) printf("%d",i);', 'for(i=1;i<=5;i++) print(i);', 'None'], correct: 0, explanation: 'Correct for loop syntax with printf.' },
          { id: 4, text: 'Write C code to create an array of 5 integers.', options: ['int arr[5];', 'array int[5];', 'int arr(5);', 'int arr = [5];'], correct: 0, explanation: 'int arr[5]; declares an array of 5 integers.' },
          { id: 5, text: 'Write C code to add two numbers and store in a variable.', options: ['int sum = a + b;', 'sum = a + b;', 'int sum; sum = a + b;', 'All of the above'], correct: 3, explanation: 'All are valid ways to add two numbers.' }
        ]
      },
      'Medium': {
        'MCQ': [
          { id: 1, text: 'What is a pointer in C?', options: ['A variable that stores address', 'A variable that stores value', 'A function', 'An array'], correct: 0, explanation: 'A pointer stores the memory address of another variable.' },
          { id: 2, text: 'What is the use of malloc() in C?', options: ['Dynamic memory allocation', 'Static memory allocation', 'File handling', 'Error handling'], correct: 0, explanation: 'malloc() is used for dynamic memory allocation.' },
          { id: 3, text: 'Which function is used to free dynamically allocated memory?', options: ['free()', 'delete()', 'clear()', 'remove()'], correct: 0, explanation: 'free() is used to deallocate dynamic memory.' },
          { id: 4, text: 'What is the output of 5/2 in C?', options: ['2', '2.5', '2.0', '3'], correct: 0, explanation: 'Integer division truncates the decimal part.' },
          { id: 5, text: 'Which of the following is a valid string declaration in C?', options: ['char str[] = "Hello";', 'char str[10] = "Hello";', 'char *str = "Hello";', 'All of the above'], correct: 3, explanation: 'All three are valid string declarations.' }
        ],
        'True False': [
          { id: 1, text: 'Pointers can be used for dynamic memory allocation.', options: ['True', 'False'], correct: 0, explanation: 'Pointers are essential for dynamic memory allocation.' },
          { id: 2, text: 'C supports function overloading.', options: ['True', 'False'], correct: 1, explanation: 'C does not support function overloading.' },
          { id: 3, text: 'Arrays in C are passed by reference to functions.', options: ['True', 'False'], correct: 0, explanation: 'Arrays are passed by reference (as pointers).' },
          { id: 4, text: 'C has built-in garbage collection.', options: ['True', 'False'], correct: 1, explanation: 'C does not have automatic garbage collection.' },
          { id: 5, text: 'The const keyword can be used with pointers in C.', options: ['True', 'False'], correct: 0, explanation: 'const can be used with pointers for read-only access.' }
        ],
        'Coding': [
          { id: 1, text: 'Write C code to declare a pointer and assign variable address to it.', options: ['int *ptr = &var;', 'int ptr = &var;', 'int &ptr = var;', 'int *ptr = var;'], correct: 0, explanation: 'int *ptr = &var; declares a pointer and assigns address.' },
          { id: 2, text: 'Write C code to dynamically allocate memory for an integer.', options: ['int *p = malloc(sizeof(int));', 'int *p = malloc(int);', 'int *p = new int;', 'int *p = calloc(int);'], correct: 0, explanation: 'malloc(sizeof(int)) allocates memory for an integer.' },
          { id: 3, text: 'Write C code to free dynamically allocated memory.', options: ['free(p);', 'delete p;', 'free(*p);', 'deallocate(p);'], correct: 0, explanation: 'free() is used to free allocated memory.' },
          { id: 4, text: 'Write C code to declare a 2D array of size 3x3.', options: ['int arr[3][3];', 'int arr[3,3];', 'array[3][3];', 'int arr(3,3);'], correct: 0, explanation: 'int arr[3][3]; declares a 2D array.' },
          { id: 5, text: 'Write C code to swap two numbers using pointers.', options: ['void swap(int *a,int *b){int temp=*a;*a=*b;*b=temp;}', 'void swap(int a,int b){temp=a;a=b;b=temp;}', 'Both A and B', 'None'], correct: 0, explanation: 'Pointers are needed to modify the original variables.' }
        ]
      },
      'Hard': {
        'MCQ': [
          { id: 1, text: 'What is a structure in C?', options: ['A user-defined data type', 'A built-in data type', 'A function', 'An array'], correct: 0, explanation: 'A structure is a user-defined data type.' },
          { id: 2, text: 'What is the purpose of typedef in C?', options: ['Create alias for data type', 'Define a new function', 'Create a new variable', 'Define a structure'], correct: 0, explanation: 'typedef creates an alias for existing data types.' },
          { id: 3, text: 'What are function pointers in C?', options: ['Pointers that point to functions', 'Pointers that store values', 'Functions that return pointers', 'None'], correct: 0, explanation: 'Function pointers store the address of functions.' },
          { id: 4, text: 'What is the difference between calloc() and malloc()?', options: ['calloc initializes to zero', 'calloc allocates more memory', 'No difference', 'malloc initializes to zero'], correct: 0, explanation: 'calloc() initializes allocated memory to zero.' },
          { id: 5, text: 'What is the use of the volatile keyword in C?', options: ['Prevent compiler optimization', 'Create volatile variables', 'Optimize code', 'None'], correct: 0, explanation: 'volatile prevents compiler optimization on variables.' }
        ],
        'True False': [
          { id: 1, text: 'Structures in C can contain functions.', options: ['True', 'False'], correct: 1, explanation: 'Structures can only contain data members.' },
          { id: 2, text: 'C supports recursion.', options: ['True', 'False'], correct: 0, explanation: 'C supports recursive function calls.' },
          { id: 3, text: 'The static keyword makes a variable global.', options: ['True', 'False'], correct: 1, explanation: 'static limits scope to the file/function.' },
          { id: 4, text: 'Unions in C share memory among members.', options: ['True', 'False'], correct: 0, explanation: 'Union members share the same memory location.' },
          { id: 5, text: 'Bit fields are supported in C.', options: ['True', 'False'], correct: 0, explanation: 'C supports bit fields for memory optimization.' }
        ],
        'Coding': [
          { id: 1, text: 'Define a structure named "Student" with name and age.', options: ['struct Student { char name[50]; int age; };', 'class Student { char name[50]; int age; };', 'typedef Student { char name[50]; int age; };', 'struct { char name[50]; int age; } Student;'], correct: 0, explanation: 'struct Student { char name[50]; int age; }; defines a structure.' },
          { id: 2, text: 'Write C code using typedef to create an alias for int.', options: ['typedef int integer;', 'typedef integer int;', '#define int integer;', 'using integer = int;'], correct: 0, explanation: 'typedef int integer; creates an alias for int.' },
          { id: 3, text: 'Write C code for a union with int and float members.', options: ['union data { int i; float f; };', 'struct data { int i; float f; };', 'class data { int i; float f; };', 'typedef data { int i; float f; };'], correct: 0, explanation: 'union is used for shared memory between members.' },
          { id: 4, text: 'Write C code for a function pointer that points to a void function.', options: ['void (*funcPtr)();', 'void *funcPtr();', '*void funcPtr();', 'funcPtr *void();'], correct: 0, explanation: 'void (*funcPtr)(); declares a function pointer.' },
          { id: 5, text: 'Write C code to allocate memory for an array of 10 integers using calloc.', options: ['int *arr = calloc(10, sizeof(int));', 'int *arr = malloc(10 * sizeof(int));', 'int arr[10];', 'Both A and B'], correct: 3, explanation: 'Both calloc and malloc can allocate memory for the array.' }
        ]
      }
    },
    // Quiz.jsx - Part 3 (C++ Question Bank)
    'cpp': {
      'Easy': {
        'MCQ': [
          { id: 1, text: 'What is C++?', options: ['An object-oriented language', 'A procedural language', 'A scripting language', 'A markup language'], correct: 0, explanation: 'C++ is an object-oriented programming language.' },
          { id: 2, text: 'Which header file is used for input/output in C++?', options: ['iostream', 'stdio.h', 'stdlib.h', 'string.h'], correct: 0, explanation: 'iostream is the standard input/output header.' },
          { id: 3, text: 'What is the correct way to declare a variable in C++?', options: ['int x;', 'variable x;', 'x int;', 'declare int x;'], correct: 0, explanation: 'int x; is the correct way to declare an integer variable.' },
          { id: 4, text: 'Which operator is used for output in C++?', options: ['<<', '>>', '<>', '><'], correct: 0, explanation: '<< is the insertion operator used with cout for output.' },
          { id: 5, text: 'What is the size of int in C++ on most systems?', options: ['2 bytes', '4 bytes', '8 bytes', '16 bytes'], correct: 1, explanation: 'int is typically 4 bytes on most systems.' }
        ],
        'True False': [
          { id: 1, text: 'C++ supports multiple inheritance.', options: ['True', 'False'], correct: 0, explanation: 'C++ supports multiple inheritance.' },
          { id: 2, text: 'C++ is a case-sensitive language.', options: ['True', 'False'], correct: 0, explanation: 'C++ is case-sensitive.' },
          { id: 3, text: 'The main() function is optional in C++ programs.', options: ['True', 'False'], correct: 1, explanation: 'Every C++ program must have a main() function.' },
          { id: 4, text: 'C++ supports function overloading.', options: ['True', 'False'], correct: 0, explanation: 'C++ supports function overloading.' },
          { id: 5, text: 'C++ supports operator overloading.', options: ['True', 'False'], correct: 0, explanation: 'C++ supports operator overloading.' }
        ],
        'Coding': [
          { id: 1, text: 'Write C++ code to print "Hello World".', options: ['cout << "Hello World";', 'printf("Hello World");', 'print("Hello World");', 'console.log("Hello World");'], correct: 0, explanation: 'cout << is used to output in C++.' },
          { id: 2, text: 'Write C++ code to declare an integer variable and assign value 10.', options: ['int x = 10;', 'x = 10;', 'int x; x = 10;', 'Both A and C'], correct: 3, explanation: 'Both int x = 10; and int x; x = 10; are valid.' },
          { id: 3, text: 'Write C++ code for a for loop that prints 1 to 5.', options: ['for(int i=1;i<=5;i++) cout<<i;', 'for(i=1;i<5;i++) cout<<i;', 'for(int i=1;i<=5;i++) print(i);', 'None'], correct: 0, explanation: 'Correct for loop syntax with cout.' },
          { id: 4, text: 'Write C++ code to create an array of 5 integers.', options: ['int arr[5];', 'array int[5];', 'int arr(5);', 'int arr = [5];'], correct: 0, explanation: 'int arr[5]; declares an array of 5 integers.' },
          { id: 5, text: 'Write C++ code to take input from user and store in variable.', options: ['cin >> x;', 'scanf("%d", &x);', 'input(x);', 'Both A and B'], correct: 3, explanation: 'Both cin and scanf can take input in C++.' }
        ]
      },
      'Medium': {
        'MCQ': [
          { id: 1, text: 'What is a class in C++?', options: ['A blueprint for objects', 'A function', 'A variable', 'An array'], correct: 0, explanation: 'A class is a blueprint for creating objects.' },
          { id: 2, text: 'What is inheritance in C++?', options: ['Deriving a class from another class', 'Creating a new class', 'Defining a method', 'Creating an object'], correct: 0, explanation: 'Inheritance is deriving a new class from an existing class.' },
          { id: 3, text: 'What is polymorphism in C++?', options: ['Many forms of a function', 'One form of a function', 'No forms', 'None'], correct: 0, explanation: 'Polymorphism allows functions to have many forms.' },
          { id: 4, text: 'What is a constructor in C++?', options: ['A special function called when object is created', 'A function called when object is destroyed', 'A normal function', 'A variable'], correct: 0, explanation: 'Constructor is called when an object is created.' },
          { id: 5, text: 'What is the purpose of the public keyword in C++?', options: ['Access specifier', 'Variable declaration', 'Function definition', 'None'], correct: 0, explanation: 'public is an access specifier in C++.' }
        ],
        'True False': [
          { id: 1, text: 'C++ supports both procedural and object-oriented programming.', options: ['True', 'False'], correct: 0, explanation: 'C++ is a multi-paradigm language.' },
          { id: 2, text: 'Destructors can be overloaded in C++.', options: ['True', 'False'], correct: 1, explanation: 'Destructors cannot be overloaded.' },
          { id: 3, text: 'C++ supports multiple inheritance.', options: ['True', 'False'], correct: 0, explanation: 'C++ supports multiple inheritance.' },
          { id: 4, text: 'The friend keyword allows access to private members.', options: ['True', 'False'], correct: 0, explanation: 'friend functions can access private members.' },
          { id: 5, text: 'C++ has built-in garbage collection.', options: ['True', 'False'], correct: 1, explanation: 'C++ does not have automatic garbage collection.' }
        ],
        'Coding': [
          { id: 1, text: 'Define a class named "Car" with a method "start".', options: ['class Car { public: void start() {} };', 'struct Car { void start() {} };', 'typedef Car { void start() {} };', 'None'], correct: 0, explanation: 'class Car { public: void start() {} }; defines a class.' },
          { id: 2, text: 'Write C++ code to inherit class Child from Parent.', options: ['class Child : public Parent {};', 'class Child extends Parent {};', 'class Child inherits Parent {};', 'class Child derives Parent {};'], correct: 0, explanation: 'class Child : public Parent {}; is used for inheritance.' },
          { id: 3, text: 'Write C++ code to create a constructor for class Person.', options: ['Person() { }', 'constructor Person() { }', 'void Person() { }', 'Person(void) { }'], correct: 0, explanation: 'Person() { } is the constructor syntax.' },
          { id: 4, text: 'Write C++ code to create a virtual function in class Animal.', options: ['virtual void sound() { }', 'void virtual sound() { }', 'virtual sound() { }', 'void sound() virtual { }'], correct: 0, explanation: 'virtual void sound() { } creates a virtual function.' },
          { id: 5, text: 'Write C++ code to create a template function for max of two values.', options: ['template<class T> T max(T a, T b) { return (a > b) ? a : b; }', 'template<typename T> T max(T a, T b) { return (a > b) ? a : b; }', 'Both A and B', 'None'], correct: 2, explanation: 'Both class and typename can be used in templates.' }
        ]
      },
      'Hard': {
        'MCQ': [
          { id: 1, text: 'What is the virtual keyword used for?', options: ['To enable polymorphism', 'To declare variables', 'To create arrays', 'To define functions'], correct: 0, explanation: 'The virtual keyword enables runtime polymorphism.' },
          { id: 2, text: 'What is an abstract class in C++?', options: ['A class with at least one pure virtual function', 'A class with no functions', 'A class with only functions', 'A class with no variables'], correct: 0, explanation: 'Abstract class has at least one pure virtual function.' },
          { id: 3, text: 'What is the difference between new and malloc?', options: ['new calls constructor', 'malloc calls constructor', 'No difference', 'new is faster'], correct: 0, explanation: 'new calls the constructor while malloc does not.' },
          { id: 4, text: 'What are smart pointers in C++?', options: ['Pointers with automatic memory management', 'Pointers that are smart', 'Regular pointers', 'None'], correct: 0, explanation: 'Smart pointers automatically manage memory.' },
          { id: 5, text: 'What is the use of the noexcept keyword?', options: ['Specifies that function doesn\'t throw exceptions', 'Specifies that function throws exceptions', 'Specifies no return', 'None'], correct: 0, explanation: 'noexcept specifies that a function does not throw exceptions.' }
        ],
        'True False': [
          { id: 1, text: 'Templates in C++ support generic programming.', options: ['True', 'False'], correct: 0, explanation: 'Templates enable generic programming.' },
          { id: 2, text: 'C++ supports lambda functions.', options: ['True', 'False'], correct: 0, explanation: 'C++11 introduced lambda functions.' },
          { id: 3, text: 'The override keyword is optional in C++.', options: ['True', 'False'], correct: 0, explanation: 'override is optional but recommended.' },
          { id: 4, text: 'C++ supports move semantics.', options: ['True', 'False'], correct: 0, explanation: 'C++11 introduced move semantics.' },
          { id: 5, text: 'The final keyword cannot be used in C++.', options: ['True', 'False'], correct: 1, explanation: 'C++11 introduced the final keyword.' }
        ],
        'Coding': [
          { id: 1, text: 'Write C++ code for a pure virtual function in class Shape.', options: ['virtual void draw() = 0;', 'virtual void draw() { }', 'void draw() = 0;', 'pure void draw();'], correct: 0, explanation: 'virtual void draw() = 0; declares a pure virtual function.' },
          { id: 2, text: 'Write C++ code to create a smart pointer using unique_ptr.', options: ['unique_ptr<int> ptr = make_unique<int>(10);', 'smart_ptr<int> ptr = make_smart<int>(10);', 'int* ptr = new int(10);', 'None'], correct: 0, explanation: 'unique_ptr<int> ptr = make_unique<int>(10); creates a unique_ptr.' },
          { id: 3, text: 'Write C++ code for a lambda function that adds two numbers.', options: ['auto add = [](int a, int b) { return a + b; };', 'function add = (int a, int b) { return a + b; };', 'lambda add = (int a, int b) { return a + b; };', 'None'], correct: 0, explanation: '[] (int a, int b) { return a + b; } is a lambda expression.' },
          { id: 4, text: 'Write C++ code to use the noexcept specifier.', options: ['void func() noexcept { }', 'void func() no_except { }', 'void func() throw() { }', 'void func() { }'], correct: 0, explanation: 'void func() noexcept { } specifies no exception throwing.' },
          { id: 5, text: 'Write C++ code for a template class with a single parameter.', options: ['template<class T> class MyClass { };', 'template<typename T> class MyClass { };', 'Both A and B', 'None'], correct: 2, explanation: 'Both class and typename work for template parameters.' }
        ]
      }
    },

    // Quiz.jsx - Part 4 (Java Question Bank)
    'java': {
      'Easy': {
        'MCQ': [
          { id: 1, text: 'What is Java?', options: ['An object-oriented language', 'A scripting language', 'A markup language', 'A database'], correct: 0, explanation: 'Java is a widely-used object-oriented language.' },
          { id: 2, text: 'Which keyword is used to define a class in Java?', options: ['class', 'Class', 'define', 'struct'], correct: 0, explanation: 'The class keyword is used to define classes.' },
          { id: 3, text: 'What is the size of int in Java?', options: ['2 bytes', '4 bytes', '8 bytes', '16 bytes'], correct: 1, explanation: 'int is always 4 bytes in Java.' },
          { id: 4, text: 'Which method is the entry point of a Java program?', options: ['main()', 'Main()', 'start()', 'run()'], correct: 0, explanation: 'public static void main(String[] args) is the entry point.' },
          { id: 5, text: 'Which keyword is used to create an object in Java?', options: ['new', 'create', 'object', 'instantiate'], correct: 0, explanation: 'new keyword is used to create objects in Java.' }
        ],
        'True False': [
          { id: 1, text: 'Java is platform independent.', options: ['True', 'False'], correct: 0, explanation: 'Java is platform independent due to JVM.' },
          { id: 2, text: 'Java supports multiple inheritance through classes.', options: ['True', 'False'], correct: 1, explanation: 'Java supports multiple inheritance only through interfaces.' },
          { id: 3, text: 'Java is a compiled language.', options: ['True', 'False'], correct: 0, explanation: 'Java is compiled to bytecode and then interpreted.' },
          { id: 4, text: 'The main() method must be static in Java.', options: ['True', 'False'], correct: 0, explanation: 'main() must be static to be called without an object.' },
          { id: 5, text: 'Java supports operator overloading.', options: ['True', 'False'], correct: 1, explanation: 'Java does not support operator overloading.' }
        ],
        'Coding': [
          { id: 1, text: 'Write Java code to print "Hello World".', options: ['System.out.println("Hello World");', 'printf("Hello World");', 'print("Hello World");', 'console.log("Hello World");'], correct: 0, explanation: 'System.out.println() is the standard output method.' },
          { id: 2, text: 'Write Java code to declare an integer variable and assign value 10.', options: ['int x = 10;', 'x = 10;', 'int x; x = 10;', 'Both A and C'], correct: 3, explanation: 'Both int x = 10; and int x; x = 10; are valid.' },
          { id: 3, text: 'Write Java code to create a class named "Person".', options: ['class Person { }', 'Class Person { }', 'person class { }', 'class person { }'], correct: 0, explanation: 'class Person { } defines a class in Java.' },
          { id: 4, text: 'Write Java code to create an object of class Person.', options: ['Person p = new Person();', 'Person p = Person();', 'new Person p;', 'Person p = new Person;'], correct: 0, explanation: 'Person p = new Person(); creates an object.' },
          { id: 5, text: 'Write Java code for a for loop that prints 1 to 5.', options: ['for(int i=1;i<=5;i++) System.out.println(i);', 'for(i=1;i<5;i++) System.out.println(i);', 'for(int i=1;i<=5;i++) print(i);', 'None'], correct: 0, explanation: 'Correct for loop syntax with System.out.println.' }
        ]
      },
      'Medium': {
        'MCQ': [
          { id: 1, text: 'What is inheritance in Java?', options: ['Deriving a class from another class', 'Creating a new class', 'Defining a method', 'Creating an object'], correct: 0, explanation: 'Inheritance is deriving a new class from an existing class.' },
          { id: 2, text: 'What is an interface in Java?', options: ['A contract for classes', 'A class', 'A method', 'A variable'], correct: 0, explanation: 'An interface defines a contract that classes must implement.' },
          { id: 3, text: 'What is polymorphism in Java?', options: ['Many forms of a method', 'One form of a method', 'No forms', 'None'], correct: 0, explanation: 'Polymorphism allows methods to have many forms.' },
          { id: 4, text: 'What is the purpose of the final keyword in Java?', options: ['Prevent modification', 'Allow modification', 'Create objects', 'Delete objects'], correct: 0, explanation: 'final prevents modification of variables, methods, or classes.' },
          { id: 5, text: 'What is the super keyword used for in Java?', options: ['Access parent class members', 'Access child class members', 'Create objects', 'Delete objects'], correct: 0, explanation: 'super is used to access parent class members.' }
        ],
        'True False': [
          { id: 1, text: 'Java supports multiple inheritance through interfaces.', options: ['True', 'False'], correct: 0, explanation: 'Java supports multiple inheritance through interfaces.' },
          { id: 2, text: 'Abstract classes can be instantiated in Java.', options: ['True', 'False'], correct: 1, explanation: 'Abstract classes cannot be instantiated directly.' },
          { id: 3, text: 'The toString() method is available in all Java objects.', options: ['True', 'False'], correct: 0, explanation: 'All objects inherit toString() from Object class.' },
          { id: 4, text: 'Java supports static methods in interfaces.', options: ['True', 'False'], correct: 0, explanation: 'Java 8 introduced static methods in interfaces.' },
          { id: 5, text: 'The instanceof operator checks object type in Java.', options: ['True', 'False'], correct: 0, explanation: 'instanceof checks if an object is an instance of a class.' }
        ],
        'Coding': [
          { id: 1, text: 'Create a class that inherits from another class.', options: ['class Child extends Parent {}', 'class Child implements Parent {}', 'class Child inherits Parent {}', 'class Child derives Parent {}'], correct: 0, explanation: 'extends is used for inheritance in Java.' },
          { id: 2, text: 'Write Java code to implement an interface named "Drawable".', options: ['class Shape implements Drawable { }', 'class Shape extends Drawable { }', 'class Shape uses Drawable { }', 'class Shape with Drawable { }'], correct: 0, explanation: 'implements is used for interfaces in Java.' },
          { id: 3, text: 'Write Java code to create a final variable.', options: ['final int x = 10;', 'int final x = 10;', 'final x = 10;', 'const int x = 10;'], correct: 0, explanation: 'final int x = 10; creates a constant variable.' },
          { id: 4, text: 'Write Java code to call a parent class method using super.', options: ['super.method();', 'super.method;', 'parent.method();', 'method.super();'], correct: 0, explanation: 'super.method(); calls the parent class method.' },
          { id: 5, text: 'Write Java code to create an abstract class.', options: ['abstract class Animal { }', 'class abstract Animal { }', 'abstract Animal { }', 'Animal abstract { }'], correct: 0, explanation: 'abstract class Animal { } creates an abstract class.' }
        ]
      },
      'Hard': {
        'MCQ': [
          { id: 1, text: 'What is the static keyword used for?', options: ['Belongs to the class', 'Belongs to the instance', 'Creates objects', 'Destroys objects'], correct: 0, explanation: 'Static members belong to the class.' },
          { id: 2, text: 'What is a generic class in Java?', options: ['A class with type parameters', 'A class with no parameters', 'A class with only methods', 'A class with only variables'], correct: 0, explanation: 'Generic classes have type parameters for flexibility.' },
          { id: 3, text: 'What is the difference between ArrayList and LinkedList?', options: ['ArrayList uses array, LinkedList uses nodes', 'LinkedList uses array, ArrayList uses nodes', 'No difference', 'Both use arrays'], correct: 0, explanation: 'ArrayList uses dynamic arrays, LinkedList uses nodes.' },
          { id: 4, text: 'What is the purpose of the synchronized keyword?', options: ['Thread safety', 'Speed optimization', 'Memory management', 'File handling'], correct: 0, explanation: 'synchronized ensures thread safety in concurrent programming.' },
          { id: 5, text: 'What is a lambda expression in Java?', options: ['Anonymous function', 'Named function', 'Class', 'Variable'], correct: 0, explanation: 'Lambda is an anonymous function introduced in Java 8.' }
        ],
        'True False': [
          { id: 1, text: 'Static methods can only access static variables.', options: ['True', 'False'], correct: 0, explanation: 'Static methods can only directly access static variables.' },
          { id: 2, text: 'Java supports functional programming.', options: ['True', 'False'], correct: 0, explanation: 'Java 8 introduced functional programming features.' },
          { id: 3, text: 'The try-with-resources statement is available in Java.', options: ['True', 'False'], correct: 0, explanation: 'try-with-resources is available from Java 7.' },
          { id: 4, text: 'Java supports enums.', options: ['True', 'False'], correct: 0, explanation: 'Java supports enums from Java 5.' },
          { id: 5, text: 'Annotations are not supported in Java.', options: ['True', 'False'], correct: 1, explanation: 'Java supports annotations from Java 5.' }
        ],
        'Coding': [
          { id: 1, text: 'Create a static method and call it without creating an object.', options: ['public static void method() { } \n method();', 'public void method() { } \n method();', 'static public void method() { } \n new Class().method();', 'None'], correct: 0, explanation: 'Static methods can be called without creating an instance.' },
          { id: 2, text: 'Write Java code for a generic class with type parameter T.', options: ['class MyClass<T> { }', 'class MyClass(T) { }', 'class MyClass[ T ] { }', 'class MyClass { T }'], correct: 0, explanation: 'class MyClass<T> { } is a generic class.' },
          { id: 3, text: 'Write Java code to create an ArrayList of Strings.', options: ['ArrayList<String> list = new ArrayList<>();', 'ArrayList list = new ArrayList();', 'List<String> list = new ArrayList<>();', 'Both A and C'], correct: 3, explanation: 'Both ArrayList<String> and List<String> work.' },
          { id: 4, text: 'Write Java code using synchronized method.', options: ['public synchronized void method() { }', 'synchronized public void method() { }', 'public void synchronized method() { }', 'public void method() synchronized { }'], correct: 0, explanation: 'public synchronized void method() { } creates a synchronized method.' },
          { id: 5, text: 'Write Java code for a lambda expression that adds two numbers.', options: ['(a,b) -> a + b', '(a,b) => a + b', 'function(a,b) { return a+b; }', 'lambda(a,b) { return a+b; }'], correct: 0, explanation: '(a,b) -> a + b is a lambda expression.' }
        ]
      }
    },

    // Quiz.jsx - Part 5 (Python and HTML Question Banks)
    'python': {
      'Easy': {
        'MCQ': [
          { id: 1, text: 'What is Python?', options: ['A high-level programming language', 'A low-level language', 'A markup language', 'A database'], correct: 0, explanation: 'Python is a high-level, interpreted language.' },
          { id: 2, text: 'Which keyword is used to define a function?', options: ['def', 'function', 'func', 'define'], correct: 0, explanation: 'The def keyword is used to define functions.' },
          { id: 3, text: 'What is the correct way to create a list in Python?', options: ['my_list = [1, 2, 3]', 'my_list = (1, 2, 3)', 'my_list = {1, 2, 3}', 'my_list = <1, 2, 3>'], correct: 0, explanation: 'Square brackets [] are used to create lists.' },
          { id: 4, text: 'Which function is used to get user input in Python?', options: ['input()', 'scan()', 'read()', 'get()'], correct: 0, explanation: 'input() is used to take user input in Python.' },
          { id: 5, text: 'What is the output of type(5) in Python?', options: ['int', 'float', 'str', 'bool'], correct: 0, explanation: 'type(5) returns int because 5 is an integer.' }
        ],
        'True False': [
          { id: 1, text: 'Python is an interpreted language.', options: ['True', 'False'], correct: 0, explanation: 'Python is interpreted, not compiled.' },
          { id: 2, text: 'Python uses indentation for code blocks.', options: ['True', 'False'], correct: 0, explanation: 'Python uses indentation to define code blocks.' },
          { id: 3, text: 'Python is a statically typed language.', options: ['True', 'False'], correct: 1, explanation: 'Python is dynamically typed.' },
          { id: 4, text: 'The print() function is used for output in Python.', options: ['True', 'False'], correct: 0, explanation: 'print() is the built-in function for output.' },
          { id: 5, text: 'Python supports object-oriented programming.', options: ['True', 'False'], correct: 0, explanation: 'Python supports OOP concepts.' }
        ],
        'Coding': [
          { id: 1, text: 'Write Python code to print "Hello World".', options: ['print("Hello World")', 'printf("Hello World")', 'console.log("Hello World")', 'echo "Hello World"'], correct: 0, explanation: 'print() is used for output in Python.' },
          { id: 2, text: 'Write Python code to declare a variable and assign value 10.', options: ['x = 10', 'int x = 10', 'var x = 10', 'x : int = 10'], correct: 0, explanation: 'Python uses dynamic typing - x = 10 is sufficient.' },
          { id: 3, text: 'Write Python code for a for loop that prints 1 to 5.', options: ['for i in range(1,6): print(i)', 'for i in range(1,5): print(i)', 'for i in range(5): print(i)', 'for i in 1..5: print(i)'], correct: 0, explanation: 'range(1,6) generates numbers 1 to 5.' },
          { id: 4, text: 'Write Python code to create a list of numbers 1 to 5.', options: ['my_list = [1, 2, 3, 4, 5]', 'my_list = (1, 2, 3, 4, 5)', 'my_list = {1, 2, 3, 4, 5}', 'my_list = range(1,6)'], correct: 0, explanation: 'Square brackets [] create a list in Python.' },
          { id: 5, text: 'Write Python code to define a function that adds two numbers.', options: ['def add(a, b): return a + b', 'function add(a, b) { return a + b }', 'add(a, b) => a + b', 'def add(a, b) { return a + b }'], correct: 0, explanation: 'def add(a, b): return a + b defines a function.' }
        ]
      },
      'Medium': {
        'MCQ': [
          { id: 1, text: 'What is a list in Python?', options: ['An ordered collection', 'A function', 'A variable', 'A dictionary'], correct: 0, explanation: 'A list is an ordered, mutable collection.' },
          { id: 2, text: 'What is a dictionary in Python?', options: ['Key-value pairs', 'Ordered collection', 'Unordered collection', 'Function'], correct: 0, explanation: 'Dictionary stores key-value pairs in Python.' },
          { id: 3, text: 'What is the difference between list and tuple?', options: ['List is mutable, tuple is immutable', 'Tuple is mutable, list is immutable', 'Both are mutable', 'Both are immutable'], correct: 0, explanation: 'Lists are mutable while tuples are immutable.' },
          { id: 4, text: 'What is the purpose of the self keyword?', options: ['Refers to current instance', 'Refers to class', 'Refers to parent class', 'Refers to module'], correct: 0, explanation: 'self refers to the current instance of the class.' },
          { id: 5, text: 'What is list comprehension in Python?', options: ['A concise way to create lists', 'A way to sort lists', 'A way to filter lists', 'A way to append lists'], correct: 0, explanation: 'List comprehension is a concise way to create lists.' }
        ],
        'True False': [
          { id: 1, text: 'Lists in Python are mutable.', options: ['True', 'False'], correct: 0, explanation: 'Lists are mutable in Python.' },
          { id: 2, text: 'Tuples in Python are immutable.', options: ['True', 'False'], correct: 0, explanation: 'Tuples are immutable in Python.' },
          { id: 3, text: 'Python supports multiple inheritance.', options: ['True', 'False'], correct: 0, explanation: 'Python supports multiple inheritance.' },
          { id: 4, text: 'The len() function returns the length of a list.', options: ['True', 'False'], correct: 0, explanation: 'len() returns the length of a list.' },
          { id: 5, text: 'Python has built-in support for regular expressions.', options: ['True', 'False'], correct: 0, explanation: 'Python has a built-in re module for regex.' }
        ],
        'Coding': [
          { id: 1, text: 'Create a list and add an item to it.', options: ['my_list = [1,2]; my_list.append(3);', 'my_list = [1,2]; my_list.add(3);', 'my_list = [1,2]; my_list.insert(3);', 'my_list = [1,2]; my_list.push(3);'], correct: 0, explanation: 'append() is the correct method to add items.' },
          { id: 2, text: 'Write Python code to create a dictionary.', options: ['my_dict = {"name": "John", "age": 25}', 'my_dict = ["name", "John", "age", 25]', 'my_dict = ("name": "John", "age": 25)', 'my_dict = <"name": "John", "age": 25>'], correct: 0, explanation: 'Curly braces {} create a dictionary in Python.' },
          { id: 3, text: 'Write Python code for list comprehension to create squares of numbers 1 to 5.', options: ['[x**2 for x in range(1,6)]', '[x*x for x in range(1,6)]', 'Both A and B', 'None'], correct: 2, explanation: 'Both x**2 and x*x work for squares.' },
          { id: 4, text: 'Write Python code to define a class named Person.', options: ['class Person: pass', 'Class Person: pass', 'person class: pass', 'class Person { }'], correct: 0, explanation: 'class Person: pass defines a class in Python.' },
          { id: 5, text: 'Write Python code to create an instance of class Person.', options: ['p = Person()', 'p = new Person()', 'p = Person.new()', 'p = create Person()'], correct: 0, explanation: 'p = Person() creates an instance in Python.' }
        ]
      },
      'Hard': {
        'MCQ': [
          { id: 1, text: 'What is a generator in Python?', options: ['A function that yields values', 'A list', 'A dictionary', 'A class'], correct: 0, explanation: 'A generator yields values one at a time using yield.' },
          { id: 2, text: 'What is a decorator in Python?', options: ['A function that modifies another function', 'A class', 'A variable', 'A list'], correct: 0, explanation: 'A decorator is a function that modifies another function.' },
          { id: 3, text: 'What is the Global Interpreter Lock (GIL) in Python?', options: ['A mutex that allows only one thread to execute', 'A lock for files', 'A lock for memory', 'None'], correct: 0, explanation: 'GIL is a mutex that allows only one thread to execute at a time.' },
          { id: 4, text: 'What is the purpose of the __init__ method?', options: ['Constructor for class', 'Destructor for class', 'Method for printing', 'Method for sorting'], correct: 0, explanation: '__init__ is the constructor method in Python.' },
          { id: 5, text: 'What is a context manager in Python?', options: ['Manages resources using with statement', 'Manages memory', 'Manages files', 'Manages threads'], correct: 0, explanation: 'Context managers are used with the with statement for resource management.' }
        ],
        'True False': [
          { id: 1, text: 'Generators in Python are memory efficient.', options: ['True', 'False'], correct: 0, explanation: 'Generators yield values one at a time, making them memory efficient.' },
          { id: 2, text: 'Python supports async/await for asynchronous programming.', options: ['True', 'False'], correct: 0, explanation: 'Python supports async/await for asynchronous programming.' },
          { id: 3, text: 'Metaclasses are not supported in Python.', options: ['True', 'False'], correct: 1, explanation: 'Python supports metaclasses for class creation.' },
          { id: 4, text: 'The with statement is used for context managers.', options: ['True', 'False'], correct: 0, explanation: 'with is used with context managers in Python.' },
          { id: 5, text: 'Python supports type hints.', options: ['True', 'False'], correct: 0, explanation: 'Python supports type hints from version 3.5.' }
        ],
        'Coding': [
          { id: 1, text: 'Write a Python generator that yields numbers 1 to 5.', options: ['def gen(): for i in range(1,6): yield i', 'def gen(): for i in range(1,6): return i', 'def gen(): for i in range(1,6): print i', 'None'], correct: 0, explanation: 'A generator uses yield to produce values.' },
          { id: 2, text: 'Write Python code to create a decorator that logs function calls.', options: ['def log(func): def wrapper(*args): print("Calling"); return func(*args); return wrapper', 'def log(func): return func', 'def log(): print("Calling")', 'None'], correct: 0, explanation: 'A decorator wraps a function to add functionality.' },
          { id: 3, text: 'Write Python code using a context manager to open a file.', options: ['with open("file.txt") as f: content = f.read()', 'f = open("file.txt"); content = f.read(); f.close()', 'Both A and B', 'None'], correct: 2, explanation: 'Both methods work, but with is preferred for resource management.' },
          { id: 4, text: 'Write Python code for a class with __init__ method.', options: ['class Person: def __init__(self, name): self.name = name', 'class Person: def init(self, name): self.name = name', 'class Person: def constructor(self, name): self.name = name', 'None'], correct: 0, explanation: '__init__ is the constructor method in Python.' },
          { id: 5, text: 'Write Python code for async/await function.', options: ['async def fetch(): await asyncio.sleep(1)', 'def fetch(): await asyncio.sleep(1)', 'async def fetch(): asyncio.sleep(1)', 'def fetch(): asyncio.sleep(1)'], correct: 0, explanation: 'async def with await is used for asynchronous functions.' }
        ]
      }
    },
    'html': {
      'Easy': {
        'MCQ': [
          { id: 1, text: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'None'], correct: 0, explanation: 'HTML stands for Hyper Text Markup Language.' },
          { id: 2, text: 'Which tag is used for the largest heading?', options: ['<h1>', '<h6>', '<head>', '<header>'], correct: 0, explanation: '<h1> is the largest heading tag.' },
          { id: 3, text: 'What is the correct HTML for inserting an image?', options: ['<img src="image.jpg">', '<image src="image.jpg">', '<img href="image.jpg">', '<picture src="image.jpg">'], correct: 0, explanation: '<img> tag with src attribute is used for images.' },
          { id: 4, text: 'Which tag creates a hyperlink?', options: ['<a>', '<link>', '<href>', '<url>'], correct: 0, explanation: '<a> tag with href attribute creates hyperlinks.' },
          { id: 5, text: 'What is the correct HTML for a paragraph?', options: ['<p>', '<paragraph>', '<para>', '<text>'], correct: 0, explanation: '<p> tag is used for paragraphs in HTML.' }
        ],
        'True False': [
          { id: 1, text: 'HTML is a programming language.', options: ['True', 'False'], correct: 1, explanation: 'HTML is a markup language, not a programming language.' },
          { id: 2, text: 'The <br> tag is used for line breaks.', options: ['True', 'False'], correct: 0, explanation: '<br> is the line break tag.' },
          { id: 3, text: 'HTML is case-insensitive.', options: ['True', 'False'], correct: 0, explanation: 'HTML is case-insensitive, but lowercase is recommended.' },
          { id: 4, text: 'The <title> tag appears in the body of the page.', options: ['True', 'False'], correct: 1, explanation: '<title> appears in the head section, not body.' },
          { id: 5, text: 'HTML comments are written as <!-- comment -->.', options: ['True', 'False'], correct: 0, explanation: '<!-- comment --> is the HTML comment syntax.' }
        ],
        'Coding': [
          { id: 1, text: 'Create a heading with text "Hello World".', options: ['<h1>Hello World</h1>', '<heading>Hello World</heading>', '<h>Hello World</h>', '<head>Hello World</head>'], correct: 0, explanation: '<h1> is used for main headings.' },
          { id: 2, text: 'Write HTML code to create a paragraph.', options: ['<p>This is a paragraph</p>', '<paragraph>This is a paragraph</paragraph>', '<para>This is a paragraph</para>', '<text>This is a paragraph</text>'], correct: 0, explanation: '<p> tag is used for paragraphs.' },
          { id: 3, text: 'Write HTML code to insert an image.', options: ['<img src="image.jpg">', '<image src="image.jpg">', '<img href="image.jpg">', '<picture src="image.jpg">'], correct: 0, explanation: '<img src="image.jpg"> is the correct syntax.' },
          { id: 4, text: 'Write HTML code to create a link to "example.com".', options: ['<a href="example.com">Link</a>', '<link href="example.com">', '<a src="example.com">', '<href="example.com">'], correct: 0, explanation: '<a> tag with href attribute creates hyperlinks.' },
          { id: 5, text: 'Write HTML code for a line break.', options: ['<br>', '<break>', '<line>', '<lb>'], correct: 0, explanation: '<br> is the line break tag in HTML.' }
        ]
      },
      'Medium': {
        'MCQ': [
          { id: 1, text: 'What is the difference between div and span?', options: ['div is block-level, span is inline', 'span is block-level, div is inline', 'Both are block-level', 'Both are inline'], correct: 0, explanation: 'div is a block-level element, span is inline.' },
          { id: 2, text: 'What is the purpose of the alt attribute in img tag?', options: ['Alternative text for images', 'Alternative image', 'Alternative link', 'Alternative style'], correct: 0, explanation: 'alt provides alternative text for images.' },
          { id: 3, text: 'Which tag is used for unordered lists?', options: ['<ul>', '<ol>', '<li>', '<list>'], correct: 0, explanation: '<ul> is used for unordered lists.' },
          { id: 4, text: 'Which tag is used for ordered lists?', options: ['<ol>', '<ul>', '<li>', '<list>'], correct: 0, explanation: '<ol> is used for ordered lists.' },
          { id: 5, text: 'What is the purpose of the action attribute in a form?', options: ['Specifies where to send form data', 'Specifies form method', 'Specifies form style', 'Specifies form validation'], correct: 0, explanation: 'action specifies the URL to send form data to.' }
        ],
        'True False': [
          { id: 1, text: 'The <div> tag is a block-level element.', options: ['True', 'False'], correct: 0, explanation: '<div> is a block-level container element.' },
          { id: 2, text: 'The <span> tag is used for inline styling.', options: ['True', 'False'], correct: 0, explanation: '<span> is an inline element for styling specific parts.' },
          { id: 3, text: 'HTML forms must always use the GET method.', options: ['True', 'False'], correct: 1, explanation: 'Forms can use GET or POST methods.' },
          { id: 4, text: 'The <meta> tag provides metadata about HTML document.', options: ['True', 'False'], correct: 0, explanation: '<meta> provides metadata like charset, viewport, etc.' },
          { id: 5, text: 'The <strong> tag is used for bold text.', options: ['True', 'False'], correct: 0, explanation: '<strong> is used for strong importance, typically bold.' }
        ],
        'Coding': [
          { id: 1, text: 'Create a link to "example.com".', options: ['<a href="example.com">Link</a>', '<link href="example.com">', '<a src="example.com">', '<href="example.com">'], correct: 0, explanation: '<a> tag with href attribute creates hyperlinks.' },
          { id: 2, text: 'Write HTML code for an unordered list with 3 items.', options: ['<ul><li>Item1</li><li>Item2</li><li>Item3</li></ul>', '<ol><li>Item1</li><li>Item2</li><li>Item3</li></ol>', '<list><item>Item1</item></list>', 'None'], correct: 0, explanation: '<ul> with <li> creates an unordered list.' },
          { id: 3, text: 'Write HTML code for a form with input and submit button.', options: ['<form><input type="text"><input type="submit"></form>', '<form><input><submit></form>', '<form><input type="text"><button>Submit</button></form>', 'Both A and C'], correct: 3, explanation: 'Both input type="submit" and button work for form submission.' },
          { id: 4, text: 'Write HTML code using the div tag.', options: ['<div>Content</div>', '<span>Content</span>', '<section>Content</section>', '<article>Content</article>'], correct: 0, explanation: '<div> is a generic block-level container.' },
          { id: 5, text: 'Write HTML code for a table with 2 rows and 2 columns.', options: ['<table><tr><td>Row1 Col1</td><td>Row1 Col2</td></tr><tr><td>Row2 Col1</td><td>Row2 Col2</td></tr></table>', '<table><row><col>Row1 Col1</col></row></table>', '<tbl><tr><td></td></tr></tbl>', 'None'], correct: 0, explanation: 'Correct table structure with tr and td tags.' }
        ]
      },
      'Hard': {
        'MCQ': [
          { id: 1, text: 'Which HTML5 tag is for navigation?', options: ['<nav>', '<menu>', '<navigation>', '<navigate>'], correct: 0, explanation: '<nav> is the semantic HTML5 tag for navigation.' },
          { id: 2, text: 'Purpose of the <article> tag?', options: ['Define independent content', 'Define a section', 'Define a header', 'Define a footer'], correct: 0, explanation: '<article> defines independent, self-contained content.' },
          { id: 3, text: 'What is the purpose of the <section> tag?', options: ['Define a section in a document', 'Define a header', 'Define a footer', 'Define navigation'], correct: 0, explanation: '<section> defines a section in an HTML document.' },
          { id: 4, text: 'What is the <canvas> tag used for?', options: ['Drawing graphics via JavaScript', 'Displaying images', 'Creating videos', 'Playing audio'], correct: 0, explanation: '<canvas> is used for drawing graphics using JavaScript.' },
          { id: 5, text: 'What is the purpose of the data-* attributes?', options: ['Store custom data', 'Store styles', 'Store scripts', 'Store images'], correct: 0, explanation: 'data-* attributes store custom data in HTML elements.' }
        ],
      
          'True False': [
          { id: 1, text: 'HTML5 supports audio and video natively.', options: ['True', 'False'], correct: 0, explanation: 'HTML5 introduced native audio and video support.' },
          { id: 2, text: 'The <header> tag can be used multiple times on a page.', options: ['True', 'False'], correct: 0, explanation: '<header> can be used multiple times for different sections.' },
          { id: 3, text: 'HTML5 supports drag and drop functionality.', options: ['True', 'False'], correct: 0, explanation: 'HTML5 includes drag and drop API.' },
          { id: 4, text: 'The <figure> tag is used for tables.', options: ['True', 'False'], correct: 1, explanation: '<figure> is used for figures, not tables.' },
          { id: 5, text: 'HTML5 supports localStorage for storing data.', options: ['True', 'False'], correct: 0, explanation: 'HTML5 includes localStorage API for client-side storage.' }
        ],
        'Coding': [
          { id: 1, text: 'Create a form with an input field and a submit button.', options: ['<form><input type="text"><button>Submit</button></form>', '<form><input><submit></form>', '<input form><button>', 'None'], correct: 0, explanation: 'Form with input field and submit button.' },
          { id: 2, text: 'Write HTML code for semantic nav using nav tag.', options: ['<nav><a href="#">Home</a><a href="#">About</a></nav>', '<navigation><a href="#">Home</a></navigation>', '<menu><a href="#">Home</a></menu>', 'None'], correct: 0, explanation: '<nav> is the semantic HTML5 navigation tag.' },
          { id: 3, text: 'Write HTML code for canvas element.', options: ['<canvas id="myCanvas"></canvas>', '<draw id="myCanvas"></draw>', '<graphic id="myCanvas"></graphic>', '<svg id="myCanvas"></svg>'], correct: 0, explanation: '<canvas> is used for drawing graphics.' },
          { id: 4, text: 'Write HTML code for audio element with controls.', options: ['<audio controls><source src="audio.mp3"></audio>', '<audio><source src="audio.mp3"></audio>', '<sound controls><source src="audio.mp3"></sound>', 'None'], correct: 0, explanation: '<audio> with controls attribute shows player controls.' },
          { id: 5, text: 'Write HTML code for video element with controls.', options: ['<video controls><source src="video.mp4"></video>', '<video><source src="video.mp4"></video>', '<media controls><source src="video.mp4"></media>', 'None'], correct: 0, explanation: '<video> with controls attribute shows player controls.' }
        ]
      }
    }
  };

  // Quiz.jsx - Part 6 (Functions, useEffect, Render Methods and Export)

  useEffect(() => {
    let interval;
    if (quizStarted && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
        setTimeTaken(prev => prev + 1);
      }, 1000);
    } else if (timer === 0 && quizStarted) {
      handleSubmitQuiz();
    }
    return () => clearInterval(interval);
  }, [quizStarted, timer]);

  const getQuestions = () => {
    if (selectedTopics.length > 0 && selectedDifficulty && selectedQuestionType) {
      let questions = [];
      selectedTopics.forEach(topic => {
        const q = questionBank[topic.id]?.[selectedDifficulty]?.[selectedQuestionType] || [];
        questions = questions.concat(q);
      });
      return questions.length > 0 ? questions : [
        {
          id: 1,
          text: `No questions available for selected combinations.`,
          options: ['Please select different options'],
          correct: 0,
          explanation: 'Try selecting different combinations.'
        }
      ];
    }
    return [];
  };

  const handleStartQuiz = () => {
    const questions = getQuestions();
    setQuizQuestions(questions);
    setUserAnswers(new Array(questions.length).fill(null));
    setTimer(900);
    setQuizStarted(true);
    setCurrentStep('quiz');
  };

  const handleAnswerSelect = (index) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = index;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleSubmitQuiz = () => {
    setQuizStarted(false);
    setShowResults(true);
    setCurrentStep('results');
  };

  const calculateResults = () => {
    let correct = 0;
    let wrong = 0;
    quizQuestions.forEach((q, index) => {
      if (userAnswers[index] === q.correct) {
        correct++;
      } else if (userAnswers[index] !== null && userAnswers[index] !== q.correct) {
        wrong++;
      }
    });
    const total = quizQuestions.length;
    const score = correct;
    const percentage = (correct / total) * 100;
    const passed = percentage >= 40;

    return { correct, wrong, score, percentage, passed, total, skipped: total - correct - wrong };
  };

  const results = showResults ? calculateResults() : null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSetup = () => (
    <div className="setup-container">
      <div className="setup-header">
        <h1>🎯 Interview Quiz</h1>
        <p>Test your technical knowledge and improve your interview readiness.</p>
      </div>

      <div className="setup-card">
        <div className="setup-section">
          <h3>📚 Select Topics</h3>
          <div className="skills-container">
            {selectedTopics.length > 0 && (
              <div className="skill-tags">
                {selectedTopics.map((topic) => (
                  <span key={topic.id} className="skill-tag">
                    {topic.name}
                    <button
                      type="button"
                      className="skill-remove"
                      onClick={() => removeTopic(topic.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="skill-input-wrapper" ref={suggestionRef}>
              <input
                type="text"
                placeholder="Type a topic and press Enter..."
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={handleAddTopic}
                onFocus={() => setShowTopicSuggestions(true)}
              />
              <Plus size={18} className="skill-input-icon" />
              {showTopicSuggestions && (
                <div className="skill-suggestions-dropdown">
                  {loadingSuggestions ? (
                    <div className="suggestion-loading">Loading...</div>
                  ) : (
                    topicSuggestions.map((topic) => (
                      <div
                        key={topic.id}
                        className="suggestion-item"
                        onClick={() => addTopicFromSuggestion(topic)}
                      >
                        <span className="suggestion-name">{topic.skill_name}</span>
                        {topic.category && <span className="suggestion-category">{topic.category}</span>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="divider"></div>

        <div className="setup-section">
          <h3>📝 Question Type</h3>
          <div className="question-type-grid">
            {questionTypes.map(type => (
              <div
                key={type}
                className={`question-type-item ${selectedQuestionType === type ? 'selected' : ''}`}
                onClick={() => setSelectedQuestionType(type)}
              >
                {type}
              </div>
            ))}
          </div>
        </div>

        <div className="divider"></div>

        <div className="setup-section">
          <h3>📊 Difficulty Level</h3>
          <div className="difficulty-grid">
            {difficulties.map(diff => (
              <div
                key={diff}
                className={`difficulty-item ${selectedDifficulty === diff ? 'selected' : ''}`}
                onClick={() => setSelectedDifficulty(diff)}
              >
                <span className={`difficulty-dot ${diff.toLowerCase()}`}></span>
                <span>{diff}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="divider"></div>

        <div className="setup-section">
          <h3>💬 Custom Instructions (Optional)</h3>
          <div className="prompt-box-wrapper">
            <textarea
              className="prompt-box-textarea"
              placeholder="e.g. Focus on dynamic programming and graph algorithms..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows="3"
            ></textarea>
          </div>
        </div>

        <button 
          className="start-quiz-btn" 
          onClick={handleStartQuiz}
          disabled={!(selectedTopics.length > 0 && selectedDifficulty && selectedQuestionType)}
        >
          🚀 Start Quiz
        </button>
      </div>
    </div>
  );

  const renderQuiz = () => (
    <div className="quiz-wrapper">
      <div className="quiz-container">
        <div className="quiz-header-bar">
          <div className="timer-display">
            <span className="timer-icon">⏱️</span>
            <span>Time Remaining: <strong>{formatTime(timer)}</strong></span>
          </div>
          <div className="question-counter">
            Question {currentQuestion + 1}/{quizQuestions.length}
          </div>
        </div>

        <div className="progress-wrapper">
          <div className="progress-label">
            <span>Progress</span>
            <span>{currentQuestion + 1}/{quizQuestions.length} Questions</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="question-card">
          <div className="question-header">
            <span className="question-number">Question {currentQuestion + 1}</span>
            <span className="question-status">
              {userAnswers[currentQuestion] !== null ? '✅ Answered' : '⏳ Pending'}
            </span>
          </div>
          <div className="question-text">
            <h3>{quizQuestions[currentQuestion]?.text}</h3>
          </div>
          <div className="options-grid">
            {quizQuestions[currentQuestion]?.options.map((option, index) => (
              <div
                key={index}
                className={`option-item ${userAnswers[currentQuestion] === index ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="navigation-bar">
          <button 
            className="nav-btn prev" 
            onClick={handlePrevious} 
            disabled={currentQuestion === 0}
          >
            ⬅️ Previous
          </button>
          <button className="nav-btn skip" onClick={handleSkip}>
            ⏭️ Skip
          </button>
          {currentQuestion === quizQuestions.length - 1 ? (
            <button className="nav-btn submit" onClick={handleSubmitQuiz}>
              📤 Submit Quiz
            </button>
          ) : (
            <button className="nav-btn next" onClick={handleNext}>
              Next ➡️
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="results-wrapper">
        <div className="results-container">
          <div className="results-header">
            <h2>📊 Quiz Results</h2>
            <div className={`result-badge ${results.passed ? 'passed' : 'failed'}`}>
              {results.passed ? '✅ Passed' : '❌ Failed'}
            </div>
          </div>

          <div className="results-grid">
            <div className="result-card">
              <span className="result-icon">🏆</span>
              <div>
                <div className="result-label">Total Score</div>
                <div className="result-value">{results.score}/{results.total}</div>
              </div>
            </div>
            <div className="result-card">
              <span className="result-icon">📈</span>
              <div>
                <div className="result-label">Percentage</div>
                <div className="result-value">{results.percentage.toFixed(1)}%</div>
              </div>
            </div>
            <div className="result-card correct">
              <span className="result-icon">✅</span>
              <div>
                <div className="result-label">Correct</div>
                <div className="result-value">{results.correct}</div>
              </div>
            </div>
            <div className="result-card wrong">
              <span className="result-icon">❌</span>
              <div>
                <div className="result-label">Wrong</div>
                <div className="result-value">{results.wrong}</div>
              </div>
            </div>
            <div className="result-card skipped">
              <span className="result-icon">⏭️</span>
              <div>
                <div className="result-label">Skipped</div>
                <div className="result-value">{results.skipped}</div>
              </div>
            </div>
            <div className="result-card">
              <span className="result-icon">⏱️</span>
              <div>
                <div className="result-label">Time Taken</div>
                <div className="result-value">{formatTime(timeTaken)}</div>
              </div>
            </div>
          </div>

          <div className="answers-review">
            <h3>📝 Answer Review</h3>
            {quizQuestions.map((q, index) => (
              <div key={index} className="review-item">
                <div className="review-header">
                  <span className="review-number">Q{index + 1}</span>
                  <span className={`review-status ${userAnswers[index] === q.correct ? 'correct' : 'incorrect'}`}>
                    {userAnswers[index] === q.correct ? '✅' : userAnswers[index] !== null ? '❌' : '⏭️'}
                  </span>
                </div>
                <p className="review-question">{q.text}</p>
                <div className="review-answers">
                  <span>Your Answer: <strong>{userAnswers[index] !== null ? q.options[userAnswers[index]] : 'Skipped'}</strong></span>
                  <span>Correct Answer: <strong>{q.options[q.correct]}</strong></span>
                </div>
                <p className="review-explanation">💡 {q.explanation}</p>
              </div>
            ))}
          </div>

          <div className="practice-section">
            <h3>🎯 Recommended Practice</h3>
            <div className="practice-buttons">
              <button className="practice-btn primary" onClick={() => window.location.reload()}>
                🔄 Retry Quiz
              </button>
              <button className="practice-btn secondary">
                📚 Practice Weak Topics
              </button>
              <button className="practice-btn secondary">
                🎤 Go to Mock Interview
              </button>
              <button className="practice-btn secondary" onClick={() => navigate("/dashboard")}>
                🏠 Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="quiz-app">
      <PageNavbar
        activePath="/quiz"
        navItems={[
          { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
          { to: "/quiz", label: "Practice Mode", icon: <ClipboardList size={18} /> },
          { to: "/resume-upload", label: "Resume Analysis", icon: <FileText size={18} /> },
        ]}
      />

      {/* Main page content container */}
      <div className="dashboard-page-container">
        <main className="dashboard-content-wrapper">
          <div className="quiz-content-wrapper" style={{ paddingTop: "20px" }}>
            {currentStep === 'setup' && renderSetup()}
            {currentStep === 'quiz' && renderQuiz()}
            {currentStep === 'results' && renderResults()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Quiz;
