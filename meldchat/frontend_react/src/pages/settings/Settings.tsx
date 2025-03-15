import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

import exit_icon from '../../assets/heroicons/exit.svg';

import { colors, Popup, LeftArrow } from '../../components';

function LogoutConfirmation({ setLogoutConfirmOpen }) {
  return (
    <Popup>
      <div style={{ color: colors.logoutConfirmWindowText }} className="flex flex-col rounded overflow-hidden w-80">
        <div style={{ backgroundColor: colors.logoutConfirmWindowTop }} className="flex flex-col p-4">
          <p className="text-xl font-bold mb-3">Logout</p>
          <p className="text-sm mb-4">Are you sure you want to logout?</p>
        </div>
        <div style={{ backgroundColor: colors.logoutConfirmWindowBottom }} className="flex flex-row p-4 justify-end items-center text-sm">
          <p className="hover:cursor-pointer hover:underline" onClick={() => setLogoutConfirmOpen(false)}>Cancel</p>
          <p
            style={{ backgroundColor: colors.logoutConfirmWindowBtn }}
            className="bg-red-600 py-2 px-4 rounded ml-6 hover:cursor-pointer"
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.logoutConfirmWindowBtnHover;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.logoutConfirmWindowBtn;
            }}
          >
            Logout
          </p>
        </div>
      </div>
    </Popup>
  )
}


function SettingsTabLink({ to, text }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        block rounded px-2 py-1.5 mr-2 mt-0.5 settings-tab-link ${isActive ? 'active' : ''}
      `}
      style={({ isActive }) => {
        return {
          backgroundColor: isActive ? colors.settingsTabActive : colors.settingsTabBtn,
          color: colors.settingsTabText
        };
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = colors.settingsTabHover;
      }}
      onMouseOut={(e) => {
        // reset to proper active color or not
        if (e.target.classList.contains('active')) {
          e.currentTarget.style.backgroundColor = colors.settingsTabActive;
        } else {
          e.currentTarget.style.backgroundColor = colors.settingsTabBtn;
        }
      }}
    >
      {text}
    </NavLink>
  );
}

function SettingsTabAction({ action, text }) {
  return (
    <div
      className="block rounded px-2 py-1.5 mr-2 mt-0.5 hover:cursor-pointer"
      onClick={(e) => action(e)}
      style={{ color: colors.settingsTabText }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = colors.settingsTabHover;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = colors.settingsTabBtn;
      }}
    >
      {text}
    </div>
  );
}


export function Settings({ children }) {

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => {
    navigate(location.state?.from || '/app');
  };

  const isRootSettings = location.pathname === '/app/settings/';

  return (
    <div className="flex flex-row h-full w-full">
      {logoutConfirmOpen && <LogoutConfirmation setLogoutConfirmOpen={setLogoutConfirmOpen} />}

      <div id="settings-left-whitespace" style={{ backgroundColor: colors.settingsNavbarBG }} className="flex-1">
      </div>
      {/* settings content */}
      <div id="settings-page-content" className="flex flex-row h-full">
        {/* left settings navbar */}
        <div id="settings-inner-navbar" style={{ backgroundColor: colors.settingsNavbarBG }} className="w-[192px] mx-auto">
          <div id="settings-navbar-title" className="w-full mt-8 ml-2 mb-2 relative flex flex-row items-center align-center">
            <div
              className="cursor-pointer"
              onClick={handleClose}
              id="mobile-exit-settings-btn"
            >
              <LeftArrow />
            </div>
            <p id="settings-navbar-title-text" style={{ color: colors.settingsTitleText }} className="text-sm">User Settings</p>
          </div>
          <SettingsTabLink to={"/app/settings/my-account/"} text="My Account" />
          <SettingsTabLink to={"/app/settings/support/"} text="Support" />
          <SettingsTabAction action={() => setLogoutConfirmOpen(true)} text="Logout" />
        </div>
        {/* settings inner-page content */}
        <div
          id="settings-inner-tab-content"
          style={{ backgroundColor: colors.settingsTabContentBG }}
          className={`w-[660px] mx-[40px] relative flex align-center ${isRootSettings ? '' : 'mobile-active'}`}
        >
          <div id="settings-content-wrapper" className="w-full h-full mx-auto pt-6 px-6">
            <div
              id="settings-exit-btn-desktop"
              onClick={handleClose}
              className="absolute top-8 right-0.5 w-12 h-12 flex flex-col items-center cursor-pointer hover:brightness-125 z-10"
            >
              <img src={exit_icon} />
              <p className="text-gray-400 text-sm">ESC</p>
            </div>
            { children }
          </div>
        </div>
      </div>
      <div id="settings-right-whitespace" style={{ backgroundColor: colors.settingsTabContentBG }} className="flex-1">
      </div>
    </div>
  );
}
