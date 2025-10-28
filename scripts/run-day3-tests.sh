#!/bin/bash

# Day 3 Authentication & Authorization Test Runner
# This script runs the complete Day 3 test suite

echo "🚀 Day 3 Authentication & Authorization Test Suite"
echo "================================================="
echo ""

# Check if required tools are available
command -v firebase >/dev/null 2>&1 || { echo "❌ Firebase CLI is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "1. 🔧 Setting up environment..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi

# Install Playwright browsers if needed
echo "   Ensuring Playwright browsers are installed..."
npx playwright install

echo ""
echo "2. 🔥 Starting Firebase emulators..."

# Start Firebase emulators in background
firebase emulators:start --only auth,firestore,functions &
FIREBASE_PID=$!

# Wait for emulators to start
echo "   Waiting for emulators to start..."
sleep 10

# Check if emulators are running
if ! curl -s http://localhost:9099 > /dev/null; then
    echo "❌ Firebase emulators failed to start"
    kill $FIREBASE_PID 2>/dev/null
    exit 1
fi

echo "   ✅ Firebase emulators are running"
echo ""

echo "3. 🌐 Starting Next.js development server..."

# Start Next.js in background
npm run dev &
NEXTJS_PID=$!

# Wait for Next.js to start
echo "   Waiting for Next.js to start..."
sleep 15

# Check if Next.js is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js development server failed to start"
    kill $FIREBASE_PID $NEXTJS_PID 2>/dev/null
    exit 1
fi

echo "   ✅ Next.js development server is running"
echo ""

echo "4. 🧪 Running Day 3 authentication tests..."
echo ""

# Run the tests with custom config
npx playwright test --config=tests/playwright/day3-playwright.config.ts

TEST_EXIT_CODE=$?

echo ""
echo "5. 🧹 Cleaning up..."

# Kill background processes
kill $FIREBASE_PID $NEXTJS_PID 2>/dev/null

# Wait a bit for cleanup
sleep 2

echo "   ✅ Cleanup complete"
echo ""

# Report results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "🎉 Day 3 Authentication & Authorization Tests PASSED!"
    echo ""
    echo "📊 Test reports generated:"
    echo "   • HTML Report: tests/playwright-report/day3/index.html"
    echo "   • JSON Report: tests/results/day3-results.json"
    echo "   • JUnit Report: tests/results/day3-junit.xml"
else
    echo "❌ Day 3 Authentication & Authorization Tests FAILED!"
    echo ""
    echo "📊 Check test reports for details:"
    echo "   • HTML Report: tests/playwright-report/day3/index.html"
    echo "   • Trace files available for failed tests"
fi

echo ""
echo "================================================="

exit $TEST_EXIT_CODE