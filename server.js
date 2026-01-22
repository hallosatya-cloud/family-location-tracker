const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Simple JSON-based storage
const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return {
    users: [],
    families: [],
    locations: [],
    screenShares: []
  };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let data = loadData();

// In-memory storage for real-time
const activeUsers = new Map();

function findUserByUsername(username) {
  return data.users.find(u => u.username === username);
}

function findUserById(id) {
  return data.users.find(u => u.id === id);
}

function findFamilyByInviteCode(code) {
  return data.families.find(f => f.invite_code === code);
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication Routes
app.post('/api/register', (req, res) => {
  try {
    const { username, password, is_admin, family_name, invite_code } = req.body;
    
    if (findUserByUsername(username)) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);

    let familyId;
    
    if (family_name) {
      // Create new family
      familyId = uuidv4();
      const inviteCode = uuidv4().substring(0, 8).toUpperCase();
      
      const newFamily = {
        id: familyId,
        name: family_name,
        invite_code: inviteCode,
        created_at: new Date().toISOString()
      };
      data.families.push(newFamily);
      saveData(data);
      
      // Store invite code in localStorage on client side
    } else if (invite_code) {
      const family = findFamilyByInviteCode(invite_code.toUpperCase());
      if (!family) {
        return res.status(400).json({ error: 'Kode invite tidak valid' });
      }
      familyId = family.id;
    } else {
      return res.status(400).json({ error: 'Harap masukkan nama keluarga atau kode invite' });
    }

    const newUser = {
      id: userId,
      username,
      password: hashedPassword,
      is_admin: is_admin ? 1 : 0,
      family_id: familyId,
      created_at: new Date().toISOString()
    };
    data.users.push(newUser);
    saveData(data);

    res.json({ success: true, userId, message: 'Registrasi berhasil' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = findUserByUsername(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const family = data.families.find(f => f.id === user.family_id);
    
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        is_admin: user.is_admin, 
        family_id: user.family_id,
        invite_code: family ? family.invite_code : ''
      },
      message: 'Login berhasil' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/family/:familyId/members', (req, res) => {
  try {
    const members = data.users
      .filter(u => u.family_id === req.params.familyId)
      .map(u => ({ id: u.id, username: u.username, is_admin: u.is_admin }));
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/location/:userId/history', (req, res) => {
  try {
    const locations = data.locations
      .filter(l => l.user_id === req.params.userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100);
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Background sync endpoint for when app is closed
app.post('/api/sync-location', (req, res) => {
  try {
    const { userId, latitude, longitude, accuracy, timestamp } = req.body;
    
    const newLocation = {
      id: uuidv4(),
      user_id: userId,
      latitude,
      longitude,
      accuracy,
      timestamp: timestamp || new Date().toISOString()
    };
    data.locations.push(newLocation);
    
    // Keep only last 1000 locations per user
    const userLocations = data.locations.filter(l => l.user_id === userId);
    if (userLocations.length > 1000) {
      const toRemove = userLocations.length - 1000;
      data.locations = data.locations.filter(l => l.user_id !== userId);
      data.locations.push(...userLocations.slice(toRemove));
    }
    
    saveData(data);
    
    // Broadcast to family members in real-time
    const user = findUserById(userId);
    if (user) {
      io.to(user.family_id).emit('location_update', {
        userId,
        latitude,
        longitude,
        accuracy,
        timestamp: newLocation.timestamp
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get last known location for admin
app.get('/api/location/:userId/latest', (req, res) => {
  try {
    const locations = data.locations
      .filter(l => l.user_id === req.params.userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (locations.length > 0) {
      res.json(locations[0]);
    } else {
      res.status(404).json({ error: 'No location data found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all family member locations (for admin dashboard)
app.get('/api/family/:familyId/all-locations', (req, res) => {
  try {
    const members = data.users.filter(u => u.family_id === req.params.familyId);
    const result = [];
    
    members.forEach(member => {
      const locations = data.locations
        .filter(l => l.user_id === member.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (locations.length > 0) {
        result.push({
          userId: member.id,
          username: member.username,
          is_admin: member.is_admin,
          lastLocation: locations[0],
          locationCount: locations.length,
          lastSeen: locations[0].timestamp
        });
      } else {
        result.push({
          userId: member.id,
          username: member.username,
          is_admin: member.is_admin,
          lastLocation: null,
          locationCount: 0,
          lastSeen: null
        });
      }
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/family/:familyId/invite-code', (req, res) => {
  try {
    const family = data.families.find(f => f.id === req.params.familyId);
    if (family) {
      res.json({ invite_code: family.invite_code });
    } else {
      res.status(404).json({ error: 'Family not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io for real-time tracking
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (data) => {
    const { userId, familyId } = data;
    socket.userId = userId;
    socket.familyId = familyId;
    socket.join(familyId);
    activeUsers.set(socket.id, { userId, familyId });
    
    // Notify family members
    socket.to(familyId).emit('member_joined', { userId, socketId: socket.id });
  });

  socket.on('update_location', (data) => {
    const { userId, latitude, longitude, accuracy } = data;
    
    // Save to storage
    const newLocation = {
      id: uuidv4(),
      user_id: userId,
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString()
    };
    data.locations.push(newLocation);
    
    // Keep only last 1000 locations
    if (data.locations.length > 1000) {
      data.locations = data.locations.slice(-1000);
    }
    saveData(data);

    // Broadcast to family members
    if (socket.familyId) {
      socket.to(socket.familyId).emit('location_update', {
        userId,
        latitude,
        longitude,
        accuracy,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('get_member_locations', () => {
    const members = data.users.filter(u => u.family_id === socket.familyId);
    const locations = [];
    
    members.forEach(member => {
      const memberLocations = data.locations.filter(l => l.user_id === member.id);
      if (memberLocations.length > 0) {
        const lastLocation = memberLocations[memberLocations.length - 1];
        locations.push({
          userId: member.id,
          username: member.username,
          ...lastLocation
        });
      }
    });

    socket.emit('member_locations', locations);
  });

  // Screen Sharing
  socket.on('start_screen_share', () => {
    const userId = socket.userId;
    
    // Remove old screen share for this user
    data.screenShares = data.screenShares.filter(s => s.user_id !== userId);
    
    const newScreenShare = {
      id: uuidv4(),
      user_id: userId,
      is_sharing: 1,
      started_at: new Date().toISOString()
    };
    data.screenShares.push(newScreenShare);
    saveData(data);

    socket.to(socket.familyId).emit('screen_share_started', { userId, socketId: socket.id });
  });

  socket.on('stop_screen_share', () => {
    const userId = socket.userId;
    
    data.screenShares = data.screenShares.map(s => {
      if (s.user_id === userId) {
        s.is_sharing = 0;
      }
      return s;
    });
    saveData(data);

    socket.to(socket.familyId).emit('screen_share_stopped', { userId });
  });

  socket.on('request_screen_stream', (data) => {
    socket.to(socket.familyId).emit('screen_stream_request', { 
      requesterId: socket.userId, 
      requesterSocketId: socket.id 
    });
  });

  socket.on('screen_stream_offer', (data) => {
    io.to(data.targetSocketId).emit('screen_stream_offer', {
      fromUserId: socket.userId,
      offer: data.offer
    });
  });

  socket.on('screen_stream_answer', (data) => {
    io.to(data.targetSocketId).emit('screen_stream_answer', {
      fromUserId: socket.userId,
      answer: data.answer
    });
  });

  socket.on('ice_candidate', (data) => {
    io.to(data.targetSocketId).emit('ice_candidate', {
      fromUserId: socket.userId,
      candidate: data.candidate
    });
  });

  socket.on('disconnect', () => {
    const userData = activeUsers.get(socket.id);
    if (userData) {
      socket.to(userData.familyId).emit('member_left', { userId: userData.userId });
    }
    activeUsers.delete(socket.id);
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

