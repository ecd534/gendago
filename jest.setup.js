process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = process.env.SECRET_KEY || 'jest-secret-key';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'jest-session-secret';