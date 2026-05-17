import { buildSparklinePoints } from "./helpers";

function DashboardSparkline({ values }) {
  return (
    <svg className="dashboard-sparkline" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline className="dashboard-sparkline__line" points={buildSparklinePoints(values)} />
      {values.map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * 96 + 2;
        const y = 26 - ((value - 1) / 5) * 18;

        return <circle className="dashboard-sparkline__dot" cx={x} cy={y} key={`${index}-${value}`} r="1.9" />;
      })}
    </svg>
  );
}

export default DashboardSparkline;
