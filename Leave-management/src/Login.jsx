import React, { useState,useEffect } from "react";
import { Box, TextField, Button, Typography, Card, CardContent } from "@mui/material";
import axios from "axios";





export default function Login({ onLogin }) {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");

  const handleLogin = async () => {
  try {
    const res = await axios.post("http://10.0.9.188:5003/login", {
      empId,
      password,
      dob
    });
    alert("Trial varsion")

    if (res.data.success) {
      onLogin(res.data);
    } else {
      alert("Invalid credentials");
    }
  } catch (err) {
    alert("Server error");
  }
};

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" style={{ backgroundColor: "#f4f2ffff", minHeight: "100vh" }}>
      
      <Card sx={{ width: 350, p: 2 , display: "flex",justifyContent:'center', flexDirection:"column",alignItems:'center',boxShadow: "4px 4px 15px rgba(107, 99, 255, 0.8)" }}>
        <Typography sx={{ fontWeight: { xs: 600, lg: 600 }, fontSize: {xs:'15px', lg:'1rem'}, textAlign: 'center'}}>KLE's Dr. Prabhakar Kore Hospital & Medical Research Centre</Typography>
        <Typography sx={{ fontWeight: { xs: 700, lg: 600 }, fontSize: {xs:'20px', lg:'1.5rem'}, color:"#4c15b2ff"}}>Leave Management</Typography>
        <CardContent>
          <Typography variant="h5" mb={2}>Login</Typography>

          <TextField
            fullWidth
            label="Employee ID"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            sx={{ mb: 2 }}
          />

            <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ placeholder: "" }}
            
          />


          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />


          <Button fullWidth sx={{ backgroundColor:"#7931ffff",color:'white'}} onClick={handleLogin}>
            Login
          </Button>
          
        </CardContent>
      </Card>
    </Box>
  );
}