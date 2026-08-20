const Sponsor = require("../models/Sponsor");
const { createReceipt } = require("./receiptController");

// Get all sponsors
const getSponsors = async (req, res) => {
  console.log("📤 getSponsors() called");

  try {
    const sponsors = await Sponsor.find().sort({ createdAt: -1 });
    res.json(sponsors);
  } catch (err) {
    console.error("❌ Error fetching sponsors:", err);
    res.status(500).json({ message: err.message });
  }
};

// Add a sponsor (Admin only)
const addSponsor = async (req, res) => {
  console.log("📤 addSponsor() called");
  console.log("📦 Received Data:", req.body);

  try {
    const { sponsorName, phone, address, amount, paymentMethod, receiptNumber, date, status, notes } = req.body;

    // Validation
    if (!sponsorName || !phone) {
      return res.status(400).json({ message: "Sponsor name and phone are required" });
    }

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount < 0) {
      return res.status(400).json({ message: "Amount must be a valid number" });
    }

    const sponsor = await Sponsor.create({
      sponsorName: sponsorName.trim(),
      phone: phone.trim(),
      address: address || "",
      amount: paymentAmount,
      paymentMethod: paymentMethod || "Cash",
      receiptNumber: receiptNumber || "",
      date: date ? new Date(date) : new Date(),
      status: status || (paymentAmount > 0 ? "Paid" : "Pending"),
      notes: notes || "",
    });

console.log(`✅ Sponsor saved: ${sponsor._id}`);

    // ── Auto-generate a receipt ───────────────────────────────────────
    if (paymentAmount > 0) {
      try {
        const receipt = await createReceipt({
          sourceType: "sponsor",
          sourceId: sponsor._id,
          recipientName: sponsor.sponsorName,
          recipientPhone: sponsor.phone,
          amount: paymentAmount,
          paymentMethod: sponsor.paymentMethod || "Cash",
          receivedBy: req.user?.username || "",
          receivedByUserId: req.user?.id || null,
          date: sponsor.date,
        });
        console.log(`🧾 Receipt generated: ${receipt.receiptNumber}`);
      } catch (receiptErr) {
        console.error("⚠️ Failed to generate sponsor receipt:", receiptErr.message);
      }
    }

    res.status(201).json(sponsor);
  } catch (err) {
    console.error("❌ Error in addSponsor():", err);
    res.status(400).json({ message: err.message });
  }
};

// Update a sponsor (Admin only)
const updateSponsor = async (req, res) => {
  console.log("📤 updateSponsor() called for:", req.params.id);

  try {
    const { id } = req.params;
    const { sponsorName, phone, address, amount, paymentMethod, receiptNumber, date, status, notes } = req.body;

    const existing = await Sponsor.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Sponsor not found" });
    }

    existing.sponsorName = sponsorName !== undefined ? sponsorName.trim() : existing.sponsorName;
    existing.phone = phone !== undefined ? phone.trim() : existing.phone;
    existing.address = address !== undefined ? address : existing.address;
    existing.amount = amount !== undefined ? Number(amount) : existing.amount;
    existing.paymentMethod = paymentMethod || existing.paymentMethod;
    existing.receiptNumber = receiptNumber !== undefined ? receiptNumber : existing.receiptNumber;
    existing.date = date ? new Date(date) : existing.date;
    existing.status = status || existing.status;
    existing.notes = notes !== undefined ? notes : existing.notes;

    await existing.save();

    console.log(`✅ Sponsor updated: ${id}`);
    res.json(existing);
  } catch (err) {
    console.error("❌ Error in updateSponsor():", err);
    res.status(400).json({ message: err.message });
  }
};

// Delete a sponsor (Admin only)
const deleteSponsor = async (req, res) => {
  console.log("📤 deleteSponsor() called for:", req.params.id);

  try {
    const { id } = req.params;

    const sponsor = await Sponsor.findByIdAndDelete(id);
    if (!sponsor) {
      return res.status(404).json({ message: "Sponsor not found" });
    }

    console.log(`✅ Sponsor deleted: ${id}`);
    res.json({ message: "Sponsor deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deleteSponsor():", err);
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getSponsors,
  addSponsor,
  updateSponsor,
  deleteSponsor,
};
