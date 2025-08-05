const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");
const { ObjectId } = require("mongodb");

// ✅ GET logs theo userId (không giới hạn theo tháng)
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    const logs = await ActivityLog.find({ userId: new ObjectId(userId) }).sort({ date: -1 });

    // Chuyển log thành chuỗi định dạng YYYY-MM-DD theo giờ VN
    const fireDays = logs.map(log => {
      const dateVN = new Date(log.date);
      dateVN.setUTCHours(dateVN.getUTCHours() + 7);
      return dateVN.toISOString().split("T")[0]; // "2025-08-03"
    });

    // ✅ Tính streak liên tiếp
    // ✅ Tính streak liên tiếp, reset nếu ngắt quãng
    let streak = 0;
    let currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);
    currentDate.setUTCHours(currentDate.getUTCHours() + 7); // giờ VN

    let expectedDate = currentDate.toISOString().split("T")[0];

    for (let day of fireDays) {
      if (day === expectedDate) {
        streak++;
      // Lùi lại 1 ngày để kiểm tra tiếp
      currentDate.setDate(currentDate.getDate() - 1);
      expectedDate = currentDate.toISOString().split("T")[0];
    } else {
     // Nếu không khớp ngày mong đợi => bị ngắt chuỗi
      break;
    }
  }


    res.json({ fireDays, streak });
  } catch (err) {
    console.error("❌ Lỗi lấy hoạt động:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ✅ POST để ghi log khi học xong
router.post("/complete", async (req, res) => {
  try {
    const { userId } = req.body;
    const now = new Date();
    now.setUTCHours(now.getUTCHours() + 7); // Múi giờ VN
    const todayStr = now.toISOString().split("T")[0];

    await ActivityLog.updateOne(
      { userId: new ObjectId(userId), date: todayStr },
      { $setOnInsert: { userId: new ObjectId(userId), date: new Date(todayStr) } },
      { upsert: true }
    );

    res.json({ message: "Ghi log thành công" });
  } catch (err) {
    console.error("❌ Lỗi ghi log:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
