defmodule MeldChatWeb.UserPlug do
  import Plug.Conn
  alias MeldChat.UserManager

  def init(opts), do: opts

  def call(conn, _opts) do
    session = conn.assigns.session

    case session.data do
      %{"user_id" => user_id} ->
        case UserManager.get_user(user_id) do
          nil ->
            # User was deleted but session still exists
            assign(conn, :user, nil)

          user ->
            if UserManager.globally_banned?(user) do
              # User was banned since their last request
              assign(conn, :user, nil)
            else
              # Valid user found
              assign(conn, :user, user)
            end
        end

      _ ->
        # No user_id in session
        assign(conn, :user, nil)
    end
  end
end
