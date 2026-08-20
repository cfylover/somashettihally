const Receipt = require("../models/Receipt");
const User = require("../models/User");

// ─── Generate next receipt number ───────────────────────────────────────
const generateReceiptNumber = async () => {
  const year = new Date().getFullYear();
  // 2026 contest reference
  const baseYear = 2026;
  const count = await Receipt.countDocuments();
  return `AS-${baseYear}-${String(count + 1).padStart(6, "0")}`;
};

// ─── Create a receipt (called after a payment or sponsor is recorded) ──
const createReceipt = async (data) => {
  const {
    sourceType, // "payment" | "sponsor"
    sourceId,
    recipientName,
    recipientPhone,
    amount,
    paymentMethod,
    receivedBy,
    receivedByUserId,
    date,
  } = data;

  // Try to link a member-user so they can view their own receipt later
  let ownerMemberUserId = null;
  if (sourceType === "payment" && recipientName) {
    const linkedUser = await User.findOne({
      username: { $regex: new RegExp(`^${recipientName.trim()}$`, "i") },
      role: "Member",
    });
    if (linkedUser) ownerMemberUserId = linkedUser._id;
  }

  const receiptNumber = await generateReceiptNumber();

  const receipt = await Receipt.create({
    sourceType,
    sourceId,
    recipientName: recipientName.trim(),
    recipientPhone: recipientPhone || "",
    amount: Number(amount) || 0,
    paymentMethod: paymentMethod || "Cash",
    receivedBy: receivedBy || "",
    receivedByUserId: receivedByUserId || null,
    ownerMemberUserId,
    receiptNumber,
    date: date ? new Date(date) : new Date(),
  });

  return receipt;
};

// ─── GET /api/receipts ──────────────────────────────────────────────────
// Admin sees all. Members only see receipts that belong to them.
const getReceipts = async (req, res) => {
  console.log("📤 getReceipts() called by:", req.user?.username, "role:", req.user?.role);

  try {
    let query = {};

    if (req.user && req.user.role !== "Admin") {
      query = {
        $or: [
          { receivedByUserId: req.user.id },
          { ownerMemberUserId: req.user.id },
        ],
      };
    }

    const receipts = await Receipt.find(query).sort({ createdAt: -1 });
    console.log(`✅ Found ${receipts.length} receipts`);
    res.json(receipts);
  } catch (err) {
    console.error("❌ Error fetching receipts:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/receipts/:id ──────────────────────────────────────────────
const getReceiptById = async (req, res) => {
  console.log("📤 getReceiptById() called for:", req.params.id);

  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Members can only access their own receipts
    const isMember = req.user && req.user.role !== "Admin";
    const isOwner =
      receipt.receivedByUserId?.toString() === req.user?.id ||
      receipt.ownerMemberUserId?.toString() === req.user?.id;

    if (isMember && !isOwner) {
      return res.status(403).json({ message: "Forbidden: You can only view your own receipt" });
    }

    res.json(receipt);
  } catch (err) {
    console.error("❌ Error fetching receipt:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE /api/receipts/:id ───────────────────────────────────────────
// Admin only
const deleteReceipt = async (req, res) => {
  console.log("📤 deleteReceipt() called for:", req.params.id);

  try {
    const receipt = await Receipt.findByIdAndDelete(req.params.id);
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }
    console.log(`✅ Receipt deleted: ${receipt.receiptNumber}`);
    res.json({ message: "Receipt deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting receipt:", err);
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  createReceipt,
  getReceipts,
  getReceiptById,
  deleteReceipt,
};

