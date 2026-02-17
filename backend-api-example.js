// backend-api-example.js
// Example Node.js + Express backend for Lead Management System
// This replaces the LocalStorage implementation for production use

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leadmanagement', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// ==================== SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['employee', 'qa', 'admin'], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Lead Schema
const leadSchema = new mongoose.Schema({
  date: { type: String, required: true },
  raName: { type: String, required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'qualified', 'disqualified'], default: 'pending' },
  companyName: { type: String, required: true },
  salutation: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: String,
  email: { type: String, required: true },
  domain: String,
  jobTitle: String,
  department: String,
  jobLevel: String,
  jobTitleLink: String,
  phoneNo: String,
  directDial: String,
  address1: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  industryType: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  qaId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qaName: { type: String, required: true },
  action: { type: String, enum: ['qualified', 'disqualified'], required: true },
  timestamp: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Lead = mongoose.model('Lead', leadSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// ==================== MIDDLEWARE ====================

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Role-based Authorization
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      password: hashedPassword,
      name,
      role: 'employee' // Default role
    });

    await user.save();

    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      userId: user._id 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== LEAD ROUTES ====================

// Get all leads (Admin only) or user's leads (Employee/QA)
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, agent, status } = req.query;
    
    let query = {};
    
    // Filter by employee if not admin
    if (req.user.role === 'employee') {
      query.employeeId = req.user.id;
    }
    
    // Apply filters
    if (startDate) query.date = { $gte: startDate };
    if (endDate) query.date = { ...query.date, $lte: endDate };
    if (agent) query.raName = new RegExp(agent, 'i');
    if (status) query.status = status;

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    
    res.json({ success: true, leads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create single lead
app.post('/api/leads', authenticateToken, authorizeRole('employee', 'admin'), async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      date: new Date().toISOString().split('T')[0],
      employeeId: req.user.id,
      raName: req.user.name,
      status: 'pending'
    };

    const lead = new Lead(leadData);
    await lead.save();

    res.status(201).json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk upload leads
app.post('/api/leads/bulk', authenticateToken, authorizeRole('employee', 'admin'), async (req, res) => {
  try {
    const { leads } = req.body;
    
    const leadsToInsert = leads.map(lead => ({
      ...lead,
      date: new Date().toISOString().split('T')[0],
      employeeId: req.user.id,
      raName: req.user.name,
      status: 'pending'
    }));

    const insertedLeads = await Lead.insertMany(leadsToInsert);

    res.status(201).json({ 
      success: true, 
      count: insertedLeads.length,
      leads: insertedLeads 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update lead status (QA only)
app.patch('/api/leads/:id/status', authenticateToken, authorizeRole('qa', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['qualified', 'disqualified'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Create audit log
    const auditLog = new AuditLog({
      leadId: lead._id,
      qaId: req.user.id,
      qaName: req.user.name,
      action: status
    });
    await auditLog.save();

    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk update lead status
app.patch('/api/leads/bulk-status', authenticateToken, authorizeRole('qa', 'admin'), async (req, res) => {
  try {
    const { leadIds, status } = req.body;
    
    if (!['qualified', 'disqualified'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update leads
    await Lead.updateMany(
      { _id: { $in: leadIds } },
      { status, updatedAt: Date.now() }
    );

    // Create audit logs
    const auditLogs = leadIds.map(leadId => ({
      leadId,
      qaId: req.user.id,
      qaName: req.user.name,
      action: status
    }));
    await AuditLog.insertMany(auditLogs);

    res.json({ success: true, count: leadIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== USER MANAGEMENT ROUTES (Admin only) ====================

// Get all users
app.get('/api/users', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user
app.post('/api/users', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      password: hashedPassword,
      name,
      role
    });

    await user.save();

    res.status(201).json({ 
      success: true, 
      user: { id: user._id, username, name, role } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user
app.patch('/api/users/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { name, role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password
app.patch('/api/users/:id/password', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { password } = req.body;
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword, updatedAt: Date.now() }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
app.delete('/api/users/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== STATISTICS ROUTES ====================

// Get statistics
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'employee') {
      const totalLeads = await Lead.countDocuments({ employeeId: req.user.id });
      const qualified = await Lead.countDocuments({ employeeId: req.user.id, status: 'qualified' });
      const disqualified = await Lead.countDocuments({ employeeId: req.user.id, status: 'disqualified' });
      const pending = await Lead.countDocuments({ employeeId: req.user.id, status: 'pending' });

      stats = { total: totalLeads, qualified, disqualified, pending };
    } else if (req.user.role === 'qa') {
      const audited = await AuditLog.countDocuments({ qaId: req.user.id });
      const qualified = await AuditLog.countDocuments({ qaId: req.user.id, action: 'qualified' });
      const disqualified = await AuditLog.countDocuments({ qaId: req.user.id, action: 'disqualified' });

      stats = { audited, qualified, disqualified };
    } else if (req.user.role === 'admin') {
      const totalLeads = await Lead.countDocuments();
      const qualified = await Lead.countDocuments({ status: 'qualified' });
      const disqualified = await Lead.countDocuments({ status: 'disqualified' });
      const totalUsers = await User.countDocuments();
      const employees = await User.countDocuments({ role: 'employee' });
      const qaUsers = await User.countDocuments({ role: 'qa' });

      stats = { totalLeads, qualified, disqualified, totalUsers, employees, qaUsers };
    }

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SERVER ====================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ==================== INITIAL SETUP ====================

// Create default admin user if none exists
async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const admin = new User({
        username: 'admin',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin'
      });
      
      await admin.save();
      console.log('Default admin user created');
    }
  } catch (err) {
    console.error('Error creating default admin:', err);
  }
}

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  createDefaultAdmin();
});

module.exports = app;
