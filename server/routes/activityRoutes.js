const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");
const { ObjectId } = require("mongodb");

// Hàm chuyển đổi ngày sang định dạng YYYY-MM-DD theo múi giờ VN
const toVNDateString = (date) => {
  const dateVN = new Date(date);
  dateVN.setUTCHours(dateVN.getUTCHours() + 7);
  return dateVN.toISOString().split("T")[0];
};

// GET logs theo userId
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "Thiếu userId" });

    const logs = await ActivityLog.find({ userId: new ObjectId(userId) })
      .sort({ date: -1 });

    // Lấy danh sách ngày đã học (không trùng lặp)
    const uniqueDates = [...new Set(logs.map(log => toVNDateString(log.date)))];
    
    // Tính current streak (chuỗi ngày học liên tiếp gần nhất)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const todayVN = new Date();
    todayVN.setUTCHours(todayVN.getUTCHours() + 7);
    todayVN.setUTCHours(0, 0, 0, 0);
    
    let checkDate = new Date(todayVN);
    
    // Kiểm tra streak hiện tại
    while (true) {
      const dateStr = toVNDateString(checkDate);
      if (uniqueDates.includes(dateStr)) {
        currentStreak++;
        tempStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Tính longest streak (chuỗi dài nhất mọi thời đại)
    let prevDate = null;
    tempStreak = 0;
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      
      if (prevDate) {
        const diffDays = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      
      prevDate = currentDate;
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    res.json({ 
      fireDays: uniqueDates,
      currentStreak,
      longestStreak 
    });
  } catch (err) {
    console.error("❌ Lỗi lấy hoạt động:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST để ghi log khi học xong
router.post("/complete", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "Thiếu userId" });

    const now = new Date();
    now.setUTCHours(now.getUTCHours() + 7); // Múi giờ VN
    now.setUTCHours(0, 0, 0, 0); // Đặt về 00:00:00
    
    // Kiểm tra xem đã có log cho ngày hôm nay chưa
    const existingLog = await ActivityLog.findOne({
      userId: new ObjectId(userId),
      date: { 
        $gte: new Date(now.toISOString().split("T")[0] + "T00:00:00Z"),
        $lt: new Date(now.toISOString().split("T")[0] + "T23:59:59Z")
      }
    });

    if (!existingLog) {
      await ActivityLog.create({
        userId: new ObjectId(userId),
        date: now
      });
    }

    res.json({ message: "Ghi log thành công" });
  } catch (err) {
    console.error("❌ Lỗi ghi log:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;