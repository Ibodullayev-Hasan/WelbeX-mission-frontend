import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginData, setLoginData] = useState({ login: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    login: "",
    password: "",
  });
  const [userProfile, setUserProfile] = useState(null);
  const [newContent, setNewContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("acc_token");
    if (!token) {
      setIsAuthenticated(false);
      setShowModal(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("https://welbex-backend-production.up.railway.app/user/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.data);
        setIsAuthenticated(true);
        setShowModal(false);
      } else {
        localStorage.removeItem("acc_token");
        setIsAuthenticated(false);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setIsAuthenticated(false);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleLogin = async () => {
    try {

      const trimmedLoginData = {
        login: loginData.login.trim(),
        password: loginData.password.trim(),
      };

      const response = await fetch("https://welbex-backend-production.up.railway.app/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmedLoginData),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("acc_token", data.acc_token);
        fetchUserProfile();
      } else {
        alert("Login failed! Please check your credentials.");
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const handleRegister = async () => {
    try {

      const trimmedRegisterData = {
        username: registerData.username.trim(),
        login: registerData.login.trim(),
        password: registerData.password.trim(),
      };

      const response = await fetch("https://welbex-backend-production.up.railway.app/user/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmedRegisterData),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("acc_token", data.acc_token);
        fetchUserProfile();
      } else {
        alert("Registration failed! Please try again.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
    }
  };

  const handleAddContent = async () => {
    const token = localStorage.getItem("acc_token");
    if (!token) return alert("Please log in first.");

    let uploadedMediaUrl = null;

    if (mediaFile) {
      const formData = new FormData();
      formData.append("file", mediaFile);

      try {
        const uploadResponse = await fetch(
          "https://crm-img-uploader.up.railway.app/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedMediaUrl = uploadData.fileUrl;
        } else {
          const res =  await uploadResponse.json()
          alert(`Failed to upload media file.${res.error}`);
          return;
        }
      } catch (error) {
        console.error("Error uploading media file:", error);
        return;
      }
    }

    try {
      const response = await fetch("https://welbex-backend-production.up.railway.app/blog/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: {
            type: uploadedMediaUrl ? "image" : "text",
            content: uploadedMediaUrl || newContent,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile((prevProfile) => ({
          ...prevProfile,
          blogs: [data.blog, ...prevProfile.blogs],
        }));
        setNewContent("");
        setMediaFile(null);
      } else {
        alert("Failed to add content.");
      }
    } catch (error) {
      console.error("Error adding content:", error);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setMediaFile(event.target.files[0]);
    }
  };

  const handleDeleteContent = async (blogId) => {
    const token = localStorage.getItem("acc_token");
    if (!token) return alert("Please log in first.");
  
    try {
      const response = await fetch(
        `https://welbex-backend-production.up.railway.app/blog/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: blogId }),
        }
      );
  
      if (response.ok) {
        setUserProfile((prevProfile) => ({
          ...prevProfile,
          blogs: prevProfile.blogs.filter((blog) => blog.id !== blogId),
        }));
      } else {
        alert("Failed to delete content.");
      }
    } catch (error) {
      console.error("Error deleting content:", error);
    }
  };
  
  const handleEditContent = async (blogId, newContent) => {
    const token = localStorage.getItem("acc_token");
    if (!token) return alert("Please log in first.");
  
    try {
      const response = await fetch(
        `https://welbex-backend-production.up.railway.app/blog/update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: blogId,
            content: {
              type: "text",
              content: newContent,
            },
          }),
        }
      );
  
      if (response.ok) {
        const data = await response.json();
        setUserProfile((prevProfile) => ({
          ...prevProfile,
          blogs: prevProfile.blogs.map((blog) =>
            blog.id === blogId ? { ...blog, content: data.blog.content } : blog
          ),
        }));
      } else {
        alert("Failed to update content.");
      }
    } catch (error) {
      console.error("Error updating content:", error);
    }
  };
  

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app">
      <header>
        <h1>Individual Blog</h1>
        {isAuthenticated && userProfile ? (
          <div>
            <span>Hello, {userProfile.username}!</span>
          </div>
        ) : (
          <span>Please authorize.</span>
        )}
      </header>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            {isRegisterMode ? (
              <>
                <h2>Sign up</h2>
                <input
                  type="text"
                  placeholder="Username: user"
                  value={registerData.username}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      username: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Login: login_1"
                  value={registerData.login}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, login: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      password: e.target.value,
                    })
                  }
                />
                <button onClick={handleRegister}>Sign up</button>
                <p>
                Already have an account?{" "}
                  <span onClick={() => setIsRegisterMode(false)}>Login</span>
                </p>
              </>
            ) : (
              <>
                <h2>Log in</h2>
                <input
                  type="text"
                  placeholder="Login: login_1"
                  value={loginData.login}
                  onChange={(e) =>
                    setLoginData({ ...loginData, login: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder="Parol"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                />
                <button onClick={handleLogin}>Kirish</button>
                <p>
                Don't have an account?{" "}
                  <span onClick={() => setIsRegisterMode(true)}>
                    Sign up
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {isAuthenticated && userProfile && (
        <div className="blog">
          <h2>{userProfile.username}'s Blog</h2>

          <div className="new-content">
            <textarea
              placeholder="Kontentingizni kiriting"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
            <div className="file-upload">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
            </div>
            <button className="add-btn" onClick={handleAddContent}>Add</button>
          </div>

          {userProfile.blogs.map((blog) => (
            <div key={blog.id} className="post">
              {blog.content.type === "text" && <p>{blog.content.content}</p>}
              {blog.content.type === "image" && (
                <img
                  src={blog.content.content}
                  alt="Uploaded content"
                  style={{ maxWidth: "100%" }}
                />
              )}
              <span>{new Date(blog.date).toLocaleString()}</span>
              <div>
                <button className="update-btn" onClick={() => handleEditContent(blog.id, prompt("Yangi kontentni kiriting", blog.content.content))}>Update</button>

                <button className="delete-btn" onClick={() => handleDeleteContent(blog.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
