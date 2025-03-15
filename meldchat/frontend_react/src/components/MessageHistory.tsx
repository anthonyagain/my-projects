import profileImage2 from '../assets/sample/profile-image-2.webp';

import { colors } from './colors';

const chatHistory = [
  {
    profileImage: profileImage2,
    displayName: "leniG",
    userID: 100,
    chatID: "dm_1",
    datetime: "2025-01-24T11:22:12",
    message: "Hey guys, how are you liking the server interface so far?"
  },
];

export function MessageHistory() {
  return (
    <div className="mt-6">
      {chatHistory.map((chat, index) => (
        <div key={index} className={`flex gap-3 ${index !== chatHistory.length - 1 ? 'mb-4' : 'mb-2' }`}>
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img src={chat.profileImage} alt={chat.displayName} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{chat.displayName}</span>
              <span style={{ color: colors.chatMessageDatetime }} className="text-xs">
                {new Date(chat.datetime).toLocaleDateString('en-US', {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric'
                })} {new Date(chat.datetime).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
            <p className="text-sm mt-1">{chat.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
