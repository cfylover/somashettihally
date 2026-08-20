import { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import { getDashboardReport } from "../api/reportApi";
import { getCurrentUser } from "../utils/auth";
import MobileNav from "../components/MobileNav";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  FaRupeeSign,
  FaHandHoldingHeart,
  FaWallet,
  FaBalanceScale,
  FaCalendarAlt,
  FaDownload,
  FaFileExcel,
  FaPrint,
  FaSearch,
  FaFilter,
  FaTimes,
  FaSpinner,
  FaTrophy,
  FaUsers,
  FaMoneyBillWave,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

// ─── Stagger animation variants ─────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ─── Helper: format currency ───────────────────────────────────────
const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return "₹" + num.toLocaleString("en-IN");
};

// ─── Helper: format date ───────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Summary Card ──────────────────────────────────────────────────
function SummaryCard({ title, value, icon, prefix = "", color, delay = 0 }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative overflow-hidden rounded-[20px] bg-[#111827]/80 backdrop-blur-xl border border-white/10 p-5 shadow-xl shadow-black/40 group"
    >
      {/* Gradient accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-2 text-white">
            {prefix}
            {Number(value).toLocaleString("en-IN")}
          </h2>
        </div>
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Glass Section ─────────────────────────────────────────────────
function GlassSection({ title, icon, children, className = "", delay = 0 }) {
  return (
    <motion.div
      variants={itemVariants}
      className={`rounded-[20px] bg-[#111827]/80 backdrop-blur-xl border border-white/10 p-5 md:p-6 shadow-xl shadow-black/40 ${className}`}
    >
      <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-base shadow-lg">
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

// ─── Filter Bar ────────────────────────────────────────────────────
function FilterBar({ range, setRange, customStart, customEnd, onCustomDateChange, onApply }) {
  const [showCustom, setShowCustom] = useState(false);

  const filters = [
    { key: "all", label: "All Time" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "custom", label: "Custom" },
  ];

  const handleFilter = (key) => {
    setRange(key);
    if (key === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onApply && onApply(key);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => handleFilter(f.key)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            range === f.key
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30"
              : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
          }`}
        >
          {f.key === "custom" ? <><FaFilter className="inline mr-1.5 text-xs" />{f.label}</> : f.label}
        </button>
      ))}

      {showCustom && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomDateChange("start", e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomDateChange("end", e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
          />
          <button
            onClick={() => onApply && onApply("custom")}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-bold transition"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setShowCustom(false);
              setRange("all");
              onApply && onApply("all");
            }}
            className="p-2 text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>
      )}
    </div>
  );
}

// ===================================================================
// REPORTS PAGE
// ===================================================================
export default function Reports() {
  const user = getCurrentUser();
  const isAdminUser = user?.role === "Admin";

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date filter state
  const [range, setRange] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Search for tables
  const [sponsorSearch, setSponsorSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const reportRef = useRef(null);

  // PDF generation state
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfStatus, setPdfStatus] = useState(null); // { type: 'success'|'error', message }

  // ─── Fetch report data ──────────────────────────────────────────
  const fetchReport = async (rangeVal, start, end) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (rangeVal && rangeVal !== "all") {
        params.range = rangeVal;
      }
      if (rangeVal === "custom" && start && end) {
        params.start = start;
        params.end = end;
      }
      const data = await getDashboardReport(params);
      setReportData(data);
    } catch (err) {
      console.error("❌ Reports fetch error:", err);
      setError(err.response?.data?.message || err.message || "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(range);
  }, []);

  const handleApplyFilter = (rangeVal) => {
    if (rangeVal === "custom") {
      if (customStart && customEnd) {
        setRange("custom");
        fetchReport("custom", customStart, customEnd);
      }
    } else {
      setRange(rangeVal);
      fetchReport(rangeVal);
    }
  };

  const handleCustomDateChange = (field, value) => {
    if (field === "start") setCustomStart(value);
    else setCustomEnd(value);
  };

  // ─── Chart configurations ───────────────────────────────────────
  const lineData = useMemo(() => {
    if (!reportData?.monthlyCollection) return null;
    const months = reportData.monthlyCollection.map((m) => m.month);
    const totals = reportData.monthlyCollection.map((m) => m.total);
    return {
      labels: months,
      datasets: [
        {
          label: "Monthly Collection (₹)",
          data: totals,
          borderColor: "#F59E0B",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#F59E0B",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          borderWidth: 3,
        },
      ],
    };
  }, [reportData]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#f59e0b",
        bodyColor: "#e5e7eb",
        borderColor: "#374151",
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `₹${Number(ctx.raw).toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: "#9ca3af" }, grid: { display: false } },
      y: {
        ticks: { color: "#9ca3af", callback: (v) => "₹" + v.toLocaleString("en-IN") },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
    },
  };

  const incomeExpenseData = useMemo(() => {
    if (!reportData) return null;
    return {
      labels: ["Income", "Expense"],
      datasets: [
        {
          label: "Amount (₹)",
          data: [
            (reportData.totalCollection || 0) + (reportData.totalSponsors || 0),
            reportData.totalExpenses || 0,
          ],
          backgroundColor: ["rgba(34, 197, 94, 0.7)", "rgba(239, 68, 68, 0.7)"],
          borderColor: ["#22c55e", "#ef4444"],
          borderWidth: 2,
          borderRadius: 8,
          barThickness: 60,
        },
      ],
    };
  }, [reportData]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#f59e0b",
        bodyColor: "#e5e7eb",
        borderColor: "#374151",
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `₹${Number(ctx.raw).toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: "#9ca3af" }, grid: { display: false } },
      y: {
        ticks: { color: "#9ca3af", callback: (v) => "₹" + v.toLocaleString("en-IN") },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
    },
  };

  const expensePieData = useMemo(() => {
    if (!reportData?.expenseCategories) return null;
    const cats = reportData.expenseCategories;
    const hasData = cats.some((c) => c.total > 0);
    if (!hasData) return null;
    const colors = ["#F59E0B", "#22C55E", "#3B82F6", "#EF4444", "#a855f7"];
    return {
      labels: cats.map((c) => c.category),
      datasets: [
        {
          data: cats.map((c) => c.total || 1),
          backgroundColor: colors.slice(0, cats.length),
          borderColor: "#111827",
          borderWidth: 3,
          hoverOffset: 12,
        },
      ],
    };
  }, [reportData]);

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#e5e7eb", usePointStyle: true, padding: 12, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#f59e0b",
        bodyColor: "#e5e7eb",
        borderColor: "#374151",
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const val = ctx.raw;
            const pct = ((val / total) * 100).toFixed(1);
            return `${ctx.label}: ₹${Number(val).toLocaleString("en-IN")} (${pct}%)`;
          },
        },
      },
    },
  };

  const donutData = useMemo(() => {
    if (!reportData) return null;
    const total = (reportData.paidMembers || 0) + (reportData.pendingMembers || 0);
    if (total === 0) return null;
    return {
      labels: ["Paid", "Pending"],
      datasets: [
        {
          data: [reportData.paidMembers || 0, reportData.pendingMembers || 0],
          backgroundColor: ["#22C55E", "#EF4444"],
          borderColor: "#111827",
          borderWidth: 3,
          hoverOffset: 12,
        },
      ],
    };
  }, [reportData]);

  const donutOptions = {
    cutout: "70%",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#e5e7eb", usePointStyle: true, padding: 12, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#f59e0b",
        bodyColor: "#e5e7eb",
        borderColor: "#374151",
        borderWidth: 1,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = ((ctx.raw / total) * 100).toFixed(1);
            return `${ctx.label}: ${ctx.raw} (${pct}%)`;
          },
        },
      },
    },
  };

  // ─── Filtered data for tables ───────────────────────────────────
  const filteredSponsors = useMemo(() => {
    if (!reportData?.topSponsors) return [];
    if (!sponsorSearch.trim()) return reportData.topSponsors;
    return reportData.topSponsors.filter(
      (s) =>
        s.sponsorName?.toLowerCase().includes(sponsorSearch.toLowerCase()) ||
        s.phone?.includes(sponsorSearch)
    );
  }, [reportData, sponsorSearch]);

const filteredPayments = useMemo(() => {
    if (!reportData?.recentPayments) return [];
    if (!paymentSearch.trim()) return reportData.recentPayments;
    const q = paymentSearch.toLowerCase();
    return reportData.recentPayments.filter(
      (p) =>
        (p.payerName || p.memberName || "").toLowerCase().includes(q) ||
        (p.receiptNumber || "").toLowerCase().includes(q) ||
        (p.paymentMethod || p.mode || "").toLowerCase().includes(q) ||
        (p.transactionId || "").toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q)
    );
  }, [reportData, paymentSearch]);

  const filteredExpenses = useMemo(() => {
    if (!reportData?.latestExpenses) return [];
    if (!expenseSearch.trim()) return reportData.latestExpenses;
    return reportData.latestExpenses.filter(
      (e) =>
        e.title?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        e.category?.toLowerCase().includes(expenseSearch.toLowerCase())
    );
  }, [reportData, expenseSearch]);

  // Derived member-like data from payments (group by payerName)
  const filteredMembers = useMemo(() => {
    if (!reportData?.recentPayments) return [];
    const map = new Map();
    reportData.recentPayments.forEach((p) => {
      const name = (p.payerName || "").trim();
      if (!name) return;
      const existing = map.get(name.toLowerCase());
      if (existing) {
        existing.amount += Number(p.amount) || 0;
      } else {
        map.set(name.toLowerCase(), {
          _id: p._id,
          name,
          phone: p.phone || "",
          amount: Number(p.amount) || 0,
          status: p.status || "Pending",
        });
      }
    });
    let list = Array.from(map.values());
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q) || m.phone.includes(q));
    }
    return list;
  }, [reportData, memberSearch]);

  // ─── Export PDF (real PDF download) ──────────────────────────────
  const exportPDF = async () => {
    try {
      setPdfStatus(null);
      setPdfGenerating(true);

      const totalCollection = Number(reportData?.totalCollection || 0);
      const totalSponsors = Number(reportData?.totalSponsors || 0);
      const totalExpenses = Number(reportData?.totalExpenses || 0);
      const netBalance = Number(reportData?.netBalance || 0);
      const totalMembers = Number(reportData?.totalMembers || 0);
      const paidMembers = Number(reportData?.paidMembers || 0);
      const pendingMembers = Number(reportData?.pendingMembers || 0);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // ── Professional header bar ─────────────────────────────
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 0, pageWidth, 42, "F");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("Shree Vinayaka Geleyara Balaga", pageWidth / 2, 18, { align: "center" });
      doc.setFontSize(13);
      doc.text("Ganapathi Utsav 2026 - Annual Report", pageWidth / 2, 30, { align: "center" });
      doc.setFontSize(9);
      doc.text(
        `Report Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`,
        pageWidth / 2,
        38,
        { align: "center" }
      );

      // ── Summary section ─────────────────────────────────────
      let y = 54;
      doc.setFontSize(14);
      doc.setTextColor(245, 158, 11);
      doc.text("Summary", 14, y);
      y += 6;
      doc.autoTable({
        startY: y,
        head: [["Metric", "Value"]],
        body: [
          ["Total Persons", String(totalMembers)],
          ["Total Collection", `₹${totalCollection.toLocaleString("en-IN")}`],
          ["Paid Payments", String(paidMembers)],
          ["Pending Payments", String(pendingMembers)],
          ["Sponsor Amount", `₹${Number(reportData?.totalSponsors || 0).toLocaleString("en-IN")}`],
          ["Total Expenses", `₹${Number(reportData?.totalExpenses || 0).toLocaleString("en-IN")}`],
          ["Net Balance", `₹${Number(reportData?.netBalance || 0).toLocaleString("en-IN")}`],
        ],
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [245, 158, 11], textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: "bold" },
          1: { cellWidth: 60, halign: "right" },
        },
      });
      y = doc.lastAutoTable.finalY + 12;

      // ── Sponsors table ──────────────────────────────────────
      if (reportData?.topSponsors?.length) {
        doc.setFontSize(14);
        doc.setTextColor(245, 158, 11);
        doc.text("Top Sponsors", 14, y);
        y += 6;
        doc.autoTable({
          startY: y,
          head: [["#", "Name", "Phone", "Amount"]],
          body: reportData.topSponsors.map((s, i) => [
            i + 1,
            s.sponsorName,
            s.phone,
            `₹${Number(s.amount).toLocaleString("en-IN")}`,
          ]),
          theme: "grid",
          headStyles: { fillColor: [245, 158, 11], textColor: [0, 0, 0] },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      // ── Recent Payments table ───────────────────────────────
      if (reportData?.recentPayments?.length) {
        doc.setFontSize(14);
        doc.setTextColor(245, 158, 11);
        doc.text("Recent Payments", 14, y);
        y += 6;
        doc.autoTable({
          startY: y,
          head: [["Person", "Amount", "Mode", "Date"]],
          body: reportData.recentPayments.map((p) => [
            p.payerName || p.memberName || "-",
            `₹${Number(p.amount).toLocaleString("en-IN")}`,
            p.mode || "-",
            formatDate(p.date),
          ]),
          theme: "grid",
          headStyles: { fillColor: [245, 158, 11], textColor: [0, 0, 0] },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      // ── Recent Expenses table ───────────────────────────────
      if (reportData?.latestExpenses?.length) {
        doc.setFontSize(14);
        doc.setTextColor(245, 158, 11);
        doc.text("Recent Expenses", 14, y);
        y += 6;
        doc.autoTable({
          startY: y,
          head: [["Title", "Category", "Amount", "Date"]],
          body: reportData.latestExpenses.map((e) => [
            e.title || "-",
            e.category || "-",
            `₹${Number(e.amount).toLocaleString("en-IN")}`,
            formatDate(e.date),
          ]),
          theme: "grid",
          headStyles: { fillColor: [245, 158, 11], textColor: [0, 0, 0] },
        });
      }

      // ── Footer + page numbers on every page ─────────────────
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          "Shree Vinayaka Geleyara Balaga - Ganapathi Utsav 2026",
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" }
        );
        if (pageCount > 1) {
          doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: "right" });
        }
      }

      // Real download (NOT window.print)
      doc.save("Shree_Vinayaka_Geleyara_Balaga_Report_2026.pdf");

      setPdfStatus({ type: "success", message: "PDF downloaded successfully." });
    } catch (err) {
      console.error("❌ PDF generation error:", err);
      setPdfStatus({
        type: "error",
        message: err.response?.data?.message || err.message || "Failed to generate PDF.",
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  // ─── Export Excel ────────────────────────────────────────────────
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["Shree Vinayaka Geleyara Balaga - Reports Dashboard"],
      ["Ganapathi Utsav 2026"],
      [],
      ["Metric", "Value"],
      ["Total Collection", reportData?.totalCollection || 0],
      ["Total Sponsor Amount", reportData?.totalSponsors || 0],
      ["Total Expenses", reportData?.totalExpenses || 0],
      ["Net Balance", reportData?.netBalance || 0],
      ["Total Activities", reportData?.totalActivities || 0],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    // Sponsors sheet
    if (reportData?.topSponsors?.length) {
      const sponsorsSheet = [
        ["#", "Name", "Phone", "Amount", "Payment Method", "Date"],
        ...reportData.topSponsors.map((s, i) => [
          i + 1,
          s.sponsorName,
          s.phone,
          s.amount,
          s.paymentMethod,
          formatDate(s.date),
        ]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(sponsorsSheet);
      XLSX.utils.book_append_sheet(wb, ws2, "Top Sponsors");
    }

    // Payments sheet
    if (reportData?.recentPayments?.length) {        const paymentsSheet = [
        ["Person", "Amount", "Mode", "Date"],
        ...reportData.recentPayments.map((p) => [
          p.payerName || p.memberName || "-",
          p.amount,
          p.mode,
          formatDate(p.date),
        ]),
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(paymentsSheet);
      XLSX.utils.book_append_sheet(wb, ws3, "Recent Payments");
    }

    // Expenses sheet
    if (reportData?.latestExpenses?.length) {
      const expensesSheet = [
        ["Title", "Category", "Amount", "Paid To", "Date"],
        ...reportData.latestExpenses.map((e) => [
          e.title,
          e.category,
          e.amount,
          e.paidTo,
          formatDate(e.date),
        ]),
      ];
      const ws4 = XLSX.utils.aoa_to_sheet(expensesSheet);
      XLSX.utils.book_append_sheet(wb, ws4, "Recent Expenses");
    }

    XLSX.writeFile(wb, "Shree_Vinayaka_Geleyara_Balaga_Report.xlsx");
  };

  // ─── Print Report ────────────────────────────────────────────────
  const printReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the report");
      return;
    }

    const data = reportData;
    const content = `
      <html>
        <head>
          <title>Shree Vinayaka Geleyara Balaga - Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #f59e0b; padding-bottom: 20px; }
            .header h1 { color: #f59e0b; margin: 0; font-size: 28px; }
            .header p { color: #666; margin: 5px 0 0; }
            .summary { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0; }
            .summary .card { flex: 1; min-width: 120px; border: 1px solid #ddd; border-radius: 8px; padding: 12px; text-align: center; }
            .summary .card h2 { margin: 0; font-size: 22px; }
            .summary .card p { margin: 5px 0 0; color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f59e0b; color: white; padding: 10px; text-align: left; }
            td { padding: 8px 10px; border-bottom: 1px solid #eee; }
            h2 { color: #f59e0b; margin-top: 30px; }
            .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🕉️ Shree Vinayaka Geleyara Balaga</h1>
            <p>Ganapathi Utsav 2026 · Reports Dashboard</p>
            <p style="font-size:12px">Generated: ${new Date().toLocaleString("en-IN")}</p>
          </div>
          <div class="summary">
            <div class="card"><h2>₹${(data?.totalCollection || 0).toLocaleString("en-IN")}</h2><p>Total Collection</p></div>
            <div class="card"><h2>₹${(data?.totalSponsors || 0).toLocaleString("en-IN")}</h2><p>Sponsor Amount</p></div>
            <div class="card"><h2>₹${(data?.totalExpenses || 0).toLocaleString("en-IN")}</h2><p>Total Expenses</p></div>
            <div class="card"><h2>₹${(data?.netBalance || 0).toLocaleString("en-IN")}</h2><p>Net Balance</p></div>
            <div class="card"><h2>${data?.totalActivities || 0}</h2><p>Activities</p></div>
          </div>
          <h2>Top Sponsors</h2>
          <table><tr><th>#</th><th>Name</th><th>Phone</th><th>Amount</th></tr>
            ${(data?.topSponsors || []).map((s, i) => `<tr><td>${i+1}</td><td>${s.sponsorName}</td><td>${s.phone}</td><td>₹${Number(s.amount).toLocaleString("en-IN")}</td></tr>`).join("")}
          </table>
          <h2>Recent Payments</h2>
          <table><tr><th>Person</th><th>Amount</th><th>Mode</th><th>Date</th></tr>
            ${(data?.recentPayments || []).map((p) => `<tr><td>${p.payerName || p.memberName || "-"}</td><td>₹${Number(p.amount).toLocaleString("en-IN")}</td><td>${p.mode}</td><td>${formatDate(p.date)}</td></tr>`).join("")}
          </table>
          <h2>Recent Expenses</h2>
          <table><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th></tr>
            ${(data?.latestExpenses || []).map((e) => `<tr><td>${e.title}</td><td>${e.category}</td><td>₹${Number(e.amount).toLocaleString("en-IN")}</td><td>${formatDate(e.date)}</td></tr>`).join("")}
          </table>
          <div class="footer">
            <p>🕉️ Shree Vinayaka Geleyara Balaga · Ganapathi Utsav 2026 · All rights reserved</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  // ─── Non-admin redirect ─────────────────────────────────────────
  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-6">
            <FaHandHoldingHeart className="text-5xl text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Only Admin users can view Reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] pt-16 lg:pt-0">
      <MobileNav />
      <motion.div
        ref={reportRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 md:p-8 max-w-[1600px] mx-auto"
      >
        {/* ═══════════ HEADER ═══════════ */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xl shadow-lg">
              📊
            </span>
            Reports & Analytics
          </h1>
          <p className="text-gray-400 mt-2 ml-1">Shree Vinayaka Geleyara Balaga · Ganapathi Utsav 2026</p>
        </motion.div>

        {/* ═══════════ FILTERS ═══════════ */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <FilterBar
              range={range}
              setRange={setRange}
              customStart={customStart}
              customEnd={customEnd}
              onCustomDateChange={handleCustomDateChange}
              onApply={handleApplyFilter}
            />

            {/* Export buttons */}
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <button
                onClick={exportPDF}
                disabled={!reportData || pdfGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {pdfGenerating ? (
                  <>
                    <FaSpinner className="animate-spin" /> Generating PDF...
                  </>
                ) : (
                  <>
                    <FaDownload /> Download PDF
                  </>
                )}
              </button>
              <button
                onClick={exportExcel}
                disabled={!reportData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                <FaFileExcel /> Excel
              </button>
              <button
                onClick={printReport}
                disabled={!reportData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                <FaPrint /> Print
              </button>
            </div>
          </div>
        </motion.div>

        {/* PDF generation status message */}
        {pdfStatus && !pdfGenerating && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 rounded-xl text-sm font-semibold ${
              pdfStatus.type === "success"
                ? "bg-green-500/15 border border-green-500/30 text-green-400"
                : "bg-red-500/15 border border-red-500/30 text-red-400"
            }`}
          >
            {pdfStatus.type === "success" ? "✅ " : "❌ "}
            {pdfStatus.message}
          </motion.div>
        )}

        {/* ═══════════ LOADING / ERROR ═══════════ */}
        {loading && (
          <div className="flex justify-center items-center py-32">
            <FaSpinner className="text-5xl text-amber-500 animate-spin" />
          </div>
        )}

        {error && (
          <motion.div
            variants={itemVariants}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center"
          >
            <p className="text-red-400 font-semibold">❌ {error}</p>
            <button
              onClick={() => fetchReport(range)}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* ═══════════ CONTENT ═══════════ */}
        {!loading && !error && reportData && (
          <>
            {/* ── Summary Cards ────────────────────────────────── */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8"
            >
              <SummaryCard
                title="Total Collection"
                value={reportData.totalCollection}
                prefix="₹"
                icon={<FaMoneyBillWave />}
                color="from-green-500 to-emerald-600"
              />
              <SummaryCard
                title="Sponsor Amount"
                value={reportData.totalSponsors}
                prefix="₹"
                icon={<FaHandHoldingHeart />}
                color="from-orange-400 to-amber-500"
              />
              <SummaryCard
                title="Total Expenses"
                value={reportData.totalExpenses}
                prefix="₹"
                icon={<FaWallet />}
                color="from-red-500 to-rose-600"
              />
              <SummaryCard
                title="Net Balance"
                value={reportData.netBalance}
                prefix="₹"
                icon={<FaBalanceScale />}
                color={
                  reportData.netBalance >= 0
                    ? "from-teal-400 to-emerald-600"
                    : "from-red-400 to-rose-600"
                }
              />
              <SummaryCard
                title="Activities"
                value={reportData.totalActivities}
                icon={<FaCalendarAlt />}
                color="from-purple-500 to-violet-600"
              />
            </motion.div>

            {/* ── Charts Row ──────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              {/* Line Chart: Monthly Collection */}
              <GlassSection title="Monthly Collection" icon={<FaArrowUp />}>
                <div className="h-72">
                  {lineData ? (
                    <Line data={lineData} options={lineOptions} />
                  ) : (
                    <p className="text-gray-500 text-center py-16">No collection data</p>
                  )}
                </div>
              </GlassSection>

              {/* Bar Chart: Income vs Expense */}
              <GlassSection title="Income vs Expense" icon={<FaBalanceScale />}>
                <div className="h-72">
                  {incomeExpenseData ? (
                    <Bar data={incomeExpenseData} options={barOptions} />
                  ) : (
                    <p className="text-gray-500 text-center py-16">No financial data</p>
                  )}
                </div>
              </GlassSection>
            </div>

            {/* ── Charts Row 2 ────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Pie Chart: Expense Category */}
              <GlassSection title="Expense Categories" icon={<FaWallet />}>
                <div className="h-72 flex items-center justify-center">
                  {expensePieData ? (
                    <Pie data={expensePieData} options={pieOptions} />
                  ) : (
                    <p className="text-gray-500 text-center">No expense data</p>
                  )}
                </div>
              </GlassSection>

            </div>

            {/* ── Tables Section ──────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              {/* Top 10 Sponsors */}
              <GlassSection title="Top 10 Sponsors" icon={<FaTrophy />}>
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={sponsorSearch}
                    onChange={(e) => setSponsorSearch(e.target.value)}
                    placeholder="Search sponsors..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400 border-b border-white/10 sticky top-0 bg-[#111827]">
                      <tr>
                        <th className="text-left py-3 font-medium">#</th>
                        <th className="text-left py-3 font-medium">Name</th>
                        <th className="text-right py-3 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSponsors.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-8 text-gray-500">
                            No sponsors found
                          </td>
                        </tr>
                      ) : (
                        filteredSponsors.map((s, i) => (
                          <tr key={s._id || i} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="py-3 text-gray-400">{i + 1}</td>
                            <td className="py-3 font-medium text-white">
                              <span className="flex items-center gap-2">
                                {s.sponsorName}
                                <span className="text-xs text-gray-500">{s.phone}</span>
                              </span>
                            </td>
                            <td className="py-3 text-right text-green-400 font-semibold">
                              {formatCurrency(s.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassSection>

              {/* Latest Payments */}
              <GlassSection title="Latest Payments" icon={<FaMoneyBillWave />}>
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    placeholder="Search payments..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400 border-b border-white/10 sticky top-0 bg-[#111827]">
                      <tr>
                        <th className="text-left py-3 font-medium">Receipt No.</th>                         <th className="text-left py-3 font-medium">Person</th>
                        <th className="text-right py-3 font-medium">Amount</th>
                        <th className="text-left py-3 font-medium">Method</th>
                        <th className="text-left py-3 font-medium">Txn ID</th>
                        <th className="text-left py-3 font-medium">Status</th>
                        <th className="text-left py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-gray-500">
                            No payments found
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((p, i) => {
                          const method = p.paymentMethod || p.mode || "Cash";
                          const status = p.status || "Pending";
                          return (
                            <tr key={p._id || i} className="border-b border-white/5 hover:bg-white/5 transition">
                              <td className="py-3 font-medium text-amber-400">
                                {p.receiptNumber || "-"}
                              </td>
                              <td className="py-3 font-medium text-white">
                                <span className="flex flex-col">
                                  {p.payerName || p.memberName || "-"}
                                  {p.phone && (
                                    <span className="text-xs text-gray-500">{p.phone}</span>
                                  )}
                                </span>
                              </td>
                              <td className="py-3 text-right text-green-400 font-semibold">
                                {formatCurrency(p.amount)}
                              </td>
                              <td className="py-3">
                                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-semibold">
                                  {method}
                                </span>
                              </td>
                              <td className="py-3 text-gray-400">{p.transactionId || "-"}</td>
                              <td className="py-3">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    status === "Paid"
                                      ? "bg-green-500/15 text-green-400"
                                      : "bg-red-500/15 text-red-400"
                                  }`}
                                >
                                  {status}
                                </span>
                              </td>
                              <td className="py-3 text-gray-400">{formatDate(p.date || p.paymentDate)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Payment summary footer */}
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-white/10 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    Total Collection:
                    <span className="font-bold text-green-400">
                      {formatCurrency(reportData?.totalCollection)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    Total Transactions:
                    <span className="font-bold text-amber-400">
                      {reportData?.totalTransactions ?? filteredPayments.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    Pending Amount:
                    <span className="font-bold text-red-400">
                      {formatCurrency(reportData?.pendingAmount)}
                    </span>
                  </div>
                </div>
              </GlassSection>
            </div>

            {/* ── Tables Section 2 ────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              {/* Latest Expenses */}
              <GlassSection title="Latest Expenses" icon={<FaArrowDown />}>
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    placeholder="Search expenses..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400 border-b border-white/10 sticky top-0 bg-[#111827]">
                      <tr>
                        <th className="text-left py-3 font-medium">Title</th>
                        <th className="text-left py-3 font-medium">Category</th>
                        <th className="text-right py-3 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-8 text-gray-500">
                            No expenses found
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((e, i) => (
                          <tr key={e._id || i} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="py-3 font-medium text-white">{e.title}</td>
                            <td className="py-3">
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-semibold">
                                {e.category || "Others"}
                              </span>
                            </td>
                            <td className="py-3 text-right text-red-400 font-semibold">
                              {formatCurrency(e.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassSection>

              {/* Recent Payers */}
              <GlassSection title="Recent Payers" icon={<FaUsers />}>
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search payers..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-400 border-b border-white/10 sticky top-0 bg-[#111827]">
                      <tr>
                        <th className="text-left py-3 font-medium">Name</th>
                        <th className="text-right py-3 font-medium">Amount</th>
                        <th className="text-left py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-8 text-gray-500">
                            No payers found
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((m, i) => (
                          <tr key={m._id || i} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="py-3 font-medium text-white">
                              <span className="flex items-center gap-2">
                                {m.name}
                                <span className="text-xs text-gray-500">{m.phone}</span>
                              </span>
                            </td>
                            <td className="py-3 text-right text-green-400 font-semibold">
                              {formatCurrency(m.amount)}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  m.status === "Paid"
                                    ? "bg-green-500/15 text-green-400"
                                    : "bg-red-500/15 text-red-400"
                                }`}
                              >
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassSection>
            </div>

            {/* ── Footer ──────────────────────────────────────── */}
            <motion.div variants={itemVariants} className="text-center py-6 border-t border-white/10">
              <p className="text-sm text-gray-400">
                🕉️ <span className="text-amber-400 font-semibold">Shree Vinayaka Geleyara Balaga</span> · Ganapathi Utsav 2026
              </p>
              <p className="text-xs text-gray-600 mt-1">
                © {new Date().getFullYear()} All rights reserved
              </p>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}

