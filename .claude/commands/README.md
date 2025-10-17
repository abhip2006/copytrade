# CopyTrade Testing & Debugging Commands

This directory contains specialized slash commands for testing and debugging the CopyTrade application. You can invoke these commands at any time during development.

## Available Commands

### Testing Commands

#### `/test-backend`
Comprehensively tests all backend API endpoints.
- Tests authentication, SnapTrade integration, user management, trading APIs, orders management
- Verifies request/response formats, error handling, security
- Reports working endpoints, failures, and recommendations

**When to use**: After creating or modifying API endpoints, before deployment, or when debugging API issues.

---

#### `/test-frontend`
Tests all frontend pages and components.
- Checks TypeScript errors, imports, state management, API calls
- Verifies responsive design, accessibility, user experience
- Reports component status, errors, and UX improvements

**When to use**: After UI changes, when debugging rendering issues, or before user testing.

---

#### `/test-auth`
Tests authentication and authorization flow.
- Verifies Clerk integration, protected routes, session management
- Checks role-based access, onboarding flow, security
- Reports auth flow status, vulnerabilities, and improvements

**When to use**: After auth changes, when debugging login issues, or for security review.

---

#### `/test-database`
Tests database schema and operations.
- Reviews migrations, tables, relationships, constraints
- Verifies CRUD operations, data integrity, performance
- Reports schema issues, integrity problems, optimization opportunities

**When to use**: After schema changes, when debugging data issues, or for performance tuning.

---

#### `/test-snaptrade`
Tests all SnapTrade API integrations.
- Verifies all SnapTrade endpoints match official documentation
- Checks authentication, request/response formats, error handling
- Reports implementation status, mismatches, security concerns

**When to use**: After SnapTrade integration changes, when debugging trading issues, or before production.

---

#### `/test-copy-engine`
Tests the copy trading engine.
- Verifies trade detection, position sizing, filtering, execution
- Checks edge cases, error handling, performance
- Reports engine status, logic errors, performance metrics

**When to use**: After copy engine changes, when debugging trade copying issues, or for performance analysis.

---

#### `/test-full-system`
End-to-end testing of complete user workflows.
- Tests new user onboarding (leader and follower)
- Verifies complete trading workflows
- Tests data consistency, error recovery, security, performance
- Reports journey results, critical bugs, recommendations

**When to use**: Before major releases, when testing complete features, or for comprehensive health check.

---

### Debugging Commands

#### `/debug-issue`
Debug a specific problem you're experiencing.
- Investigates the issue with targeted analysis
- Reproduces and identifies root cause
- Proposes and implements fixes
- Reports root cause, changes made, and testing

**When to use**: When you encounter a specific bug or unexpected behavior.

---

#### `/check-logs`
Analyzes application logs and dev server output.
- Checks compilation errors, runtime errors, warnings
- Identifies patterns and recurring issues
- Categorizes by severity (critical, important, minor)
- Reports all errors with suggested fixes

**When to use**: When checking app health, debugging mysterious issues, or before deployment.

---

#### `/review-security`
Performs comprehensive security audit.
- Reviews authentication, authorization, API security
- Checks for OWASP Top 10 vulnerabilities
- Audits dependencies and third-party integrations
- Reports vulnerabilities with severity and remediation

**When to use**: Before production deployment, after major changes, or for regular security review.

---

## How to Use

Simply type the command in your conversation with Claude Code:

```
/test-backend
```

or

```
/debug-issue
```

The specialized agent will run autonomously and provide a comprehensive report.

## Best Practices

1. **Regular Testing**: Run `/test-full-system` before major releases
2. **After Changes**: Run relevant test command after modifying that area
3. **Before Deployment**: Run `/review-security` and `/check-logs`
4. **When Stuck**: Use `/debug-issue` to get targeted help
5. **Health Checks**: Periodically run `/check-logs` to catch issues early

## Command Priority

For comprehensive testing, run in this order:

1. `/check-logs` - Check for obvious errors first
2. `/test-auth` - Ensure security foundation is solid
3. `/test-database` - Verify data layer works
4. `/test-backend` - Test API layer
5. `/test-snaptrade` - Verify external integrations
6. `/test-frontend` - Test UI layer
7. `/test-copy-engine` - Test business logic
8. `/test-full-system` - End-to-end verification
9. `/review-security` - Final security check

## Notes

- Commands run autonomously and provide detailed reports
- Each command is specialized for its domain
- Commands will suggest fixes and improvements
- Reports include priority levels (P0/P1/P2 or Critical/High/Medium/Low)
