import { NavLink, Link } from "react-router-dom";
import { useState } from 'react';

import { useParams } from 'react-router-dom';

import { colors, ProfileStatusWithSettings, ProfileStatusFriendRequest, LeftArrow, ServerList, ChatSection, MessageHistory } from '../components';

import profileImage1 from '../assets/sample/profile-image-3.jpg';

import addFriendIcon from '../assets/material-icons/add-friend.svg';
import addFriendIconWhite from '../assets/material-icons/add-friend-white.svg';
import exit_icon from '../assets/heroicons/exit.svg';

import green_checkmark_yes from '../assets/heroicons/checkmark-green-circle-yes.svg';
import x_grey_no from '../assets/heroicons/x-grey-circle-no.svg';

const tempDM = {
  id: 1,
  profileImage: profileImage1,
  displayName: "",
  username: ""
};

const pendingRequests = [
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
  tempDM,
]

const openDMs = [
  { ...tempDM, id: 1 },
  { ...tempDM, id: 2 },
  { ...tempDM, id: 3 },
  { ...tempDM, id: 4 },
  { ...tempDM, id: 5 }
];

const hasPendingFriendRequests = true;

function BeginningOfMessageHistory() {
  return (
    <div className="flex flex-col">
      <div className="rounded-full overflow-hidden h-[80px] w-[80px]">
        <img src={tempDM.profileImage} />
      </div>
      <p className="text-3xl font-bold my-2">{tempDM.displayName}</p>
      <p className="text-xl mb-2">{tempDM.username}</p>
      <p className="text-sm">This is the beginning of your direct message history with <span className="font-semibold">{tempDM.displayName}</span>.</p>
    </div>
  );
}

function AddFriendsButtonContent({ iconWhite=false }) {
  return (
    <>
        <div id="dms-friends-button-image-wrapper" className="w-8 h-8 mr-1 p-0.5 flex flex-row items-center justify-center">
        { !iconWhite && <img className="" src={addFriendIcon} /> }
        { iconWhite && <img className="" src={addFriendIconWhite} /> }
      </div>
      <p className="my-auto">Add friends</p>
    </>
  );
}

function DirectMessagesList() {
  return (
    <div id="direct-messages-list" style={{ backgroundColor: colors.directMessagesBG }} className="w-[240px] h-full flex flex-col">
      {/* TODO: search dms */}
      {/* friends button */}
      <NavLink
        id="dms-friends-button"
        style={{ color: colors.friendsButtonText, backgroundColor: colors.friendsButtonBG }}
        className="m-2 rounded mx-2 py-1 flex flex-row justify-center"
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = colors.friendsButtonHover;
          e.currentTarget.style.backgroundColor = colors.friendsButtonHover;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = colors.friendsButtonBG;
        }}
        to="/app/friends/"
      >
        <AddFriendsButtonContent />
      </NavLink>
      {/* messages list section */}
      <div className="flex-1 flex flex-col overflow-y-auto mt-0">
        <p style={{ color: colors.directMessagesTitleText }} className="mx-4 text-sm mb-2">Direct Messages</p>
        {openDMs.map((channel, i) => (
          <NavLink
            to={`/app/chats/${channel.id}`}
            key={i}
            className={`cursor-pointer flex flex-row items-center rounded h-[42px] mb-1 mx-2 p-2`}
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
            <div className="rounded-full overflow-hidden h-[32px] w-[32px] mr-2">
              <img src={channel.profileImage} />
            </div>
            <p className="text-[15px]">{channel.displayName}</p>
          </NavLink>
        ))}
      </div>
      {/* profile data section */}
      <div style={{ backgroundColor: colors.directMessagesSettingsBG }} className="px-2 h-[52px]">
        <ProfileStatusWithSettings />
      </div>
    </div>
  );
}

function OtherUserProfileSection() {
  return (
    <div id="other-user-profile-section" style={{ backgroundColor: colors.serverMembersListBG }} className="w-[380px] flex flex-col px-4 pt-4">
      <div className="rounded-full overflow-hidden h-[80px] w-[80px] mt-2">
        <img src={tempDM.profileImage} />
      </div>
      <p className="text-3xl font-bold mt-2">{tempDM.displayName}</p>
      <p className="text-xl mb-2">{tempDM.username}</p>
      <div className="rounded p-3 mt-0.5" style={{ backgroundColor: colors.directMessagesExtraProfileMemberSinceBG }}>
        <p className="text-xs mb-1 font-semibold">Member Since</p>
        <p className="text-[13px]">Jul 13, 2022</p>
      </div>
    </div>
  );
}

function DirectMessagesChatArea() {
  return (
    <div className="flex flex-row">
      <ChatSection sendTo={`@${tempDM.username}`}>
        <BeginningOfMessageHistory />
        <MessageHistory />
      </ChatSection>
      <OtherUserProfileSection />
    </div>
  );
}

/* later, add a button here to view friends list? or make
friends list the primary view, and add button to add by username? */
function DirectMessagesFriendsArea() {

  const [hidePendingFriendRequestsWindow, setHidePendingFriendRequestsWindow] = useState(false);

  return (
    <div style={{ maxWidth: '600px' }} className="w-full py-4 px-6 mt-6 mx-auto">
      {hasPendingFriendRequests && !hidePendingFriendRequestsWindow && (
        <div style={{ backgroundColor: colors.friendsPagePendingRequestsBG }} className="rounded-lg p-4 mb-8 shadow-md relative">
          {/* close button for pending friend requests window */}
          <div
            onClick={() => setHidePendingFriendRequestsWindow(true)}
            className="absolute top-2 right-2 w-8 h-8 flex justify-center items-center cursor-pointer hover:brightness-125 z-10"
          >
            <img src={exit_icon} />
          </div>
          <div className="mb-2">
            {/* mr-6 here to prevent the title from overlapping with x button on mobile */}
            <p className="text-xl font-semibold mb-4 mr-6">Received Friend Requests</p>
            <div className="rounded overflow-y-scroll max-h-64 meldchat-scrollbar">
              {pendingRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between mb-1.5 rounded p-0.5 hover:brightness-110"
                    style={{ backgroundColor: colors.directMessagesSettingsBG }}>
                  <div className="flex-grow">
                    <ProfileStatusFriendRequest />
                  </div>
                  <div className="flex items-center space-x-2 px-3">
                    <button
                      className="w-8 h-8 hover:brightness-125"
                    >
                      <img src={x_grey_no} />
                    </button>
                    <button
                      className="w-8 h-8 hover:brightness-125"
                    >
                      <img src={green_checkmark_yes} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <p className="text-xl font-semibold mb-4">Add by Username</p>
      <p
        style={{ color: colors.friendsPageSmallertext }}
        className="mb-2 text-sm"
      >
        Who would you like to add as a friend?
      </p>
      <form className="w-full">
        <input
          type="text"
          style={{ backgroundColor: colors.friendsPageInputBG, color: colors.friendsPageInputText }}
          className="w-full py-2 px-3 rounded mb-1 focus:outline-none focus:ring-0"
          placeholder="Enter a username"
        />
        <p
          className="text-xs mb-4"
          style={{ color: colors.friendsPageSmallertext }}
        >
          By the way, your username is <span
            style={{ color: colors.friendsPageWhiteText }}
          >
            myusername
          </span>.
        </p>

        {/* Desktop button */}
        <button
          id="send-friend-request-button"
          type="submit"
          style={{ backgroundColor: colors.friendsPageSubmitBtn }}
          className="px-4 py-2 rounded mt-2"
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = colors.friendsPageSubmitBtnHover;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = colors.friendsPageSubmitBtn;
          }}
        >
          Send Friend Request
        </button>
      </form>
    </div>
  );
}


function DirectMessagesHeader() {
  return (
    <div className="w-full h-[48px] shadow-md">
      <div
        className={`
          cursor-pointer flex flex-row items-center rounded my-0.5 mx-1 p-2
        `}
      >
        <Link
          to="/app/chats/"
          id="mobile-close-chat-btn"
        >
          <LeftArrow />
        </Link>
        <div className="rounded-full overflow-hidden h-[32px] w-[32px] mr-2">
          <img src={tempDM.profileImage} />
        </div>
        <p>{tempDM.displayName}</p>
      </div>
    </div>
  );
}

function FriendsSectionHeader() {
  return (
    <div className="w-full h-[48px] shadow-md">
      <div
        className={`
          cursor-pointer flex flex-row items-center rounded my-0.5 mx-1 p-2
        `}
      >
        <Link
          to="/app/chats/"
          id="mobile-close-chat-btn"
        >
          <LeftArrow />
        </Link>
        <AddFriendsButtonContent iconWhite={true} />
      </div>
    </div>
  )
}

export function DirectMessagesFriendsSection() {
  return (
    <div className="flex flex-row h-full w-full">
      <ServerList />
      <DirectMessagesList />
      {/* main dms view area. */}
      <div
        style={{ backgroundColor: colors.chatContentsBG, color: colors.chatContentsText }}
        className={`friends-list flex flex-col`}
      >
        {/* top row with profile info and buttons */}
        <FriendsSectionHeader />
        {/* actual chat contents */}
        <DirectMessagesFriendsArea />
      </div>
    </div>
  );
}

export function DirectMessages() {

  const { privateChannelID } = useParams();

  // TODO, probably redirect here to the first channel ID if none is set

  console.log(privateChannelID)

  return (
    <div className="flex flex-row h-full w-full">
      <ServerList />
      <DirectMessagesList />
      {/* main dms view area. */}
      <div
        style={{ backgroundColor: colors.chatContentsBG, color: colors.chatContentsText }}
        className={`dms-main-view ${privateChannelID ? 'mobile-active' : ''} flex flex-col`}
      >
        {/* top row with profile info and buttons */}
        <DirectMessagesHeader />
        {/* actual chat contents */}
        <DirectMessagesChatArea />
      </div>
    </div>
  );
}
