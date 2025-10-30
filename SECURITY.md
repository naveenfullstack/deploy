# Environment Variables Security Guide

## 🔒 Security Model

### ✅ SAFE: Deployment Credentials (Local Only)
These variables are used by Serverless Framework for deployment and are **NEVER** sent to Lambda:

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=...
SERVERLESS_ACCESS_KEY=...
```

- ✅ Used only during `serverless deploy`
- ✅ Stay on your local machine
- ✅ Never appear in Lambda console
- ✅ Never logged or exposed

### ⚠️ EXPOSED: Lambda Environment Variables
These variables ARE sent to Lambda functions and visible in AWS Console:

```yaml
# In serverless.yml
provider:
  environment:
    NODE_ENV: ${env:NODE_ENV}
    DB_URL: ${env:DB_URL}
```

- ❌ Visible in AWS Lambda console
- ❌ Visible in CloudFormation
- ❌ Potentially logged in CloudWatch
- ❌ Accessible to anyone with Lambda read permissions

## 🛡️ Best Practices

### DO ✅
- Use `.env` for deployment credentials
- Use AWS Systems Manager Parameter Store for sensitive Lambda variables
- Use AWS Secrets Manager for database passwords
- Define environment variables explicitly in `serverless.yml`

### DON'T ❌
- Put secrets directly in `serverless.yml`
- Use `.env` variables directly in Lambda without explicit definition
- Store database passwords in environment variables
- Commit `.env` files to git

## 📋 Example: Secure Configuration

```yaml
# serverless.yml
provider:
  environment:
    # Safe - not sensitive
    NODE_ENV: ${env:NODE_ENV, 'production'}
    API_VERSION: ${env:API_VERSION, 'v1'}
    
    # Better - use Parameter Store
    DB_HOST: ${ssm:/myapp/db/host}
    
    # Best - use Secrets Manager  
    DB_PASSWORD: ${ssm(SecureString):/myapp/db/password}
```

## 🔍 What Gets Deployed

| Variable | Local .env | Lambda Console | Secure |
|----------|------------|----------------|---------|
| `AWS_ACCESS_KEY_ID` | ✅ | ❌ | ✅ Safe |
| `NODE_ENV` (via serverless.yml) | ✅ | ✅ | ⚠️ Visible |
| Direct secret in yml | ❌ | ✅ | ❌ Exposed |
| SSM Parameter | ❌ | ✅ (resolved value) | ✅ Secure |

## � Package Exclusions

Files that are **NEVER** deployed to Lambda:
- `README.md` and all `*.md` files
- `.env` and `.env.*` files  
- `serverless.yml` configuration
- `.git/` directory and `.gitignore`
- Test files (`*.test.js`, `*.spec.js`)
- Development folders (`test/`, `coverage/`, `.vscode/`)
- `old/` legacy code directory

Only these files go to Lambda:
- `handler.js` - Your Lambda function code
- `package.json` - Dependencies metadata
- `node_modules/` - Runtime dependencies only

## �🚀 Current Setup

Your current setup follows security best practices:
- Deployment credentials stay local
- Only explicitly defined environment variables go to Lambda
- `.env` file is in `.gitignore`
- Documentation and config files excluded from Lambda package