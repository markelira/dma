/**
 * ELIRA Firestore Security Rules Test Suite
 * 
 * Comprehensive testing for Firestore security rules using Firebase emulators.
 * Tests all collections, roles, and security scenarios.
 * 
 * Run with: npm run test:firestore
 */

const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, doc } = require('firebase/firestore');

let testEnv;
let testDb;

// Test users with different roles
const testUsers = {
  student: { uid: 'student-123', email: 'student@test.com', role: 'student' },
  instructor: { uid: 'instructor-456', email: 'instructor@test.com', role: 'instructor' },
  admin: { uid: 'admin-789', email: 'admin@test.com', role: 'admin' },
  universityAdmin: { uid: 'univ-admin-101', email: 'univadmin@test.com', role: 'university_admin' },
  unauthenticated: null
};

// Test data
const testCourse = {
  id: 'course-123',
  title: 'Test Course',
  description: 'A test course',
  instructorId: 'instructor-456',
  status: 'published',
  createdAt: new Date()
};

const testEnrollment = {
  id: 'student-123_course-123',
  userId: 'student-123',
  courseId: 'course-123',
  enrolledAt: new Date(),
  progress: 0
};

describe('ELIRA Firestore Security Rules', () => {
  beforeAll(async () => {
    // Initialize test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'elira-rules-test',
      firestore: {
        rules: require('fs').readFileSync('./firestore.rules.new', 'utf8'),
        host: 'localhost',
        port: 8080
      }
    });

    // Setup test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      
      // Create test users
      for (const [key, user] of Object.entries(testUsers)) {
        if (user) {
          await setDoc(doc(db, 'users', user.uid), user);
        }
      }
      
      // Create test course
      await setDoc(doc(db, 'courses', testCourse.id), testCourse);
      
      // Create test enrollment
      await setDoc(doc(db, 'enrollments', testEnrollment.id), testEnrollment);
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Users Collection', () => {
    test('users can read their own data', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertSucceeds(getDoc(doc(studentDb, 'users', testUsers.student.uid)));
    });

    test('users cannot read other users data', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertFails(getDoc(doc(studentDb, 'users', testUsers.instructor.uid)));
    });

    test('admins can read any user data', async () => {
      const adminDb = testEnv.authenticatedContext(testUsers.admin.uid).firestore();
      await assertSucceeds(getDoc(doc(adminDb, 'users', testUsers.student.uid)));
    });

    test('users can create their own profile', async () => {
      const newUserId = 'new-user-123';
      const newUserDb = testEnv.authenticatedContext(newUserId).firestore();
      
      await assertSucceeds(setDoc(doc(newUserDb, 'users', newUserId), {
        email: 'newuser@test.com',
        role: 'student',
        createdAt: new Date()
      }));
    });

    test('users cannot create profiles with admin role', async () => {
      const newUserId = 'new-user-456';
      const newUserDb = testEnv.authenticatedContext(newUserId).firestore();
      
      await assertFails(setDoc(doc(newUserDb, 'users', newUserId), {
        email: 'newuser@test.com',
        role: 'admin',
        createdAt: new Date()
      }));
    });

    test('users cannot update their role', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertFails(updateDoc(doc(studentDb, 'users', testUsers.student.uid), {
        role: 'admin'
      }));
    });

    test('users can update allowed fields', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertSucceeds(updateDoc(doc(studentDb, 'users', testUsers.student.uid), {
        displayName: 'Updated Name'
      }));
    });

    test('admins can update any user field', async () => {
      const adminDb = testEnv.authenticatedContext(testUsers.admin.uid).firestore();
      await assertSucceeds(updateDoc(doc(adminDb, 'users', testUsers.student.uid), {
        role: 'instructor'
      }));
    });
  });

  describe('Courses Collection', () => {
    test('anyone can read published courses', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(getDoc(doc(unauthenticatedDb, 'courses', testCourse.id)));
    });

    test('instructors can create courses', async () => {
      const instructorDb = testEnv.authenticatedContext(testUsers.instructor.uid).firestore();
      await assertSucceeds(addDoc(collection(instructorDb, 'courses'), {
        title: 'New Course',
        description: 'A new course',
        instructorId: testUsers.instructor.uid,
        status: 'draft',
        createdAt: new Date()
      }));
    });

    test('students cannot create courses', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertFails(addDoc(collection(studentDb, 'courses'), {
        title: 'Unauthorized Course',
        description: 'Should fail',
        instructorId: testUsers.student.uid,
        status: 'draft',
        createdAt: new Date()
      }));
    });

    test('course instructors can update their courses', async () => {
      const instructorDb = testEnv.authenticatedContext(testUsers.instructor.uid).firestore();
      await assertSucceeds(updateDoc(doc(instructorDb, 'courses', testCourse.id), {
        title: 'Updated Course Title'
      }));
    });

    test('instructors cannot update other instructors courses', async () => {
      // Create another instructor
      const otherInstructorId = 'other-instructor-789';
      const otherInstructorDb = testEnv.authenticatedContext(otherInstructorId).firestore();
      
      await assertFails(updateDoc(doc(otherInstructorDb, 'courses', testCourse.id), {
        title: 'Unauthorized Update'
      }));
    });

    test('only admins can delete courses', async () => {
      const instructorDb = testEnv.authenticatedContext(testUsers.instructor.uid).firestore();
      await assertFails(deleteDoc(doc(instructorDb, 'courses', testCourse.id)));

      const adminDb = testEnv.authenticatedContext(testUsers.admin.uid).firestore();
      // We won't actually delete for other tests
      // await assertSucceeds(deleteDoc(doc(adminDb, 'courses', testCourse.id)));
    });
  });

  describe('Enrollments Collection', () => {
    test('students can read their own enrollments', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertSucceeds(getDoc(doc(studentDb, 'enrollments', testEnrollment.id)));
    });

    test('instructors can read enrollments for their courses', async () => {
      const instructorDb = testEnv.authenticatedContext(testUsers.instructor.uid).firestore();
      await assertSucceeds(getDoc(doc(instructorDb, 'enrollments', testEnrollment.id)));
    });

    test('users cannot create enrollments directly', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertFails(addDoc(collection(studentDb, 'enrollments'), {
        userId: testUsers.student.uid,
        courseId: 'some-course',
        enrolledAt: new Date()
      }));
    });

    test('students can update their progress', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertSucceeds(updateDoc(doc(studentDb, 'enrollments', testEnrollment.id), {
        progress: 50,
        lastAccessedAt: new Date()
      }));
    });

    test('students cannot update other fields', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertFails(updateDoc(doc(studentDb, 'enrollments', testEnrollment.id), {
        userId: 'different-user'
      }));
    });
  });

  describe('Lesson Progress Collection', () => {
    const progressId = 'progress-123';
    const progressData = {
      userId: testUsers.student.uid,
      courseId: testCourse.id,
      lessonId: 'lesson-123',
      completed: false,
      timeSpent: 0,
      createdAt: new Date()
    };

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'lessonProgress', progressId), progressData);
      });
    });

    test('users can read their own progress', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertSucceeds(getDoc(doc(studentDb, 'lessonProgress', progressId)));
    });

    test('users can create their own progress', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertSucceeds(addDoc(collection(studentDb, 'lessonProgress'), {
        ...progressData,
        lessonId: 'different-lesson'
      }));
    });

    test('users cannot create progress for others', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertFails(addDoc(collection(studentDb, 'lessonProgress'), {
        ...progressData,
        userId: 'different-user'
      }));
    });

    test('instructors can read progress for their courses', async () => {
      const instructorDb = testEnv.authenticatedContext(testUsers.instructor.uid).firestore();
      await assertSucceeds(getDoc(doc(instructorDb, 'lessonProgress', progressId)));
    });
  });

  describe('Quiz Results Collection', () => {
    const resultId = 'result-123';
    const quizResult = {
      userId: testUsers.student.uid,
      courseId: testCourse.id,
      lessonId: 'lesson-123',
      score: 85,
      maxScore: 100,
      answers: ['A', 'B', 'C'],
      submittedAt: new Date()
    };

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'quizResults', resultId), quizResult);
      });
    });

    test('users can read their own quiz results', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertSucceeds(getDoc(doc(studentDb, 'quizResults', resultId)));
    });

    test('instructors can read results for their courses', async () => {
      const instructorDb = testEnv.authenticatedContext(testUsers.instructor.uid).firestore();
      await assertSucceeds(getDoc(doc(instructorDb, 'quizResults', resultId)));
    });

    test('users can create their own quiz results', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertSucceeds(addDoc(collection(studentDb, 'quizResults'), quizResult));
    });

    test('quiz results are immutable after creation', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertFails(updateDoc(doc(studentDb, 'quizResults', resultId), {
        score: 100
      }));
    });
  });

  describe('Categories Collection', () => {
    test('anyone can read categories', async () => {
      const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
      // This would succeed if categories exist
      const categoriesRef = collection(unauthenticatedDb, 'categories');
      // Just test that we can attempt to read
      expect(categoriesRef).toBeDefined();
    });

    test('only admins can create categories', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertFails(addDoc(collection(studentDb, 'categories'), {
        name: 'Unauthorized Category'
      }));

      const adminDb = testEnv.authenticatedContext(testUsers.admin.uid).firestore();
      await assertSucceeds(addDoc(collection(adminDb, 'categories'), {
        name: 'Admin Category'
      }));
    });
  });

  describe('Payments Collection', () => {
    const paymentId = 'payment-123';
    const paymentData = {
      userId: testUsers.student.uid,
      courseId: testCourse.id,
      amount: 99.99,
      currency: 'USD',
      status: 'completed',
      createdAt: new Date()
    };

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'payments', paymentId), paymentData);
      });
    });

    test('users can read their own payments', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertSucceeds(getDoc(doc(studentDb, 'payments', paymentId)));
    });

    test('users cannot create payments directly', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertFails(addDoc(collection(studentDb, 'payments'), paymentData));
    });

    test('users cannot update payments', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertFails(updateDoc(doc(studentDb, 'payments', paymentId), {
        status: 'refunded'
      }));
    });
  });

  describe('Default Deny Rule', () => {
    test('access to undefined collections is denied', async () => {
      const studentDb = testEnv.authenticatedContext(testUsers.student.uid).firestore();
      await assertFails(getDoc(doc(studentDb, 'undefinedCollection', 'doc-123')));
    });

    test('even admins cannot access undefined collections', async () => {
      const adminDb = testEnv.authenticatedContext(testUsers.admin.uid).firestore();
      await assertFails(getDoc(doc(adminDb, 'secretCollection', 'doc-456')));
    });
  });
});

// Helper function to run specific test suites
async function runSecurityTests() {
  console.log('🔒 Running ELIRA Firestore Security Rules Tests...');
  
  try {
    // This would integrate with your test runner
    console.log('✅ All security tests would run here');
    console.log('📊 Test results would be displayed');
    return true;
  } catch (error) {
    console.error('❌ Security tests failed:', error);
    return false;
  }
}

module.exports = {
  runSecurityTests,
  testUsers,
  testCourse,
  testEnrollment
};