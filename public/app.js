// Global variables
let currentUser = null;
let socket = null;
let map = null;
let markers = {};
let locationInterval = null;
let isSharingLocation = true;
let updateInterval = 10000;
let peerConnection = null;
let localStream = null;
let screenStream = null;
let wakeLock = null;
let bgGeo = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

async function initializeApp() {
  // Check if user is already logged in
  const savedUser = localStorage.getItem('familyTrackerUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showDashboard();
  }

  // Setup form handlers
  setupForms();
  setupSocketListeners();
  
  // Setup visibility change handler for background tracking
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    // App is in background - use more aggressive tracking
    if (isSharingLocation) {
      startBackgroundTracking();
    }
  } else {
    // App is in foreground
    stopBackgroundTracking();
  }
}

function startBackgroundTracking() {
  // Use Page Visibility API with longer intervals
  if (!locationInterval) {
    locationInterval = setInterval(updateMyLocation, updateInterval);
  }
  
  // Request wake lock to keep app running
  requestWakeLock();
  
  // Use Background Geolocation if available (for mobile)
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    registerBackgroundSync();
  }
}

function stopBackgroundTracking() {
  // Keep tracking but at normal interval
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock active');
      
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock released');
      });
    }
  } catch (err) {
    console.log('Wake Lock error:', err);
  }
}

async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await registration.sync.register('sync-location');
      console.log('Background sync registered');
    } catch (err) {
      console.log('Background sync registration failed:', err);
    }
  }
}

function setupForms() {
  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (data.success) {
        currentUser = data.user;
        localStorage.setItem('familyTrackerUser', JSON.stringify(currentUser));
        showToast('Login berhasil!', 'success');
        showDashboard();
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'error');
    }
  });

  // Register form
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const userType = document.querySelector('input[name="userType"]:checked').value;
    const familyName = document.getElementById('familyName').value;
    const inviteCode = document.getElementById('inviteCode').value;

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          is_admin: userType === 'admin',
          family_name: familyName || null,
          invite_code: inviteCode || null
        })
      });

      const data = await response.json();
      if (data.success) {
        showToast('Registrasi berhasil! Silakan login.', 'success');
        showTab('login');
      } else {
        showToast(data.error, 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'error');
    }
  });

  // User type radio buttons
  document.querySelectorAll('input[name="userType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isMember = e.target.value === 'member';
      document.getElementById('familyNameGroup').style.display = isMember ? 'none' : 'block';
      document.getElementById('inviteCodeGroup').style.display = isMember ? 'block' : 'none';
    });
  });

  // Location sharing toggle
  document.getElementById('shareLocation').addEventListener('change', (e) => {
    isSharingLocation = e.target.checked;
    if (isSharingLocation) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  });

  // Update interval
  document.getElementById('updateInterval').addEventListener('change', (e) => {
    updateInterval = parseInt(e.target.value);
    if (isSharingLocation) {
      startLocationTracking();
    }
  });
}

function setupSocketListeners() {
  // Socket listeners will be set up when dashboard is shown
}

function showTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
  document.getElementById(`${tabName}Tab`).classList.add('active');
}

async function showDashboard() {
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('dashboardPage').classList.add('active');
  
  document.getElementById('currentUser').textContent = currentUser.username;

  // Initialize map
  initializeMap();

  // Connect to socket
  connectSocket();

  // Load family data
  await loadFamilyData();

  // Start location tracking if enabled
  if (isSharingLocation) {
    startLocationTracking();
  }
}

function initializeMap() {
  if (map) {
    map.remove();
  }

  map = L.map('map').setView([-6.2088, 106.8456], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Add my location marker
  getCurrentLocation().then(location => {
    addMarker(currentUser.id, currentUser.username, location.lat, location.lng, true);
    map.setView([location.lat, location.lng], 13);
  }).catch(() => {
    // Default location
    addMarker(currentUser.id, currentUser.username, -6.2088, 106.8456, true);
  });
}

function connectSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('join', {
      userId: currentUser.id,
      familyId: currentUser.family_id
    });
  });

  socket.on('location_update', (data) => {
    updateMarker(data.userId, data.latitude, data.longitude);
  });

  socket.on('member_joined', async (data) => {
    showToast('Anggota keluarga baru bergabung', 'success');
    await loadFamilyData();
  });

  socket.on('member_left', async (data) => {
    await loadFamilyData();
  });

  socket.on('member_locations', (locations) => {
    locations.forEach(loc => {
      if (loc.user_id !== currentUser.id) {
        addMarker(loc.user_id, loc.username, loc.latitude, loc.longitude, false);
      }
    });
  });

  socket.on('screen_share_started', (data) => {
    showToast(`${data.userId} mulai berbagi layar`, 'warning');
    updateScreenShareUI(true, data.userId);
  });

  socket.on('screen_share_stopped', (data) => {
    showToast('Screen sharing dihentikan', 'warning');
    updateScreenShareUI(false);
  });

  socket.on('screen_stream_request', async (data) => {
    // Check if we're the one being requested
    if (data.targetUserId === currentUser.id) {
      const accept = confirm('Seseorang ingin melihat layar Anda. Izinkan?');
      if (accept) {
        await startScreenStreamForRequest(data.requesterSocketId);
      }
    }
  });

  socket.on('screen_stream_offer', async (data) => {
    if (data.fromUserId) {
      document.getElementById('sharedBy').textContent = data.fromUserId;
      document.getElementById('viewingScreen').style.display = 'block';
      document.getElementById('noSharing').style.display = 'none';
      
      await handleOffer(data.offer);
    }
  });

  socket.on('screen_stream_answer', (data) => {
    if (peerConnection) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  });

  socket.on('ice_candidate', (data) => {
    if (peerConnection && data.candidate) {
      peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  });
}

async function loadFamilyData() {
  try {
    // Load invite code
    const inviteResponse = await fetch(`/api/family/${currentUser.family_id}/invite-code`);
    const inviteData = await inviteResponse.json();
    document.getElementById('inviteCodeDisplay').textContent = inviteData.invite_code || 'XXXXXX';

    // Load members
    const familyResponse = await fetch(`/api/family/${currentUser.family_id}/members`);
    const members = await familyResponse.json();

    // Update member list
    updateMemberList(members);

    // Request member locations
    if (socket) {
      socket.emit('get_member_locations');
    }
  } catch (error) {
    console.error('Error loading family data:', error);
  }
}

function updateMemberList(members) {
  const memberList = document.getElementById('memberList');
  memberList.innerHTML = '';

  members.forEach(member => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="member-avatar">${member.username.charAt(0).toUpperCase()}</div>
      <span>${member.username}</span>
      ${member.is_admin ? '<span style="color: #667eea; font-size: 12px;">(Admin)</span>' : ''}
      <div class="member-status ${markers[member.id] ? '' : 'offline'}"></div>
    `;
    li.onclick = () => focusOnMember(member.id);
    memberList.appendChild(li);
  });
}

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

function startLocationTracking() {
  if (locationInterval) {
    clearInterval(locationInterval);
  }

  // Get initial location
  updateMyLocation();

  // Start interval
  locationInterval = setInterval(updateMyLocation, updateInterval);
}

function stopLocationTracking() {
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
  }
}

async function updateMyLocation() {
  if (!isSharingLocation) return;

  try {
    const location = await getCurrentLocation();
    
    // Update local marker
    updateMarker(currentUser.id, location.lat, location.lng);
    map.setView([location.lat, location.lng], 13);

    // Send to server
    if (socket) {
      socket.emit('update_location', {
        userId: currentUser.id,
        latitude: location.lat,
        longitude: location.lng,
        accuracy: location.accuracy
      });
    }
  } catch (error) {
    console.error('Error getting location:', error);
    showToast('Tidak dapat mendapatkan lokasi', 'warning');
  }
}

function addMarker(userId, username, lat, lng, isMe) {
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin ${isMe ? 'me' : (currentUser.is_admin ? 'admin' : 'member')}">
      ${username.charAt(0).toUpperCase()}
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });

  const marker = L.marker([lat, lng], { icon })
    .addTo(map)
    .bindPopup(`<b>${username}</b><br>${isMe ? '(Anda)' : ''}`)
    .on('click', () => showLocationInfo(userId, username, lat, lng));

  markers[userId] = { marker, username };
  return marker;
}

function updateMarker(userId, lat, lng) {
  if (markers[userId]) {
    markers[userId].marker.setLatLng([lat, lng]);
    markers[userId].marker.openPopup();
  } else {
    addMarker(userId, markers[userId]?.username || 'Unknown', lat, lng, false);
  }
}

function focusOnMember(userId) {
  const memberData = markers[userId];
  if (memberData) {
    const latLng = memberData.marker.getLatLng();
    map.setView(latLng, 16);
    
    // Highlight in member list
    document.querySelectorAll('.member-list li').forEach(li => li.classList.remove('active'));
    event.target.closest('li').classList.add('active');
  }
}

function centerOnMyLocation() {
  if (markers[currentUser.id]) {
    const latLng = markers[currentUser.id].marker.getLatLng();
    map.setView(latLng, 16);
  }
}

function showAllMembers() {
  const bounds = Object.values(markers).map(m => m.marker.getLatLng());
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50] });
  }
}

function showLocationInfo(userId, username, lat, lng) {
  const panel = document.getElementById('locationPanel');
  const info = document.getElementById('locationInfo');
  
  info.innerHTML = `
    <p><strong>Nama:</strong> ${username}</p>
    <p><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
    <p><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
    <button onclick="requestLocationHistory('${userId}')">Lihat Riwayat</button>
    ${userId !== currentUser.id ? `<button onclick="requestScreenShare('${userId}')">Minta Berbagi Layar</button>` : ''}
  `;
  
  panel.classList.add('active');
}

function closeLocationPanel() {
  document.getElementById('locationPanel').classList.remove('active');
}

async function requestLocationHistory(userId) {
  try {
    const response = await fetch(`/api/location/${userId}/history`);
    const locations = await response.json();
    
    // Draw route on map
    if (locations.length > 1) {
      const coords = locations.map(loc => [loc.latitude, loc.longitude]);
      const polyline = L.polyline(coords, { color: 'blue', weight: 3 }).addTo(map);
      map.fitBounds(polyline.getBounds());
    }
    
    showToast(`Menampilkan ${locations.length} titik lokasi`, 'success');
  } catch (error) {
    showToast('Gagal memuat riwayat lokasi', 'error');
  }
}

// Screen Sharing Functions
async function startScreenShare() {
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    document.getElementById('startShareBtn').style.display = 'none';
    document.getElementById('stopShareBtn').style.display = 'block';

    socket.emit('start_screen_share');

    // Listen for stream end
    screenStream.getVideoTracks()[0].onended = () => {
      stopScreenShare();
    };

    showToast('Berbagi layar dimulai', 'success');
  } catch (error) {
    console.error('Error starting screen share:', error);
    showToast('Gagal memulai screen sharing', 'error');
  }
}

function stopScreenShare() {
  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    screenStream = null;
  }

  document.getElementById('startShareBtn').style.display = 'block';
  document.getElementById('stopShareBtn').style.display = 'none';

  socket.emit('stop_screen_share');
  showToast('Berbagi layar dihentikan', 'warning');
}

function requestScreenShare(userId) {
  socket.emit('request_screen_stream', { targetUserId: userId });
  showToast('Permintaan terkirim', 'success');
}

async function startScreenStreamForRequest(requesterSocketId) {
  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });

    // Create peer connection
    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
    peerConnection = new RTCPeerConnection(config);

    // Add local stream tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', {
          targetSocketId: requesterSocketId,
          candidate: event.candidate
        });
      }
    };

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit('screen_stream_offer', {
      targetSocketId: requesterSocketId,
      offer
    });

    // Handle stream
    peerConnection.ontrack = (event) => {
      document.getElementById('remoteVideo').srcObject = event.streams[0];
    };

    showToast('Streaming dimulai', 'success');
  } catch (error) {
    console.error('Error starting screen stream:', error);
    showToast('Gagal memulai streaming', 'error');
  }
}

async function handleOffer(offer) {
  try {
    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
    peerConnection = new RTCPeerConnection(config);

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', {
          targetSocketId: socket.id,
          candidate: event.candidate
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      document.getElementById('remoteVideo').srcObject = event.streams[0];
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('screen_stream_answer', {
      targetSocketId: socket.id,
      answer
    });
  } catch (error) {
    console.error('Error handling offer:', error);
  }
}

function updateScreenShareUI(isSharing, userId) {
  if (isSharing) {
    document.getElementById('pendingRequests').style.display = 'block';
    document.getElementById('noSharing').style.display = 'none';
  } else {
    document.getElementById('pendingRequests').style.display = 'none';
    document.getElementById('viewingScreen').style.display = 'none';
    document.getElementById('noSharing').style.display = 'block';
  }
}

function closeScreenShareModal() {
  document.getElementById('screenShareModal').classList.remove('active');
}

function copyInviteCode() {
  const code = document.getElementById('inviteCodeDisplay').textContent;
  navigator.clipboard.writeText(code).then(() => {
    showToast('Kode invite disalin!', 'success');
  }).catch(() => {
    showToast('Gagal menyalin kode', 'error');
  });
}

function logout() {
  localStorage.removeItem('familyTrackerUser');
  stopLocationTracking();
  if (socket) {
    socket.disconnect();
  }
  currentUser = null;
  markers = {};
  
  document.getElementById('dashboardPage').classList.remove('active');
  document.getElementById('loginPage').classList.add('active');
  
  showToast('Logout berhasil', 'success');
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast active ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

