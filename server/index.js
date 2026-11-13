import express from "express";
import cors from "cors";
import { prisma } from "./db.js";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "School server is running" });
});

// The public admission form sends a new enquiry here
app.post("/api/admissions", async (req, res) => {
  try {
    const {
      parentName,
      email,
      phone,
      childName,
      childAge,
      classApplying,
      contactMethod,
      message,
    } = req.body;

    const age = Number(childAge);

    if (
      !parentName ||
      !email ||
      !phone ||
      !childName ||
      !classApplying ||
      !contactMethod ||
      !age
    ) {
      return res
        .status(400)
        .json({ error: "Please fill in all required fields." });
    }

    const admission = await prisma.admission.create({
      data: {
        parentName,
        email,
        phone,
        childName,
        childAge: age,
        classApplying,
        contactMethod,
        message: message || null,
      },
    });

    res.status(201).json(admission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
});

// The admin dashboard reads all enquiries, newest first
app.get("/api/admissions", async (req, res) => {
  try {
    const admissions = await prisma.admission.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(admissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
});

const ADMISSION_STATUSES = [
  "PENDING",
  "REVIEWED",
  "CONTACTED",
  "APPROVED",
  "REJECTED",
];

// The admin changes an enquiry's status
app.patch("/api/admissions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!id || !ADMISSION_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid admission or status." });
    }

    const updated = await prisma.admission.update({
      where: { id },
      data: { status },
    });

    res.json(updated);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Admission not found." });
    }
    console.error(error);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
