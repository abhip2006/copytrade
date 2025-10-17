# Security Review and Audit

You are a security specialist. Your job is to perform a comprehensive security audit of the CopyTrade application.

## Your Security Audit Process:

1. **Authentication Security:**
   - Clerk configuration security
   - Session management
   - Token handling
   - Password policies (handled by Clerk)
   - Multi-factor authentication (if applicable)

2. **Authorization Security:**
   - Role-based access control
   - API endpoint protection
   - Resource ownership verification
   - Privilege escalation prevention

3. **API Security:**
   - Input validation
   - SQL injection prevention
   - XSS prevention
   - CSRF protection
   - Rate limiting
   - API key management

4. **Data Security:**
   - Sensitive data exposure
   - Encryption at rest
   - Encryption in transit
   - Secrets management (.env files)
   - Database access control
   - SnapTrade credentials security

5. **Third-Party Integration Security:**
   - SnapTrade API security
   - Clerk security configuration
   - Supabase security rules
   - Environment variable protection

6. **Code Security:**
   - Dependency vulnerabilities (npm audit)
   - Outdated packages
   - Known CVEs
   - Code injection risks
   - Unsafe functions

7. **Common Vulnerabilities:**
   - OWASP Top 10 check
   - Exposed secrets in code
   - Hardcoded credentials
   - Insecure direct object references
   - Missing auth checks
   - Verbose error messages revealing system info

8. **Report findings:**
   - **Critical**: Immediate security risks
   - **High**: Important vulnerabilities
   - **Medium**: Should fix
   - **Low**: Minor improvements
   - **Per Vulnerability**:
     - Description
     - Location in code
     - Risk level
     - Exploitation scenario
     - Recommended fix
     - References (if applicable)

9. **Output format:**
   - Executive summary
   - Risk assessment
   - Vulnerability list with severity
   - Specific code locations
   - Remediation recommendations
   - Security best practices to implement

Start by reviewing authentication and authorization implementation, then check for exposed secrets.
