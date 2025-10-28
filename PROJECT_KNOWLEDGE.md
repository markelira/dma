# DMA Production Development - Project Knowledge

## 🎯 Project Mission
Transform DMA from a development prototype into a production-ready B2B2C e-learning platform that enables universities to offer professional development courses with enterprise-grade security, scalability, and user experience.

## 🚨 Critical Context for Claude

### Current State Assessment
The platform has significant architectural foundation but lacks critical production components:
- **Security**: Firestore rules are open, API keys exposed in git history
- **Missing Systems**: Video player, email service, payment processing backend
- **Incomplete Features**: Quiz persistence, course creation UI, university management
- **No Monitoring**: Error tracking, analytics, or performance monitoring absent
- **Compliance Gaps**: GDPR, data export/deletion features missing

### Production Requirements
1. **Security First**: All user data must be protected with proper authentication and authorization
2. **Enterprise Ready**: Multi-tenant support for universities with isolated data
3. **Scalable**: Handle 10,000+ concurrent users
4. **Compliant**: GDPR, FERPA, and data privacy regulations
5. **Reliable**: 99.9% uptime with proper error handling and recovery

## 📋 Implementation Strategy

### Phase Approach (21 Days Total)
- **Week 1 (Days 1-7)**: Critical security fixes and infrastructure
- **Week 2 (Days 8-14)**: Core user experience and missing features  
- **Week 3 (Days 15-21)**: Advanced features and production deployment

### Daily Execution Pattern
1. **Morning Stand-up**: Review roadmap tasks for the day
2. **Implementation**: Follow exact steps in roadmap
3. **Testing**: Run Playwright tests after each component
4. **Validation**: End-of-day comprehensive testing
5. **Documentation**: Update progress tracker

## 🛠 Technical Architecture

### Technology Stack
```yaml
Frontend:
  - Framework: Next.js 15 (App Router)
  - Language: TypeScript
  - Styling: Tailwind CSS + Shadcn/UI
  - State: Zustand (global) + TanStack Query (server)
  
Backend:
  - Functions: Firebase Cloud Functions (Node.js 18)
  - Database: Firestore (NoSQL)
  - Auth: Firebase Authentication
  - Storage: Firebase Storage
  - Email: SendGrid
  - Payments: Stripe
  - Video: Mux Player

DevOps:
  - Hosting: Firebase Hosting
  - CI/CD: GitHub Actions
  - Monitoring: Sentry + Google Analytics
  - Testing: Jest + Playwright
```

### Data Architecture
```typescript
// Core Collections Structure
collections: {
  users: {
    [userId]: {
      role: 'student' | 'instructor' | 'admin' | 'university_admin',
      universityId?: string,
      stripeCustomerId?: string,
      profile: UserProfile
    }
  },
  courses: {
    [courseId]: {
      instructorId: string,
      universityId?: string,
      status: 'draft' | 'published' | 'archived',
      pricing: CoursePricing,
      lessons: subcollection
    }
  },
  enrollments: {
    [userId_courseId]: {
      userId: string,
      courseId: string,
      progress: number,
      status: 'active' | 'completed' | 'expired'
    }
  },
  universities: {
    [universityId]: {
      settings: UniversitySettings,
      departments: Department[],
      admins: string[]
    }
  }
}
```

## 🔧 Development Guidelines

### Code Standards
```typescript
// ALWAYS follow this pattern for Cloud Functions
export const functionName = onCall({
  cors: true,
  region: 'us-central1',
  maxInstances: 100
}, async (request) => {
  // 1. Authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }
  
  // 2. Authorization
  const userRole = await getUserRole(request.auth.uid);
  if (!hasPermission(userRole, 'action')) {
    throw new HttpsError('permission-denied', 'Insufficient permissions');
  }
  
  // 3. Validation
  const validated = Schema.parse(request.data);
  
  // 4. Business Logic
  try {
    const result = await performAction(validated);
    return { success: true, data: result };
  } catch (error) {
    logger.error('Function error:', error);
    throw new HttpsError('internal', 'Operation failed');
  }
});
```

### Security Checklist
- [ ] Never expose API keys in client code
- [ ] Validate all inputs with Zod schemas
- [ ] Implement proper Firestore security rules
- [ ] Use Firebase Auth for all protected routes
- [ ] Sanitize user inputs before database operations
- [ ] Implement rate limiting on sensitive endpoints
- [ ] Log security events for audit trail

### Performance Optimization
- Use React.memo for expensive components
- Implement virtual scrolling for lists > 100 items
- Lazy load heavy components and routes
- Optimize images with Next.js Image component
- Create Firestore composite indexes for complex queries
- Batch Firestore operations (max 500 per batch)
- Cache frequently accessed data with Redis/Memory

## 🚀 Production Deployment Checklist

### Pre-Deployment
- [ ] All critical gaps addressed from roadmap
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Accessibility WCAG 2.1 AA compliant
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified
- [ ] Load testing passed (10k users)

### Deployment Process
```bash
# 1. Run comprehensive tests
npm run test:all
npm run test:e2e
npm run test:security

# 2. Build and validate
npm run build
npm run build:functions

# 3. Deploy to staging
firebase use staging
firebase deploy --only hosting,functions

# 4. Smoke tests on staging
npm run test:staging

# 5. Deploy to production
firebase use production
firebase deploy --only firestore:rules
firebase deploy --only functions
firebase deploy --only hosting

# 6. Monitor deployment
firebase functions:log --only production
```

### Post-Deployment
- [ ] Monitor error rates (target < 0.1%)
- [ ] Check performance metrics
- [ ] Verify email delivery
- [ ] Test payment processing
- [ ] Confirm video streaming quality
- [ ] Review security logs

## 📊 Success Metrics

### Technical KPIs
- Page Load Time: < 2 seconds
- API Response Time: < 200ms (p95)
- Error Rate: < 0.1%
- Uptime: > 99.9%
- Security Incidents: 0

### Business KPIs
- User Registration Success: > 95%
- Course Completion Rate: > 60%
- Payment Success Rate: > 98%
- Support Ticket Volume: < 2% of DAU
- User Satisfaction Score: > 4.5/5

## 🔥 Critical Implementation Notes

### Day 1-3 Focus (Security)
1. **IMMEDIATE**: Rotate all API keys and remove from git history
2. **CRITICAL**: Implement Firestore security rules
3. **REQUIRED**: Setup proper authentication middleware

### Day 4-7 Focus (Infrastructure)
1. **Email Service**: Complete SendGrid integration
2. **Payment Backend**: Stripe webhook handlers
3. **Video System**: Mux player implementation

### Day 8-14 Focus (Core Features)
1. **Course Creation**: Complete instructor workflow
2. **Quiz System**: Persistent results and analytics
3. **University Features**: Multi-tenant isolation

### Day 15-21 Focus (Production Ready)
1. **Monitoring**: Sentry + Analytics setup
2. **Performance**: Optimization and caching
3. **Compliance**: GDPR features implementation

## 🎓 Hungarian UI Convention
All user-facing text must be in Hungarian. Use these translations:
- Login → Bejelentkezés
- Register → Regisztráció  
- Course → Tanfolyam
- Lesson → Lecke
- Quiz → Kvíz
- Certificate → Tanúsítvány
- Dashboard → Irányítópult
- Settings → Beállítások
- Profile → Profil
- Logout → Kijelentkezés

## ⚠️ Common Pitfalls to Avoid

1. **Never** mix Firebase Admin SDK with Client SDK
2. **Never** store sensitive data in localStorage
3. **Never** trust client-side validation alone
4. **Always** handle Firebase offline scenarios
5. **Always** implement proper error boundaries
6. **Always** test with Firebase emulators first

## 📚 Essential Resources

### Documentation
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Stripe Integration](https://stripe.com/docs/payments/checkout)
- [Mux Player](https://docs.mux.com/guides/video/play-your-videos)
- [SendGrid Email](https://docs.sendgrid.com/for-developers)

### Testing Commands
```bash
# Development
npm run dev                  # Start Next.js dev server
firebase emulators:start     # Start Firebase emulators

# Testing
npm run test                 # Unit tests
npm run test:e2e            # Playwright E2E tests
npm run test:security       # Security rule tests

# Production
npm run build               # Build for production
firebase deploy             # Deploy to Firebase
```

## 🆘 Emergency Procedures

### If API Keys Exposed
1. Immediately rotate all keys
2. Review access logs for unauthorized use
3. Implement key rotation schedule
4. Add monitoring alerts

### If Data Breach Detected
1. Immediately restrict database access
2. Audit all recent access logs
3. Notify affected users within 72 hours
4. Document incident and remediation

### If Production Down
1. Check Firebase status page
2. Review function logs
3. Rollback to last known good deployment
4. Implement fix and redeploy

## 💡 Implementation Philosophy

### Principles
1. **Security by Default**: Every feature starts with security considerations
2. **User First**: Optimize for user experience and performance
3. **Test Everything**: No code reaches production without tests
4. **Document Decisions**: Maintain clear documentation for future developers
5. **Iterate Quickly**: Ship small, frequent improvements

### Code Review Checklist
- [ ] Security implications considered
- [ ] Error handling implemented
- [ ] Tests written and passing
- [ ] Performance impact assessed
- [ ] Accessibility requirements met
- [ ] Documentation updated

## 🎯 Daily Success Criteria

Each day's implementation is successful when:
1. All roadmap tasks completed
2. Playwright tests passing
3. No critical errors in console
4. Performance benchmarks met
5. Security requirements satisfied

## 🚦 Go/No-Go Decision Points

### Day 7 Checkpoint
- Security vulnerabilities fixed? → Continue
- Payment system functional? → Continue
- Email delivery working? → Continue
- If any NO → Stop and fix before proceeding

### Day 14 Checkpoint  
- Core features complete? → Continue
- User flows tested? → Continue
- Performance acceptable? → Continue
- If any NO → Reassess timeline

### Day 21 Final Review
- All critical gaps addressed?
- Security audit passed?
- Load testing successful?
- Compliance requirements met?
- All YES → Deploy to production

---

*This knowledge base is your single source of truth for the DMA production development. Follow the expanded_production_roadmap.md for detailed daily tasks, and use this document for context, standards, and decision-making.*