import { useState } from "react";
import { jsPDF } from "jspdf";
import Toast from "./Toast";
import {
  FaPrint,
  FaDownload,
  FaRupeeSign,
  FaReceipt,
  FaUserAlt,
  FaPhone,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaTimes,
} from "react-icons/fa";

// ─── Module-scope helper for the printable receipt body ───────────────
function ReceiptBody({ pay, memberName, phone, formatting }) {
  const { formatDate, formatIN } = formatting;

  const txId = pay.transactionId || "-";
  const status = pay.status || "Pending";

  return (
    <div className="bg-white p-6">
      <div className="border-[3px] border-orange-600 rounded-2xl p-5">
        {/* Header */}
        <div className="text-center border-b-[3px] border-orange-600 pb-3">
          <div className="text-4xl">🕉️</div>
          <h1 className="text-2xl font-extrabold text-orange-700">
            Shree Vinayaka Geleyara Balaga
          </h1>
          <h2 className="text-base text-amber-600 font-semibold">
            Ganapathi Utsav 2026
          </h2>
        </div>

        <p className="text-center text-orange-600 font-bold tracking-widest mt-3">
          PAYMENT RECEIPT
        </p>

        {/* Receipt & date */}
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
            <span className="text-gray-500 flex items-center gap-2">
              <FaReceipt className="text-orange-500" /> Receipt No
            </span>
            <span className="font-bold text-gray-800">
              {pay.receiptNumber || "-"}
            </span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
            <span className="text-gray-500 flex items-center gap-2">
              <FaCalendarAlt className="text-orange-500" /> Date
            </span>
            <span className="font-bold text-gray-800">
              {formatDate(pay.paymentDate || pay.date)}
            </span>
          </div>

          {/* Person */}
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
            <span className="text-gray-500 flex items-center gap-2">
              <FaUserAlt className="text-orange-500" /> Name
            </span>
            <span className="font-bold text-gray-800">{memberName}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
            <span className="text-gray-500 flex items-center gap-2">
              <FaPhone className="text-orange-500" /> Phone
            </span>
            <span className="font-bold text-gray-800">{phone || "-"}</span>
          </div>

          {/* Payment details */}
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
            <span className="text-gray-500 flex items-center gap-2">
              <FaMoneyBillWave className="text-orange-500" /> Amount
            </span>
            <span className="font-bold text-gray-800">
              {formatIN(pay.amount)}
            </span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
            <span className="text-gray-500 flex items-center gap-2">
              <FaMoneyBillWave className="text-orange-500" /> Method
            </span>
            <span className="font-bold text-gray-800">
              {pay.paymentMethod || pay.mode || "Cash"}
            </span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-2">
            <span className="text-gray-500 flex items-center gap-2">
              <FaReceipt className="text-orange-500" /> Transaction ID
            </span>
            <span className="font-bold text-gray-800">{txId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span
              className={`font-bold ${
                status === "Paid" ? "text-green-700" : "text-red-600"
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400 border-t border-dashed border-gray-300 pt-3">
          🙏 Ganapathi Bappa Morya · Shree Vinayaka Geleyara Balaga
        </div>
      </div>
    </div>
  );
}

// ─── Main Receipt Component ──────────────────────────────────────────
export default function PaymentReceipt({ pay, onClose }) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const fmtIN = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

  const memberName = pay.payerName || pay.memberName || "Member";
  const phone = pay.phone || "";

  // ── Generate a real PDF with jsPDF ────────────────────────────────
  const handleDownload = async () => {
    setBusy(true);
    try {
      const payMethod = pay.paymentMethod || pay.mode || "Cash";
      const dateStr = fmtDate(pay.paymentDate || pay.date);
      const txId = pay.transactionId || "-";
      const status = pay.status || "Pending";
      const receiptNo = pay.receiptNumber || "N/A";

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = 20;

      // Header band
      doc.setFillColor(234, 88, 12);
      doc.rect(0, 0, pageWidth, 34, "F");
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 34, pageWidth, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Shree Vinayaka Geleyara Balaga", pageWidth / 2, 16, { align: "center" });
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Ganapathi Utsav 2026", pageWidth / 2, 28, { align: "center" });

      y = 50;
      doc.setTextColor(234, 88, 12);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("PAYMENT RECEIPT", pageWidth / 2, y, { align: "center" });

      y += 12;

      const line = (label, value, yPos, color) => {
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.setFont("helvetica", "normal");
        doc.text(label, margin + 6, yPos);
        doc.setTextColor(...(color || [31, 41, 55]));
        doc.setFont("helvetica", "bold");
        doc.text(String(value), pageWidth - margin - 6, yPos, { align: "right" });
      };

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);

      line("Receipt No", receiptNo, y); y += 8;
      line("Date", dateStr, y); y += 8;
      line("Name", memberName, y); y += 8;
      line("Phone", phone || "-", y); y += 8;
      line("Amount", fmtIN(pay.amount), y); y += 8;
      line("Method", payMethod, y); y += 8;
      line("Transaction ID", txId, y); y += 8;
      line("Status", status, y, status === "Paid" ? [22, 163, 74] : [220, 38, 38]); y += 12;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "normal");
      doc.text("Shree Vinayaka Geleyara Balaga · Ganapathi Utsav 2026", pageWidth / 2, y, { align: "center" });

      doc.save(`receipt-${receiptNo}.pdf`);
      setToast({ message: "✅ PDF downloaded!", type: "success" });
    } catch (err) {
      console.error("PDF error:", err);
      setToast({ message: "Failed to generate PDF", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  // ── Print receipt (opens a print-friendly window) ─────────────────
  const handlePrint = () => {
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${pay.receiptNumber || ""}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 3px solid #ea580c; padding-bottom: 12px; }
          .header h1 { color: #ea580c; margin: 0; font-size: 22px; }
          .header h2 { color: #f59e0b; margin: 4px 0 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          td { padding: 8px; border-bottom: 1px dashed #d1d5db; }
          td:first-child { color: #6b7280; width: 45%; }
          .status-paid { color: #16a34a; font-weight: bold; }
          .status-pending { color: #dc2626; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🕉️ Shree Vinayaka Geleyara Balaga</h1>
          <h2>Ganapathi Utsav 2026</h2>
        </div>
        <h2 style="text-align:center;color:#ea580c;">PAYMENT RECEIPT</h2>
        <table>
          <tr><td>Receipt No</td><td>${pay.receiptNumber || "-"}</td></tr>
          <tr><td>Date</td><td>${fmtDate(pay.paymentDate || pay.date)}</td></tr>
          <tr><td>Name</td><td>${memberName}</td></tr>
          <tr><td>Phone</td><td>${phone || "-"}</td></tr>
          <tr><td>Amount</td><td>${fmtIN(pay.amount)}</td></tr>
          <tr><td>Method</td><td>${pay.paymentMethod || pay.mode || "Cash"}</td></tr>
          <tr><td>Transaction ID</td><td>${pay.transactionId || "-"}</td></tr>
          <tr><td>Status</td><td class="${(pay.status || "Pending") === "Paid" ? "status-paid" : "status-pending"}">${pay.status || "Pending"}</td></tr>
        </table>
        <div class="footer">
          <p>🕉️ Shree Vinayaka Geleyara Balaga · Ganapathi Utsav 2026 · All rights reserved</p>
        </div>
      </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg">
        {/* Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60"
            >
              <FaDownload /> {busy ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-semibold transition"
            >
              <FaPrint /> Print
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        <ReceiptBody
          pay={pay}
          memberName={memberName}
          phone={phone}
          formatting={{ formatDate: fmtDate, formatIN: fmtIN }}
        />
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
