defmodule MeldChatWeb.UserController do
  use MeldChatWeb.Utils, :controller
  alias MeldChat.UserManager
  alias MeldChat.SessionManager

  def get_profile(conn, _params) do
    user_id = conn.assigns.session.data["user_id"]
    profile = MeldChat.UserManager.get_user_profile(user_id)
    json(conn, %{profile: profile})
  end

  def create(conn, params) do
    case UserManager.create_user(params) do
      {:ok, user} ->
        # Update session with the new user_id
        session = conn.assigns.session
        updated_session = SessionManager.set_logged_in_user_id(session, user.id)

        conn
          |> assign(:session, updated_session)
          |> json(%{
            success: true,
            user: %{
              id: user.id,
              email: user.email,
              username: user.username,
              display_name: user.display_name
            }
          })

      {:error, changeset} ->
        conn
          |> put_status(400)
          |> json(%{
            success: false,
            errors: format_changeset_errors(changeset)
          })
    end
  end

  # Helper function to format changeset errors into a more user-friendly format
  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end


# does this get used anywhere, or can it be deleted?
# defmodule MeldChatWeb.UserJSON do
#   def error(%{errors: errors}) do
#     %{
#       success: false,
#       errors: errors
#     }
#   end

#   def success(%{user: user}) do
#     %{
#       success: true,
#       user: %{
#         id: user.id,
#         email: user.email,
#         username: user.username,
#         display_name: user.display_name
#       }
#     }
#   end
# end
