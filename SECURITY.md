# Security Framework

This document outlines the security measures implemented in the portfolio website.

## Security Features

### 1. Password Security
- **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
- **Password Requirements**: Minimum 8 characters with at least one letter and one number
- **Legacy Migration**: Existing plain-text passwords are automatically migrated to hashed passwords on login

### 2. Rate Limiting
- **General API**: 100 requests per 15 minutes per IP address
- **Authentication Endpoints**: 5 requests per 15 minutes per IP address (login/signup)
- Prevents brute force attacks and API abuse

### 3. Security Headers (Helmet)
- **Content Security Policy**: Restricts resource loading to prevent XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Strict-Transport-Security**: Enforces HTTPS in production
- **X-XSS-Protection**: Additional XSS protection

### 4. Input Validation & Sanitization
- **Express Validator**: Validates all user inputs
- **Email Validation**: Ensures proper email format
- **Input Sanitization**: Removes dangerous characters and scripts
- **NoSQL Injection Prevention**: Sanitizes MongoDB-style query patterns
- **XSS Prevention**: Escapes HTML and removes script tags

### 5. CORS Configuration
- **Production**: Restricted to specified frontend URL
- **Development**: Allows localhost origins
- **Credentials**: Supports credential-based requests

### 6. Authentication
- **Bearer Token**: Uses user ID as token (consider JWT for production)
- **Protected Endpoints**: `/api/members` requires authentication
- **Secure Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)

### 7. Error Handling
- **Generic Errors**: Production errors don't leak sensitive information
- **Validation Errors**: Clear validation messages for debugging
- **404 Handling**: Proper handling of non-existent endpoints

## Security Best Practices

### For Production Deployment

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Configure `FRONTEND_URL` for CORS
   - Use secure session secrets

2. **HTTPS**
   - Always use HTTPS in production
   - Helmet will enforce this with HSTS

3. **Database Security**
   - Consider migrating from JSON file storage to a proper database
   - Use connection pooling and prepared statements
   - Implement database backups

4. **Token Management**
   - Consider implementing JWT tokens with expiration
   - Use httpOnly cookies instead of localStorage
   - Implement token refresh mechanism

5. **Monitoring**
   - Set up logging for security events
   - Monitor rate limit violations
   - Track failed login attempts

6. **Regular Updates**
   - Keep all dependencies updated
   - Run `npm audit` regularly
   - Review security advisories

## Security Checklist

- [x] Password hashing implemented
- [x] Rate limiting enabled
- [x] Security headers configured
- [x] Input validation in place
- [x] XSS protection active
- [x] CORS properly configured
- [x] Authentication middleware working
- [x] Error handling secure
- [ ] JWT tokens (recommended for production)
- [ ] httpOnly cookies (recommended for production)
- [ ] Database migration (recommended for production)
- [ ] Security logging (recommended for production)

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly. Do not create public GitHub issues for security vulnerabilities.
