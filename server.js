import 'dotenv/config';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import bcrypt from 'bcrypt';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { body, validationResult, param } from 'express-validator';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const MEMBERS_FILE = path.join(__dirname, 'members.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');


// Middleware
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(mongoSanitize());

const isProd = process.env.NODE_ENV === 'production';
app.use(
  helmet({
    contentSecurityPolicy: isProd
      ? {
          useDefaults: true,
          directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", "https:", "data:", "blob:"],
            "media-src": ["'self'", "https:", "data:", "blob:"],
            "script-src": ["'self'", "https:", "'unsafe-inline'"],
            "style-src": ["'self'", "https:", "'unsafe-inline'"],
            "font-src": ["'self'", "https:", "data:"],
            "connect-src": ["'self'", "https:", "http://localhost:3000", "http://localhost:5173"],
            "frame-src": ["'self'", "https:"],
            "object-src": ["'none'"],
            "base-uri": ["'self'"],
            "form-action": ["'self'"]
          }
        }
      : false
  })
);
app.use(express.static('dist'));

// Serve public folder for development (videos, images)
app.use(express.static('public'));

// Set proper MIME types for video files
app.use((req, res, next) => {
  if (req.path.endsWith('.mp4')) {
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
  } else if (req.path.endsWith('.webm')) {
    res.setHeader('Content-Type', 'video/webm');
    res.setHeader('Accept-Ranges', 'bytes');
  }
  next();
});

// cors
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173'
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// rate limits
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);

// security helpers
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const loginAttempts = new Map();

const CSRF_TTL_MS = 2 * 60 * 60 * 1000;
const csrfTokens = new Map();

const AUDIT_LOG_FILE = path.join(__dirname, 'logs', 'security.log');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

async function auditLog(req, action, details = {}) {
  try {
    await fs.mkdir(path.dirname(AUDIT_LOG_FILE), { recursive: true });
    const entry = {
      timestamp: new Date().toISOString(),
      ip: getClientIp(req),
      userId: req.user?.id || null,
      userEmail: req.user?.email || null,
      action,
      details
    };
    await fs.appendFile(AUDIT_LOG_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

function issueCsrfToken(req) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + CSRF_TTL_MS;
  csrfTokens.set(token, { ip: getClientIp(req), expiresAt });
  return token;
}

function requireCsrf(req, res, next) {
  const token = req.headers['x-csrf-token'];
  if (!token || typeof token !== 'string') {
    return res.status(403).json({ error: 'CSRF token missing' });
  }
  const record = csrfTokens.get(token);
  if (!record || record.expiresAt < Date.now() || record.ip !== getClientIp(req)) {
    if (record) csrfTokens.delete(token);
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }
  next();
}

// auth middleware
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.substring(7); // remove 'Bearer '
    await initializeMembersFile();
    const data = await fs.readFile(MEMBERS_FILE, 'utf8');
    const members = JSON.parse(data);
    
    // find member by id
    const member = members.find(m => m.id === token);
    
    if (!member) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    
    // attach user to request
    req.user = { id: member.id, name: member.name, email: member.email };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// Initialize members.json if it doesn't exist
async function initializeMembersFile() {
  try {
    await fs.access(MEMBERS_FILE);
  } catch {
    await fs.writeFile(MEMBERS_FILE, JSON.stringify([], null, 2));
  }
}

// Initialize messages.json if it doesn't exist
async function initializeMessagesFile() {
  try {
    await fs.access(MESSAGES_FILE);
  } catch {
    await fs.writeFile(MESSAGES_FILE, JSON.stringify([], null, 2));
  }
}

// validation helper
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

const emailChain = body('email').isEmail().normalizeEmail();
const passwordChain = body('password')
  .isString()
  .isLength({ min: 8, max: 100 })
  .matches(/[A-Z]/)
  .matches(/[a-z]/)
  .matches(/\d/);
const nameChain = body('name').isString().trim().isLength({ min: 2, max: 100 });

// get all members
app.get('/api/members', async (req, res) => {
  try {
    await initializeMembersFile();
    const data = await fs.readFile(MEMBERS_FILE, 'utf8');
    const members = JSON.parse(data);
    res.json(members);
  } catch (error) {
    console.error('Error reading members:', error);
    res.status(500).json({ error: 'Failed to read members' });
  }
});

// sign up
app.post(
  '/api/members',
  authLimiter,
  [
    nameChain,
    emailChain,
    passwordChain,
    body('phone').optional().isString().trim().isLength({ min: 7, max: 20 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      await initializeMembersFile();
      const data = await fs.readFile(MEMBERS_FILE, 'utf8');
      const members = JSON.parse(data);

      const { name, email, password, phone } = req.body;

      // check if email exists
      if (members.some(m => m.email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const newMember = {
        id: Date.now().toString(),
        name,
        email,
        password: hashedPassword,
        phone,
        createdAt: new Date().toISOString()
      };

      members.push(newMember);
      await fs.writeFile(MEMBERS_FILE, JSON.stringify(members, null, 2));

      // don't send password back
      const { password: _, ...memberWithoutPassword } = newMember;
      res.status(201).json({ message: 'Member registered successfully', member: memberWithoutPassword });
    } catch (error) {
      console.error('Error creating member:', error);
      res.status(500).json({ error: 'Failed to create member' });
    }
  }
);

// login
app.post(
  '/api/login',
  authLimiter,
  [emailChain, body('password').isString().isLength({ min: 1, max: 100 })],
  validateRequest,
  async (req, res) => {
    try {
      await initializeMembersFile();
      const data = await fs.readFile(MEMBERS_FILE, 'utf8');
      const members = JSON.parse(data);

      const { email, password } = req.body;
      const member = members.find(m => m.email === email);

      if (!member) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // check if password is hashed or plaintext (for migration)
      let passwordMatch = false;
      if (member.password.startsWith('$2')) {
        // hashed password
        passwordMatch = await bcrypt.compare(password, member.password);
      } else {
        // plaintext password (legacy) - hash it and update
        if (member.password === password) {
          passwordMatch = true;
          // upgrade to hashed password
          member.password = await bcrypt.hash(password, 10);
          await fs.writeFile(MEMBERS_FILE, JSON.stringify(members, null, 2));
        }
      }

      if (passwordMatch) {
        res.json({ message: 'Login successful', member: { id: member.id, name: member.name, email: member.email } });
      } else {
        res.status(401).json({ error: 'Invalid email or password' });
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Failed to process login' });
    }
  }
);


// contact endpoint - requires authentication
app.post(
  '/api/contact',
  authenticateUser,
  [
    nameChain,
    emailChain,
    body('subject').isString().trim().isLength({ min: 2, max: 200 }),
    body('message').isString().trim().isLength({ min: 2, max: 5000 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

    // get user info
    await initializeMembersFile();
    const data = await fs.readFile(MEMBERS_FILE, 'utf8');
    const members = JSON.parse(data);
    const member = members.find(m => m.id === req.user.id);

    if (!member) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // store message in messages.json
    await initializeMessagesFile();
    let messages = [];
    try {
      const messagesData = await fs.readFile(MESSAGES_FILE, 'utf8');
      if (messagesData.trim()) {
        messages = JSON.parse(messagesData);
      }
    } catch (error) {
      // if file is empty or invalid, start with empty array
      console.log('Creating new messages.json file');
      messages = [];
    }

    const newMessage = {
      id: Date.now().toString(),
      userId: req.user.id,
      userName: name,
      userEmail: email,
      subject: subject,
      message: message,
      createdAt: new Date().toISOString(),
      read: false
    };

    messages.push(newMessage);
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));

    console.log(`\n📨 New message received from ${name} (${email})`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Message ID: ${newMessage.id}\n`);
    
      res.json({ 
        message: 'Message sent successfully! I\'ll get back to you soon.', 
        messageId: newMessage.id 
      });
    } catch (error) {
      console.error('Error saving message:', error);
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      res.status(500).json({ 
        error: 'Failed to send message. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// admin emails - only these can access messages
const ADMIN_EMAILS = ['ronindesignz123@gmail.com', 'roninsyoutub123@gmail.com'];

// check if user is admin
function isAdminUser(userEmail) {
  return ADMIN_EMAILS.includes(userEmail?.toLowerCase());
}

// get all messages (for admin/viewing - returns all messages, not filtered)
app.get('/api/messages', authenticateUser, async (req, res) => {
  try {
    // check if user is admin
    if (!isAdminUser(req.user.email)) {
      return res.status(403).json({ error: 'Access denied. Only administrators can view messages.' });
    }

    await initializeMessagesFile();
    let messages = [];
    try {
      const data = await fs.readFile(MESSAGES_FILE, 'utf8');
      if (data.trim()) {
        messages = JSON.parse(data);
      }
    } catch (error) {
      console.log('No messages file or empty file');
      messages = [];
    }
    
    // get user details for each message
    await initializeMembersFile();
    const membersData = await fs.readFile(MEMBERS_FILE, 'utf8');
    const members = JSON.parse(membersData);
    
    // enrich messages with user details
    const enrichedMessages = messages.map(msg => {
      const user = members.find(m => m.id === msg.userId);
      return {
        ...msg,
        userPhone: user?.phone || null
      };
    });
    
    res.json(enrichedMessages);
  } catch (error) {
    console.error('Error reading messages:', error);
    res.status(500).json({ error: 'Failed to read messages' });
  }
});

const allowedProjectCategories = new Set([
  'web',
  'ui-ux',
  '3d',
  '2d',
  'programming',
  'web-development',
  'ui-ux-design',
  '3d-design',
  '2d-illustration-animations',
  'programming-software-development'
]);

// file upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const rawCategory = (req.body.category || '3d').toLowerCase()
    const category = allowedProjectCategories.has(rawCategory) ? rawCategory : '3d'
    const isVideo = file.mimetype.startsWith('video/')
    const uploadPath = isVideo 
      ? path.join(__dirname, 'public', 'videos', 'projects', category)
      : path.join(__dirname, 'public', 'images', 'projects', category)
    
    try {
      await fs.mkdir(uploadPath, { recursive: true })
      cb(null, uploadPath)
    } catch (error) {
      cb(error, null)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/')
    const isVideo = file.mimetype.startsWith('video/')
    if (isImage || isVideo) {
      cb(null, true)
    } else {
      cb(new Error('Only image and video files are allowed'))
    }
  }
})

// file upload endpoint
app.post('/api/upload', authenticateUser, uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const rawCategory = (req.body.category || '3d').toLowerCase()
    const category = allowedProjectCategories.has(rawCategory) ? rawCategory : '3d'
    const isVideo = req.file.mimetype.startsWith('video/')
    const url = isVideo
      ? `/videos/projects/${category}/${req.file.filename}`
      : `/images/projects/${category}/${req.file.filename}`

    res.json({ 
      url,
      filename: req.file.filename,
      type: isVideo ? 'video' : 'image'
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to upload file' })
  }
})

// projects file path
const PROJECTS_FILE = path.join(__dirname, 'src', 'data', 'projects.js')
const PROJECTS_FILE_URL = pathToFileURL(PROJECTS_FILE).href

async function loadProjects() {
  const module = await import(`${PROJECTS_FILE_URL}?v=${Date.now()}`)
  return Array.isArray(module.projects) ? module.projects : []
}

// get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await loadProjects()
    res.json(projects)
  } catch (error) {
    console.error('Error reading projects:', error)
    res.status(500).json({ error: 'Failed to read projects' })
  }
})

// save project (create or update)
app.post(
  '/api/projects',
  authenticateUser,
  [
    body('title').isString().trim().isLength({ min: 2, max: 200 }),
    body('description').isString().trim().isLength({ min: 2, max: 500 }),
    body('category').isString().trim().isLength({ min: 2, max: 100 }),
    body('technologies').optional().isArray({ max: 50 }),
    body('programming').optional().isArray({ max: 50 }),
    body('features').optional().isArray({ max: 50 }),
    body('longDescription').optional().isString().isLength({ max: 5000 }),
    body('challenges').optional().isString().isLength({ max: 5000 }),
    body('results').optional().isString().isLength({ max: 5000 }),
    body('image').optional().isString().isLength({ max: 500 }),
    body('video').optional({ nullable: true }).isString().isLength({ max: 500 }),
    body('media').optional().isArray({ max: 30 }),
    body('id').optional().isInt({ min: 1 })
  ],
  validateRequest,
  async (req, res) => {
  try {
    if (!isAdminUser(req.user.email)) {
      return res.status(403).json({ error: 'Only administrators can manage projects' })
    }

    const projectData = req.body
    let projects = await loadProjects()
    
    if (projectData.id) {
      // update existing
      const index = projects.findIndex(p => p.id === parseInt(projectData.id))
      if (index !== -1) {
        projects[index] = { ...projects[index], ...projectData, id: parseInt(projectData.id) }
      } else {
        return res.status(404).json({ error: 'Project not found' })
      }
    } else {
      // create new
      const newId = Math.max(...projects.map(p => p.id), 0) + 1
      projects.push({ ...projectData, id: newId })
    }

    // write back to file
    const newContent = `// projects data
// images go in public/images/projects/
// videos go in public/videos/projects/

export const projects = ${JSON.stringify(projects, null, 2)}

// get project by id - memoized lookup
const projectMap = new Map()
projects.forEach(p => projectMap.set(p.id, p))

export function getProjectById(id) {
  return projectMap.get(parseInt(id)) || projects.find(project => project.id === parseInt(id))
}
`

    await fs.writeFile(PROJECTS_FILE, newContent, 'utf8')
    res.json({ message: 'Project saved successfully', project: projectData.id ? projects.find(p => p.id === parseInt(projectData.id)) : projects[projects.length - 1] })
  } catch (error) {
    console.error('Error saving project:', error)
    res.status(500).json({ error: 'Failed to save project' })
  }
  }
)

// delete project
app.delete(
  '/api/projects/:id',
  authenticateUser,
  [param('id').isInt({ min: 1 })],
  validateRequest,
  async (req, res) => {
  try {
    if (!isAdminUser(req.user.email)) {
      return res.status(403).json({ error: 'Only administrators can delete projects' })
    }

    const projectId = parseInt(req.params.id)
    let projects = await loadProjects()
    projects = projects.filter(p => p.id !== projectId)

    const newContent = `// projects data
// images go in public/images/projects/
// videos go in public/videos/projects/

export const projects = ${JSON.stringify(projects, null, 2)}

// get project by id - memoized lookup
const projectMap = new Map()
projects.forEach(p => projectMap.set(p.id, p))

export function getProjectById(id) {
  return projectMap.get(parseInt(id)) || projects.find(project => project.id === parseInt(id))
}
`

    await fs.writeFile(PROJECTS_FILE, newContent, 'utf8')
    res.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
  }
)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Server error' })
})

app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`📨 Messages are stored in messages.json`);
  console.log(`All endpoints are functional\n`);
});
