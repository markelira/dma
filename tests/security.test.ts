/**
 * DMA Comprehensive Security Test Suite
 * 
 * Tests Firestore security rules with comprehensive coverage of all collections,
 * user roles, and security scenarios.
 * 
 * Part of Step 7: Create Security Test Suite
 */

import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { setDoc, doc, getDoc, deleteDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

describe('DMA Firestore Security Rules', () => {
  let testEnv: any;
  let unauthedDb: any;
  let studentDb: any;
  let instructorDb: any;
  let adminDb: any;
  let universityAdminDb: any;

  // Test user configurations
  const testUsers = {
    student: { uid: 'student-123', role: 'student', email: 'student@test.com' },
    instructor: { uid: 'instructor-456', role: 'instructor', email: 'instructor@test.com' },
    admin: { uid: 'admin-789', role: 'admin', email: 'admin@test.com' },
    universityAdmin: { uid: 'univ-admin-101', role: 'university_admin', email: 'univadmin@test.com' },
    otherStudent: { uid: 'student-999', role: 'student', email: 'other@test.com' }
  };

  // Test data
  const testCourse = {
    id: 'course-123',
    title: 'Test Course',
    description: 'A comprehensive test course',
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

  beforeAll(async () => {
    // Initialize test environment
    testEnv = await initializeTestEnvironment({
      projectId: 'elira-security-test',
      firestore: {
        rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8'),
        host: 'localhost',
        port: 8080
      }
    });

    // Setup database contexts
    unauthedDb = testEnv.unauthenticatedContext().firestore();
    studentDb = testEnv.authenticatedContext(testUsers.student.uid, testUsers.student).firestore();
    instructorDb = testEnv.authenticatedContext(testUsers.instructor.uid, testUsers.instructor).firestore();
    adminDb = testEnv.authenticatedContext(testUsers.admin.uid, testUsers.admin).firestore();
    universityAdminDb = testEnv.authenticatedContext(testUsers.universityAdmin.uid, testUsers.universityAdmin).firestore();

    // Setup test data with admin privileges
    await testEnv.withSecurityRulesDisabled(async (context: any) => {
      const db = context.firestore();
      
      // Create test users
      for (const [key, user] of Object.entries(testUsers)) {
        await setDoc(doc(db, 'users', user.uid), {
          ...user,
          createdAt: new Date()
        });
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

  describe('Users Collection Security', () => {
    describe('Reading User Data', () => {
      test('Unauthenticated users cannot read user profiles', async () => {
        await assertFails(getDoc(doc(unauthedDb, 'users', testUsers.student.uid)));
      });

      test('Users can read their own profile', async () => {
        await assertSucceeds(getDoc(doc(studentDb, 'users', testUsers.student.uid)));
      });

      test('Users cannot read other user profiles', async () => {
        await assertFails(getDoc(doc(studentDb, 'users', testUsers.instructor.uid)));
      });

      test('Admins can read any user profile', async () => {
        await assertSucceeds(getDoc(doc(adminDb, 'users', testUsers.student.uid)));
        await assertSucceeds(getDoc(doc(adminDb, 'users', testUsers.instructor.uid)));
      });
    });

    describe('Creating User Profiles', () => {
      test('Users can create their own profile with student role', async () => {
        const newUserId = 'new-user-123';
        const newUserDb = testEnv.authenticatedContext(newUserId).firestore();
        
        await assertSucceeds(setDoc(doc(newUserDb, 'users', newUserId), {
          email: 'newuser@test.com',
          role: 'student',
          createdAt: new Date()
        }));
      });

      test('Users cannot create profiles with admin role', async () => {
        const newUserId = 'new-admin-456';
        const newUserDb = testEnv.authenticatedContext(newUserId).firestore();
        
        await assertFails(setDoc(doc(newUserDb, 'users', newUserId), {
          email: 'newadmin@test.com',
          role: 'admin',
          createdAt: new Date()
        }));
      });

      test('Users cannot create profiles for other users', async () => {
        await assertFails(setDoc(doc(studentDb, 'users', 'someone-else'), {
          email: 'hacker@test.com',
          role: 'student',
          createdAt: new Date()
        }));
      });
    });

    describe('Updating User Data', () => {
      test('Users can update allowed fields on their profile', async () => {
        await assertSucceeds(updateDoc(doc(studentDb, 'users', testUsers.student.uid), {
          displayName: 'Updated Student Name',
          bio: 'Updated bio'
        }));
      });

      test('Users cannot update their role', async () => {
        await assertFails(updateDoc(doc(studentDb, 'users', testUsers.student.uid), {
          role: 'admin'
        }));
      });

      test('Users cannot update restricted fields', async () => {
        await assertFails(updateDoc(doc(studentDb, 'users', testUsers.student.uid), {
          isVerified: true,
          permissions: ['admin']
        }));
      });

      test('Admins can update any user field', async () => {
        await assertSucceeds(updateDoc(doc(adminDb, 'users', testUsers.student.uid), {
          role: 'instructor',
          isVerified: true
        }));
      });
    });

    describe('Deleting Users', () => {
      test('Users cannot delete their own profile', async () => {
        await assertFails(deleteDoc(doc(studentDb, 'users', testUsers.student.uid)));
      });

      test('Only admins can delete user profiles', async () => {
        // Create a test user to delete
        await testEnv.withSecurityRulesDisabled(async (context: any) => {
          const db = context.firestore();
          await setDoc(doc(db, 'users', 'delete-test-user'), {
            email: 'delete@test.com',
            role: 'student',
            createdAt: new Date()
          });
        });

        await assertSucceeds(deleteDoc(doc(adminDb, 'users', 'delete-test-user')));
      });
    });
  });

  describe('Courses Collection Security', () => {
    describe('Reading Courses', () => {
      test('Anyone can read published courses', async () => {
        await assertSucceeds(getDoc(doc(unauthedDb, 'courses', testCourse.id)));
      });

      test('Course instructors can read their own courses', async () => {
        await assertSucceeds(getDoc(doc(instructorDb, 'courses', testCourse.id)));
      });

      test('Enrolled students can read courses', async () => {
        await assertSucceeds(getDoc(doc(studentDb, 'courses', testCourse.id)));
      });
    });

    describe('Creating Courses', () => {
      test('Instructors can create courses', async () => {
        await assertSucceeds(addDoc(collection(instructorDb, 'courses'), {
          title: 'New Instructor Course',
          description: 'A new course by instructor',
          instructorId: testUsers.instructor.uid,
          status: 'draft',
          createdAt: new Date()
        }));
      });

      test('Students cannot create courses', async () => {
        await assertFails(addDoc(collection(studentDb, 'courses'), {
          title: 'Unauthorized Course',
          description: 'Should fail',
          instructorId: testUsers.student.uid,
          status: 'draft',
          createdAt: new Date()
        }));
      });

      test('Admins can create courses', async () => {
        await assertSucceeds(addDoc(collection(adminDb, 'courses'), {
          title: 'Admin Course',
          description: 'Course created by admin',
          instructorId: testUsers.admin.uid,
          status: 'published',
          createdAt: new Date()
        }));
      });
    });

    describe('Updating Courses', () => {
      test('Course instructors can update their courses', async () => {
        await assertSucceeds(updateDoc(doc(instructorDb, 'courses', testCourse.id), {
          title: 'Updated Course Title',
          description: 'Updated description'
        }));
      });

      test('Instructors cannot change course instructor', async () => {
        await assertFails(updateDoc(doc(instructorDb, 'courses', testCourse.id), {
          instructorId: 'different-instructor'
        }));
      });

      test('Other instructors cannot update courses they do not own', async () => {
        const otherInstructorDb = testEnv.authenticatedContext('other-instructor-789', 
          { role: 'instructor' }).firestore();
        
        await assertFails(updateDoc(doc(otherInstructorDb, 'courses', testCourse.id), {
          title: 'Unauthorized Update'
        }));
      });

      test('Students cannot update courses', async () => {
        await assertFails(updateDoc(doc(studentDb, 'courses', testCourse.id), {
          title: 'Student Hack Attempt'
        }));
      });
    });

    describe('Deleting Courses', () => {
      test('Course instructors cannot delete their courses', async () => {
        await assertFails(deleteDoc(doc(instructorDb, 'courses', testCourse.id)));
      });

      test('Only admins can delete courses', async () => {
        // Create a test course to delete
        await testEnv.withSecurityRulesDisabled(async (context: any) => {
          const db = context.firestore();
          await setDoc(doc(db, 'courses', 'delete-test-course'), {
            title: 'Course to Delete',
            description: 'Will be deleted',
            instructorId: testUsers.instructor.uid,
            status: 'draft',
            createdAt: new Date()
          });
        });

        await assertSucceeds(deleteDoc(doc(adminDb, 'courses', 'delete-test-course')));
      });
    });
  });

  describe('Enrollments Collection Security', () => {
    describe('Reading Enrollments', () => {
      test('Students can read their own enrollments', async () => {
        await assertSucceeds(getDoc(doc(studentDb, 'enrollments', testEnrollment.id)));
      });

      test('Instructors can read enrollments for their courses', async () => {
        await assertSucceeds(getDoc(doc(instructorDb, 'enrollments', testEnrollment.id)));
      });

      test('Students cannot read other students enrollments', async () => {
        const otherStudentDb = testEnv.authenticatedContext(testUsers.otherStudent.uid, 
          testUsers.otherStudent).firestore();
        
        await assertFails(getDoc(doc(otherStudentDb, 'enrollments', testEnrollment.id)));
      });

      test('Admins can read any enrollment', async () => {
        await assertSucceeds(getDoc(doc(adminDb, 'enrollments', testEnrollment.id)));
      });
    });

    describe('Creating Enrollments', () => {
      test('Users cannot create enrollments directly', async () => {
        await assertFails(addDoc(collection(studentDb, 'enrollments'), {
          userId: testUsers.student.uid,
          courseId: 'some-course',
          enrolledAt: new Date()
        }));
      });

      test('Instructors cannot create enrollments directly', async () => {
        await assertFails(addDoc(collection(instructorDb, 'enrollments'), {
          userId: 'some-user',
          courseId: testCourse.id,
          enrolledAt: new Date()
        }));
      });

      test('Even admins cannot create enrollments (Cloud Functions only)', async () => {
        await assertFails(addDoc(collection(adminDb, 'enrollments'), {
          userId: 'some-user',
          courseId: testCourse.id,
          enrolledAt: new Date()
        }));
      });
    });

    describe('Updating Enrollments', () => {
      test('Students can update their progress fields', async () => {
        await assertSucceeds(updateDoc(doc(studentDb, 'enrollments', testEnrollment.id), {
          progress: 50,
          lastAccessedAt: new Date(),
          currentLessonId: 'lesson-123'
        }));
      });

      test('Students cannot update other fields', async () => {
        await assertFails(updateDoc(doc(studentDb, 'enrollments', testEnrollment.id), {
          userId: 'different-user'
        }));

        await assertFails(updateDoc(doc(studentDb, 'enrollments', testEnrollment.id), {
          courseId: 'different-course'
        }));
      });

      test('Course instructors can update enrollments', async () => {
        await assertSucceeds(updateDoc(doc(instructorDb, 'enrollments', testEnrollment.id), {
          progress: 75,
          status: 'completed'
        }));
      });
    });
  });

  describe('Lesson Progress Collection Security', () => {
    const progressData = {
      userId: testUsers.student.uid,
      courseId: testCourse.id,
      lessonId: 'lesson-123',
      completed: false,
      timeSpent: 0,
      createdAt: new Date()
    };

    test('Users can create their own lesson progress', async () => {
      await assertSucceeds(addDoc(collection(studentDb, 'lessonProgress'), progressData));
    });

    test('Users cannot create progress for other users', async () => {
      await assertFails(addDoc(collection(studentDb, 'lessonProgress'), {
        ...progressData,
        userId: 'different-user'
      }));
    });

    test('Users can only create progress for courses they are enrolled in', async () => {
      await assertFails(addDoc(collection(studentDb, 'lessonProgress'), {
        ...progressData,
        courseId: 'unauthorized-course'
      }));
    });

    test('Users can update their own progress', async () => {
      // First create a progress record
      const progressId = 'progress-test-123';
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const db = context.firestore();
        await setDoc(doc(db, 'lessonProgress', progressId), progressData);
      });

      await assertSucceeds(updateDoc(doc(studentDb, 'lessonProgress', progressId), {
        completed: true,
        timeSpent: 300
      }));
    });

    test('Instructors can read progress for their courses', async () => {
      const progressId = 'progress-instructor-read';
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const db = context.firestore();
        await setDoc(doc(db, 'lessonProgress', progressId), progressData);
      });

      await assertSucceeds(getDoc(doc(instructorDb, 'lessonProgress', progressId)));
    });
  });

  describe('Quiz Results Collection Security', () => {
    const quizResult = {
      userId: testUsers.student.uid,
      courseId: testCourse.id,
      lessonId: 'lesson-123',
      score: 85,
      maxScore: 100,
      answers: ['A', 'B', 'C'],
      submittedAt: new Date()
    };

    test('Users can create their own quiz results', async () => {
      await assertSucceeds(addDoc(collection(studentDb, 'quizResults'), quizResult));
    });

    test('Users cannot create quiz results for others', async () => {
      await assertFails(addDoc(collection(studentDb, 'quizResults'), {
        ...quizResult,
        userId: 'different-user'
      }));
    });

    test('Quiz results are immutable after creation', async () => {
      const resultId = 'quiz-result-immutable';
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const db = context.firestore();
        await setDoc(doc(db, 'quizResults', resultId), quizResult);
      });

      await assertFails(updateDoc(doc(studentDb, 'quizResults', resultId), {
        score: 100
      }));
    });

    test('Instructors can read results for their courses', async () => {
      const resultId = 'quiz-result-instructor-read';
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const db = context.firestore();
        await setDoc(doc(db, 'quizResults', resultId), quizResult);
      });

      await assertSucceeds(getDoc(doc(instructorDb, 'quizResults', resultId)));
    });

    test('Users can read their own quiz results', async () => {
      const resultId = 'quiz-result-own-read';
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const db = context.firestore();
        await setDoc(doc(db, 'quizResults', resultId), quizResult);
      });

      await assertSucceeds(getDoc(doc(studentDb, 'quizResults', resultId)));
    });
  });

  describe('Categories Collection Security', () => {
    test('Anyone can read categories', async () => {
      // First create a category
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const db = context.firestore();
        await setDoc(doc(db, 'categories', 'test-category'), {
          name: 'Test Category',
          description: 'A test category'
        });
      });

      await assertSucceeds(getDoc(doc(unauthedDb, 'categories', 'test-category')));
      await assertSucceeds(getDoc(doc(studentDb, 'categories', 'test-category')));
    });

    test('Only admins can create categories', async () => {
      await assertFails(addDoc(collection(studentDb, 'categories'), {
        name: 'Unauthorized Category'
      }));

      await assertFails(addDoc(collection(instructorDb, 'categories'), {
        name: 'Instructor Category'
      }));

      await assertSucceeds(addDoc(collection(adminDb, 'categories'), {
        name: 'Admin Category'
      }));
    });

    test('Only admins can update categories', async () => {
      await assertFails(updateDoc(doc(studentDb, 'categories', 'test-category'), {
        name: 'Hacked Category'
      }));

      await assertSucceeds(updateDoc(doc(adminDb, 'categories', 'test-category'), {
        name: 'Updated by Admin'
      }));
    });
  });

  describe('Payments Collection Security', () => {
    const paymentData = {
      userId: testUsers.student.uid,
      courseId: testCourse.id,
      amount: 99.99,
      currency: 'USD',
      status: 'completed',
      stripeSessionId: 'cs_test_123',
      createdAt: new Date()
    };

    beforeAll(async () => {
      // Create test payment data
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const db = context.firestore();
        await setDoc(doc(db, 'payments', 'test-payment'), paymentData);
      });
    });

    test('Users can read their own payments', async () => {
      await assertSucceeds(getDoc(doc(studentDb, 'payments', 'test-payment')));
    });

    test('Users cannot read other users payments', async () => {
      const otherStudentDb = testEnv.authenticatedContext(testUsers.otherStudent.uid, 
        testUsers.otherStudent).firestore();
      
      await assertFails(getDoc(doc(otherStudentDb, 'payments', 'test-payment')));
    });

    test('Admins can read any payment', async () => {
      await assertSucceeds(getDoc(doc(adminDb, 'payments', 'test-payment')));
    });

    test('Users cannot create payments directly', async () => {
      await assertFails(addDoc(collection(studentDb, 'payments'), paymentData));
    });

    test('Users cannot update payments', async () => {
      await assertFails(updateDoc(doc(studentDb, 'payments', 'test-payment'), {
        status: 'refunded'
      }));
    });

    test('Even admins cannot create payments (Cloud Functions only)', async () => {
      await assertFails(addDoc(collection(adminDb, 'payments'), paymentData));
    });
  });

  describe('Default Deny Rule', () => {
    test('Access to undefined collections is denied', async () => {
      await assertFails(getDoc(doc(studentDb, 'undefinedCollection', 'doc-123')));
      await assertFails(getDoc(doc(unauthedDb, 'secretCollection', 'doc-456')));
      await assertFails(getDoc(doc(adminDb, 'unknownCollection', 'doc-789')));
    });

    test('Even authenticated users cannot access undefined collections', async () => {
      await assertFails(addDoc(collection(instructorDb, 'hackerCollection'), {
        malicious: 'data'
      }));
    });
  });

  describe('Role-Based Access Control', () => {
    test('Role validation works correctly', async () => {
      // Students should have limited access
      await assertFails(addDoc(collection(studentDb, 'courses'), {
        title: 'Student Course',
        instructorId: testUsers.student.uid
      }));

      // Instructors should be able to create courses
      await assertSucceeds(addDoc(collection(instructorDb, 'courses'), {
        title: 'Instructor Course',
        description: 'Valid instructor course',
        instructorId: testUsers.instructor.uid,
        status: 'draft',
        createdAt: new Date()
      }));

      // Admins should have elevated privileges
      await assertSucceeds(updateDoc(doc(adminDb, 'users', testUsers.student.uid), {
        role: 'instructor'
      }));
    });

    test('University admin role works correctly', async () => {
      // First create a university with admin
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const db = context.firestore();
        await setDoc(doc(db, 'universities', 'test-university'), {
          name: 'Test University',
          admins: {
            [testUsers.universityAdmin.uid]: true
          },
          members: {
            [testUsers.universityAdmin.uid]: true,
            [testUsers.student.uid]: true
          }
        });
      });

      // University admin should be able to read university data
      await assertSucceeds(getDoc(doc(universityAdminDb, 'universities', 'test-university')));
    });
  });
});