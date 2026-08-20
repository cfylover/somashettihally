import { motion } from "framer-motion";

export default function DashboardCard({
  title,
  value,
  icon,
  color,
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      className={`rounded-3xl p-6 shadow-xl text-white ${color}`}
    >
      <div className="flex justify-between items-center">

        <div>

          <p className="text-lg opacity-90">
            {title}
          </p>

          <h2 className="text-4xl font-bold mt-3">
            {value}
          </h2>

        </div>

        <div className="text-6xl opacity-80">
          {icon}
        </div>

      </div>
    </motion.div>
  );
}