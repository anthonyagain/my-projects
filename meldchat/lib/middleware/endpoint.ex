defmodule MeldChatWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :meldchat

  # The session will be stored in the cookie and signed,
  # this means its contents can be read but not tampered with.
  # Set :encryption_salt if you would also like to encrypt it.
  @session_options [
    store: :cookie,
    key: "_meldchat_key",
    signing_salt: "J+I4n3Fx",
    same_site: "Lax"
  ]

  socket "/user-socket", MeldChatWeb.UserSocket,
    websocket: true,
    longpoll: false




  if Mix.env() == :dev do
    plug :cors
  end

  def cors(conn, _opts) do
    conn
    |> put_resp_header("access-control-allow-origin", "http://127.0.0.1:5173")
    |> put_resp_header("access-control-allow-methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
    |> put_resp_header("access-control-allow-headers", "accept, content-type, authorization, x-csrftoken")
    |> put_resp_header("access-control-allow-credentials", "true")
    |> handle_options_request()
  end

  defp handle_options_request(%{method: "OPTIONS"} = conn) do
    conn
    |> send_resp(:no_content, "")
    |> halt()
  end
  defp handle_options_request(conn), do: conn


  # socket "/live", Phoenix.LiveView.Socket,
  #   websocket: [connect_info: [session: @session_options]],
  #   longpoll: [connect_info: [session: @session_options]]

  # Serve at "/" the static files from "priv/static" directory.
  #
  # You should set gzip to true if you are running phx.digest
  # when deploying your static files in production.
  plug Plug.Static,
    at: "/static/",
    from: :meldchat,
    gzip: false,
    only: MeldChatWeb.Utils.static_paths()

  # IO.inspect(MeldChatWeb.Utils.static_paths())

  # Code reloading can be explicitly enabled under the
  # :code_reloader configuration of your endpoint.
  if code_reloading? do
    socket "/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket
    plug Phoenix.LiveReloader
    plug Phoenix.CodeReloader
    plug Phoenix.Ecto.CheckRepoStatus, otp_app: :meldchat
  end

  plug Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options

  # if code_reloading? do
  #   plug Plug.Debugger
  # end

  plug MeldChatWeb.Router
end
