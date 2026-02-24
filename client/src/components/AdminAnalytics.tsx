import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
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

  if (loading) return <div className="dashboard-layout">Loading...</div>;
  if (error) return <div className="dashboard-layout">Error: {error}</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1>Points Of Control</h1>
          <h2>Course Analytics</h2>
        </header>

        {analytics.length === 0 ? (
          <p>No course data yet.</p>
        ) : (
          <>
            <div style={{ maxWidth: 700, margin: '2rem 0' }}>
              <canvas ref={chartRef} />
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Course</th>
                  <th style={{ padding: '0.5rem' }}>ID</th>
                  <th style={{ padding: '0.5rem' }}>Completed</th>
                  <th style={{ padding: '0.5rem' }}>Total</th>
                  <th style={{ padding: '0.5rem' }}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((a) => (
                  <tr key={a._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.5rem' }}>{a.title}</td>
                    <td style={{ padding: '0.5rem', color: '#666' }}>{a.courseId}</td>
                    <td style={{ padding: '0.5rem' }}>{a.completedModules}</td>
                    <td style={{ padding: '0.5rem' }}>{a.totalModules}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: a.completionRate === 100 ? '#38a169' : '#4a90e2' }}>
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