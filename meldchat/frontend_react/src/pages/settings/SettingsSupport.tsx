import { Link } from 'react-router-dom';

import { Settings } from './Settings';

import { colors, SettingsTitle } from '../../components';


export function SettingsSupport() {
  return (
    <Settings>
      <SettingsTitle title="Support" />
      <div style={{ color: colors.settingsTabTextContents }}>
        <div className="mt-6">
          <p>{'For support, '}
            <Link
              to="/app"
              style={{ color: colors.textLink }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = colors.textLinkHover;
              }}
              onMouseOut={(e) => {
                  e.currentTarget.style.color = colors.textLink;
              }}
            >
              send me a direct message.
            </Link>
          </p>
        </div>
      </div>
    </Settings>
  );
}
