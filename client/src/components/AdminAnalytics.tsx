import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import { SkeletonPage } from './Skeleton';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

interface CourseAnalytic {
  _id: string;
  courseId: string;
  title: string;
  totalModules: number;
  completedModules: number;
  completionRate: number;
}

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<CourseAnalytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    document.title = 'Points of Control — Analytics';
  }, []);

  useEffect(() => {
    fetch('/api/analytics/courses')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAnalytics(data);
        } else {
          setError('Unexpected response from server');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load analytics');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!analytics.length || !chartRef.current) return;

    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: analytics.map((a) => a.title),
        datasets: [
          {
            label: 'Completed Modules',
            data: analytics.map((a) => a.completedModules),
            backgroundColor: 'rgba(74, 144, 226, 0.8)',
          },
          {
            label: 'Total Modules',
            data: analytics.map((a) => a.totalModules),
            backgroundColor: 'rgba(200, 200, 200, 0.5)',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [analytics]);

  if (loading) return <SkeletonPage cards={2} />;
  if (error) return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content"><p>Error: {error}</p></main>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>Course Analytics</h2>
        </header>

        {analytics.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No course data yet</h3>
            <p>Analytics will appear here once courses have activity.</p>
          </div>
        ) : (
          <>
            <div className="analytics-chart-wrap">
              <canvas ref={chartRef} />
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>ID</th>
                  <th>Completed</th>
                  <th>Total</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((a) => (
                  <tr key={a._id}>
                    <td>{a.title}</td>
                    <td className="muted">{a.courseId}</td>
                    <td>{a.completedModules}</td>
                    <td>{a.totalModules}</td>
                    <td style={{ color: a.completionRate === 100 ? '#22c55e' : 'var(--accent)', fontWeight: 600 }}>
                      {a.completionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminAnalytics;
