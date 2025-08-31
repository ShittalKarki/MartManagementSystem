import { Bell, Camera, ShieldCheck, SlidersHorizontal, Upload } from 'lucide-react';
import { ChangeEvent, useMemo, useState } from 'react';
import { SectionPage } from '../components/SectionPage';

export function SettingsPage() {
  const [screenshots, setScreenshots] = useState<Array<{ name: string; url: string }>>([]);
  const [compactMode, setCompactMode] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const screenshotCount = useMemo(() => screenshots.length, [screenshots]);

  const handleScreenshotUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    setScreenshots((current) => [
      ...files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
      ...current,
    ]);

    event.target.value = '';
  };

  return (
    <SectionPage
      kicker="Settings"
      title="Application Settings"
      description="Adjust the workspace, capture screenshots, and keep reporting preferences ready for class demos or submissions."
    >
      <section className="settings-grid">
        <article className="panel settings-card">
          <div className="panel-header">
            <div>
              <h2>Workspace Preferences</h2>
              <p>Control the look and behavior of the dashboard.</p>
            </div>
            <SlidersHorizontal size={18} />
          </div>
          <div className="settings-list">
            <label className="settings-toggle">
              <div>
                <strong>Compact mode</strong>
                <span>Tighten spacing on tables and cards for quicker reviews.</span>
              </div>
              <input type="checkbox" checked={compactMode} onChange={(event) => setCompactMode(event.target.checked)} />
            </label>
            <label className="settings-toggle">
              <div>
                <strong>Email alerts</strong>
                <span>Receive notices when stock, orders, or reports change.</span>
              </div>
              <input type="checkbox" checked={emailAlerts} onChange={(event) => setEmailAlerts(event.target.checked)} />
            </label>
            <label className="settings-toggle">
              <div>
                <strong>Auto refresh</strong>
                <span>Reload summary cards when you come back to the tab.</span>
              </div>
              <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
            </label>
          </div>
        </article>

        <article className="panel settings-card">
          <div className="panel-header">
            <div>
              <h2>Activity & Security</h2>
              <p>Quick reminders for admin workflow.</p>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="settings-list">
            <div className="settings-note">
              <Bell size={16} />
              <div>
                <strong>Audit log review</strong>
                <span>Check Activity Logs after creating products, suppliers, or purchases.</span>
              </div>
            </div>
            <div className="settings-note">
              <Camera size={16} />
              <div>
                <strong>Screenshot evidence</strong>
                <span>Upload screenshots here before submitting reports or assignments.</span>
              </div>
            </div>
          </div>
        </article>

        <article className="panel settings-card settings-span-2">
          <div className="panel-header">
            <div>
              <h2>Screenshot Inbox</h2>
              <p>{screenshotCount} uploaded image{screenshotCount === 1 ? '' : 's'}</p>
            </div>
            <label className="ghost-btn settings-upload-btn">
              <Upload size={16} /> Upload screenshots
              <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} className="screen-reader-input" />
            </label>
          </div>

          {screenshots.length ? (
            <div className="screenshot-grid">
              {screenshots.map((item) => (
                <figure key={`${item.name}-${item.url}`} className="screenshot-card">
                  <img src={item.url} alt={item.name} />
                  <figcaption>{item.name}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="screenshot-empty">
              <Upload size={20} />
              <div>
                <strong>No screenshots uploaded yet</strong>
                <span>Add report images, UI captures, or evidence screenshots here.</span>
              </div>
            </div>
          )}
        </article>
      </section>
    </SectionPage>
  );
}
