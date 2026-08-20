import { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FaPrint, FaDownload, FaShareAlt, FaRupeeSign, FaPhone, FaUserAlt, FaReceipt, FaCalendarAlt, FaHandHoldingHeart, FaMoneyBillWave } from "react-icons/fa";
import Toast from "./Toast";
import { useState } from "react";

const LOGO = "/logo.png"; // Ganapathi logo from client/public

export default function ReceiptView({ receipt, onClose }) {
  const receiptRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const amountInWords = (num) => {
    const n = Number(num) || 0;
    if (n === 0) return "ZERO";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const convert = (x) => {
      if (x < 20) return ones[x];
      if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? " " + ones[x % 10] : "");
      if (x < 1000) return ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + convert(x % 100) : "");
      if (x < 100000) return convert(Math.floor(x / 1000)) + " Thousand" + (x % 1000 ? " " + convert(x % 1000) : "");
      return convert(Math.floor(x / 100000)) + " Lakh" + (x % 100000 ? " " + convert(x % 100000) : "");
    };
    return convert(n);
  };

  // ── Print ──────────────────────────────────────────────────────────
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const title = receipt?.receiptNumber || "Receipt";
    const html = `
      <html>
        <head>
          <title>Receipt ${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color:#333; }
            .receipt { max-width: 600px; margin: 0 auto; border: 3px solid #ea580c; border-radius: 12px; padding: 24px; }
            .head { display:flex; align-items:center; gap:16px; border-bottom:3px solid #ea580c; padding-bottom:16px; }
            .logo { width:80px; height:80px; border-radius:50%; overflow:hidden; }
            .logo img { width:100%; height:100%; object-fit:cover; }
            .brand { flex:1; text-align:center; }
            .brand h1 { margin:0; color:#ea580c; font-size:26px; }
            .brand h2 { margin:4px 0 0; color:#f59e0b; font-size:16px; font-weight:normal; }
            .sub { text-align:center; color:#ea580c; font-weight:bold; margin:12px 0; }
            table.details { width:100%; border-collapse:collapse; margin:16px 0; }
            table.details td { padding:10px 8px; border-bottom:1px dashed #ddd; }
            table.details td:first-child { color:#666; width:45%; }
            table.details td:last-child { font-weight:bold; color:#333; }
            .amount-box { background:#fff7ed; border:2px solid #f59e0b; border-radius:10px; padding:16px; text-align:center; margin:16px 0; }
            .amount-box .amt { font-size:28px; color:#ea580c; font-weight:bold; }
            .amount-box .words { color:#666; font-size:13px; margin-top:6px; }
            .footer { text-align:center; border-top:3px solid #ea580c; padding-top:14px; margin-top:16px; color:#ea580c; font-weight:bold; font-size:14px; }
            .sign { text-align:right; margin-top:24px; font-weight:bold; color:#333; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="head">
              <div class="logo"><img src="${window.location.origin}/logo.png" onerror="this.parentElement.innerHTML='🕉️'"/></div>
              <div class="brand">
                <h1>Shree Vinayaka Geleyara Balaga</h1>
                <h2>Ganapathi Utsav 2026</h2>
              </div>
            </div>
            <div class="sub">OFFICIAL RECEIPT</div>
            <table class="details">
              <tr><td>Receipt No:</td><td>${receipt?.receiptNumber || "-"}</td></tr>
              <tr><td>Date:</td><td>${formatDate(receipt?.date)}</td></tr>
              <tr><td>Name:</td><td>${receipt?.recipientName || "-"}</td></tr>
              <tr><td>Phone:</td><td>${receipt?.recipientPhone || "-"}</td></tr>
              <tr><td>Payment Method:</td><td>${receipt?.paymentMethod || "-"}</td></tr>
              <tr><td>Received By:</td><td>${receipt?.receivedBy || "-"}</td></tr>
            </table>
            <div class="amount-box">
              <div class="amt">₹${(Number(receipt?.amount) || 0).toLocaleString("en-IN")}</div>
              <div class="words">Rupees ${amountInWords(receipt?.amount)} Only</div>
            </div>
            <div class="sign">Authorised Signatory</div>
            <div class="footer">Thank you for supporting Shree Vinayaka Geleyara Balaga Ganapathi Utsav 2026</div>
          </div>
          <script>window.onload=function(){window.print();}</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ── Download PDF ───────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`${receipt?.receiptNumber || "receipt"}.pdf`);
      showToast("✅ PDF downloaded");
    } catch (err) {
      console.error("❌ PDF error:", err);
      showToast("Failed to download PDF", "error");
    } finally {
      setBusy(false);
    }
  };

  // ── Share via Web Share API ────────────────────────────────────────
  const handleShare = async () => {
    const text = `🧾 Shree Vinayaka Geleyara Balaga\nGanapathi Utsav 2026\n\nReceipt No: ${receipt?.receiptNumber}\nDate: ${formatDate(receipt?.date)}\nName: ${receipt?.recipientName}\nAmount: ₹${(Number(receipt?.amount) || 0).toLocaleString("en-IN")}\n\nThank you for supporting Shree Vinayaka Geleyara Balaga!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Receipt", text });
        showToast("✅ Shared successfully");
      } catch (err) {
        if (err.name !== "AbortError") {
          showToast("Share cancelled", "error");
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        showToast("✅ Receipt copied to clipboard");
      } catch (err) {
        showToast("Unable to share", "error");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Toolbar */}
          <div className="bg-gradient-to-r from-orange-600 to-yellow-500 p-4 flex justify-between items-center">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <FaReceipt /> Receipt
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-lg transition"
                title="Print Receipt"
              >
                <FaPrint />
              </button>
              <button
                onClick={handleDownload}
                disabled={busy}
                className="bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-lg transition disabled:opacity-50"
                title="Download PDF"
              >
                <FaDownload />
              </button>
              <button
                onClick={handleShare}
                className="bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-lg transition"
                title="Share"
              >
                <FaShareAlt />
              </button>
              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-lg transition"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Receipt Body (printable) */}
          <div ref={receiptRef} className="bg-white p-6">
            <div className="border-[3px] border-orange-600 rounded-2xl p-5">
{/* Header */}
              <div className="flex items-center gap-4 border-b-[3px] border-orange-600 pb-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-orange-500 flex items-center justify-center bg-orange-50">
                  <img
                    src={LOGO}
                    alt="Ganapathi"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <span className="text-4xl">🕉️</span>
                </div>
                <div className="flex-1 text-center">
                  <h1 className="text-2xl font-extrabold text-orange-700">Shree Vinayaka Geleyara Balaga</h1>
                  <h2 className="text-base text-amber-600 font-semibold">Ganapathi Utsav 2026</h2>
                </div>
              </div>

              <p className="text-center text-orange-600 font-bold tracking-widest mt-3">OFFICIAL RECEIPT</p>

              {/* Details */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between border-b border-dashed border-gray-300 pb-2">
                  <span className="text-gray-500 flex items-center gap-2"><FaReceipt className="text-orange-500" /> Receipt No</span>
                  <span className="font-bold text-gray-800">{receipt?.receiptNumber || "-"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-gray-300 pb-2">
                  <span className="text-gray-500 flex items-center gap-2"><FaCalendarAlt className="text-orange-500" /> Date</span>
                  <span className="font-bold text-gray-800">{formatDate(receipt?.date)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-gray-300 pb-2">
                  <span className="text-gray-500 flex items-center gap-2"><FaUserAlt className="text-orange-500" /> Name</span>
                  <span className="font-bold text-gray-800">{receipt?.recipientName || "-"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-gray-300 pb-2">
                  <span className="text-gray-500 flex items-center gap-2"><FaPhone className="text-orange-500" /> Phone</span>
                  <span className="font-bold text-gray-800">{receipt?.recipientPhone || "-"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-gray-300 pb-2">
                  <span className="text-gray-500 flex items-center gap-2"><FaMoneyBillWave className="text-orange-500" /> Payment Method</span>
                  <span className="font-bold text-gray-800">{receipt?.paymentMethod || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-2"><FaHandHoldingHeart className="text-orange-500" /> Received By</span>
                  <span className="font-bold text-gray-800">{receipt?.receivedBy || "Admin"}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-orange-50 border-2 border-amber-500 rounded-xl p-4 text-center mt-4">
                <div className="flex items-center justify-center gap-2 text-3xl font-extrabold text-orange-700">
                  <FaRupeeSign className="text-2xl" />
                  {(Number(receipt?.amount) || 0).toLocaleString("en-IN")}
                </div>
                <p className="text-gray-600 text-xs mt-1 font-medium">
                  Rupees {amountInWords(receipt?.amount)} Only
                </p>
              </div>

              {/* Amount received by tag */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                <span className="text-sm text-gray-600">
                  Amount Received: <span className="font-bold text-green-700">₹{(Number(receipt?.amount) || 0).toLocaleString("en-IN")}</span>
                </span>
              </div>

              <div className="text-right mt-6 font-semibold text-gray-700">
                <p>Authorised Signatory</p>
              </div>

              {/* Footer */}
              <div className="border-t-[3px] border-orange-600 pt-3 mt-4 text-center">
                <p className="text-orange-700 font-bold text-sm">
                  Thank you for supporting Shree Vinayaka Geleyara Balaga Ganapathi Utsav 2026
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons below */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-700 hover:to-yellow-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg"
          >
            <FaPrint /> Print
          </button>
          <button
            onClick={handleDownload}
            disabled={busy}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-60"
          >
            <FaDownload /> {busy ? "..." : "PDF"}
          </button>
          <button
            onClick={handleShare}
            className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg"
          >
            <FaShareAlt /> Share
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
