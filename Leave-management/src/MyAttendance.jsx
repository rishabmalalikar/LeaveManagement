import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent
} from "@mui/material";

export default function MyAttendance({ user }) {

  const [attendance, setAttendance] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {

      const res = await axios.get(
        `http://10.0.9.188:5003/my-attendance/${user.empid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        setAttendance(res.data.data);
      }

    } catch (err) {
      console.log(err);
    }
  };

 

const formatDate = (value) => {
  if (!value) return "";

  const [datePart, timePart] = value.split(" ");

  const [yyyy, mm, dd] = datePart.split("-");
  const [hh, min] = timePart.split(":");

  let hour = parseInt(hh);

  const ampm = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${dd}/${mm}/${yyyy} ${String(hour).padStart(2, "0")}:${min} ${ampm}`;
};

return (
    <Box sx={{ mt: 1 }}>
        <Typography
            fontWeight="600"
            fontSize="1rem"
            mb={2}
            sx={{ textAlign: "center" }}
        >
            My Attendance
        </Typography>

        {attendance.map((item, index) => (
            <Typography fontSize="15px" fontWeight="500">
                {index + 1}. {formatDate(item.punch_time)}
            </Typography>
        ))}
    </Box>
);
}