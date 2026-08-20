/* Migration script for Agraja Sangam
 * - Recompute Member.balance, Member.excess, Member.status, add memberId where missing
 * - Migrate Payment legacy fields (mode -> paymentMethod, date -> paymentDate, notes -> note)
 * - Unset legacy fields on Payment documents
 * - Ensure Payment.receiptNumber exists (generate if missing)
 * - Create useful indexes where missing
 *
 * Run: node migrations/20260820_migrate.js
 */

const mongoose = require('mongoose');
const Member = require('../models/Member');
const { Payment } = require('../models/Payment');
const Receipt = require('../models/Receipt');

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agraja-sangam';
const EXPECTED_CONTRIBUTION = 2500;

async function run() {
  console.log('Connecting to', MONGO);
  await mongoose.connect(MONGO);

  try {
    // 1) Members: populate memberId, recompute balance/excess/status
    const members = await Member.find();
    console.log(`Found ${members.length} members`);
    for (const m of members) {
      let changed = false;
      if (!m.memberId) {
        m.memberId = `MEM-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        changed = true;
      }
      const paid = Number(m.amount) || 0;
      const balance = Math.max(EXPECTED_CONTRIBUTION - paid, 0);
      const excess = Math.max(paid - EXPECTED_CONTRIBUTION, 0);
      if (m.balance !== balance) { m.balance = balance; changed = true; }
      if (m.excess !== excess) { m.excess = excess; changed = true; }
      const status = balance > 0 ? 'Pending' : 'Paid';
      if (m.status !== status) { m.status = status; changed = true; }
      if (changed) {
        await m.save();
        console.log(`Updated member ${m._id} (${m.name || m.memberId})`);
      }
    }

    // 2) Payments: migrate legacy fields into new fields and unset legacy fields
    const payments = await Payment.find();
    console.log(`Found ${payments.length} payments`);
    for (const p of payments) {
      const update = {};
      let willUpdate = false;

      if ((!p.paymentMethod || p.paymentMethod === '') && p.mode) {
        update.paymentMethod = p.mode;
        willUpdate = true;
      }
      if ((!p.paymentDate || p.paymentDate == null) && p.date) {
        update.paymentDate = p.date;
        willUpdate = true;
      }
      if ((!p.note || p.note === '') && p.notes) {
        update.note = p.notes;
        willUpdate = true;
      }

      // Ensure receiptNumber exists
      if (!p.receiptNumber) {
        const year = (new Date()).getFullYear();
        update.receiptNumber = `AGS-${year}-${p._id.toString().slice(-6)}`;
        willUpdate = true;
      }

      if (willUpdate) {
        // unset legacy fields and set new ones
        const unset = { mode: 1, date: 1, notes: 1 };
        await Payment.updateOne({ _id: p._id }, { $set: update, $unset: unset });
        console.log(`Migrated payment ${p._id}`);
      }
    }

    // 3) Ensure unique index on Receipt.receiptNumber and Payment.receiptNumber
    try {
      await Receipt.collection.createIndex({ receiptNumber: 1 }, { unique: true, sparse: true });
      console.log('Ensured unique index on Receipt.receiptNumber');
    } catch (err) {
      console.warn('Could not create Receipt.receiptNumber index:', err.message);
    }
    try {
      await Payment.collection.createIndex({ receiptNumber: 1 }, { unique: true, sparse: true });
      console.log('Ensured unique index on Payment.receiptNumber');
    } catch (err) {
      console.warn('Could not create Payment.receiptNumber index:', err.message);
    }

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
