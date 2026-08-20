import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Doughnut } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function ExpenseChart() {
  const data = {
    labels: [],

    datasets: [
      {
        data: [],
        backgroundColor: [
          "#22c55e",
          "#3b82f6",
          "#f59e0b",
          "#ef4444",
        ],
      },
    ],
  };

  return <Doughnut data={data} />;
}
