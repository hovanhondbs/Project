const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// ✅ GET logs theo userId + month + year
router.get("/", async (req, res) => {
  try {
    const { userId, month, year } = req.query;
    const monthPadded = month.toString().padStart(2, "0");

    const startDate = new Date(`${year}-${monthPadded}-01T00:00:00`);
    const endDate = new Date(`${year}-${monthPadded}-31T23:59:59`);

    const logs = await ActivityLog.find({
      userId: new ObjectId(userId),
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    res.json({
      fireDays: logs.map((log) => new Date(log.date).getDate()),
      streak: logs.length,
    });
  } catch (err) {
    console.error("❌ Lỗi lấy hoạt động:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ✅ POST để ghi log khi học xong (giờ VN)
router.post("/complete", async (req, res) => {
  try {
    const { userId } = req.body;

    const todayVN = new Date();
    todayVN.setHours(0, 0, 0, 0); // 0h theo giờ hệ thống (VN nếu server đang ở VN)

    await ActivityLog.updateOne(
      { userId: new ObjectId(userId), date: todayVN },
      {
        $setOnInsert: {
          userId: new ObjectId(userId),
          date: todayVN,
        },
      },
      { upsert: true }
    );

    console.log("✅ Ghi log múi giờ VN:", todayVN);
    res.json({ message: "Ghi log thành công (VN time)" });
  } catch (err) {
    console.error("❌ Lỗi ghi log:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
