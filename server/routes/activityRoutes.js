const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");
const { ObjectId } = require("mongodb");

// ✅ Trả về tất cả logs + streak thực sự
router.get("/", async (req, res) => {
  try {
    const { userId, month, year } = req.query;

    // Lấy tất cả logs theo user
    const logs = await ActivityLog.find({
      userId: new ObjectId(userId),
    });

    // Duyệt từ ngày hôm nay ngược lại, tính streak liên tiếp
    const logDates = logs.map(log => new Date(log.date).toISOString().split("T")[0]);

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
      const isoDate = currentDate.toISOString().split("T")[0];
      if (logDates.includes(isoDate)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Trả về logs của tháng được yêu cầu để highlight
    const monthLogs = logs.filter(log => {
      const d = new Date(log.date);
      return d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year);
    });

    res.json({
      fireDays: monthLogs.map(log => new Date(log.date).getDate()),
      streak
    });
  } catch (err) {
    console.error("❌ Lỗi lấy hoạt động:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ✅ Ghi log hôm nay
router.post("/complete", async (req, res) => {
  try {
    const { userId } = req.body;

    // Set giờ về VN
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const today = vietnamTime.toISOString().split("T")[0];

    await ActivityLog.updateOne(
      { userId: new ObjectId(userId), date: today },
      { $setOnInsert: { userId: new ObjectId(userId), date: new Date(today) } },
      { upsert: true }
    );

    res.json({ message: "Ghi log thành công" });
  } catch (err) {
    console.error("❌ Lỗi ghi log:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
