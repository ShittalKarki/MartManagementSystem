import { Camera, Download, FileImage, LineChart, TrendingDown, TrendingUp } from 'lucide-react';
import { ChangeEvent, useEffect, useState } from 'react';
import api, { getReportsSummary } from '../services/api';
import { SectionPage } from '../components/SectionPage';

export function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [reportShots, setReportShots] = useState<Array<{ name: string; url: string }>>([]);

  useEffect(() => {
    getReportsSummary().then(setSummary);
  }, []);

  const handleReportShotUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    setReportShots((current) => [
      ...files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
      ...current,
    ]);

    event.target.value = '';
  };

  const exportSalesCsv = async () => {
    const response = await api.get('/reports/sales/csv', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sales-report.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SectionPage
      kicker="Analytics"
      title="Reports"
      description="Sales, purchases, stock, and export summaries for coursework and day-to-day reporting."
      actions={
        <div className="form-actions">
          <label className="ghost-btn settings-upload-btn">
            <Camera size={16} /> Add screenshot
            <input type="file" accept="image/*" multiple onChange={handleReportShotUpload} className="screen-reader-input" />
          </label>
          <button className="primary-btn" onClick={exportSalesCsv}><Download size={16} /> Export Sales CSV</button>
        </div>
      }
    >
      <section className="kpi-grid">
        <article className="kpi-card tone-blue"><div className="kpi-icon"><LineChart size={20} /></div><div><span>Total Sales</span><strong>{summary?.totalSales ?? 0}</strong></div></article>
        <article className="kpi-card tone-green"><div className="kpi-icon"><TrendingUp size={20} /></div><div><span>Total Purchases</span><strong>{summary?.totalPurchases ?? 0}</strong></div></article>
        <article className="kpi-card tone-amber"><div className="kpi-icon"><TrendingDown size={20} /></div><div><span>Low Stock</span><strong>{summary?.lowStockItems ?? 0}</strong></div></article>
      </section>

      <section className="dashboard-grid">
        <article className="panel panel-span-7">
          <div className="panel-header">
            <div>
              <h2>Report window</h2>
              <p>{summary ? `${summary.startDate} to ${summary.endDate}` : 'Loading report summary...'}</p>
            </div>
            <FileImage size={18} />
          </div>
          <p>Use the export action to download a CSV snapshot for sales reporting.</p>
          <div className="notification-card">
            <span className="dot blue" />
            <div>
              <strong>Screenshot-ready view</strong>
              <p>This panel is intentionally compact so you can capture it cleanly in screenshots.</p>
            </div>
          </div>
        </article>

        <article className="panel panel-span-5">
          <div className="panel-header">
            <div>
              <h2>Screenshot Gallery</h2>
              <p>Attach captured report images for documentation.</p>
            </div>
            <Camera size={18} />
          </div>
          {reportShots.length ? (
            <div className="screenshot-grid compact">
              {reportShots.map((item) => (
                <figure key={`${item.name}-${item.url}`} className="screenshot-card">
                  <img src={item.url} alt={item.name} />
                  <figcaption>{item.name}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="screenshot-empty">
              <Camera size={20} />
              <div>
                <strong>No report screenshots yet</strong>
                <span>Upload a screenshot after generating or exporting a report.</span>
              </div>
            </div>
          )}
        </article>
      </section>
    </SectionPage>
  );
}