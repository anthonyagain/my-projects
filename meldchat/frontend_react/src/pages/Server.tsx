import { NavLink, Link } from "react-router-dom";
import { useState, useEffect } from 'react';

import { useParams } from 'react-router-dom';

import { colors, ProfileStatusMember, ProfileStatusWithSettings, LeftArrow, ServerList, ChatSection, MessageHistory } from '../components';
import { useTemporaryAlert } from '../hooks';

import hashtagIconGrey from '../assets/material-icons/hashtag-grey.svg';
import hashtagIconFaded from '../assets/material-icons/hashtag-faded.svg';
import audioIcon from '../assets/heroicons/audio.svg';
import addFriendIcon from '../assets/material-icons/add-friend.svg';

import profileImage1 from '../assets/sample/profile-image-3.jpg';

const tempUser = {
  id: 1,
  profileImage: profileImage1,
  displayName: "",
  username: ""
};

const onlineUsers = [
  { ...tempUser, id: 1 },
];
const offlineUsers = [
  { ...tempUser, id: 1 },
  { ...tempUser, id: 2 },
  { ...tempUser, id: 3 },
];


const textChannels = [
  { id: 1, name: 'text-channel-1' },
  { id: 2, name: 'text-channel-2' },
  { id: 3, name: 'text-channel-3' },
];

const audioChannels = [
  { id: 1, name: 'audio-chat-1' },
  { id: 2, name: 'audio-chat-2' },
]

function BeginningOfChannelHistory({ channel }) {
  return (
    <div className="flex flex-col mb-4">
      <div style={{ backgroundColor: colors.serverHashIconBG }} className="rounded-full overflow-hidden h-[60px] w-[60px] mb-2 p-2">
        <img className="w-full h-full" src={hashtagIconGrey} />
      </div>
      <p className="text-3xl font-bold my-2">Welcome to #{channel.name}</p>
      <p className="text-sm">This is the start of the #{channel.name} channel.</p>
    </div>
  );
}


function ChannelsList({ activeServerID, activeChannelID }) {
  const serverName = "Anthony's Server";

  const { isAlertOpen, fadeOut, showAlert } = useTemporaryAlert();

  return (
    <div
      id="direct-messages-list"
      style={{ backgroundColor: colors.directMessagesBG }}
      className="w-[240px] h-full flex flex-col relative"
    >
      {/* alert for having copied invite link to clipboard */}
      {isAlertOpen && (
        <div
          className={`absolute top-16 left-1/2 transform -translate-x-1/2 text-white px-4 py-2 rounded-md shadow-lg z-50 text-center text-nowrap ${
            fadeOut ? 'animate-fade-out' : ''
          }`}
          style={{ backgroundColor: colors.serverInviteBtnAlertBG }}
        >
          Invite link copied!
        </div>
      )}
      {/* TODO: search dms */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex flex-row justify-between items-center">
          <p style={{ color: colors.directMessagesTitleText }} className="ml-4 my-4">{serverName}</p>
          <button
            style={{ backgroundColor: colors.serverHeaderInviteBtnBG }}
            className="w-9 h-9 flex items-center justify-center mr-3 rounded-full hover:brightness-125 transition-opacity"
            onClick={() => {
              // copy invite link to clipboard, then show alert saying its been copied
              const serverId = "ABC123";
              const inviteLink = `test/${serverId}`;
              navigator.clipboard.writeText(inviteLink).then(() => {
                showAlert();
              });
            }}
          >
            <img className="w-5 h-5" src={addFriendIcon} alt="Add friend" />
          </button>
        </div>
        <p style={{ color: colors.directMessagesTitleText }} className="mt-4 ml-4 text-[13px]">Text Channels</p>
        <div className="mb-2">
          {textChannels.map((channel, i) => (
            <NavLink
              to={`/app/servers/${activeServerID}/channels/${channel.id}`}
              key={i}
              className={`cursor-pointer flex flex-row items-center rounded h-[36px] mx-1 px-2`}
              style={({ isActive }) => {
                return {
                  backgroundColor: isActive ? colors.openSpecificChatActive : colors.openSpecificChatBtn ,
                  color: isActive ? colors.openSpecificChatTextActive : colors.openSpecificChatText
                };
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = colors.openSpecificChatHover;
                e.currentTarget.style.color = colors.openSpecificChatTextHover;
              }}
              onMouseOut={(e) => {
                // reset to proper active color or not
                if (e.target.classList.contains('active')) {
                  e.currentTarget.style.backgroundColor = colors.openSpecificChatActive;
                  e.currentTarget.style.color = colors.openSpecificChatTextActive;
                } else {
                  e.currentTarget.style.backgroundColor = colors.openSpecificChatBtn;
                  e.currentTarget.style.color = colors.openSpecificChatText;
                }
              }}
            >
              <div className="rounded-full overflow-hidden h-[20px] w-[20px] mr-2">
                <img className="w-full h-full" src={hashtagIconFaded} />
              </div>
              <p className="text-sm">{channel.name}</p>
            </NavLink>
          ))}
        </div>
        <p style={{ color: colors.directMessagesTitleText }} className="mt-4 ml-4 text-[13px]">Voice Channels</p>
        <div className="mb-2">
          {audioChannels.map((channel, i) => (
            <div
              key={i}
              className={`cursor-pointer flex flex-row items-center rounded h-[36px] mx-1 px-2`}
              style={{
                  backgroundColor: false ? colors.openSpecificChatActive : colors.openSpecificChatBtn ,
                  color: false ? colors.openSpecificChatTextActive : colors.openSpecificChatText
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = colors.openSpecificChatHover;
                e.currentTarget.style.color = colors.openSpecificChatTextHover;
              }}
              onMouseOut={(e) => {
                // reset to proper active color or not
                if (e.target.classList.contains('active')) {
                  e.currentTarget.style.backgroundColor = colors.openSpecificChatActive;
                  e.currentTarget.style.color = colors.openSpecificChatTextActive;
                } else {
                  e.currentTarget.style.backgroundColor = colors.openSpecificChatBtn;
                  e.currentTarget.style.color = colors.openSpecificChatText;
                }
              }}
            >
              <div className="rounded-full overflow-hidden h-[20px] w-[20px] mr-2">
                <img className="w-full h-full" src={audioIcon} />
              </div>
              <p className="text-sm">{channel.name}</p>
            </div>
          ))}
        </div>
      </div>
      {/* profile data section */}
      <div style={{ backgroundColor: colors.directMessagesSettingsBG }} className="px-2 h-[52px]">
        <ProfileStatusWithSettings />
      </div>
    </div>
  );
}

function ChannelMembersSection() {
  return (
    <div id="channel-members-list-section" style={{ backgroundColor: colors.serverMembersListBG }} className="w-[280px] flex flex-col px-2 pt-6">
      <p style={{ color: colors.serverMembersListText }} className="text-sm mb-1 px-2">Online - {onlineUsers.length}</p>
      {onlineUsers.map(user => <ProfileStatusMember key={user.id}  />)}
      <p style={{ color: colors.serverMembersListText }} className="text-sm mt-4 mb-1 px-2">Offline - {offlineUsers.length}</p>
      {offlineUsers.map(user => <ProfileStatusMember key={user.id} />)}
    </div>
  );
}


export function Server() {

  const { serverID, channelID } = useParams();

  const channel = textChannels[0];
  console.log({channel})

  return (
    <div className="flex flex-row h-full w-full">
      <ServerList />
      <ChannelsList activeServerID={serverID} activeChannelID={channelID} />
      {/* main dms view area */}
      <div style={{ backgroundColor: colors.chatContentsBG, color: colors.chatContentsText }} className={`dms-main-view ${channelID ? 'mobile-active' : ''} flex flex-col`}>
        {/* top row with profile info and buttons */}
        <div className="w-full h-[48px] shadow-md">
          <div
            className={`
              cursor-pointer flex flex-row items-center rounded mb-1 mx-1 p-2
            `}
          >
            <Link
              to={`/app/servers/${serverID}`}
              id="mobile-close-chat-btn"
            >
              <LeftArrow />
            </Link>
            <div className="rounded-full overflow-hidden h-[32px] w-[32px] mr-2 p-1">
              <img className="w-full h-full" src={hashtagIconGrey} />
            </div>
            <p>{channel.name}</p>
          </div>
        </div>
        <div className="flex flex-row">
          <ChatSection sendTo={`#${channel.name}`}>
            <BeginningOfChannelHistory channel={channel} />
            <MessageHistory />
          </ChatSection>
          <ChannelMembersSection />
        </div>
      </div>
    </div>
  );
}
