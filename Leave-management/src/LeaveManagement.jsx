import React, { useEffect, useState } from "react";

import dayjs from 'dayjs';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import Snackbar from '@mui/material/Snackbar';
import axios from "axios";
import MyAttendance from "./MyAttendance";

import {
Container,
Grid,
Card,
CardContent,
Typography,
TextField,
Select,
MenuItem,
Button,
Tabs,
Tab,
Box,
Avatar,
Chip
} from "@mui/material";
import { purple } from "@mui/material/colors";








export default function LeaveManagement({ user, setUser, setSnackbar }) {

  const [tab, setTab] = useState(0);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [startDate, setStartDate] = React.useState(dayjs());
  const [endDate, setEndDate] = React.useState(dayjs());
  const [reason, setReason] = useState("");

  const [empName, setEmpName] = useState("");
const [leaveCards, setLeaveCards] = useState([]);
const [myLeaves, setMyLeaves] = useState([]);

const token = localStorage.getItem("token");




const fetchDashboard = async () => {
  try {
    const res = await axios.get(
      `http://10.0.9.188:5003/employee-dashboard/${user.empid}`,
      {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }

    );

    if (res.data.success) {
      setEmpName(res.data.empName);

      setLeaveCards([
        {
          name: "CL",
          used: res.data.leaveData.CL.used,
          available: res.data.leaveData.CL.available,
        },
        {
          name: "EL",
          used: res.data.leaveData.EL.used,
          available: res.data.leaveData.EL.available,
        },
        {
          name: "COMP_OFF",
          used: res.data.leaveData.COMP_OFF.used,
          available: res.data.leaveData.COMP_OFF.available,
        },
      ]);
    }
  } catch (err) {
    console.log(err);
  }
};

const fetchLeaves = async () => {
  try {
    const res = await axios.get(
      `http://10.0.9.188:5003/my-leaves/${user.empid}`,
      {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
    );

    if (res.data.success) {
      setMyLeaves(res.data.data);
    }
  } catch (err) {
    console.log(err);
  }
};





useEffect(() => {
  if (!user) return;

  fetchDashboard();
  fetchLeaves();
}, [user]);



  const handleApplyLeave = async (e) => {
  e.preventDefault();

  try {

    if (!selectedLeave) {
      
      setSnackbar({
        open: true,
        message: "Please select a leave type",
        severity: "error",
      });
      return;
    }
    if (!reason) {
      setSnackbar({
        open: true,
        message: "Please provide a reason for leave",
        severity: "error",
      });
      return;
    }

    if (endDate.isBefore(startDate)) {
  setSnackbar({
    open: true,
    message: "To Date Cannot Be Less Than From Date",
    severity: "error",
  });
  return;
}
    const response = await axios.post("http://10.0.9.188:5003/apply-leave", {
      empId: user.empid,
      leaveType: selectedLeave?.name,
      fromDate: startDate.toISOString(),
      toDate: endDate.toISOString(),
      reason: reason
    },
    {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
  );
    

    if (response.data.success) {
      setSnackbar({
        open: true,
        message: response.data.message || "Leave applied successfully",
        severity: "success",
      });
      fetchLeaves();      
      fetchDashboard();     // optional (to update counts)
      setTab(1);
    } else {
      setSnackbar({
        open: true,
        message: response.data.message || "Failed to apply leave",
        severity: "error",
      });
    }

  } catch (error) {
    console.error("Error applying leave:", error);
    setSnackbar({
      open: true,
      message: "Server error",
      severity: "error",
    });
  }
};
    



const handleLogout = () => {
  setUser(null);
  localStorage.removeItem("user");
  localStorage.removeItem("loginTime"); 
  setSnackbar({
    open: true,
    message: "Logout Successful",
    severity: "success",
  });
};





return (
  <div style={{ backgroundColor: "#f4f2ffff", minHeight: "100vh" }}>
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 1)",
        px: 2,
        py: 1,
        borderBottom: "1px solid #dbdbdbff",
        fontSize: "2rem",
      }}
    >
      
      <Typography sx={{ fontWeight: { xs: 300, lg: 600 }, fontSize: {xs:'20px', lg:'2rem'}}}>Leave Management</Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: { xs: 'none', lg: 'inline-flex' } }}>
          <Chip label={empName} sx={{backgroundColor:'rgba(82, 75, 201, 1)', color:'white'}} />
        </Box>

        <Avatar sx={{ display: {sx:'block', lg:'none'} }} />
        
        <Button variant="contained"  size="small" onClick={handleLogout} sx={{backgroundColor:'rgba(82, 75, 201, 1)'}}>
          Logout
        </Button>
      </Box>
    </Box>

    <Tabs
      value={tab}
      onChange={(e,v) => setTab(v)}
      sx={{ backgroundColor: "rgba(255, 255, 255, 1)", width: "100%" ,boxShadow: "0px 2px 15px rgba(108,99,255,0.3)"}}
    >
      <Tab
        sx={{
          fontSize: { xs: "0.7rem", sm: "1rem", md: "1rem" },
          width: "fit-content",
          padding: 0,
        }}
        label="Apply"
        value={0}
      />
      <Tab
        sx={{
          fontSize: { xs: "0.7rem", sm: "1rem", md: "1rem" },
          width: "fit-content",
          padding: 0,
          marginRight: 2
        }}
        label="My Leaves"
        value={1}
        
      />
      <Tab
        sx={{
          fontSize: { xs: "0.7rem", sm: "1rem", md: "1rem" },
          width: "fit-content",
          padding: 0,
          display: { xs: 'block', lg: "none" }
        }}
        label="My Attendance"
        value={2}
        
      />
    </Tabs>

    <Grid container spacing={2} sx={{ p: 2 }}>
      {/*left panel*/}
        <Grid item xs={12} sm={3}>
          <Box>
            <Grid container spacing={1} sx={{display:'flex',flexDirection:'column'}}>


              {/* GUID */}
              {tab===0?(   
              <Grid item >
                <Grid display={"flex"} alignItems="center" gap={1}>
                  <Grid item display={"flex"} alignItems="center" gap={1} >
                    <Box sx={{ background: "#b8ffeeff", height: "15px", width: "10px" }} />
                    Used
                  </Grid>
                  <Grid item display={"flex"} alignItems="center" gap={1}>
                    <Box sx={{ background: "#dee8ffff", height: "15px", width: "10px" }} />
                    Available
                  </Grid>
                </Grid>
              </Grid>
              ):(null)}

              
              {tab===0?(
                
                <Grid item display={"flex"} flexDirection={{ xs: "row", md: "column" }} gap={2}>
                {leaveCards.map((item, i) => {
                  const selected = selectedLeave?.name === item.name;
                  const handleSelect = () =>
                    setSelectedLeave(item.name === selectedLeave?.name ? null :  {name: item.name} );
                  return (
                <Box
                  key={i}
                  component="label"
                  sx={{
                    cursor: "pointer",
                    width: "100%",
                    display: "block",
                  }}
                >
                  <input
                    type="radio"
                    name="leaveType"
                    value={item.name}
                    checked={selected}
                    onChange={handleSelect}
                    style={{ display: "none" }}
                  />

                  <Card
                    sx={{
                  flexDirection: { xs: "row", md: "column" },
                  boxShadow: selected ? "0 0 0 3px rgba(108,99,255,0.12)" : "3px 7px 10px rgba(108,99,255,0.3)",
                  border: selected ? "2px solid rgba(108,99,255,0.6)" : "none",
                  transition: "box-shadow 150ms, border 150ms",
                    }}
                  >
                    <CardContent>
                  <Typography fontWeight="600" sx={{ width: 'fit-content', textWrap: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      mt: 1,
                      gap: 1,
                      paddingBottom: "0.01px",
                    }}
                  >
                    <Grid
                      item
                      sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 1,
                    alignItems: "center",
                      }}
                    >
                      <Box
                    sx={{
                      background: "#b8ffeeff",
                      p: 1,
                      borderRadius: 2,
                      flex: 1,
                      textAlign: "center",
                      width: "fit-content",
                    }}
                      >
                    <Grid
                      item
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 2,
                        pr: 1,
                        pl: 1,
                        alignItems: "center",
                      }}
                    >
                      <Typography color="primary">{item.used}</Typography>
                      <Typography color="primary" sx={{ display: { xs: "none", md: "block" } }}>
                        Used
                      </Typography>
                    </Grid>
                      </Box>
                      <Box
                    sx={{
                      background: "#dee8ffff",
                      p: 1,
                      borderRadius: 2,
                      flex: 1,
                      textAlign: "center",
                      width: "fit-content",
                    }}
                      >
                    <Grid
                      item
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 2,
                        pr: 1,
                        pl: 1,
                        alignItems: "center",
                      }}
                    >
                      <Typography color="primary">{item.available}</Typography>
                      <Typography color="primary" sx={{ display: { xs: "none", md: "block" } }}>
                        Available
                      </Typography>
                    </Grid>
                      </Box>
                    </Grid>
                  </Box>
                    </CardContent>
                  </Card>
                </Box>
                  );
                })}
              </Grid>
              ):(null)}
            </Grid>
          </Box>
        </Grid>

        
        {/* RIGHT PANEL */}
      <Grid item xs={12} lg={9} sx={{ display: "flex", flexDirection: "row"}}>
        <Card
          sx={{
            padding: 1,
            borderRadius: 3,
            boxShadow: "3px 7px 20px rgba(108,99,255,0.3)",
            width: "fit-content",
          }}
        >
          <CardContent>
            {tab === 0 ? (
              <form onSubmit={handleApplyLeave}>
              <Box sx={{ transition: "opacity 200ms ease", opacity: 1, pointerEvents: "auto" ,width: "100%"}}>
                <Typography fontWeight="600" fontSize="2rem" mb={2} sx={{ textAlign: "center" }}>Leave Days</Typography>
                <Grid container spacing={2} alignItems="center" mb={2}>

                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DemoContainer components={['DateCalendar', 'DateCalendar']} sx={{border: "2px solid #e6e5e571", borderRadius: 5,boxShadow: "3px 7px 10px rgba(108,99,255,0.3)", display: "flex", display: "flex", justifyContent: "center", alignItems: "center", width: {sx:"100%", xl:"45%"}, p: 2}}>
                      <DemoItem label="From Date">
                        <DateCalendar sx={{ width: "100%" }} value={startDate} onChange={(newValue) => setStartDate(newValue)} />
                      </DemoItem>
                    </DemoContainer>
                  </LocalizationProvider>

                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DemoContainer components={['DateCalendar', 'DateCalendar']} sx={{border: "2px solid #e6e5e571", borderRadius: 5,boxShadow: "3px 7px 10px rgba(108,99,255,0.3)", display: "flex", display: "flex", justifyContent: "center", alignItems: "center", width: {sx:"100%", xl:"45%"}, p: 2}}>
                      <DemoItem label="To Date" >
                        <DateCalendar sx={{ width: "100%" }} value={endDate} onChange={(newValue) => setEndDate(newValue)} />
                      </DemoItem>
                    </DemoContainer>
                  </LocalizationProvider>

                </Grid>

                <TextField onChange={(e) => setReason(e.target.value)}  label="Reason" sx={{ width: "100%", boxShadow: "3px 7px 10px rgba(108,99,255,0.3)" }} />
              </Box>
              <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                Apply Leave
              </Button>
            </form>
            
            ) : tab===1 ? (
              <Box sx={{ mt: 1 }}>
                <Typography fontWeight="600" fontSize="2rem" mb={2} sx={{ textAlign: "center" }}>My Leaves</Typography>

                <Grid container spacing={2} sx={{width: "100%"}}>
                  
                    <Grid item xs={12} sm={6} md={4} >
                      <Card sx={{ p: 1 }}>
                        <CardContent>
                          <Grid container spacing={2}>
                            {myLeaves.map((leave, index) => (
                              <Grid item xs={12} key={index}>
                                <Card>
                                  <CardContent>
                                    <Typography><b>Type:</b> {leave.type}</Typography>
                                    <Typography><b>Reason:</b> {leave.Leave_Reason}</Typography>
                                    <Typography><b>From:</b> {new Date(leave.Frm_Dt).toLocaleDateString()}</Typography>
                                    <Typography><b>To:</b> {new Date(leave.To_Dt).toLocaleDateString()}</Typography>
                                    <Typography><b>Days:</b> {leave.days}</Typography>
                                    <Typography><b>Status:</b> {leave.status}</Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  
                  
                </Grid>
              </Box>
            ):tab===2?(
              <MyAttendance user={user} />
            ):(null)}

            
          </CardContent>

        </Card>
        {tab === 0 && (
          <Card
            sx={{
              marginLeft: 2,
              borderRadius: 3,
              boxShadow: "3px 7px 20px rgba(108,99,255,0.3)",
              width: "240px",
              display: { xs: "none", lg: "block" }
            }}
          >
            <CardContent sx={{ width: "fit-content", }}>
              <MyAttendance user={user} />
            </CardContent>
          </Card>
        )}
      </Grid>
        
    </Grid>
    
  </div>
);
}
