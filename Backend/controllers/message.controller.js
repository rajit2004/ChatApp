import { Message } from "../models/Messages.js";


export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const isImage = req.file.mimetype.startsWith("image/");
    const isPdf = req.file.mimetype === "application/pdf";
    const isWord = req.file.mimetype.includes("word") || req.file.mimetype.includes("document");

    let fileType = "other";
    if (isImage) fileType = "image";
    else if (isPdf) fileType = "pdf";
    else if (isWord) fileType = "word";

    res.json({
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};