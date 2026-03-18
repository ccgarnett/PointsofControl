import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import { SkeletonPage } from './Skeleton';
import { useAuth } from '../context/AuthContext';
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

interface PurchaseAnalytic {
  _id: string;
  courseId: string;
  title: string;
  price: number;
  purchaseCount: number;
  totalRevenue: number;
}

interface ClickAnalytic {
  _id: string;
  courseId: string;
  title: string;
  enrollClicks: number;
  pageviews: number;
  conversionRate: number;
}

const AdminAnalytics: React.FC = () => {
  const { token } = useAuth();

  const [analytics, setAnalytics] = useState<CourseAnalytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [purchases, setPurchases] = useState<PurchaseAnalytic[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(true);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const [clicks, setClicks] = useState<ClickAnalytic[]>([]);
  const [clickLoading, setClickLoading] = useState(true);
  const [clickError, setClickError] = useState<string | null>(null);

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
    if (!token) return;
    fetch('/api/admin/analytics/purchases', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPurchases(data);
        } else {
          setPurchaseError('Unexpected response from server');
        }
        setPurchaseLoading(false);
      })
      .catch(() => {
        setPurchaseError('Failed to load purchase analytics');
        setPurchaseLoading(false);
      });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/analytics/clicks', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setClicks(data);
        } else {
          setClickError('Unexpected response from server');
        }
        setClickLoading(false);
      })
      .catch(() => {
        setClickError('Failed to load click analytics');
        setClickLoading(false);
      });
  }, [token]);

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

  const totalEnrollments = purchases.reduce((s, p) => s + p.purchaseCount, 0);
  const totalRevenue = purchases.reduce((s, p) => s + p.totalRevenue, 0);

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

        {/* ── Purchase Analytics ──────────────────────────────────────────── */}
        <div className="section-heading-row" style={{ marginTop: '2.5rem' }}>
          <h3 className="section-heading">Purchase Analytics</h3>
        </div>

        {purchaseLoading ? (
          <p className="muted">Loading purchase data…</p>
        ) : purchaseError ? (
          <p style={{ color: '#ef4444' }}>{purchaseError}</p>
        ) : (
          <>
            <div className="analytics-summary-row">
              <div className="analytics-summary-card">
                <div className="analytics-summary-value">{purchases.length}</div>
                <div className="analytics-summary-label">Courses</div>
              </div>
              <div className="analytics-summary-card">
                <div className="analytics-summary-value">{totalEnrollments}</div>
                <div className="analytics-summary-label">Total Enrollments</div>
              </div>
              <div className="analytics-summary-card">
                <div className="analytics-summary-value">${totalRevenue.toLocaleString()}</div>
                <div className="analytics-summary-label">Total Revenue</div>
              </div>
            </div>

            {purchases.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💳</div>
                <h3>No purchases yet</h3>
                <p>Enrollment data will appear here once users sign up for courses.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>ID</th>
                    <th>Price</th>
                    <th>Enrollments</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p._id}>
                      <td>{p.title}</td>
                      <td className="muted">{p.courseId}</td>
                      <td>${p.price.toLocaleString()}</td>
                      <td>{p.purchaseCount}</td>
                      <td style={{ color: '#22c55e', fontWeight: 600 }}>
                        ${p.totalRevenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
        {/* ── Click / Conversion Analytics ──────────────────────────────── */}
        <div className="section-heading-row" style={{ marginTop: '2.5rem' }}>
          <h3 className="section-heading">Enroll Click Analytics</h3>
        </div>

        {clickLoading ? (
          <p className="muted">Loading click data…</p>
        ) : clickError ? (
          <p style={{ color: '#ef4444' }}>{clickError}</p>
        ) : (
          <>
            {clicks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🖱️</div>
                <h3>No click data yet</h3>
                <p>Click and pageview events will appear here once users visit course pages.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Page Views</th>
                    <th>Enroll Clicks</th>
                    <th>Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {clicks.map((c) => (
                    <tr key={c._id}>
                      <td>{c.title}</td>
                      <td>{c.pageviews}</td>
                      <td>{c.enrollClicks}</td>
                      <td style={{ color: c.conversionRate >= 10 ? '#22c55e' : 'var(--accent)', fontWeight: 600 }}>
                        {c.conversionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminAnalytics;
