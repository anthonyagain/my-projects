import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import {
  NotFoundPage,
  Register,
  Login,
  DirectMessages,
  SettingsMyAccount,
  SettingsSupport,
  Server,
  DirectMessagesFriendsSection
} from "./pages";

import { AnimatePresence } from 'framer-motion';

import { useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from 'react-query';
import './services';

import './App.css';

function pageWithLayout(children: any) {
  return (
    <div className="h-full w-full">
      {children}
    </div>
  );
}

/* redirect to url with trailing slash if there isnt already one */
function TrailingSlashRedirect() {
  const location = useLocation();

  if (!location.pathname.endsWith('/')) {
    return <Navigate to={`${location.pathname}/${location.search}${location.hash}`} replace />;
  }

  return null;
}


// logged out? -> all /app pages redirect to /app/login
// logged in? -> /app/login and /app/register pages redirect to /app
//

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <TrailingSlashRedirect />
        <Routes>
          <Route path="/app">
            <Route index element={<Navigate to="chats" replace />} />
            {/* probably call it this? */}
            <Route path="friends" element={pageWithLayout(<DirectMessagesFriendsSection />)} />
            <Route path="chats/:privateChannelID?" element={pageWithLayout(<DirectMessages />)} />
            <Route path="servers/:serverID" element={pageWithLayout(<Server />)} />
            <Route path="servers/:serverID/channels/:channelID" element={pageWithLayout(<Server />)} />
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
            <Route path="settings">
              {/* have to render this here, instead of redirect, for mobile */}
              <Route index element={<SettingsMyAccount />} />
              <Route path="my-account" element={<SettingsMyAccount />} />
              <Route path="support" element={<SettingsSupport />} />
            </Route>
            {/* <Route path="/login" element={<Login />} /> */}
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
