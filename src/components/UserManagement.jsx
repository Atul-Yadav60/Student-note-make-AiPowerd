import React, { useState, useEffect } from "react";
import {
  getAllUsers,
  createUser,
  getCurrentUser,
  switchUser,
  deleteUser,
} from "../utils/storage";
import "./UserManagement.css";

function UserManagement({ onUserSelected, onClose }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = getAllUsers();
    setUsers(allUsers);
    const current = getCurrentUser();
    setCurrentUser(current);

    // If no users exist, show create form
    if (allUsers.length === 0) {
      setShowCreateForm(true);
    }
  };

  const handleCreateUser = () => {
    setError("");

    if (!newUser.name.trim() || !newUser.email.trim()) {
      setError("Please enter both name and email");
      return;
    }

    if (!newUser.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const user = createUser(newUser.name.trim(), newUser.email.trim());
      switchUser(user.id);
      setNewUser({ name: "", email: "" });
      setShowCreateForm(false);
      loadUsers();
      onUserSelected(user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectUser = (user) => {
    switchUser(user.id);
    setCurrentUser(user);
    onUserSelected(user);
    if (onClose) onClose();
  };

  const handleDeleteUser = (userId, e) => {
    e.stopPropagation();

    if (
      !confirm("Are you sure you want to delete this user and all their data?")
    ) {
      return;
    }

    deleteUser(userId);
    loadUsers();
  };

  return (
    <div className="user-management-overlay">
      <div className="user-management-modal">
        <div className="modal-header">
          <h2>👤 User Management</h2>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        <div className="modal-content">
          {!showCreateForm ? (
            <>
              <div className="users-list">
                <h3>Select User</h3>
                {users.length === 0 ? (
                  <p className="empty-message">
                    No users yet. Create one to get started!
                  </p>
                ) : (
                  <div className="users-grid">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className={`user-card ${
                          currentUser?.id === user.id ? "active" : ""
                        }`}
                        onClick={() => handleSelectUser(user)}
                      >
                        <div className="user-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                          <h4>{user.name}</h4>
                          <p>{user.email}</p>
                        </div>
                        {currentUser?.id === user.id && (
                          <div className="active-badge">✓ Active</div>
                        )}
                        <button
                          className="delete-user-btn"
                          onClick={(e) => handleDeleteUser(user.id, e)}
                          title="Delete user"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="create-user-btn"
                onClick={() => setShowCreateForm(true)}
              >
                <span>➕</span>
                <span>Create New User</span>
              </button>
            </>
          ) : (
            <div className="create-user-form">
              <h3>Create New User</h3>

              {error && (
                <div className="error-message">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  onKeyPress={(e) => e.key === "Enter" && handleCreateUser()}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  onKeyPress={(e) => e.key === "Enter" && handleCreateUser()}
                />
              </div>

              <div className="form-actions">
                {users.length > 0 && (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowCreateForm(false);
                      setError("");
                      setNewUser({ name: "", email: "" });
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button className="btn-primary" onClick={handleCreateUser}>
                  Create User
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
