import React, { useState } from "react";
import axios from "axios";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from "@mui/material";

export default function AdminAttendance() {
  const token = localStorage.getItem("token");

  const currentDate = new Date();

  const [empId, setEmpId] = useState("");
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const fetchAttendance = async () => {
    if (!empId.trim()) {
      showSnackbar("Please enter employee ID", "error");
      return;
    }

    if (!/^\d{1,6}$/.test(empId.trim())) {
      showSnackbar("Employee ID must contain up to 6 digits", "error");
      return;
    }

    try {
      setLoading(true);
      setAttendance([]);

      const normalizedEmpId = empId.trim().padStart(6, "0");

      const response = await axios.get(
        "http://10.0.9.188:5003/admin/attendance",
        {
          params: {
            empId: normalizedEmpId,
            year,
            month,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setAttendance(response.data.data);

        showSnackbar(
          `${response.data.data.length} attendance records found`,
          "success"
        );
      } else {
        showSnackbar(
          response.data.message || "Failed to fetch attendance",
          "error"
        );
      }
    } catch (error) {
      console.error("Fetch attendance error:", error);

      showSnackbar(
        error.response?.data?.message ||
          "Unable to fetch attendance records",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePunchTimeChange = (id, value) => {
    setAttendance((previousAttendance) =>
      previousAttendance.map((item) =>
        item.id === id
          ? {
              ...item,
              punch_time: value,
            }
          : item
      )
    );
  };

  const saveAttendance = async (record) => {
    if (!record.punch_time) {
      showSnackbar("Punch time cannot be empty", "error");
      return;
    }

    try {
      setSavingId(record.id);

      const normalizedEmpId = empId.trim().padStart(6, "0");

      const response = await axios.put(
        `http://10.0.9.188:5003/admin/attendance/${record.id}`,
        {
          empId: normalizedEmpId,
          punchTime: record.punch_time,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showSnackbar("Attendance updated successfully", "success");
      } else {
        showSnackbar(
          response.data.message || "Failed to update attendance",
          "error"
        );
      }
    } catch (error) {
      console.error("Update attendance error:", error);

      showSnackbar(
        error.response?.data?.message ||
          "Unable to update attendance",
        "error"
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Box sx={{ width: "100%", p: { xs: 1, sm: 2 } }}>
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: "3px 7px 20px rgba(108, 99, 255, 0.25)",
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            fontWeight={700}
            textAlign="center"
            mb={3}
          >
            Admin Attendance
          </Typography>

          {/* FILTER SECTION */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Employee ID"
                value={empId}
                onChange={(event) => setEmpId(event.target.value)}
                placeholder="Enter employee ID"
                inputProps={{
                  maxLength: 6,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                select
                fullWidth
                label="Month"
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {months.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                type="number"
                label="Year"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                inputProps={{
                  min: 2000,
                  max: 2100,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={fetchAttendance}
                disabled={loading}
                sx={{
                  height: 56,
                  borderRadius: 2,
                  backgroundColor: "rgba(82, 75, 201, 1)",
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Get Attendance"
                )}
              </Button>
            </Grid>
          </Grid>

          {/* ATTENDANCE TABLE */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Attendance Records
            </Typography>

            {attendance.length === 0 && !loading ? (
              <Alert severity="info">
                No attendance records to display.
              </Alert>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: 2,
                  maxHeight: 550,
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <b>Sl. No.</b>
                      </TableCell>

                      <TableCell>
                        <b>Record ID</b>
                      </TableCell>

                      <TableCell>
                        <b>Employee Code</b>
                      </TableCell>

                      <TableCell>
                        <b>Punch Time</b>
                      </TableCell>

                      <TableCell align="center">
                        <b>Action</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {attendance.map((record, index) => (
                      <TableRow key={record.id} hover>
                        <TableCell>{index + 1}</TableCell>

                        <TableCell>{record.id}</TableCell>

                        <TableCell>{record.emp_code}</TableCell>

                        <TableCell>
                          <TextField
                            size="small"
                            type="text"
                            value={record.punch_time || ""}
                            onChange={(event) =>
                              handlePunchTimeChange(
                                record.id,
                                event.target.value
                              )
                            }
                            placeholder="YYYY-MM-DD HH:mm:ss"
                            sx={{
                              minWidth: 230,
                            }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => saveAttendance(record)}
                            disabled={savingId === record.id}
                            sx={{
                              backgroundColor: "rgba(82, 75, 201, 1)",
                            }}
                          >
                            {savingId === record.id ? (
                              <CircularProgress
                                size={20}
                                color="inherit"
                              />
                            ) : (
                              "Save"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((previous) => ({
            ...previous,
            open: false,
          }))
        }
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar((previous) => ({
              ...previous,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}