# Church Finance Management System

A secure and efficient system for managing church finances, members, and submissions.

## Security Features

- Role-based access control (Admin/User)
- Secure authentication with Firebase
- Rate limiting for login attempts
- Session timeout management
- Input sanitization
- Strong password requirements
- Secure file upload restrictions
- HTTPS enforcement
- XSS protection
- CSRF protection
- Content Security Policy
- Audit logging

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project

## Environment Setup

1. Create a `.env` file in the root directory:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Security Settings
REACT_APP_MAX_LOGIN_ATTEMPTS=5
REACT_APP_LOGIN_COOLDOWN_MINUTES=15
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase:
```bash
firebase init
```

## Development

```bash
npm start
```

## Security Checks

Run security checks:
```bash
npm run security-check
```

## Deployment

1. Build and deploy:
```bash
npm run deploy
```

This will:
- Run security checks
- Create a production build
- Deploy to Firebase

## Security Best Practices

1. **Firebase Security Rules**
   - Review and update `firestore.rules`
   - Review and update `storage.rules`

2. **Authentication**
   - Enable MFA for admin accounts
   - Set up email verification
   - Configure password requirements

3. **Database**
   - Regular backups
   - Data validation
   - Rate limiting

4. **Monitoring**
   - Set up Firebase Analytics
   - Enable audit logging
   - Monitor security rules

## Maintenance

1. Regular updates:
```bash
npm audit fix
npm update
```

2. Security monitoring:
- Check Firebase Console for security issues
- Review audit logs
- Monitor authentication attempts

## License

Private - All rights reserved
