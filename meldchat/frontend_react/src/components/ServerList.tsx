import { NavLink } from "react-router-dom";

import { colors } from '../components';

import chatIcon from '../assets/heroicons/chat-white.svg';
import serverIcon from '../assets/sample/server-icon.png';



const tempServer = {
  id: 1,
  icon: serverIcon,
  name: "Primaldex Chat"
};

const servers = [
  { ...tempServer, id: 1 },
  // { ...tempServer, id: 2 },
  // { ...tempServer, id: 3 },
  // { ...tempServer, id: 4 },
  // { ...tempServer, id: 5 },
];

export function ServerList() {
  return (
    <div style={{ backgroundColor: colors.serverSidebarBG }} className="w-[72px] h-full flex flex-col items-center">
      <NavLink
        to="/app/chats"
        className={({ isActive }) => `
          cursor-pointer flex justify-center items-center rounded-lg w-[48px] h-[48px] mt-2
        `}
        style={({ isActive }) => {
          return { backgroundColor: isActive ? colors.openAllChatsActive : colors.openAllChatsBtn };
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = colors.openAllChatsHover;
        }}
        onMouseOut={(e) => {
          // reset to proper active color or not
          if (e.target.classList.contains('active')) {
            e.currentTarget.style.backgroundColor = colors.openAllChatsActive;
          } else {
            e.currentTarget.style.backgroundColor = colors.openAllChatsBtn;
          }
        }}
      >
        <img
          style={{ width: '32px' }}
          src={chatIcon}
          alt="Chat Icon"
        />
      </NavLink>
      <div style={{ backgroundColor: colors.serverSidebarLineAboveServerList }} className="h-[2px] w-8 my-3"></div>
      {/* TODO, add an animation on server hover */}
      {servers.map((server) => (
        <NavLink
          to={`/app/servers/${server.id}`}
          key={server.id}
          className={({ isActive }) => `
            cursor-pointer flex justify-center items-center rounded-full w-[48px] h-[48px] mb-2 overflow-hidden
          `}
        >
          <img
            style={{ width: '48px' }}
            className="w-full h-full"
            src={server.icon}
            alt={`${server.name} Server Icon`}
          />
        </NavLink>
      ))}
    </div>
  );
}
