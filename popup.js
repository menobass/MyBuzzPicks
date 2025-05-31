const API = 'https://api.hive.blog';

const getUserPosts = async (username) => {
  const response = await fetch(API, {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'condenser_api.get_discussions_by_blog',
      params: [{ tag: username, limit: 5 }],
      id: 1
    })
  });
  const result = await response.json();
  return result.result;
};

const loadPosts = async () => {
  const { followedUsers = [] } = await chrome.storage.local.get(['followedUsers']);
  const postList = document.getElementById('postList');
  postList.innerHTML = '';

  for (const user of followedUsers) {
    const posts = await getUserPosts(user);
    posts.forEach(post => {
      const created = new Date(post.created);
      const now = new Date();
      const diff = (now - created) / (1000 * 60 * 60 * 24);
      // Only show if post is authored by the user (not a reblog)
      if (diff <= 3 && post.author === user) {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.flexDirection = 'column';
        li.style.marginBottom = '8px';
        li.style.padding = '4px 0';
        // Top row: avatar + username
        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.alignItems = 'center';
        // Avatar (smaller)
        const avatar = document.createElement('img');
        avatar.src = `https://images.hive.blog/u/${post.author}/avatar`;
        avatar.width = 17; // 25 * 0.7 = 17.5
        avatar.height = 17;
        avatar.alt = post.author;
        avatar.style.borderRadius = '50%';
        avatar.style.marginRight = '6px';
        // Username
        const usernameLink = document.createElement('a');
        usernameLink.href = `https://peakd.com/@${post.author}`;
        usernameLink.target = '_blank';
        usernameLink.textContent = `@${post.author}`;
        usernameLink.style.color = '#666';
        usernameLink.style.fontWeight = 'bold';
        usernameLink.style.fontSize = '13px';
        topRow.appendChild(avatar);
        topRow.appendChild(usernameLink);
        // Bottom row: thumbnail + info
        const bottomRow = document.createElement('div');
        bottomRow.style.display = 'flex';
        bottomRow.style.alignItems = 'flex-start';
        // Thumbnail (small)
        const thumb = document.createElement('img');
        // Try to get thumbnail from post json_metadata, fallback to blank
        let thumbUrl = '';
        try {
          const meta = typeof post.json_metadata === 'string' ? JSON.parse(post.json_metadata) : post.json_metadata;
          if (meta && meta.image && meta.image.length > 0) {
            thumbUrl = meta.image[0];
          }
        } catch (e) {}
        thumb.src = thumbUrl || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        thumb.width = 50;
        thumb.height = 34;
        thumb.alt = 'thumbnail';
        thumb.style.objectFit = 'cover';
        thumb.style.marginRight = '6px';
        // Info column
        const infoCol = document.createElement('div');
        infoCol.style.display = 'flex';
        infoCol.style.flexDirection = 'column';
        infoCol.style.fontSize = '11px';
        // Title first, then date, then tag/replies/payout
        let timeDisplay = '';
        if (diff < 1) {
          timeDisplay = `${Math.floor(diff * 24)}h ago`;
        } else {
          timeDisplay = `${Math.floor(diff)}d ago`;
        }
        infoCol.innerHTML = `
          <div><a href="https://peakd.com/${post.category}/@${post.author}/${post.permlink}" target="_blank" style="font-weight:bold;color:#222;">${post.title}</a></div>
          <div>${created.toLocaleDateString()} ${created.toLocaleTimeString()} &bull; #${post.category}</div>
          <div>${timeDisplay} &bull; Replies: ${post.children} &bull; Payout: ${post.pending_payout_value}</div>
        `;
        bottomRow.appendChild(thumb);
        bottomRow.appendChild(infoCol);
        // Compose li
        li.appendChild(topRow);
        li.appendChild(bottomRow);
        postList.appendChild(li);
      }
    });
  }
};

// Add user by username (from addUsernameInput)
const addUser = async (username) => {
  username = username.trim().toLowerCase();
  if (!username) return;
  const { followedUsers = [] } = await chrome.storage.local.get(['followedUsers']);
  if (!followedUsers.includes(username)) {
    followedUsers.push(username);
    await chrome.storage.local.set({ followedUsers });
    loadPosts();
  }
};

// Delete user by username (from deleteUsernameInput)
const deleteUser = async (username) => {
  username = username.trim().toLowerCase();
  if (!username) return;
  const { followedUsers = [] } = await chrome.storage.local.get(['followedUsers']);
  const index = followedUsers.indexOf(username);
  if (index !== -1) {
    followedUsers.splice(index, 1);
    await chrome.storage.local.set({ followedUsers });
    loadPosts();
  }
};

document.addEventListener('DOMContentLoaded', function() {
  const addUserBtn = document.getElementById('addUserBtn');
  const deleteUserBtn = document.getElementById('deleteUserBtn');
  const addUserForm = document.getElementById('addUserForm');
  const deleteUserForm = document.getElementById('deleteUserForm');
  const saveAddUserBtn = document.getElementById('saveAddUserBtn');
  const saveDeleteUserBtn = document.getElementById('saveDeleteUserBtn');
  const addUsernameInput = document.getElementById('addUsernameInput');
  const deleteUsernameInput = document.getElementById('deleteUsernameInput');

  // Show Add User form, hide Delete User form
  addUserBtn.addEventListener('click', function() {
    addUserForm.classList.remove('hidden');
    deleteUserForm.classList.add('hidden');
  });

  // Show Delete User form, hide Add User form
  deleteUserBtn.addEventListener('click', function() {
    deleteUserForm.classList.remove('hidden');
    addUserForm.classList.add('hidden');
  });

  // Add User logic
  saveAddUserBtn.addEventListener('click', function() {
    const username = addUsernameInput.value.trim();
    if (username) {
      addUser(username); // You should define this function elsewhere
      addUsernameInput.value = '';
      addUserForm.classList.add('hidden');
    }
  });

  // Delete User logic
  saveDeleteUserBtn.addEventListener('click', function() {
    const username = deleteUsernameInput.value.trim();
    if (username) {
      deleteUser(username); // You should define this function elsewhere
      deleteUsernameInput.value = '';
      deleteUserForm.classList.add('hidden');
    }
  });
});

loadPosts();