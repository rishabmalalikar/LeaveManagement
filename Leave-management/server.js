
import express from "express";
import cors from "cors";
import sql from "mssql";
import jwt from "jsonwebtoken";

import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import helmet from "helmet";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
app.use(compression());


app.use(cors());
app.use(express.json());
const SECRET = "kleit1234";

const config = {
  user: "sa",
  password: "",
  server: "ibmserver\\kleslive",
  database: "attpaydb",
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 100,
    min: 10,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: 30000,
  connectionTimeout: 30000,
};


const attendanceConfig = {
  user: "sa",
  password: "kleit1234",
  server: "10.0.9.219",
  database: "easytimepro_db",
  options: {
  trustServerCertificate: true,
  encrypt: false,
  enableArithAbort: true
  },
  requestTimeout: 60000,
  connectionTimeout: 60000,
};

let attendancePool;

async function getAttendanceConnection() {
  if (!attendancePool) {
    console.log("🔌 Creating attendance DB connection...");

    attendancePool = await new sql.ConnectionPool(attendanceConfig).connect();
  }

  return attendancePool;
}


function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required"
    });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid token"
      });
    }

    req.user = user;
    next();
  });
}



app.get("/test-db", async (req, res) => { 
  try { 
    const pool = await getConnection(); 
    const result = await pool.request().query `SELECT 1 as test;`
     res.json(result.recordset); } catch (err) { console.log(err); res.send("DB Error"); } });


let pool;

async function getConnection() {
  if (!pool) {
    console.log("🔌 Creating new DB connection...");
    pool = await sql.connect(config); // ✅ correct
  }
  return pool;
}


// LOGIN
app.post("/login", async (req, res) => {
  const { empId, password, dob } = req.body;

  try {
    const pool = await getConnection();

    const result = await pool.request().query`
      SELECT * FROM payslip_login 
      WHERE empid = ${empId} AND pwd = ${password}
    `;

    if (result.recordset.length === 0) {
      return res.json({ success: false });
    }

    const user = result.recordset[0];

    if (!dob) {
      return res.json({ success: false, message: "DOB required" });
    }

    const providedDob = new Date(dob);
    const storedDob = new Date(user.dob);

    if (
      isNaN(providedDob.getTime()) ||
      isNaN(storedDob.getTime())
    ) {
      return res.json({ success: false, message: "Invalid DOB format" });
    }

    const sameDate =
      providedDob.getFullYear() === storedDob.getFullYear() &&
      providedDob.getMonth() === storedDob.getMonth() &&
      providedDob.getDate() === storedDob.getDate();

    if (!sameDate) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // ✅ Create token
    const token = jwt.sign(
      { empId: user.empid },
      SECRET,
      { expiresIn: "30m" }
    );

    // ✅ ONLY ONE RESPONSE 
    return res.json({
      success: true,
      user,
      token
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    // ✅ Ensure only one response here also
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
});




app.get("/my-attendance/:empId", authenticateToken, async (req, res) => {
  const { empId } = req.params;

  try {
    const attendancePool = await getAttendanceConnection();

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const result = await attendancePool.request().query(`
  SELECT 
    CONVERT(VARCHAR, punch_time, 120) as punch_time
  FROM dbo.iclock_transaction
  WHERE YEAR(punch_time) = ${currentYear}
  AND MONTH(punch_time) = ${currentMonth}
  AND RIGHT(emp_code, 6) = '${empId}'
  ORDER BY punch_time DESC
`);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Attendance fetch failed"
    });
  }
});







app.post("/apply-leave", authenticateToken, async (req, res) => {
  const { empId, leaveType, fromDate, toDate, reason } = req.body;

  try {
    const pool = await getConnection();

    const from = new Date(fromDate);
    const to = new Date(toDate);

    const days = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;

    const currentYear = new Date().getFullYear();

    const leaveMst = await pool.request().query`
      SELECT 
      a.cl,
      b.EL,
      b.Comp_Off
      FROM em_leave_op a
      JOIN Emp_Leave_Mst b 
        ON a.empid = b.empid AND a.lyear = b.LYear
      WHERE a.empid = ${empId} 
        AND a.lyear = ${currentYear}
    `;

    // Check if leaveMst.recordset is empty
    if (!leaveMst.recordset || leaveMst.recordset.length === 0) {
      return res.json({ success: false, message: "Leave data not found for the employee" });
    }

    // Check if CL leave is available
    if (leaveType === "CL") {
      if (leaveMst.recordset[0]?.cl < days) {
        return res.json({ success: false, message: "Insufficient CL balance" });
      }
    }

    // Check if EL leave is available
    if (leaveType === "EL") {
      if (leaveMst.recordset[0]?.EL < days) {
        return res.json({ success: false, message: "Insufficient EL balance" });
      }
    }

    // ❌ DATE CHECK
    if (to < from) {
      return res.json({ success: false, message: "Invalid date range" });
    }

    // ❌ CL RULE
    if (leaveType === "CL" && days > 6) {
      return res.json({ success: false, message: "Max 6 CL allowed" });
    }

    // ❌ EL RULE
    if (leaveType === "EL" && days < 5) {
      return res.json({ success: false, message: "Min 5 EL required" });
    }

    // ❌ DUPLICATE CHECK
    const duplicateCheck = await pool.request().query`
      SELECT * FROM Emp_Leave_Trn
      WHERE EMPID = ${empId}
      AND (
        (CAST(${from} AS DATE) BETWEEN CAST(Frm_Dt AS DATE) AND CAST(To_Dt AS DATE))
        OR (CAST(${to} AS DATE) BETWEEN CAST(Frm_Dt AS DATE) AND CAST(To_Dt AS DATE))
        OR (CAST(Frm_Dt AS DATE) BETWEEN CAST(${from} AS DATE) AND CAST(${to} AS DATE))
      )
    `;

    if (duplicateCheck.recordset.length > 0) {
      return res.json({ success: false, message: "Leave already applied for these dates" });
    }

    // ✅ INSERT BASE RECORD
    const insertResult = await pool.request().query`
      INSERT INTO Emp_Leave_Trn 
      (LYear, EMPID, Req_Dt, Leave_Reason, Frm_Dt, To_Dt, rmrks, Crt_usr, Crt_Dt)
      OUTPUT INSERTED.Sys_Id
      VALUES 
      (${currentYear}, ${empId}, GETDATE(), ${reason}, ${from}, ${to}, ${reason}, ${empId}, GETDATE())
    `;

    const sysId = insertResult.recordset[0].Sys_Id;

    // ✅ UPDATE LEAVE TYPE COLUMN (CL / EL / Comp_Off)
    if (leaveType === "CL") {
      await pool.request().query`UPDATE Emp_Leave_Trn SET CL = ${days} WHERE Sys_Id = ${sysId}`;
    } else if (leaveType === "EL") {
      await pool.request().query`UPDATE Emp_Leave_Trn SET EL = ${days} WHERE Sys_Id = ${sysId}`;
    } else if (leaveType === "COMP_OFF") {
      await pool.request().query`UPDATE Emp_Leave_Trn SET COMP_OFF = ${days} WHERE Sys_Id = ${sysId}`;
    }

    res.json({ success: true, message: "Leave applied successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});








app.get("/employee-dashboard/:empId", authenticateToken, async (req, res) => {
  const { empId } = req.params;
  const year = new Date().getFullYear();

  try {
    const pool = await getConnection();

    // ✅ Employee Name
    const empResult = await pool.request().query`
      SELECT empname 
      FROM empmst A 
      JOIN personaldetails B ON A.empid = B.empid
      WHERE A.empid = ${empId} AND A.empstscd = 1
    `;

    const empName = empResult.recordset[0]?.empname || "";

    // ✅ Leave Master (Total Allocated)
    const leaveMst = await pool.request().query`
      SELECT 
      a.cl,
      b.EL,
      b.Comp_Off
      FROM em_leave_op a
      JOIN Emp_Leave_Mst b 
        ON a.empid = b.empid AND a.lyear = b.LYear
      WHERE a.empid = ${empId} 
        AND a.lyear = ${year}
    `;


    

    // ✅ Used Leaves (Approved only like VB logic)
    const usedclLeaves = await pool.request().query`
      SELECT SUM(cl) AS totalCL FROM (
    SELECT ISNULL(SUM(CL), 0) AS cl
    FROM Emp_Leave_Trn
    WHERE empid = ${empId} 
      AND lyear = ${year}
      AND CL > 0
      AND app_by IS NOT NULL

    UNION ALL

    SELECT ISNULL(SUM(CL), 0) AS cl
    FROM Emp_Leave_Trn
    WHERE empid = ${empId} 
      AND lyear = ${year}
      AND CL < 0
  ) a
    `;

    const usedelLeaves = await pool.request().query`
      SELECT SUM(el) AS totalEL FROM (
    SELECT ISNULL(SUM(el), 0) AS el
    FROM Emp_Leave_Trn
    WHERE empid = ${empId} 
      AND lyear = ${year}
      AND eL > 0
      AND app_by IS NOT NULL

    UNION ALL

    SELECT ISNULL(SUM(EL), 0) AS cl
    FROM Emp_Leave_Trn
    WHERE empid = ${empId} 
      AND lyear = ${year}
      AND eL < 0
  ) a
    `;

    const usedcompoffLeaves = await pool.request().query`
      SELECT SUM(Comp_Off) AS totalcompoff FROM (
    SELECT ISNULL(SUM(Comp_Off), 0) AS Comp_Off
    FROM Emp_Leave_Trn
    WHERE empid = ${empId} 
      AND lyear = ${year}
      AND Comp_Off > 0
      AND app_by IS NOT NULL

    UNION ALL

    SELECT ISNULL(SUM(Comp_Off), 0) AS Comp_Off
    FROM Emp_Leave_Trn
    WHERE empid = ${empId} 
      AND lyear = ${year}
      AND Comp_Off < 0
  ) a
    `;


    const total = leaveMst.recordset[0] || {};
    const usedcl = usedclLeaves.recordset[0] || {};
    const usedel= usedelLeaves.recordset[0] || {};
    const usedcompoff=usedcompoffLeaves.recordset[0] || {};
    
    // console.log(total.cl, used.totalCL)
    // ✅ Calculate Available
    const leaveData = {
      CL: {
        used: usedcl.totalCL || 0,
        available: (total.cl || 0) - (usedcl.totalCL || 0)
      },
      EL: {
        used: usedel.totalEL || 0,
        available: (total.EL || 0) - (usedel.totalEL || 0)
      },
      COMP_OFF: {
        used: usedcompoff.totalcompoff || 0,
        available: (total.COMP_OFF || 0) - (usedcompoff.totalcompoff || 0)
      }
    };

    res.json({
      success: true,
      empName,
      leaveData
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});










app.get("/my-leaves/:empId", authenticateToken, async (req, res) => {
  const { empId } = req.params;
  const year = new Date().getFullYear();

  try {
    const pool = await getConnection();

    const result = await pool.request().query`
      SELECT 'CL' as type, Leave_Reason, Frm_Dt, To_Dt, CL as days, App_By
      FROM Emp_Leave_Trn WHERE CL <> 0 AND empid = ${empId} AND lyear = ${year}

      UNION ALL

      SELECT 'EL', Leave_Reason, Frm_Dt, To_Dt, EL, App_By
      FROM Emp_Leave_Trn WHERE EL <> 0 AND empid = ${empId} AND lyear = ${year}

      UNION ALL

      SELECT 'COMP_OFF', Leave_Reason, Frm_Dt, To_Dt, Comp_Off, App_By
      FROM Emp_Leave_Trn WHERE Comp_Off <> 0 AND empid = ${empId} AND lyear = ${year}

      ORDER BY Frm_Dt DESC
    `;

    const formatted = result.recordset.map(row => ({
      ...row,
      status: row.days < 0
        ? "Cancelled"
        : row.App_By
        ? "Approved"
        : "Pending"
    }));

    res.json({ success: true, data: formatted });

  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});



// app.use(express.static(path.join(__dirname, "dist")));

// app.get("/*", (req, res) => {
//   res.sendFile(path.join(__dirname, "dist", "index.html"));
// });

app.get("/", (req, res) => {
  res.send("API Running");
});


app.listen(5003, "0.0.0.0", () => {
  console.log("Server running on port 5003");
});