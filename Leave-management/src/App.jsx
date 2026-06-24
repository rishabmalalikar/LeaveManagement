import React, { useState, useEffect } from "react";
import LeaveManagement from "./LeaveManagement";
import Login from "./Login";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const AUTO_LOGOUT_TIME = 20 * 60 * 1000; 



export default function App() {
  const [user, setUser] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

 
  useEffect(() => {
  const savedUser = localStorage.getItem("user");
  const loginTime = localStorage.getItem("loginTime");

  // Restore session if not expired
  if (savedUser && loginTime) {
    const currentTime = Date.now();
    const diff = currentTime - parseInt(loginTime);

    if (diff < AUTO_LOGOUT_TIME) {
      setUser(JSON.parse(savedUser));
    } else {
      handleLogout();
    }
  }

  // Check every second for auto logout
  const interval = setInterval(() => {
    const loginTime = localStorage.getItem("loginTime");

    if (loginTime) {
      const diff = Date.now() - parseInt(loginTime);

      // console.log("Time Passed:", diff);

      if (diff >= AUTO_LOGOUT_TIME) {
        console.log("Auto logout triggered");

        handleLogout();
      }
    }
  }, 1000);

  return () => clearInterval(interval);

}, []);




  
  const handleLogin = (data) => {
  const loginTime = Date.now();

  setUser(data.user);
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("loginTime", loginTime); 
  localStorage.setItem("token", data.token);

  setSnackbar({
    open: true,
    message: "Login Successful",
    severity: "success",
  });
};
  


 const handleLogout = () => {
  setUser(null);
  localStorage.removeItem("user");
localStorage.removeItem("loginTime");
localStorage.removeItem("token");

  setSnackbar({
    open: true,
    message: "Logged out",
    severity: "info",
  });
};



  return (
    <>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <LeaveManagement user={user} setUser={setUser} onLogout={handleLogout}  setSnackbar={setSnackbar} />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}