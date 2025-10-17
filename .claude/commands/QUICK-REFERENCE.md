# Quick Reference - Testing Commands

## 🧪 Testing Commands

| Command | Purpose | Use When |
|---------|---------|----------|
| `/test-backend` | Test all API endpoints | After API changes, before deployment |
| `/test-frontend` | Test UI components & pages | After UI changes, debugging rendering |
| `/test-auth` | Test authentication flow | After auth changes, security review |
| `/test-database` | Test database schema & ops | After schema changes, data issues |
| `/test-snaptrade` | Test SnapTrade integration | After trading changes, API issues |
| `/test-copy-engine` | Test copy trading logic | After engine changes, trade copying issues |
| `/test-full-system` | End-to-end testing | Before releases, comprehensive check |

## 🔧 Debugging Commands

| Command | Purpose | Use When |
|---------|---------|----------|
| `/debug-issue` | Debug specific problem | Encountering bugs, unexpected behavior |
| `/check-logs` | Analyze logs & errors | Health checks, mysterious issues |
| `/review-security` | Security audit | Before production, security review |

## 📋 Common Workflows

### Before Deployment
```
/check-logs
/test-full-system
/review-security
```

### After Backend Changes
```
/test-backend
/test-database
```

### After Frontend Changes
```
/test-frontend
/check-logs
```

### When Something Breaks
```
/check-logs
/debug-issue
```

### Full Health Check
```
/check-logs
/test-auth
/test-database
/test-backend
/test-snaptrade
/test-frontend
/test-copy-engine
/test-full-system
/review-security
```

## 🎯 Command Outputs

Each command provides:
- ✅ **Status**: What's working
- ❌ **Failures**: What's broken
- ⚠️ **Warnings**: What needs attention
- 💡 **Recommendations**: How to improve
- 🔧 **Fixes**: Specific code changes

## 💡 Tips

- Run commands individually for focused testing
- Commands are autonomous - they'll complete on their own
- Each command is specialized for its domain
- Reports include actionable recommendations
- Use `/debug-issue` for targeted troubleshooting
