import { colors } from '../components';

export function ChatSection({ children, sendTo }) {
  return (
    <div className="dms-chat-section w-full flex flex-col">
      <div className="w-full p-4 flex-1 flex flex-col justify-end">
        {/* chat history gets inserted here */}
        { children }
      </div>
      {/* send message section */}
      <div className="w-full px-3 pb-3">
        <input
          type="text"
          placeholder={`Message ${sendTo}`}
          className="h-[44px] w-full p-3 rounded-lg focus:outline-none text-sm"
          style={{ backgroundColor: colors.sendMessageChatboxBG }}
        />
      </div>
    </div>
  );
}
