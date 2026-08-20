const Payment = require("../models/Payment");
const Sponsor = require("../models/Sponsor");
const Expense = require("../models/Expense");
const Activity = require("../models/Activity");

// Build a date filter based on the selected range
const getDateFilter = (range = "all", start, end) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case "today": {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { $gte: today, $lt: tomorrow };
    }
    case "week": {
      const day = today.getDay(); // 0 = Sunday
      const diff = day === 0 ? 6 : day - 1;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - diff);
      return { $gte: weekStart };
    }
    case "month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { $gte: monthStart };
    }
    case "custom": {
      if (start && end) {
        const s = new Date(start);
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        return { $gte: s, $lte: e };
      }
      return {};
    }
    default:
      return {};
  }
};

// GET /api/reports/dashboard
const getDashboardReport = async (req, res) => {
  try {
    const { range = "all", start, end } = req.query;
    const dateFilter = getDateFilter(range, start, end);

    const hasDateFilter = dateFilter.$gte || dateFilter.$lte;
    const paymentDateFilter = hasDateFilter ? { paymentDate: dateFilter } : {};
    const sponsorDateFilter = hasDateFilter ? { date: dateFilter } : {};
    const expenseDateFilter = hasDateFilter ? { date: dateFilter } : {};


    // ── Totals ───────────────────────────────────────────────
    const [totalCollection, totalSponsors, totalExpenses, totalActivities] =
      await Promise.all([
        Payment.aggregate([
          { $match: paymentDateFilter },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Sponsor.aggregate([
          { $match: sponsorDateFilter },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Expense.aggregate([
          { $match: expenseDateFilter },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Activity.countDocuments(),
      ]);

    const collectionTotal = totalCollection[0]?.total || 0;
    const sponsorTotal = totalSponsors[0]?.total || 0;
    const expenseTotal = totalExpenses[0]?.total || 0;
    const netBalance = collectionTotal + sponsorTotal - expenseTotal;

    // ── Total transactions (all payment records) ─────────────
    const totalTransactions = await Payment.countDocuments(paymentDateFilter);
    const pendingAmountResult = await Payment.aggregate([
      { $match: { status: "Pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const pendingAmount = pendingAmountResult[0]?.total || 0;

    // ── Monthly Collection (last 6 months) ──────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRaw = await Payment.aggregate([
      { $match: { paymentDate: { $gte: sixMonthsAgo } } },
      {
$group: {
          _id: { month: { $month: "$paymentDate" }, year: { $year: "$paymentDate" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthlyCollection = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const found = monthlyRaw.find((r) => r._id.month === m && r._id.year === y);
      monthlyCollection.push({
        month: monthNames[m - 1],
        total: found ? found.total : 0,
      });
    }

    // ── Expense Categories ──────────────────────────────────
    const expenseCategoryRaw = await Expense.aggregate([
      { $match: expenseDateFilter },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]);

    const CATEGORY_ORDER = ["Decoration", "Food", "Sound", "Lighting", "Others"];
    const categoryMap = {};
    expenseCategoryRaw.forEach((c) => {
      categoryMap[c._id || "Others"] = c.total;
    });
    const expenseCategories = CATEGORY_ORDER.map((cat) => ({
      category: cat,
      total: categoryMap[cat] || 0,
    }));

    // ── Payment Status (from Payment records) ──────────────
    const paidQuery = { status: "Paid" };
    const pendingQuery = { status: "Pending" };
    const [paidMembers, pendingMembers] = await Promise.all([
      Payment.countDocuments(paidQuery),
      Payment.countDocuments(pendingQuery),
    ]);

    // ── Recent Payments ─────────────────────────────────────
    const recentPayments = await Payment.find()
      .sort({ paymentDate: -1 })
      .limit(5)
      .lean();

    // Recent members removed
    const recentMembers = [];

    // ── Top 10 Sponsors ─────────────────────────────────────
    const topSponsors = await Sponsor.find()
      .sort({ amount: -1 })
      .limit(10)
      .lean();

    // ── Latest Expenses ─────────────────────────────────────
    const latestExpenses = await Expense.find()
      .sort({ date: -1 })
      .limit(5)
      .lean();

    const totalSponsorCount = await Sponsor.countDocuments(sponsorDateFilter);

    // Count unique payer names from payments
    const allPayers = await Payment.distinct("payerName");
    const totalMembers = allPayers.filter(Boolean).length;

    res.json({
      totalMembers,
      totalCollection: collectionTotal,
      totalTransactions,
      pendingAmount,
      totalSponsors: sponsorTotal,
      totalExpenses: expenseTotal,
      netBalance,
      totalActivities,
      totalSponsorCount,
      monthlyCollection,
      expenseCategories,
      paidMembers,
      pendingMembers,
      recentPayments,
      recentMembers,
      topSponsors,
      latestExpenses,
    });
  } catch (err) {
    console.error("❌ Report error:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDashboardReport };
