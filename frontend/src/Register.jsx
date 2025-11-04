import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef();

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'unsigned_avatar'); // your preset

    try {
      const res = await fetch(
        'https://api.cloudinary.com/v1_1/dchdfdaqy/image/upload',
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      setAvatarUrl(data.secure_url);
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      alert('Avatar upload failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const userData = {
      name: fullName,
      username,
      email,
      password,
      role,
      avatar: avatarUrl,
    };

    try {
      const res = await fetch('http://localhost:5001/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Registration failed');
        return;
      }

      alert(`Registered successfully as ${role}!`);
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      alert('Registration failed. Check console.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img src="logo.png" alt="Clean Street Logo" className="logo"/>
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <input
              type="text"
              placeholder="* Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              placeholder="* Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="email"
              placeholder="* Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="* Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Avatar */}
          <div className="avatar-upload">
            <button type="button" onClick={() => fileInputRef.current.click()}>
              Upload Avatar
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            {avatarPreview && <img src={avatarPreview} alt="Avatar Preview" className="avatar-preview" />}
          </div>

          <div className="input-group">
            <select value={role} onChange={e => setRole(e.target.value)} required>
              <option value="" disabled hidden>* Select Role</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>

          <button type="submit" className="primary-btn">Register</button>
          <p>
            Already have an account? <span onClick={() => navigate('/login')} className="link-text">Login</span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
