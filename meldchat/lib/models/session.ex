defmodule MeldChat.Session do
  use Ecto.Schema
  import Ecto.Changeset

  schema "sessions" do
    field :session_id, :string
    field :data, :map
    field :expires_at, :utc_datetime

    timestamps()
  end

  def changeset(session, attrs) do
    session
    |> cast(attrs, [:session_id, :data, :expires_at])
    |> validate_required([:session_id, :data, :expires_at])
    |> unique_constraint(:session_id)
  end
end

# module containing business logic relating to sessions
defmodule MeldChat.SessionManager do
  import Ecto.Query
  alias MeldChat.{Repo, Session}

  @max_age 31_968_000  # 370 days in seconds (370 * 24 * 60 * 60)

  def set_logged_in_user_id(session, user_id) do
    update_session_data(session, "user_id", user_id)
  end

  def create_session do
    session_id = :crypto.strong_rand_bytes(32) |> Base.url_encode64()
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    expires_at = now |> DateTime.add(@max_age, :second)

    %Session{
      session_id: session_id,
      data: %{},
      expires_at: expires_at
    }
    |> Repo.insert!()
  end

  def get_session(session_id) do
    case Repo.get_by(Session, session_id: session_id) do
      nil ->
        {:error, :not_found}
      session ->
        if is_session_valid?(session) do
          {:ok, session}
        else
          delete_session(session)
          {:error, :expired}
        end
    end
  end

  def delete_session(%Session{} = session) do
    Repo.delete(session)
  end

  # TODO put into a cron job
  def cleanup_expired_sessions do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    Session
      |> where([s], s.expires_at <= ^now)
      |> Repo.delete_all()
  end

  defp is_session_valid?(session) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)
    DateTime.compare(session.expires_at, now) == :gt
  end

  def update_session_data(session, key, value) do
    session
      |> Ecto.Changeset.change(%{
        data: Map.put(session.data, key, value)
      })
      |> Repo.update!()
  end
end
