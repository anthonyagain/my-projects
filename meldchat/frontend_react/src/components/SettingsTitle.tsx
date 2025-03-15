import { LeftArrow } from './LeftArrow';
import { colors } from './colors';

import { Link } from "react-router-dom";

/*
Simple utility component for us to re-use on settings pages, which contains the title
for the settings page, and if on mobile, a back button.
*/
export function SettingsTitle({ title }) {
  return (
    <div id="settings-page-title" className="mt-6 mb-2 relative">
      <Link
        to="/app/settings/"
        id="mobile-exit-settings-page-btn"
      >
        <LeftArrow />
      </Link>
      <p style={{ color: colors.settingsTabText }} className="text-lg font-semibold">{title}</p>
    </div>
  );
}
