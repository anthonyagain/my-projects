import cauldron from '../assets/cauldron.svg';

export function MeldChatLogo() {
  return (
    <div className="mx-6 flex items-center fixed top-0 left-0 m-4">
      <a href="/">
        <div className="meldchat-logo flex flex-row justify-center items-center">
          {/* prevent the logo from shrinking on screens below 380px width */}
          <div style={{ minWidth: '40px' }}>
            <img
              style={{ width: '40px' }}
              className="mr-2.5"
              src={cauldron}
              alt="MeldChat Logo Icon"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex flex-row items-end">
              <p className="text-xl text-zinc-200 font-bold whitespace-nowrap leading-5">
                MeldChat
              </p>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}
