import { Link } from "react-router-dom";

import { colors } from './colors';

import settingsIcon from '../assets/heroicons/settings.svg';
import profileImage2 from '../assets/sample/profile-image-2.webp';

const tempMyProfile = {
  id: 100,
  profileImage: profileImage2,
  displayName: "leniG",
  username: "_lenig"
};

function ProfileStatusShared({ children, textColor }) {
  return (
    <div style={{ color: textColor }} className="flex flex-row items-center h-full text-[16px]">
      <div className="rounded-full overflow-hidden h-[32px] w-[32px] mr-3">
        <img src={tempMyProfile.profileImage} />
      </div>
      <p>{tempMyProfile.displayName}</p>
      { children }
    </div>
  );
}

export function ProfileStatusWithSettings() {
  return (
    <ProfileStatusShared textColor={colors.directMessagesSettingsText}>
      <Link
        to="/app/settings"
        state={{ from: location.pathname }}
        className="ml-auto h-[32px] w-[32px] rounded hover:brightness-125 p-0.5"
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = colors.directMessagesSettingsHover;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '';
        }}
      >
        <img src={settingsIcon} />
      </Link>
    </ProfileStatusShared>
  );
}

export function ProfileStatusFriendRequest() {
  return (
    <div className="h-[40px] my-0.5 rounded px-2">
      <ProfileStatusShared textColor={colors.serverMembersListText} />
    </div>
  );
}

export function ProfileStatusMember() {
  return (
    <div
      className="h-[40px] my-0.5 rounded px-2 cursor-pointer"
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = colors.serverMembersListHover;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '';
      }}
    >
      <ProfileStatusShared textColor={colors.serverMembersListText} />
    </div>
  );
}
