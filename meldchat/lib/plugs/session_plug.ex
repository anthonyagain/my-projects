defmodule MeldChatWeb.SessionPlug do
  import Plug.Conn
  alias MeldChat.SessionManager

  @max_age 31_968_000  # 370 days in seconds (370 * 24 * 60 * 60)
  @session_cookie "_meldchat_session"

  def init(opts), do: opts

  def call(conn, _opts) do
    case get_session_id(conn) do
      nil -> create_session(conn)
      session_id -> load_session(conn, session_id)
    end
  end

  defp get_session_id(conn) do
    case get_req_header(conn, "cookie") |> List.first() do
      nil -> nil
      cookie_header ->
        Plug.Conn.Cookies.decode(cookie_header)
        |> Map.get(@session_cookie)
    end
  end


  defp create_session(conn) do
    session = SessionManager.create_session()
    conn
      |> put_resp_cookie(@session_cookie, session.session_id, max_age: @max_age, http_only: true)
      |> assign(:session, session)
  end

  defp load_session(conn, session_id) do
    case SessionManager.get_session(session_id) do
      {:ok, session} ->
        assign(conn, :session, session)
      {:error, _reason} ->
        create_session(conn)
    end
  end
end
