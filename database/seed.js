const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employer = require('../backend/models/Employer');
const Test = require('../backend/models/Test');

dotenv.config();

// Sample question bank
const SAMPLE_QUESTIONS = {
    javascript: [
        {
            title: "FizzBuzz Implementation",
            description: "Write a function that takes a number n and returns an array of numbers from 1 to n. For multiples of 3, include 'Fizz' instead of the number. For multiples of 5, include 'Buzz'. For numbers which are multiples of both 3 and 5, include 'FizzBuzz'.",
            difficulty: "beginner",
            category: "algorithms",
            language: "javascript",
            template: `function fizzBuzz(n) {
    // Write your solution here
    const result = [];

    for (let i = 1; i <= n; i++) {
        // Your logic here
    }

    return result;
}`,
            solution: `function fizzBuzz(n) {
    const result = [];
    for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) result.push('FizzBuzz');
        else if (i % 3 === 0) result.push('Fizz');
        else if (i % 5 === 0) result.push('Buzz');
        else result.push(i.toString());
    }
    return result;
}`,
            tests: [
                { input: [3], expected: ['1', '2', 'Fizz'] },
                { input: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'] },
                { input: [15], expected: ['1','2','Fizz','4','Buzz','Fizz','7','8','Fizz','Buzz','11','Fizz','13','14','FizzBuzz'] }
            ],
            points: 10,
            estimatedTime: 300
        },
        {
            title: "Array Manipulation - Max Product",
            description: "Write a function that finds the maximum product of two integers in an array.",
            difficulty: "beginner",
            category: "algorithms",
            language: "javascript",
            template: `function maxProduct(arr) {
    // Write your solution here
}`,
            solution: `function maxProduct(arr) {
    arr.sort((a, b) => b - a);
    return Math.max(arr[0] * arr[1], arr[arr.length-1] * arr[arr.length-2]);
}`,
            tests: [
                { input: [[1,2,3,4]], expected: 12 },
                { input: [[-10,-3,5,2]], expected: 30 },
                { input: [[0,-1,2,3]], expected: 6 }
            ],
            points: 10,
            estimatedTime: 240
        },
        {
            title: "String Reversal",
            description: "Write a function that reverses a string without using built-in reverse methods.",
            difficulty: "beginner",
            category: "algorithms",
            language: "javascript",
            template: `function reverseString(str) {
    // Write your solution here
}`,
            solution: `function reverseString(str) {
    let reversed = '';
    for (let i = str.length - 1; i >= 0; i--) {
        reversed += str[i];
    }
    return reversed;
}`,
            tests: [
                { input: ["hello"], expected: "olleh" },
                { input: ["world"], expected: "dlrow" },
                { input: ["algorithm"], expected: "mhtirogla" }
            ],
            points: 8,
            estimatedTime: 180
        },
        {
            title: "Palindrome Checker",
            description: "Write a function that checks if a string is a palindrome (reads the same forwards and backwards). Ignore case and non-alphanumeric characters.",
            difficulty: "intermediate",
            category: "algorithms",
            language: "javascript",
            template: `function isPalindrome(str) {
    // Write your solution here
}`,
            solution: `function isPalindrome(str) {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === cleaned.split('').reverse().join('');
}`,
            tests: [
                { input: ["A man, a plan, a canal: Panama"], expected: true },
                { input: ["race a car"], expected: false },
                { input: [" "], expected: true }
            ],
            points: 12,
            estimatedTime: 360
        },
        {
            title: "Binary Search Implementation",
            description: "Implement binary search algorithm to find a target in a sorted array. Return the index if found, -1 otherwise.",
            difficulty: "intermediate",
            category: "algorithms",
            language: "javascript",
            template: `function binarySearch(arr, target) {
    // Write your solution here
}`,
            solution: `function binarySearch(arr, target) {
    let left = 0, right = arr.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
            tests: [
                { input: [[1,2,3,4,5], 3], expected: 2 },
                { input: [[1,2,3,4,5], 6], expected: -1 },
                { input: [[], 1], expected: -1 }
            ],
            points: 15,
            estimatedTime: 420
        },
        {
            title: "Fibonacci Sequence",
            description: "Write a function that returns the nth Fibonacci number. The sequence starts with 0, 1.",
            difficulty: "intermediate",
            category: "algorithms",
            language: "javascript",
            template: `function fibonacci(n) {
    // Write your solution here
}`,
            solution: `function fibonacci(n) {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
}`,
            tests: [
                { input: [0], expected: 0 },
                { input: [1], expected: 1 },
                { input: [5], expected: 5 },
                { input: [10], expected: 55 }
            ],
            points: 12,
            estimatedTime: 360
        },
        {
            title: "Two Sum Problem",
            description: "Given an array of integers and a target sum, return indices of the two numbers that add up to the target.",
            difficulty: "intermediate",
            category: "algorithms",
            language: "javascript",
            template: `function twoSum(nums, target) {
    // Write your solution here
}`,
            solution: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
            tests: [
                { input: [[2,7,11,15], 9], expected: [0,1] },
                { input: [[3,2,4], 6], expected: [1,2] },
                { input: [[3,3], 6], expected: [0,1] }
            ],
            points: 15,
            estimatedTime: 480
        },
        {
            title: "Valid Parentheses",
            description: "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Brackets must close in the correct order.",
            difficulty: "advanced",
            category: "data-structures",
            language: "javascript",
            template: `function isValid(s) {
    // Write your solution here
}`,
            solution: `function isValid(s) {
    const stack = [];
    const pairs = { '(': ')', '{': '}', '[': ']' };
    for (let char of s) {
        if (pairs[char]) {
            stack.push(char);
        } else {
            const last = stack.pop();
            if (pairs[last] !== char) return false;
        }
    }
    return stack.length === 0;
}`,
            tests: [
                { input: ["()"], expected: true },
                { input: ["()[]{}"], expected: true },
                { input: ["(]"], expected: false },
                { input: ["([)]"], expected: false }
            ],
            points: 18,
            estimatedTime: 540
        },
        {
            title: "Merge Sorted Arrays",
            description: "Merge two sorted arrays into one sorted array.",
            difficulty: "advanced",
            category: "algorithms",
            language: "javascript",
            template: `function mergeSortedArrays(arr1, arr2) {
    // Write your solution here
}`,
            solution: `function mergeSortedArrays(arr1, arr2) {
    const result = [];
    let i = 0, j = 0;
    while (i < arr1.length && j < arr2.length) {
        if (arr1[i] < arr2[j]) result.push(arr1[i++]);
        else result.push(arr2[j++]);
    }
    return result.concat(arr1.slice(i), arr2.slice(j));
}`,
            tests: [
                { input: [[1,3,5], [2,4,6]], expected: [1,2,3,4,5,6] },
                { input: [[1,2,3], [4,5,6]], expected: [1,2,3,4,5,6] },
                { input: [[], [1,2,3]], expected: [1,2,3] }
            ],
            points: 20,
            estimatedTime: 600
        },
        {
            title: "Longest Substring Without Repeating Characters",
            description: "Given a string, find the length of the longest substring without repeating characters.",
            difficulty: "expert",
            category: "algorithms",
            language: "javascript",
            template: `function lengthOfLongestSubstring(s) {
    // Write your solution here
}`,
            solution: `function lengthOfLongestSubstring(s) {
    const seen = new Map();
    let maxLen = 0, start = 0;
    for (let i = 0; i < s.length; i++) {
        if (seen.has(s[i]) && seen.get(s[i]) >= start) {
            start = seen.get(s[i]) + 1;
        }
        seen.set(s[i], i);
        maxLen = Math.max(maxLen, i - start + 1);
    }
    return maxLen;
}`,
            tests: [
                { input: ["abcabcbb"], expected: 3 },
                { input: ["bbbbb"], expected: 1 },
                { input: ["pwwkew"], expected: 3 }
            ],
            points: 25,
            estimatedTime: 720
        }
    ]
};

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillassess', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Clear existing data
        console.log('Clearing existing data...');
        await Employer.deleteMany({});
        await Test.deleteMany({});

        // Create sample employer
        console.log('Creating sample employer...');
        const employer = await Employer.create({
            email: 'demo@skillassess.com',
            password: 'password123',
            company: {
                name: 'Demo Company',
                website: 'https://demo.com',
                industry: 'Technology'
            },
            contactPerson: {
                firstName: 'John',
                lastName: 'Doe',
                position: 'HR Manager'
            },
            isVerified: true
        });

        console.log('Sample employer created:', employer.email);

        // Create sample tests
        console.log('Creating sample tests...');

        // Beginner Test
        const beginnerTest = await Test.create({
            employerId: employer._id,
            title: 'JavaScript Fundamentals - Entry Level',
            description: 'Assessment for entry-level JavaScript developers',
            config: {
                totalQuestions: 3,
                questionTimeLimit: 900,
                totalTimeLimit: 3600,
                enableAIDetection: true,
                strictMode: true,
                showResults: false,
                passingScore: 60
            },
            questions: SAMPLE_QUESTIONS.javascript.filter(q => q.difficulty === 'beginner'),
            targetRoles: ['frontend-developer', 'backend-developer'],
            status: 'published'
        });

        console.log('Created test:', beginnerTest.title);

        // Intermediate Test
        const intermediateTest = await Test.create({
            employerId: employer._id,
            title: 'JavaScript Skills - Mid Level',
            description: 'Assessment for mid-level JavaScript developers',
            config: {
                totalQuestions: 4,
                questionTimeLimit: 900,
                totalTimeLimit: 5400,
                enableAIDetection: true,
                strictMode: true,
                showResults: false,
                passingScore: 70
            },
            questions: SAMPLE_QUESTIONS.javascript.filter(q => q.difficulty === 'intermediate'),
            targetRoles: ['frontend-developer', 'backend-developer', 'fullstack-developer'],
            status: 'published'
        });

        console.log('Created test:', intermediateTest.title);

        // Advanced Test
        const advancedTest = await Test.create({
            employerId: employer._id,
            title: 'JavaScript Mastery - Senior Level',
            description: 'Comprehensive assessment for senior JavaScript developers',
            config: {
                totalQuestions: 5,
                questionTimeLimit: 1200,
                totalTimeLimit: 7200,
                enableAIDetection: true,
                strictMode: true,
                showResults: false,
                passingScore: 80
            },
            questions: [
                ...SAMPLE_QUESTIONS.javascript.filter(q => q.difficulty === 'advanced'),
                ...SAMPLE_QUESTIONS.javascript.filter(q => q.difficulty === 'expert')
            ],
            targetRoles: ['fullstack-developer'],
            status: 'published'
        });

        console.log('Created test:', advancedTest.title);

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📋 Sample Login Credentials:');
        console.log('Email: demo@skillassess.com');
        console.log('Password: password123');
        console.log('\nTests created:');
        console.log('1. JavaScript Fundamentals - Entry Level (3 questions)');
        console.log('2. JavaScript Skills - Mid Level (4 questions)');
        console.log('3. JavaScript Mastery - Senior Level (5 questions)');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
