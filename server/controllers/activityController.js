// controllers/activityController.js
const ActivityLog = require('../models/ActivityLog');

exports.logDailyActivity = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });

    const todayDateOnly = new Date().toISOString().split('T')[0];

    await ActivityLog.updateOne(
      {
        userId,
        date: new Date(todayDateOnly)
      },
      { $setOnInsert: { userId, date: new Date(todayDateOnly) } },
      { upsert: true }
    );

    res.json({ success: true, message: 'Activity logged' });
  } catch (err) {
    console.error('❌ Error logging activity:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFireDays = async (req, res) => {
  try {
    const { userId, year, month } = req.query;
    if (!userId || !year || !month) return res.status(400).json({ message: 'Missing params' });

    const start = new Date(`${year}-${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const logs = await ActivityLog.find({
      userId,
      date: { $gte: start, $lt: end }
    });

    const fireDays = logs.map(log => new Date(log.date).getDate());

    res.json({ fireDays });
  } catch (err) {
    console.error('❌ Error fetching activity days:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
